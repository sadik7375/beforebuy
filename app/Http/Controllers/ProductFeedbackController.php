<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\TokenService;

class ProductFeedbackController extends Controller
{
    /**
     * Helper to extract clean full shop domain (e.g. store.myshopify.com) from Request or Session
     */
    /**
     * Helper to validate and format myshopify.com domain handle safely
     */
    private function sanitizeShopDomain(?string $shop): ?string
    {
        if (!$shop) return null;
        $shop = strtolower(trim($shop));
        if (!str_contains($shop, '.')) {
            $shop .= '.myshopify.com';
        }
        if (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/', $shop)) {
            return $shop;
        }
        return null;
    }

    /**
     * Helper to extract clean full shop domain (e.g. store.myshopify.com) from Request, host parameter, or referer
     */
    private function getShopDomain(Request $request = null)
    {
        $request = $request ?: request();
        $shop = $request->get('shop') ?: $request->header('x-shopify-domain');

        if ($shop && ($sanitized = $this->sanitizeShopDomain($shop))) {
            return $sanitized;
        }

        // Check host parameter (e.g. host = base64 encoded admin.shopify.com/store/canny-apps)
        $host = $request->get('host');
        if ($host) {
            $decodedHost = base64_decode($host);
            if ($decodedHost && str_contains($decodedHost, 'admin.shopify.com/store/')) {
                $parts = explode('admin.shopify.com/store/', $decodedHost);
                if (isset($parts[1])) {
                    $handle = explode('/', $parts[1])[0];
                    if ($handle && ($sanitized = $this->sanitizeShopDomain($handle))) {
                        return $sanitized;
                    }
                }
            }
        }

        // Check HTTP referer header if loaded inside Shopify Admin Iframe
        $referer = $request->header('referer');
        if ($referer) {
            $parsed = parse_url($referer);
            if (isset($parsed['host']) && (str_contains($parsed['host'], 'myshopify.com') || str_contains($parsed['host'], 'shopify.com'))) {
                if (isset($parsed['path']) && str_contains($parsed['path'], '/store/')) {
                    $parts = explode('/store/', $parsed['path']);
                    if (isset($parts[1])) {
                        $handle = explode('/', $parts[1])[0];
                        if ($handle && ($sanitized = $this->sanitizeShopDomain($handle))) {
                            return $sanitized;
                        }
                    }
                }
                if (str_contains($parsed['host'], 'myshopify.com') && ($sanitized = $this->sanitizeShopDomain($parsed['host']))) {
                    return $sanitized;
                }
            }
        }

        return null;
    }

    /**
     * Helper to count monthly submissions
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
     * Get dynamic app config (reasons, email toggle, email required, popup theme) per shop
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
                    $config = isset($decoded['reasons']) ? array_merge($default, $decoded) : array_merge($default, ['reasons' => $decoded]);

                    // If shop is not on Pro plan, fallback Pro-only themes to 'modern'
                    $theme = $config['popup_theme'] ?? 'modern';
                    if (in_array($theme, ['badge_list', 'chips_grid', 'dark'])) {
                        $planInfo = $this->getShopPlan($shopDomain);
                        if (($planInfo['plan'] ?? 'free') !== 'pro') {
                            $config['popup_theme'] = 'modern';
                        }
                    }

                    return $config;
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
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);
        $planDetails = $this->getShopPlan($shopDomain);

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
            'monthlyCount' => $monthlyCount,
            'currentPlan' => $planDetails['plan'],
            'freeSubmissionLimit' => 10,
        ]);
    }

    /**
     * Submenu: Feedback Submissions Log Table
     */
    public function submissions(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);
        $planDetails = $this->getShopPlan($shopDomain);

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
            'monthlyCount' => $monthlyCount,
            'currentPlan' => $planDetails['plan'],
            'freeSubmissionLimit' => 10,
        ]);
    }

    /**
     * Submenu: Weekly AI Report & Actionable Suggestions
     */
    public function aiReport(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);
        $planDetails = $this->getShopPlan($shopDomain);

        try {
            $query = DB::table('product_feedbacks');
            $this->applyShopFilter($query, $shopDomain);

            $repeatCustomers = $query
                ->whereNotNull('customer_email')
                ->where('customer_email', '!=', '')
                ->select('customer_email', DB::raw('count(*) as count'))
                ->groupBy('customer_email')
                ->having('count', '>', 1)
                ->get();
        } catch (\Throwable $e) {
            $repeatCustomers = collect([]);
        }

        $stats = $this->getStats($shopDomain);

        return Inertia::render('AiReport', [
            'stats' => $stats,
            'repeatCustomers' => $repeatCustomers,
            'shopDomain' => $shopDomain,
            'monthlyCount' => $monthlyCount,
            'currentPlan' => $planDetails['plan'],
            'freeSubmissionLimit' => 10,
        ]);
    }

    /**
     * Submenu: App Configuration & Customization Settings
     */
    public function settings(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $config = $this->getAppSettings($shopDomain);
        $planDetails = $this->getShopPlan($shopDomain);

        return Inertia::render('Settings', [
            'reasons' => $config['reasons'] ?? [],
            'enable_email' => (bool)($config['enable_email'] ?? true),
            'require_email' => (bool)($config['require_email'] ?? false),
            'popup_theme' => $config['popup_theme'] ?? 'modern',
            'shopDomain' => $shopDomain,
            'currentPlan' => $planDetails['plan'],
            'plan' => $planDetails['plan'],
        ]);
    }

    /**
     * Save/Update Popup Customization Settings
     */
    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'reasons' => 'required|array|min:1',
            'reasons.*' => 'required|string',
            'enable_email' => 'required|boolean',
            'require_email' => 'required|boolean',
            'popup_theme' => 'required|string',
        ]);

        $shopDomain = $this->getShopDomain($request);
        $planDetails = $this->getShopPlan($shopDomain);

        $selectedTheme = $validated['popup_theme'];
        if (in_array($selectedTheme, ['badge_list', 'chips_grid', 'dark']) && $planDetails['plan'] !== 'pro') {
            $selectedTheme = 'modern';
        }

        $config = [
            'reasons' => array_values(array_filter($validated['reasons'])),
            'enable_email' => $validated['enable_email'],
            'require_email' => $validated['require_email'],
            'popup_theme' => $selectedTheme,
        ];

        try {
            $shortHandle = $shopDomain ? explode('.myshopify.com', $shopDomain)[0] : null;

            DB::table('app_settings')->updateOrInsert(
                ['shop_domain' => $shopDomain ?: 'canny-apps.myshopify.com', 'key' => 'app_config'],
                [
                    'value' => json_encode($config),
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

        return response()->json([
            'success' => true,
            'reasons' => $reasons,
            'enable_email' => $config['enable_email'],
            'require_email' => $config['require_email'],
            'popup_theme' => $config['popup_theme'] ?? 'modern',
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
     * Public API: Save new customer feedback from storefront modal
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

        $shopDomain = $validated['shop_domain'] ?? $this->getShopDomain($request);
        if ($shopDomain) {
            $planInfo = $this->getShopPlan($shopDomain);
            if (($planInfo['plan'] ?? 'free') === 'free') {
                $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);
                if ($monthlyCount >= 10) {
                    return response()->json([
                        'success' => false,
                        'limit_reached' => true,
                        'message' => 'Monthly feedback submission limit reached for Free plan (10/10). Upgrade to Pro for unlimited submissions.',
                    ], 403);
                }
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
     * Automatic OAuth callback handler to capture and save Shopify access_token
     */
    public function authCallback(Request $request)
    {
        $shop = $this->getShopDomain($request);
        $code = $request->get('code');
        $hmac = $request->get('hmac');
        $apiKey = env('SHOPIFY_API_KEY');
        $apiSecret = env('SHOPIFY_API_SECRET');

        // HMAC verification for OAuth callback security
        if ($hmac && $apiSecret) {
            $params = $request->all();
            unset($params['hmac'], $params['signature']);
            ksort($params);
            $computedHmac = hash_hmac('sha256', http_build_query($params), $apiSecret);
            if (!hash_equals($hmac, $computedHmac)) {
                Log::warning("OAuth Callback HMAC verification failed for shop: {$shop}");
                return response('Unauthorized: Invalid HMAC signature', 401);
            }
        }

        if ($shop && $code) {
            try {
                $response = \Illuminate\Support\Facades\Http::post("https://{$shop}/admin/oauth/access_token", [
                    'client_id' => $apiKey,
                    'client_secret' => $apiSecret,
                    'code' => $code,
                    'grant_options' => ['value'],
                    'expiring' => 1,
                ]);

                if ($response->successful()) {
                    $body = $response->json();
                    $accessToken = $body['access_token'] ?? null;

                    if ($accessToken) {
                        $tokenValue = [
                            'token' => $accessToken,
                            'updated_at' => now()->toDateTimeString(),
                        ];

                        if (!empty($body['refresh_token'])) {
                            $tokenValue['refresh_token'] = $body['refresh_token'];
                        }

                        if (!empty($body['expires_in'])) {
                            $tokenValue['expires_in'] = $body['expires_in'];
                            $tokenValue['expires_at'] = now()->addSeconds($body['expires_in'])->toDateTimeString();
                        }

                        $shortHandle = explode('.myshopify.com', $shop)[0];

                        // Purge any stale access token and plan subscription entries
                        DB::table('app_settings')
                            ->where(function ($q) use ($shop, $shortHandle) {
                                $q->where('shop_domain', '=', $shop)
                                  ->orWhere('shop_domain', '=', $shortHandle)
                                  ->orWhere('shop_domain', '=', 'global');
                            })
                            ->whereIn('key', ['access_token', 'plan_subscription'])
                            ->delete();

                        DB::table('app_settings')->insert([
                            'shop_domain' => $shop,
                            'key' => 'access_token',
                            'value' => json_encode($tokenValue),
                            'updated_at' => now(),
                        ]);

                        // Reset plan subscription to 'free' on fresh install / re-install
                        DB::table('app_settings')->insert([
                            'shop_domain' => $shop,
                            'key' => 'plan_subscription',
                            'value' => json_encode([
                                'plan' => 'free',
                                'charge_id' => null,
                                'status' => 'CANCELLED',
                                'updated_at' => now()->toDateTimeString(),
                            ]),
                            'updated_at' => now(),
                        ]);

                        Log::info("Automatic OAuth token saved and plan reset to free for shop: {$shop}");

                        $stateParam = (string)$request->get('state');
                        if ($stateParam === 'auto_subscribe' || str_contains($stateParam, 'auto_subscribe')) {
                            $baseUrl = config('app.url', 'https://beforebuy.cannyapps.com');
                            $host = $request->get('host');
                            $returnUrl = "{$baseUrl}/plans/callback?shop=" . urlencode($shop) . ($host ? "&host=" . urlencode($host) : '');
                            $isTest = env('SHOPIFY_BILLING_TEST', true);

                            $query = <<<'GRAPHQL'
mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
  appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
    appSubscription {
      id
    }
    confirmationUrl
    userErrors {
      field
      message
    }
  }
}
GRAPHQL;

                            $variables = [
                                'name' => 'BeforeBuy Pro Plan',
                                'returnUrl' => $returnUrl,
                                'test' => (bool)$isTest,
                                'lineItems' => [
                                    [
                                        'plan' => [
                                            'appRecurringPricingDetails' => [
                                                'price' => [
                                                    'amount' => 5.0,
                                                    'currencyCode' => 'USD',
                                                ],
                                                'interval' => 'EVERY_30_DAYS',
                                            ],
                                        ],
                                    ],
                                ],
                            ];

                            try {
                                $apiVersion = env('SHOPIFY_API_VERSION', '2025-01');
                                $subResponse = \Illuminate\Support\Facades\Http::withHeaders([
                                    'X-Shopify-Access-Token' => $accessToken,
                                    'Content-Type' => 'application/json',
                                ])->post("https://{$shop}/admin/api/{$apiVersion}/graphql.json", [
                                    'query' => $query,
                                    'variables' => $variables,
                                ]);

                                if ($subResponse->successful()) {
                                    $subResult = $subResponse->json();
                                    $confirmationUrl = $subResult['data']['appSubscriptionCreate']['confirmationUrl'] ?? null;
                                    if ($confirmationUrl) {
                                        Log::info("Auto-subscribing merchant directly to Billing Approval screen for shop: {$shop}");
                                        return redirect($confirmationUrl);
                                    }
                                }
                            } catch (\Throwable $e) {
                                Log::error("Auto-subscribe exception after OAuth for {$shop}: " . $e->getMessage());
                            }
                        }

                        $host = $request->get('host');
                        return redirect("/plans?shop=" . urlencode($shop) . ($host ? "&host=" . urlencode($host) : ''));
                    }
                } else {
                    Log::error('OAuth token exchange failed: ' . $response->body());
                }
            } catch (\Throwable $e) {
                Log::error('OAuth token exchange exception: ' . $e->getMessage());
            }
        }

        return redirect("/plans?shop=" . urlencode($shop ?: ''));
    }

    /**
     * Handle app/uninstalled webhook from Shopify
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

        if ($shopDomain) {
            $shortHandle = explode('.myshopify.com', $shopDomain)[0];

            DB::table('app_settings')
                ->where(function ($q) use ($shopDomain, $shortHandle) {
                    $q->where('shop_domain', '=', $shopDomain)
                      ->orWhere('shop_domain', '=', $shortHandle);
                })
                ->whereIn('key', ['plan_subscription', 'access_token'])
                ->delete();

            Log::info("Cleaned app_settings (plan and tokens) for uninstalled shop domain: {$shopDomain}");
        }

        return response()->json(['success' => true]);
    }

    /**
     * Helper to get active shop plan ('free' or 'pro') directly synchronized with Shopify API
     */
    private function getShopPlan(?string $shopDomain): array
    {
        $default = [
            'plan' => 'free',
            'charge_id' => null,
            'status' => 'CANCELLED',
        ];

        if (!$shopDomain) {
            return $default;
        }

        try {
            $token = TokenService::getValidToken($shopDomain);
            if ($token) {
                $query = <<<'GRAPHQL'
query GetActiveSubscriptions {
  app {
    installation {
      activeSubscriptions {
        id
        name
        status
      }
    }
  }
}
GRAPHQL;
                $apiVersion = env('SHOPIFY_API_VERSION', '2025-01');
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'X-Shopify-Access-Token' => $token,
                    'Content-Type' => 'application/json',
                ])->post("https://{$shopDomain}/admin/api/{$apiVersion}/graphql.json", [
                    'query' => $query,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $subscriptions = $data['data']['app']['installation']['activeSubscriptions'] ?? [];
                    
                    $activeSub = null;
                    foreach ($subscriptions as $sub) {
                        if (($sub['status'] ?? '') === 'ACTIVE') {
                            $activeSub = $sub;
                            break;
                        }
                    }

                    $shortHandle = explode('.myshopify.com', $shopDomain)[0];

                    if ($activeSub) {
                        $planData = [
                            'plan' => 'pro',
                            'charge_id' => $activeSub['id'],
                            'status' => 'ACTIVE',
                            'updated_at' => now()->toDateTimeString(),
                        ];

                        DB::table('app_settings')
                            ->where(function ($q) use ($shopDomain, $shortHandle) {
                                $q->where('shop_domain', '=', $shopDomain)
                                  ->orWhere('shop_domain', '=', $shortHandle)
                                  ->orWhere('shop_domain', '=', 'global');
                            })
                            ->where('key', 'plan_subscription')
                            ->delete();

                        DB::table('app_settings')->insert([
                            'shop_domain' => $shopDomain,
                            'key' => 'plan_subscription',
                            'value' => json_encode($planData),
                            'updated_at' => now(),
                        ]);

                        return $planData;
                    } else {
                        // No active subscription on Shopify side -> Force reset to Free Plan
                        $planData = [
                            'plan' => 'free',
                            'charge_id' => null,
                            'status' => 'CANCELLED',
                            'updated_at' => now()->toDateTimeString(),
                        ];

                        DB::table('app_settings')
                            ->where(function ($q) use ($shopDomain, $shortHandle) {
                                $q->where('shop_domain', '=', $shopDomain)
                                  ->orWhere('shop_domain', '=', $shortHandle)
                                  ->orWhere('shop_domain', '=', 'global');
                            })
                            ->where('key', 'plan_subscription')
                            ->delete();

                        DB::table('app_settings')->insert([
                            'shop_domain' => $shopDomain,
                            'key' => 'plan_subscription',
                            'value' => json_encode($planData),
                            'updated_at' => now(),
                        ]);

                        return $planData;
                    }
                } else {
                    // Token rejected or 401 Unauthorized -> App was uninstalled/reinstalled!
                    Log::info("Shopify API returned non-successful response ({$response->status()}) for {$shopDomain}. Wiping dead access token and resetting plan to Free.");
                    $shortHandle = explode('.myshopify.com', $shopDomain)[0];
                    DB::table('app_settings')
                        ->where(function ($q) use ($shopDomain, $shortHandle) {
                            $q->where('shop_domain', '=', $shopDomain)
                              ->orWhere('shop_domain', '=', $shortHandle)
                              ->orWhere('shop_domain', '=', 'global');
                        })
                        ->whereIn('key', ['access_token', 'plan_subscription'])
                        ->delete();

                    DB::table('app_settings')->insert([
                        'shop_domain' => $shopDomain,
                        'key' => 'plan_subscription',
                        'value' => json_encode([
                            'plan' => 'free',
                            'charge_id' => null,
                            'status' => 'CANCELLED',
                            'updated_at' => now()->toDateTimeString(),
                        ]),
                        'updated_at' => now(),
                    ]);

                    return $default;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Live Shopify plan sync exception for {$shopDomain}: " . $e->getMessage());
        }

        // Fallback to default free plan if API check fails
        return $default;
    }

    /**
     * Submenu: Pricing Plans comparison & management
     */
    public function plans(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);
        $planDetails = $this->getShopPlan($shopDomain);

        return Inertia::render('Plans', [
            'shopDomain' => $shopDomain,
            'currentPlan' => $planDetails['plan'],
            'subscriptionDetails' => $planDetails,
            'monthlyCount' => $monthlyCount,
            'freeSubmissionLimit' => 10,
        ]);
    }

    /**
     * Upgrade to Pro Plan ($5/month) via Shopify GraphQL appSubscriptionCreate
     */
    public function subscribePro(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        if (!$shopDomain) {
            return response()->json(['success' => false, 'message' => 'Shop domain missing. Please refresh the page.'], 400);
        }

        $apiKey = env('SHOPIFY_API_KEY');
        $baseUrl = config('app.url', 'https://beforebuy.cannyapps.com');
        $host = $request->get('host');
        $cleanRedirectUri = urlencode("{$baseUrl}/auth/callback");
        $authUrl = "https://{$shopDomain}/admin/oauth/authorize?client_id={$apiKey}&scope=read_products&redirect_uri={$cleanRedirectUri}&state=auto_subscribe&grant_options[]=value";

        $token = TokenService::getValidToken($shopDomain);
        if (!$token) {
            if ($apiKey && $shopDomain) {
                return response()->json([
                    'success' => true,
                    'confirmationUrl' => $authUrl,
                ]);
            }
            return response()->json(['success' => false, 'message' => 'Shopify Access Token missing. Please authorize app permissions.'], 401);
        }

        $host = $request->get('host');
        $returnUrl = "{$baseUrl}/plans/callback?shop=" . urlencode($shopDomain) . ($host ? "&host=" . urlencode($host) : '');
        $isTest = env('SHOPIFY_BILLING_TEST', true);

        $query = <<<'GRAPHQL'
mutation appSubscriptionCreate($name: String!, $returnUrl: URL!, $lineItems: [AppSubscriptionLineItemInput!]!, $test: Boolean) {
  appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
    appSubscription {
      id
    }
    confirmationUrl
    userErrors {
      field
      message
    }
  }
}
GRAPHQL;

        $variables = [
            'name' => 'BeforeBuy Pro Plan',
            'returnUrl' => $returnUrl,
            'test' => (bool)$isTest,
            'lineItems' => [
                [
                    'plan' => [
                        'appRecurringPricingDetails' => [
                            'price' => [
                                'amount' => 5.0,
                                'currencyCode' => 'USD',
                            ],
                            'interval' => 'EVERY_30_DAYS',
                        ],
                    ],
                ],
            ],
        ];

        try {
            $apiVersion = env('SHOPIFY_API_VERSION', '2025-01');
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'X-Shopify-Access-Token' => $token,
                'Content-Type' => 'application/json',
            ])->post("https://{$shopDomain}/admin/api/{$apiVersion}/graphql.json", [
                'query' => $query,
                'variables' => $variables,
            ]);

            $body = $response->body();
            $statusCode = $response->status();

            if ($response->successful()) {
                $result = $response->json();
                $responseStr = json_encode($result);

                // Handle Non-expiring or invalid token rejection error from Shopify
                if (str_contains($responseStr, 'Non-expiring access tokens are no longer accepted') || str_contains($responseStr, 'Invalid API key or access token')) {
                    Log::warning("Token rejected for {$shopDomain}. Wiping token and initiating re-auth.");
                    DB::table('app_settings')
                        ->where(function ($q) use ($shopDomain) {
                            $shortHandle = explode('.myshopify.com', $shopDomain)[0];
                            $q->where('shop_domain', '=', $shopDomain)
                              ->orWhere('shop_domain', '=', $shortHandle);
                        })
                        ->where('key', 'access_token')
                        ->delete();

                    return response()->json([
                        'success' => true,
                        'confirmationUrl' => $authUrl,
                    ]);
                }

                if (!empty($result['errors'])) {
                    $topError = $result['errors'][0]['message'] ?? 'GraphQL error';
                    Log::error("Shopify GraphQL Error for {$shopDomain}: " . json_encode($result['errors']));
                    return response()->json(['success' => false, 'message' => "Shopify API Error: {$topError}"], 422);
                }

                $userErrors = $result['data']['appSubscriptionCreate']['userErrors'] ?? [];
                if (!empty($userErrors)) {
                    $errorMsg = implode(', ', array_column($userErrors, 'message'));
                    Log::error("Shopify appSubscriptionCreate User Errors for {$shopDomain}: " . $errorMsg);
                    return response()->json(['success' => false, 'message' => "Shopify Billing Error: {$errorMsg}"], 422);
                }

                $confirmationUrl = $result['data']['appSubscriptionCreate']['confirmationUrl'] ?? null;
                if ($confirmationUrl) {
                    return response()->json([
                        'success' => true,
                        'confirmationUrl' => $confirmationUrl,
                    ]);
                }
            } else {
                Log::error("Shopify GraphQL Billing Error ({$statusCode}) for {$shopDomain}: " . $body);
                if ($statusCode === 401 || str_contains($body, 'Non-expiring access tokens are no longer accepted') || str_contains($body, 'Invalid API key')) {
                    Log::warning("Unauthorized token for {$shopDomain}. Wiping token and initiating re-auth.");
                    DB::table('app_settings')
                        ->where(function ($q) use ($shopDomain) {
                            $shortHandle = explode('.myshopify.com', $shopDomain)[0];
                            $q->where('shop_domain', '=', $shopDomain)
                              ->orWhere('shop_domain', '=', $shortHandle);
                        })
                        ->where('key', 'access_token')
                        ->delete();

                    return response()->json([
                        'success' => true,
                        'confirmationUrl' => $authUrl,
                    ]);
                }

                return response()->json(['success' => false, 'message' => "Shopify Error ({$statusCode}): {$body}"], 500);
            }
        } catch (\Throwable $e) {
            Log::error("Subscribe Pro Exception: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }

        return response()->json(['success' => false, 'message' => 'Failed to initialize Shopify Pro Plan charge.'], 500);
    }

    /**
     * Callback after merchant approves $5 charge on Shopify Authorization screen
     */
    public function subscribeCallback(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $chargeId = $request->get('charge_id');

        if ($shopDomain) {
            $shortHandle = explode('.myshopify.com', $shopDomain)[0];

            DB::table('app_settings')
                ->where(function ($q) use ($shopDomain, $shortHandle) {
                    $q->where('shop_domain', '=', $shopDomain)
                      ->orWhere('shop_domain', '=', $shortHandle)
                      ->orWhere('shop_domain', '=', 'global');
                })
                ->where('key', 'plan_subscription')
                ->delete();

            DB::table('app_settings')->insert([
                'shop_domain' => $shopDomain,
                'key' => 'plan_subscription',
                'value' => json_encode([
                    'plan' => 'pro',
                    'charge_id' => $chargeId,
                    'status' => 'ACTIVE',
                    'updated_at' => now()->toDateTimeString(),
                ]),
                'updated_at' => now(),
            ]);
            Log::info("Pro Plan successfully activated for shop: {$shopDomain}");
        }

        $host = $request->get('host');
        $redirectUrl = "/plans?shop=" . urlencode($shopDomain ?: '') . ($host ? "&host=" . urlencode($host) : '');
        return redirect($redirectUrl);
    }

    /**
     * Downgrade / Cancel Pro Plan back to Free Plan
     */
    public function cancelSubscription(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        if (!$shopDomain) {
            return response()->json(['success' => false, 'message' => 'Shop domain missing'], 400);
        }

        $planDetails = $this->getShopPlan($shopDomain);
        $chargeId = $planDetails['charge_id'] ?? null;

        if ($chargeId) {
            $token = TokenService::getValidToken($shopDomain);
            if ($token) {
                $query = <<<'GRAPHQL'
mutation appSubscriptionCancel($id: ID!) {
  appSubscriptionCancel(id: $id) {
    appSubscription {
      id
      status
    }
    userErrors {
      field
      message
    }
  }
}
GRAPHQL;

                try {
                    $apiVersion = env('SHOPIFY_API_VERSION', '2025-01');
                    \Illuminate\Support\Facades\Http::withHeaders([
                        'X-Shopify-Access-Token' => $token,
                        'Content-Type' => 'application/json',
                    ])->post("https://{$shopDomain}/admin/api/{$apiVersion}/graphql.json", [
                        'query' => $query,
                        'variables' => ['id' => $chargeId],
                    ]);
                } catch (\Throwable $e) {
                    Log::warning("Cancel GraphQL Exception for {$shopDomain}: " . $e->getMessage());
                }
            }
        }

        $shortHandle = explode('.myshopify.com', $shopDomain)[0];

        // Revert database status to free plan by wiping old rows first
        DB::table('app_settings')
            ->where(function ($q) use ($shopDomain, $shortHandle) {
                $q->where('shop_domain', '=', $shopDomain)
                  ->orWhere('shop_domain', '=', $shortHandle)
                  ->orWhere('shop_domain', '=', 'global');
            })
            ->where('key', 'plan_subscription')
            ->delete();

        DB::table('app_settings')->insert([
            'shop_domain' => $shopDomain,
            'key' => 'plan_subscription',
            'value' => json_encode([
                'plan' => 'free',
                'charge_id' => null,
                'status' => 'CANCELLED',
                'updated_at' => now()->toDateTimeString(),
            ]),
            'updated_at' => now(),
        ]);

        $host = $request->get('host');
        return redirect("/plans?shop=" . urlencode($shopDomain) . ($host ? "&host=" . urlencode($host) : ''));
    }
}
