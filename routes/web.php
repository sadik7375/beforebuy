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
Route::get('/pricing', [ProductFeedbackController::class, 'pricing'])->name('pricing');
Route::get('/setup', [ProductFeedbackController::class, 'setup'])->name('setup');
Route::get('/support', [ProductFeedbackController::class, 'support'])->name('support');
Route::post('/support/submit', [ProductFeedbackController::class, 'submitMerchantSupport'])->name('support.submit');

// Shopify Billing Routes
Route::post('/billing/subscribe', [ProductFeedbackController::class, 'subscribePro'])->name('billing.subscribe');
Route::get('/billing/confirm', [ProductFeedbackController::class, 'billingConfirm'])->name('billing.confirm');

// Webhook Handler
Route::post('/webhooks/app-uninstalled', [ProductFeedbackController::class, 'handleAppUninstalled']);

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

Route::get('/reset-app-data', function (\Illuminate\Http\Request $request) {
    try {
        $shop = $request->get('shop');
        if ($shop) {
            $shortHandle = explode('.myshopify.com', $shop)[0];
            \Illuminate\Support\Facades\DB::table('app_settings')
                ->where('shop_domain', '=', $shop)
                ->orWhere('shop_domain', '=', $shortHandle)
                ->delete();
            \Illuminate\Support\Facades\DB::table('product_feedbacks')
                ->where('shop_domain', '=', $shop)
                ->orWhere('shop_domain', '=', $shortHandle)
                ->delete();
            \Illuminate\Support\Facades\DB::table('merchant_supports')
                ->where('shop_domain', '=', $shop)
                ->orWhere('shop_domain', '=', $shortHandle)
                ->delete();
            return "<h2>App Data Cleared for shop: {$shop}!</h2><br><a href=\"/?shop={$shop}\">Go Back to App</a>";
        }
        \Illuminate\Support\Facades\DB::table('app_settings')->truncate();
        \Illuminate\Support\Facades\DB::table('product_feedbacks')->truncate();
        \Illuminate\Support\Facades\DB::table('merchant_supports')->truncate();
        return '<h2>All Database App Settings & Feedbacks Truncated!</h2><br><a href="/">Go Back to App</a>';
    } catch (\Exception $e) {
        return '<h2>Reset Failed:</h2><pre>' . $e->getMessage() . '</pre>';
    }
});
