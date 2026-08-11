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
     * Helper to extract clean full shop domain (e.g. store.myshopify.com) from Request, host parameter, or referer
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

        // Check host parameter (e.g. host = base64 encoded admin.shopify.com/store/canny-apps)
        $host = $request->get('host');
        if ($host) {
            $decodedHost = base64_decode($host);
            if ($decodedHost && str_contains($decodedHost, 'admin.shopify.com/store/')) {
                $parts = explode('admin.shopify.com/store/', $decodedHost);
                if (isset($parts[1])) {
                    $handle = explode('/', $parts[1])[0];
                    if ($handle) {
                        return strtolower(trim($handle)) . '.myshopify.com';
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
                        if ($handle) {
                            return strtolower(trim($handle)) . '.myshopify.com';
                        }
                    }
                }
                if (str_contains($parsed['host'], 'myshopify.com')) {
                    return strtolower(trim($parsed['host']));
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
            'monthlyCount' => $monthlyCount,
        ]);
    }

    /**
     * Submenu: Feedback Submissions Log Table
     */
    public function submissions(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
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
            'monthlyCount' => $monthlyCount,
        ]);
    }

    /**
     * Submenu: Weekly AI Report & Actionable Suggestions
     */
    public function aiReport(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $monthlyCount = $this->getMonthlySubmissionCount($shopDomain);

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
        ]);
    }

    /**
     * Submenu: App Configuration & Customization Settings
     */
    public function settings(Request $request)
    {
        $shopDomain = $this->getShopDomain($request);
        $config = $this->getAppSettings($shopDomain);

        return Inertia::render('Settings', [
            'reasons' => $config['reasons'] ?? [],
            'enable_email' => (bool)($config['enable_email'] ?? true),
            'require_email' => (bool)($config['require_email'] ?? false),
            'popup_theme' => $config['popup_theme'] ?? 'modern',
            'shopDomain' => $shopDomain,
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

        $config = [
            'reasons' => array_values(array_filter($validated['reasons'])),
            'enable_email' => $validated['enable_email'],
            'require_email' => $validated['require_email'],
            'popup_theme' => $validated['popup_theme'],
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

                        DB::table('app_settings')->updateOrInsert(
                            ['shop_domain' => $shop, 'key' => 'access_token'],
                            [
                                'value' => json_encode($tokenValue),
                                'updated_at' => now(),
                            ]
                        );

                        Log::info("Automatic OAuth token saved for shop: {$shop}");
                        return redirect("/?shop=" . urlencode($shop));
                    }
                } else {
                    Log::error('OAuth token exchange failed: ' . $response->body());
                }
            } catch (\Throwable $e) {
                Log::error('OAuth token exchange exception: ' . $e->getMessage());
            }
        }

        return redirect("/?shop=" . urlencode($shop ?: ''));
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

        Log::info("Webhook app/uninstalled received for shop domain: " . ($shopDomain ?: 'UNKNOWN'));
        return response()->json(['success' => true]);
    }
}
