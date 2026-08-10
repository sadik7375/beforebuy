<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ProductFeedbackController extends Controller
{
    /**
     * Helper to extract clean full shop domain (e.g. store.myshopify.com) from Request or Session
     */
    /**
     * Helper to extract clean full shop domain (e.g. store.myshopify.com) from Request or headers
     */
    private function getShopDomain(Request $request = null)
    {
        $request = $request ?: request();
        $shop = $request->get('shop') ?: $request->header('x-shopify-domain');

        if ($shop) {
            $shop = strtolower(trim($shop));
            if (!str_contains($shop, '.')) {
                $shop .= '.myshopify.com';
            }
            return $shop;
        }

        // Check HTTP referer header if loaded inside Shopify Admin Iframe
        $referer = $request->header('referer');
        if ($referer) {
            $parsed = parse_url($referer);
            if (isset($parsed['host']) && str_contains($parsed['host'], 'myshopify.com')) {
                return strtolower(trim($parsed['host']));
            }
        }

        return null;
    }

    /**
     * Helper to get active store plan ('free' by default, 'pro' if active subscription exists in DB)
     */
    private function getShopPlan($shopDomain = null, Request $request = null)
    {
        $shopDomain = $shopDomain ?: $this->getShopDomain($request);
        if ($shopDomain) {
            $shopDomain = strtolower(trim($shopDomain));
            if (!str_contains($shopDomain, '.')) {
                $shopDomain .= '.myshopify.com';
            }
            $shortHandle = explode('.myshopify.com', $shopDomain)[0];

            try {
                $row = DB::table('app_settings')
                    ->where('key', 'shop_plan')
                    ->where(function ($q) use ($shopDomain, $shortHandle) {
                        $q->where('shop_domain', '=', $shopDomain)
                          ->orWhere('shop_domain', '=', $shortHandle);
                    })
                    ->first();

                if ($row && !empty($row->value)) {
                    $decoded = json_decode($row->value, true);
                    if (is_array($decoded) && isset($decoded['plan'])) {
                        return strtolower($decoded['plan']) === 'pro' ? 'pro' : 'free';
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('getShopPlan DB fetch error: ' . $e->getMessage());
            }
        }

        return 'free';
    }

    /**
     * Helper to update store plan cleanly (removes duplicates first)
     */
    private function setShopPlan($shopDomain, $planName = 'free', $subscriptionId = null)
    {
        if (!$shopDomain) return;

        $shopDomain = strtolower(trim($shopDomain));
        if (!str_contains($shopDomain, '.')) {
            $shopDomain .= '.myshopify.com';
        }
        $shortHandle = explode('.myshopify.com', $shopDomain)[0];

        try {
            // Delete any existing shop_plan records for both full domain & short handle to prevent stale duplicates
            DB::table('app_settings')
                ->where('key', 'shop_plan')
                ->where(function ($q) use ($shopDomain, $shortHandle) {
                    $q->where('shop_domain', '=', $shopDomain)
                      ->orWhere('shop_domain', '=', $shortHandle);
                })
                ->delete();

            // Insert new clean row
            DB::table('app_settings')->insert([
                'shop_domain' => $shopDomain,
                'key' => 'shop_plan',
                'value' => json_encode([
                    'plan' => $planName,
                    'subscription_id' => $subscriptionId,
                    'updated_at' => now()->toDateTimeString(),
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('setShopPlan error: ' . $e->getMessage());
        }
    }

    /**
     * Helper to count monthly submissions for quota tracking
     */
    private function getMonthlySubmissionCount($shopDomain = null)
    {
        if (!$shopDomain) return 0;

        try {
            $query = DB::table('product_feedbacks')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year);

            $this->applyShopFilter($query, $shopDomain);
            return $query->count();
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Helper to apply exact store filter on queries with strict isolation
     */
    private function applyShopFilter($query, $shopDomain)
    {
        if (!$shopDomain) {
            return $query->whereRaw('1 = 0');
        }

        $shortHandle = explode('.myshopify.com', $shopDomain)[0];

        return $query->where(function ($q) use ($shopDomain, $shortHandle) {
            $q->where('shop_domain', '=', $shopDomain)
              ->orWhere('shop_domain', '=', $shortHandle);
        });
    }

    /**
     * Get dynamic app config (reasons, email toggle, email required) per shop
     */
    private function getAppSettings($shopDomain = null)
    {
        $default = [
            'reasons' => [
                'Price is higher than expected',
                'Unsure about size / fit / dimensions',
                'Shipping fee or delivery time is too high',
                'Product information or reviews missing',
                'Other reason',
            ],
            'enable_email' => true,
            'require_email' => false,
            'popup_theme' => 'modern',
        ];

        try {
            $setting = null;
            if ($shopDomain) {
                $shortHandle = explode('.myshopify.com', $shopDomain)[0];
                $setting = DB::table('app_settings')
                    ->where(function ($q) use ($shopDomain, $shortHandle) {
                        $q->where('shop_domain', '=', $shopDomain)
                          ->orWhere('shop_domain', '=', $shortHandle);
                    })
                    ->where('key', 'app_config')
                    ->first();
            }

            if (!$setting) {
                $setting = DB::table('app_settings')->where('key', 'app_config')->first();
            }

            if ($setting && !empty($setting->value)) {
                $decoded = json_decode($setting->value, true);
                if (is_array($decoded)) {
                    if (isset($decoded['reasons'])) {
                        return array_merge($default, $decoded);
                    } else {
                        $default['reasons'] = $decoded;
                        return $default;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('AppSetting DB fetch error: ' . $e->getMessage());
        }

        return $default;
    }

    /**
     * Get statistics summary for dashboard filtered by shop domain
     */
    private function getStats($shopDomain = null)
    {
        try {
            $query = DB::table('product_feedbacks');
            $this->applyShopFilter($query, $shopDomain);

            $totalFeedbacks = (clone $query)->count();
            $emailsCount = (clone $query)->whereNotNull('customer_email')->where('customer_email', '!=', '')->count();
            
            // Top reasons with percentages
            $reasonsData = (clone $query)
                ->select('reason', DB::raw('count(*) as count'))
                ->groupBy('reason')
                ->orderByDesc('count')
                ->get();
                
            $totalReasonCount = $reasonsData->sum('count') ?: 1;
            $reasonsBreakdown = $reasonsData->map(function ($item) use ($totalReasonCount) {
                return [
                    'reason' => $item->reason,
                    'count' => $item->count,
                    'percentage' => round(($item->count / $totalReasonCount) * 100),
                ];
            });

            // Top products
            $topProducts = (clone $query)
                ->select('product_title', DB::raw('count(*) as count'))
                ->whereNotNull('product_title')
                ->where('product_title', '!=', '')
                ->groupBy('product_title')
                ->orderByDesc('count')
                ->take(5)
                ->get();

            return [
                'total_feedbacks' => $totalFeedbacks,
                'emails_collected' => $emailsCount,
                'response_rate' => $totalFeedbacks > 0 ? round(($emailsCount / $totalFeedbacks) * 100) : 0,
                'estimated_lost_revenue' => $totalFeedbacks * 35,
                'open_inquiries' => (clone $query)->whereNull('ai_summary')->count(),
                'top_reason' => $reasonsData->first()?->reason ?? null,
                'reasons_breakdown' => $reasonsBreakdown,
                'top_products' => $topProducts,
            ];
        } catch (\Throwable $e) {
            return [
                'total_feedbacks' => 0,
                'emails_collected' => 0,
                'response_rate' => 0,
                'estimated_lost_revenue' => 0,
                'open_inquiries' => 0,
                'top_reason' => null,
                'reasons_breakdown' => [],
                'top_products' => [],
            ];
        }
    }

    /**
     * Submenu: Overview
     */
    public function overview(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $plan = $this->getShopPlan($shopDomain);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);

        try {
            $query = DB::table('product_feedbacks');
            $this->applyShopFilter($query, $shopDomain);
            $feedbacks = $query->orderByDesc('id')->take(10)->get();
        } catch (\Throwable $e) {
            $feedbacks = collect([]);
        }

        $config = $this->getAppSettings($shopDomain);

        return Inertia::render('Overview', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats($shopDomain),
            'reasons' => $config['reasons'] ?? [],
            'shopDomain' => $shopDomain,
            'plan' => $plan,
            'monthlyCount' => $monthlyCount,
        ]);
    }

    /**
     * Submenu: Feedback Submissions Log Table
     */
    public function submissions(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $plan = $this->getShopPlan($shopDomain);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);

        try {
            $query = DB::table('product_feedbacks');
            $this->applyShopFilter($query, $shopDomain);
            $feedbacks = $query->orderByDesc('id')->paginate(50);
        } catch (\Throwable $e) {
            $feedbacks = collect([]);
        }

        $config = $this->getAppSettings($shopDomain);

        return Inertia::render('Submissions', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats($shopDomain),
            'reasons' => $config['reasons'] ?? [],
            'shopDomain' => $shopDomain,
            'plan' => $plan,
            'monthlyCount' => $monthlyCount,
        ]);
    }

    /**
     * Submenu: Weekly AI Report & Actionable Suggestions
     */
    public function aiReport(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $plan = $this->getShopPlan($shopDomain);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);

        try {
            $query = DB::table('product_feedbacks');
            $this->applyShopFilter($query, $shopDomain);

            $repeatCustomers = $query
                ->select('customer_email', DB::raw('count(*) as count'), DB::raw('GROUP_CONCAT(DISTINCT product_title SEPARATOR ", ") as products'))
                ->whereNotNull('customer_email')
                ->where('customer_email', '!=', '')
                ->groupBy('customer_email')
                ->having('count', '>', 1)
                ->orderByDesc('count')
                ->get();
        } catch (\Throwable $e) {
            $repeatCustomers = collect([]);
        }

        return Inertia::render('AiReport', [
            'stats' => $this->getStats($shopDomain),
            'repeatCustomers' => $repeatCustomers,
            'shopDomain' => $shopDomain,
            'plan' => $plan,
            'monthlyCount' => $monthlyCount,
        ]);
    }

    /**
     * Submenu: Settings Page
     */
    public function settings(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $plan = $this->getShopPlan($shopDomain);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);
        $config = $this->getAppSettings($shopDomain);

        return Inertia::render('Settings', [
            'reasons' => $config['reasons'],
            'enable_email' => (bool)$config['enable_email'],
            'require_email' => (bool)$config['require_email'],
            'popup_theme' => $config['popup_theme'] ?? 'modern',
            'shopDomain' => $shopDomain,
            'plan' => $plan,
            'monthlyCount' => $monthlyCount,
        ]);
    }

    /**
     * Save dynamic settings (DB per shop domain)
     */
    public function saveSettings(Request $request)
    {
        $shopDomain = $this->getShopDomain($request) ?: 'global';
        $plan = $this->getShopPlan($shopDomain);

        $validated = $request->validate([
            'reasons' => 'required|array',
            'reasons.*' => 'required|string',
            'enable_email' => 'required|boolean',
            'require_email' => 'required|boolean',
            'popup_theme' => 'nullable|string|in:modern,badge_list,chips_grid,icon_pills,dark,minimal,pills',
        ]);

        $selectedTheme = $validated['popup_theme'] ?? 'modern';

        // Enforce popup theme restriction: Free plan only gets 'modern' or 'pills'
        if ($plan === 'free' && !in_array($selectedTheme, ['modern', 'pills'])) {
            $selectedTheme = 'modern';
        }

        $config = [
            'reasons' => array_values(array_filter($validated['reasons'])),
            'enable_email' => (bool)$validated['enable_email'],
            'require_email' => (bool)$validated['require_email'],
            'popup_theme' => $selectedTheme,
        ];

        // Save to MySQL Database with shop domain key
        try {
            DB::table('app_settings')->updateOrInsert(
                ['shop_domain' => $shopDomain, 'key' => 'app_config'],
                [
                    'value' => json_encode($config),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        } catch (\Throwable $e) {
            Log::error('Settings DB save error: ' . $e->getMessage());
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Settings saved successfully!',
                'settings' => $config,
            ]);
        }

        return redirect()->back()->with('success', 'Settings saved successfully!');
    }

    /**
     * Public API: Get dynamic settings for storefront popup
     */
    public function getApiSettings(Request $request)
    {
        $shopDomain = $request->get('shop') ?: $this->getShopDomain($request);
        $plan = $this->getShopPlan($shopDomain);
        $config = $this->getAppSettings($shopDomain);
        
        $reasons = $config['reasons'];
        $hasOther = false;
        foreach ($reasons as $r) {
            if (strtolower(trim($r)) === 'other' || strtolower(trim($r)) === 'other reason') {
                $hasOther = true;
                break;
            }
        }
        if (!$hasOther) {
            $reasons[] = 'Other reason';
        }

        $selectedTheme = $config['popup_theme'] ?? 'modern';
        if ($plan === 'free' && !in_array($selectedTheme, ['modern', 'pills'])) {
            $selectedTheme = 'modern';
        }

        return response()->json([
            'success' => true,
            'reasons' => $reasons,
            'enable_email' => $config['enable_email'],
            'require_email' => $config['require_email'],
            'popup_theme' => $selectedTheme,
            'plan' => $plan,
        ]);
    }

    /**
     * Submenu: Pricing
     */
    public function pricing(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $plan = $this->getShopPlan($shopDomain);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);

        return Inertia::render('Pricing', [
            'plan' => $plan,
            'monthlyCount' => $monthlyCount,
            'shopDomain' => $shopDomain,
        ]);
    }

    /**
     * Submenu: Setup
     */
    public function setup(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $defaultEmail = $shopDomain ? "shop@" . $shopDomain : "shop@canny-apps.myshopify.com";

        return Inertia::render('Setup', [
            'shopDomain' => $shopDomain,
            'defaultEmail' => $defaultEmail,
        ]);
    }

    /**
     * Submenu: Support
     */
    public function support(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $defaultEmail = $shopDomain ? "shop@" . $shopDomain : "shop@canny-apps.myshopify.com";

        return Inertia::render('Support', [
            'shopDomain' => $shopDomain,
            'defaultEmail' => $defaultEmail,
        ]);
    }

    /**
     * Handle Merchant Support & Complaint Form Submissions
     */
    public function submitMerchantSupport(Request $request)
    {
        $validated = $request->validate([
            'feedback_type' => 'required|string',
            'contact_email' => 'required|email',
            'subject' => 'nullable|string',
            'message' => 'required|string',
        ]);

        $shopDomain = $this->getShopDomain($request);

        try {
            DB::table('merchant_supports')->insert([
                'shop_domain' => $shopDomain ?: 'unknown',
                'feedback_type' => $validated['feedback_type'],
                'contact_email' => $validated['contact_email'],
                'subject' => $validated['subject'] ?? '',
                'message' => $validated['message'],
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Email Notification to App Owner / Support Admin Email
            $adminEmail = env('ADMIN_NOTIFICATION_EMAIL', 'wahidsadik38@gmail.com');
            if ($adminEmail) {
                try {
                    \Illuminate\Support\Facades\Mail::raw(
                        "New Merchant Support / Complaint Received!\n\n" .
                        "Shop Domain: " . ($shopDomain ?: 'Unknown Shop') . "\n" .
                        "Feedback Type: " . $validated['feedback_type'] . "\n" .
                        "Contact Email: " . $validated['contact_email'] . "\n" .
                        "Subject: " . ($validated['subject'] ?? 'N/A') . "\n\n" .
                        "Message:\n" . $validated['message'],
                        function ($mail) use ($adminEmail, $validated, $shopDomain) {
                            $mail->to($adminEmail)
                                 ->replyTo($validated['contact_email'])
                                 ->subject("[BeforeBuy Support] " . $validated['feedback_type'] . " from " . ($shopDomain ?: $validated['contact_email']));
                        }
                    );
                } catch (\Throwable $mailError) {
                    Log::warning('Support email notification error: ' . $mailError->getMessage());
                }
            }
        } catch (\Throwable $e) {
            Log::error('Merchant Support store error: ' . $e->getMessage());
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Thank you! Your feedback/support message has been submitted successfully.',
            ]);
        }

        return redirect()->back()->with('success', 'Thank you! Your message has been submitted.');
    }

    /**
     * Public API: Save new customer feedback from storefront modal with 10-submission Free limit check
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_domain' => 'nullable|string',
            'product_id' => 'nullable|string',
            'product_title' => 'nullable|string',
            'product_handle' => 'nullable|string',
            'reason' => 'required|string',
            'custom_comment' => 'nullable|string',
            'customer_email' => 'nullable|string',
        ]);

        $shopDomain = $validated['shop_domain'] ?: $this->getShopDomain($request);
        $plan = $this->getShopPlan($shopDomain, $request);

        if ($plan === 'free') {
            $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);
            if ($monthlyCount >= 10) {
                return response()->json([
                    'success' => false,
                    'limit_reached' => true,
                    'message' => 'Monthly feedback limit reached for Free plan (10/10). Please upgrade to Pro for unlimited submissions.',
                ], 429);
            }
        }

        $feedbackId = null;

        // Save directly into MySQL Database
        try {
            $dataToInsert = array_merge($validated, [
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $feedbackId = DB::table('product_feedbacks')->insertGetId($dataToInsert);
        } catch (\Throwable $e) {
            Log::error('Feedback DB store error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
            'feedback' => $validated,
        ]);
    }

    /**
     * Helper to retrieve active Shopify API access token from DB or ENV
     */
    private function getShopToken($shopDomain = null)
    {
        $token = env('SHOPIFY_API_TOKEN');
        if (!empty($token)) return $token;

        if ($shopDomain) {
            $shortHandle = explode('.myshopify.com', $shopDomain)[0];
            $row = DB::table('app_settings')
                ->where(function ($q) use ($shopDomain, $shortHandle) {
                    $q->where('shop_domain', '=', $shopDomain)
                      ->orWhere('shop_domain', '=', $shortHandle)
                      ->orWhereNull('shop_domain')
                      ->orWhere('shop_domain', '=', '');
                })
                ->whereIn('key', ['shopify_token', 'access_token', 'token', 'api_token'])
                ->orderByDesc('id')
                ->first();

            if ($row && !empty($row->value)) {
                $decoded = json_decode($row->value, true);
                if (is_array($decoded) && !empty($decoded['token'])) {
                    return $decoded['token'];
                }
                if (is_array($decoded) && !empty($decoded['access_token'])) {
                    return $decoded['access_token'];
                }
                return $row->value;
            }
        }

        // Global fallback to any access_token in DB
        $global = DB::table('app_settings')
            ->whereIn('key', ['shopify_token', 'access_token', 'token', 'api_token'])
            ->orderByDesc('id')
            ->first();

        if ($global && !empty($global->value)) {
            $decoded = json_decode($global->value, true);
            if (is_array($decoded) && !empty($decoded['token'])) return $decoded['token'];
            if (is_array($decoded) && !empty($decoded['access_token'])) return $decoded['access_token'];
            return $global->value;
        }

        return null;
    }

    /**
     * Initiate Pro Subscription ($5/month) via Shopify Billing API & Admin Charge Confirmation Screen
     */
    public function subscribePro(Request $request)
    {
        $shopDomain = $this->getShopDomain($request) ?: 'canny-apps.myshopify.com';
        $appUrl = env('APP_URL', 'https://beforebuy.cannyapps.com');
        $returnUrl = "{$appUrl}/billing/confirm?shop=" . urlencode($shopDomain);
        $token = $this->getShopToken($shopDomain);

        // If token is missing, generate OAuth authorize URL to acquire token first
        if (!$token) {
            $shopHandle = explode('.', $shopDomain)[0];
            $apiKey = env('SHOPIFY_API_KEY');
            $scopes = env('SHOPIFY_API_SCOPES', 'read_products,write_products,read_themes,read_purchase_options,write_purchase_options');
            $redirectUri = urlencode("{$appUrl}/auth/callback");
            $authUrl = "https://admin.shopify.com/store/{$shopHandle}/oauth/authorize?client_id={$apiKey}&scope=" . urlencode($scopes) . "&redirect_uri={$redirectUri}";

            if ($request->wantsJson()) {
                return response()->json(['success' => true, 'confirmationUrl' => $authUrl]);
            }
            return redirect()->to($authUrl);
        }

        // 1. Execute GraphQL appSubscriptionCreate mutation to generate official Shopify Charge URL
        try {
            $graphqlUrl = "https://{$shopDomain}/admin/api/2026-07/graphql.json";
            $query = <<<'GRAPHQL'
mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean) {
  appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, test: $test) {
    userErrors {
      field
      message
    }
    confirmationUrl
    appSubscription {
      id
    }
  }
}
GRAPHQL;

            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'X-Shopify-Access-Token' => $token,
                'Content-Type' => 'application/json',
            ])->post($graphqlUrl, [
                'query' => $query,
                'variables' => [
                    'name' => 'BeforeBuy Pro Plan',
                    'returnUrl' => $returnUrl,
                    'test' => true,
                    'lineItems' => [
                        [
                            'plan' => [
                                'appRecurringPricingDetails' => [
                                    'price' => [
                                        'amount' => 5.00,
                                        'currencyCode' => 'USD'
                                    ],
                                    'interval' => 'EVERY_30_DAYS'
                                ]
                            ]
                        ]
                    ]
                ]
            ]);

            $body = $response->json();
            $confirmationUrl = $body['data']['appSubscriptionCreate']['confirmationUrl'] ?? null;

            if ($confirmationUrl) {
                $shopHandle = explode('.', $shopDomain)[0];
                $unifiedUrl = $confirmationUrl;
                if (str_contains($confirmationUrl, "{$shopDomain}/admin/charges/")) {
                    $unifiedUrl = str_replace("{$shopDomain}/admin/charges/", "admin.shopify.com/store/{$shopHandle}/charges/", $confirmationUrl);
                } elseif (str_contains($confirmationUrl, 'https://') && !str_contains($confirmationUrl, 'admin.shopify.com') && str_contains($confirmationUrl, '/admin/charges/')) {
                    $unifiedUrl = preg_replace('/https:\/\/[^\/]+\/admin\/charges\//', "https://admin.shopify.com/store/{$shopHandle}/charges/", $confirmationUrl);
                }

                if ($request->wantsJson()) {
                    return response()->json(['success' => true, 'confirmationUrl' => $unifiedUrl]);
                }

                return redirect()->to($unifiedUrl);
            } else {
                $gqlErrors = json_encode($body['data']['appSubscriptionCreate']['userErrors'] ?? $body['errors'] ?? $body);
                Log::warning("appSubscriptionCreate error for {$shopDomain}: {$gqlErrors}");

                // If token invalid/expired, wipe stale token and redirect to OAuth to refresh token
                if (str_contains($gqlErrors, 'Non-expiring access tokens') || str_contains($gqlErrors, 'Invalid API key') || str_contains($gqlErrors, 'unrecognized login') || str_contains($gqlErrors, 'Invalid token')) {
                    DB::table('app_settings')->whereIn('key', ['shopify_token', 'access_token', 'token', 'api_token'])->delete();

                    $shopHandle = explode('.', $shopDomain)[0];
                    $apiKey = env('SHOPIFY_API_KEY');
                    $scopes = env('SHOPIFY_API_SCOPES', 'read_products,write_products,read_themes,read_purchase_options,write_purchase_options');
                    $redirectUri = urlencode("{$appUrl}/auth/callback");
                    $authUrl = "https://admin.shopify.com/store/{$shopHandle}/oauth/authorize?client_id={$apiKey}&scope=" . urlencode($scopes) . "&redirect_uri={$redirectUri}";

                    if ($request->wantsJson()) {
                        return response()->json(['success' => true, 'confirmationUrl' => $authUrl]);
                    }
                    return redirect()->to($authUrl);
                }
            }
        } catch (\Throwable $e) {
            Log::error('Shopify Subscription GraphQL exception: ' . $e->getMessage());
        }

        // Return error message if subscription charge creation failed
        if ($request->wantsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Could not generate Shopify Subscription charge URL. Please try again.',
            ], 500);
        }

        return redirect("/pricing?shop=" . urlencode($shopDomain ?: ''))
            ->with('error', 'Could not generate Shopify Subscription charge URL. Please try again.');
    }

    /**
     * Automatic OAuth callback handler to capture and save Shopify access_token
     */
    public function authCallback(Request $request)
    {
        $shop = $this->getShopDomain($request);
        $code = $request->get('code');
        $appUrl = env('APP_URL', 'https://beforebuy.cannyapps.com');
        $apiKey = env('SHOPIFY_API_KEY');
        $apiSecret = env('SHOPIFY_API_SECRET');

        if ($shop && $code) {
            try {
                $response = \Illuminate\Support\Facades\Http::post("https://{$shop}/admin/oauth/access_token", [
                    'client_id' => $apiKey,
                    'client_secret' => $apiSecret,
                    'code' => $code,
                ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $accessToken = $body['access_token'] ?? null;

                    if ($accessToken) {
                        DB::table('app_settings')->updateOrInsert(
                            ['shop_domain' => $shop, 'key' => 'access_token'],
                            [
                                'value' => json_encode(['token' => $accessToken, 'updated_at' => now()->toDateTimeString()]),
                                'updated_at' => now(),
                            ]
                        );

                        Log::info("Automatic OAuth token saved to database for shop: {$shop}");
                        return redirect("/?shop=" . urlencode($shop));
                    }
                } else {
                    Log::error('OAuth token exchange failed: ' . $response->body());
                }
            } catch (\Throwable $e) {
                Log::error('OAuth token exchange exception: ' . $e->getMessage());
            }
        }

        return redirect("/pricing?shop=" . urlencode($shop ?: ''));
    }

    /**
     * Handle Billing Confirmation callback
     */
    public function billingConfirm(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $chargeId = $request->get('charge_id') ?: ('charge_approved_' . time());

        if ($shopDomain) {
            $this->setShopPlan($shopDomain, 'pro', $chargeId);
        }

        $appUrl = env('APP_URL', 'https://beforebuy.cannyapps.com');
        return redirect("{$appUrl}/pricing?shop=" . urlencode($shopDomain ?: '') . "&upgraded=1");
    }

    /**
     * Handle app/uninstalled webhook from Shopify - Resets plan to free while retaining store feedback data
     */
    public function handleAppUninstalled(Request $request)
    {
        $shopDomain = $request->header('X-Shopify-Shop-Domain')
            ?: $request->header('x-shopify-shop-domain')
            ?: $request->get('shop')
            ?: $request->get('shop_domain');

        if (!$shopDomain) {
            $rawContent = $request->getContent();
            if (!empty($rawContent)) {
                $payload = json_decode($rawContent, true);
                if (is_array($payload)) {
                    $shopDomain = $payload['myshopify_domain']
                        ?? $payload['domain']
                        ?? $payload['shop_domain']
                        ?? null;
                }
            }
        }

        Log::info("Webhook app/uninstalled received for shop domain: " . ($shopDomain ?: 'UNKNOWN'));

        if ($shopDomain) {
            $shopDomain = strtolower(trim($shopDomain));
            if (!str_contains($shopDomain, '.')) {
                $shopDomain .= '.myshopify.com';
            }

            try {
                // Immediately cancel Pro plan and revert store to Free Plan
                $this->setShopPlan($shopDomain, 'free', null);

                Log::info("App uninstalled: active plan reset to free for shop: {$shopDomain} (Feedback data retained).");
            } catch (\Throwable $e) {
                Log::error("App uninstalled plan reset error for shop {$shopDomain}: " . $e->getMessage());
            }
        }

        return response()->json(['success' => true]);
    }
}
