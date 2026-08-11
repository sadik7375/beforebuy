<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\ProductFeedbackController;

// Submenu Routes
Route::get('/', [ProductFeedbackController::class, 'overview'])->name('overview');
Route::get('/submissions', [ProductFeedbackController::class, 'submissions'])->name('submissions');
Route::get('/ai-report', [ProductFeedbackController::class, 'aiReport'])->name('ai.report');
Route::get('/settings', [ProductFeedbackController::class, 'settings'])->name('settings');
Route::post('/settings/save', [ProductFeedbackController::class, 'saveSettings'])->name('settings.save');
Route::get('/setup', [ProductFeedbackController::class, 'setup'])->name('setup');
Route::get('/support', [ProductFeedbackController::class, 'support'])->name('support');
Route::post('/support/submit', [ProductFeedbackController::class, 'submitMerchantSupport'])->name('support.submit');

// Pricing Plan Routes
Route::get('/plans', [ProductFeedbackController::class, 'plans'])->name('plans');
Route::post('/plans/pro/subscribe', [ProductFeedbackController::class, 'subscribePro'])->name('plans.pro.subscribe');
Route::get('/plans/callback', [ProductFeedbackController::class, 'subscribeCallback'])->name('plans.callback');
Route::post('/plans/cancel', [ProductFeedbackController::class, 'cancelSubscription'])->name('plans.cancel');

// Shopify OAuth Route
Route::get('/auth/callback', [ProductFeedbackController::class, 'authCallback'])->name('auth.callback');

// Webhook Handler
Route::post('/webhooks/app-uninstalled', [ProductFeedbackController::class, 'handleAppUninstalled']);
Route::post('/webhooks/app/uninstalled', [ProductFeedbackController::class, 'handleAppUninstalled']);

// Privacy Policy Public Route (Required for Shopify App Store Listing)
Route::get('/privacy', function () {
    return view('privacy');
})->name('privacy');

Route::get('/privacy-policy', function () {
    return view('privacy');
});

// API Endpoints for Storefront Popup
Route::post('/api/feedback', [ProductFeedbackController::class, 'store']);
Route::get('/api/settings', [ProductFeedbackController::class, 'getApiSettings'])->name('api.settings');

// Utilities
Route::get('/run-migrate', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);
        return '<h2>Database Migration Success!</h2><pre>' . Artisan::output() . '</pre><br><a href="/">Go Back to App</a>';
    } catch (\Exception $e) {
        return '<h2>Migration Failed:</h2><pre>' . $e->getMessage() . '</pre>';
    }
});

Route::get('/clean-db', function (\Illuminate\Http\Request $request) {
    try {
        $shop = $request->get('shop') ?: session('shopify_shop') ?: 'canny-apps.myshopify.com';
        
        // 1. Delete all feedback submissions
        \Illuminate\Support\Facades\DB::table('product_feedbacks')->delete();
        
        // 2. Reset shop plan to Free ($0/month)
        \Illuminate\Support\Facades\DB::table('shops')
            ->where('shop_domain', $shop)
            ->update([
                'plan' => 'free',
                'charge_id' => null,
                'updated_at' => now()
            ]);

        return '
            <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif; padding: 50px 20px; text-align: center; background-color: #f6f6f7; min-height: 100vh;">
                <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🧹✨</div>
                    <h1 style="color: #008060; margin-bottom: 12px; font-size: 24px;">Database Cleaned Successfully!</h1>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                        • All product feedback submissions deleted.<br>
                        • Shop plan reset to <strong>Free Plan ($0/mo)</strong>.<br>
                        • Monthly feedback limit reset to <strong>0 / 10</strong>.
                    </p>
                    <a href="/?shop='.$shop.'" style="display: inline-block; background: #008060; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                        Return to App Overview
                    </a>
                </div>
            </div>
        ';
    } catch (\Exception $e) {
        return '<h2>Clean DB Error:</h2><pre>' . $e->getMessage() . '</pre>';
    }
});
