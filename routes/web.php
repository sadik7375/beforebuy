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

Route::get('/clear-cache', function () {
    try {
        Artisan::call('config:clear');
        Artisan::call('cache:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        return '<h2>All Caches Cleared!</h2><br><a href="/">Go Back to App</a>';
    } catch (\Exception $e) {
        return '<h2>Cache Clear Failed:</h2><pre>' . $e->getMessage() . '</pre>';
    }
});
