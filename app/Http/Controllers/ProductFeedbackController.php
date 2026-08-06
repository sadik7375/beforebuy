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
     * Get dynamic feedback reasons from DB or Storage fallback
     */
    private function getReasons()
    {
        // 1. Try DB app_settings table
        try {
            $setting = DB::table('app_settings')->where('key', 'reasons')->first();
            if ($setting && !empty($setting->value)) {
                $decoded = json_decode($setting->value, true);
                if (is_array($decoded) && !empty($decoded)) {
                    return $decoded;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('AppSetting DB fetch error: ' . $e->getMessage());
        }

        // 2. Try Storage JSON file
        try {
            if (Storage::disk('local')->exists('settings.json')) {
                $data = json_decode(Storage::disk('local')->get('settings.json'), true);
                if (!empty($data['reasons']) && is_array($data['reasons'])) {
                    return $data['reasons'];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('AppSetting File fetch error: ' . $e->getMessage());
        }

        // 3. Fallback default reasons
        return [
            'Price is higher than expected',
            'Unsure about size / fit / dimensions',
            'Shipping fee or delivery time is too high',
            'Product information or reviews missing',
        ];
    }

    /**
     * Get statistics summary for dashboard
     */
    private function getStats()
    {
        try {
            return [
                'total_feedbacks' => DB::table('product_feedbacks')->count(),
                'top_reason' => DB::table('product_feedbacks')
                    ->select('reason')
                    ->selectRaw('count(*) as total')
                    ->groupBy('reason')
                    ->orderByDesc('total')
                    ->first()?->reason ?? 'Price too high',
                'pending_ai_analysis' => DB::table('product_feedbacks')->whereNull('ai_summary')->count(),
            ];
        } catch (\Throwable $e) {
            return [
                'total_feedbacks' => 0,
                'top_reason' => 'Price too high',
                'pending_ai_analysis' => 0,
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

        return Inertia::render('Overview', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
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

        return Inertia::render('Submissions', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
        ]);
    }

    /**
     * Submenu: Settings Page
     */
    public function settings()
    {
        return Inertia::render('Settings', [
            'reasons' => $this->getReasons(),
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
        ]);

        $reasons = array_values(array_filter($validated['reasons']));

        // 1. Save to File Storage Backup
        try {
            Storage::disk('local')->put('settings.json', json_encode(['reasons' => $reasons]));
        } catch (\Throwable $e) {
            Log::error('Settings file save error: ' . $e->getMessage());
        }

        // 2. Save to MySQL Database
        try {
            DB::table('app_settings')->updateOrInsert(
                ['key' => 'reasons'],
                [
                    'shop_domain' => 'global',
                    'value' => json_encode($reasons),
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
                'reasons' => $reasons,
            ]);
        }

        return redirect()->back()->with('success', 'Settings saved successfully!');
    }

    /**
     * Public API: Get dynamic settings for storefront popup
     */
    public function getApiSettings()
    {
        return response()->json([
            'success' => true,
            'reasons' => $this->getReasons(),
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
            'customer_email' => 'nullable|email',
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
