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
     * Get dynamic app config (reasons, email toggle, email required)
     */
    private function getAppSettings()
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
        ];

        // 1. Try DB app_settings table
        try {
            $setting = DB::table('app_settings')->where('key', 'app_config')->first();
            if (!$setting) {
                // Fallback check old 'reasons' key
                $setting = DB::table('app_settings')->where('key', 'reasons')->first();
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

        // 2. Try Storage JSON file
        try {
            if (Storage::disk('local')->exists('settings.json')) {
                $data = json_decode(Storage::disk('local')->get('settings.json'), true);
                if (is_array($data)) {
                    if (isset($data['reasons'])) {
                        return array_merge($default, $data);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('AppSetting File fetch error: ' . $e->getMessage());
        }

        return $default;
    }

    /**
     * Get statistics summary for dashboard
     */
    private function getStats()
    {
        try {
            $totalFeedbacks = DB::table('product_feedbacks')->count();
            $emailsCount = DB::table('product_feedbacks')->whereNotNull('customer_email')->where('customer_email', '!=', '')->count();
            
            // Top reasons with percentages
            $reasonsData = DB::table('product_feedbacks')
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
            $topProducts = DB::table('product_feedbacks')
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
                'response_rate' => $totalFeedbacks > 0 ? round(($emailsCount / $totalFeedbacks) * 100) : 60,
                'estimated_lost_revenue' => $totalFeedbacks * 35,
                'open_inquiries' => DB::table('product_feedbacks')->whereNull('ai_summary')->count(),
                'top_reason' => $reasonsData->first()?->reason ?? 'Price is higher than expected',
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
                'top_reason' => 'Price is higher than expected',
                'reasons_breakdown' => [],
                'top_products' => [],
            ];
        }
    }

    /**
     * Submenu: Overview
     */
    public function overview()
    {
        try {
            $feedbacks = DB::table('product_feedbacks')->orderByDesc('id')->take(10)->get();
        } catch (\Throwable $e) {
            $feedbacks = collect([]);
        }

        $config = $this->getAppSettings();

        return Inertia::render('Overview', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
            'reasons' => $config['reasons'] ?? [],
        ]);
    }

    /**
     * Submenu: Feedback Submissions Log Table
     */
    public function submissions()
    {
        try {
            $feedbacks = DB::table('product_feedbacks')->orderByDesc('id')->paginate(50);
        } catch (\Throwable $e) {
            $feedbacks = collect([]);
        }

        $config = $this->getAppSettings();

        return Inertia::render('Submissions', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
            'reasons' => $config['reasons'] ?? [],
        ]);
    }

    /**
     * Submenu: Settings Page
     */
    public function settings()
    {
        $config = $this->getAppSettings();
        return Inertia::render('Settings', [
            'reasons' => $config['reasons'],
            'enable_email' => (bool)$config['enable_email'],
            'require_email' => (bool)$config['require_email'],
        ]);
    }

    /**
     * Save dynamic settings (DB + File persistence)
     */
    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'reasons' => 'required|array',
            'reasons.*' => 'required|string',
            'enable_email' => 'required|boolean',
            'require_email' => 'required|boolean',
        ]);

        $config = [
            'reasons' => array_values(array_filter($validated['reasons'])),
            'enable_email' => (bool)$validated['enable_email'],
            'require_email' => (bool)$validated['require_email'],
        ];

        // 1. Save to File Storage Backup
        try {
            Storage::disk('local')->put('settings.json', json_encode($config));
        } catch (\Throwable $e) {
            Log::error('Settings file save error: ' . $e->getMessage());
        }

        // 2. Save to MySQL Database
        try {
            DB::table('app_settings')->updateOrInsert(
                ['key' => 'app_config'],
                [
                    'shop_domain' => 'global',
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
    public function getApiSettings()
    {
        $config = $this->getAppSettings();
        
        // Ensure "Other reason" is always in the list
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
        ]);
    }

    /**
     * Submenu: Pricing
     */
    public function pricing()
    {
        return Inertia::render('Pricing', [
            'current_plan' => 'Free Trial',
        ]);
    }

    /**
     * Submenu: Setup
     */
    public function setup()
    {
        return Inertia::render('Setup');
    }

    /**
     * Submenu: Support
     */
    public function support()
    {
        return Inertia::render('Support');
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

        // 1. Save directly into MySQL Database
        try {
            $dataToInsert = array_merge($validated, [
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $feedbackId = DB::table('product_feedbacks')->insertGetId($dataToInsert);
        } catch (\Throwable $e) {
            Log::error('Feedback DB store error: ' . $e->getMessage());
        }

        // 2. File Backup in storage/app/feedbacks.json
        try {
            $existing = [];
            if (Storage::disk('local')->exists('feedbacks.json')) {
                $existing = json_decode(Storage::disk('local')->get('feedbacks.json'), true) ?: [];
            }
            $validated['created_at'] = now()->toDateTimeString();
            $existing[] = $validated;
            Storage::disk('local')->put('feedbacks.json', json_encode($existing));
        } catch (\Throwable $e) {
            Log::error('Feedback File backup error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
            'feedback' => $validated,
        ]);
    }
}
