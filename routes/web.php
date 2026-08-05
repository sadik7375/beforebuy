<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Dashboard');
});

// Run DB Migrations via browser URL (for cPanel without terminal)
Route::get('/run-migrate', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);
        return '<h2>Database Migration Success!</h2><pre>' . Artisan::output() . '</pre><br><a href="/">Go Back to Dashboard</a>';
    } catch (\Exception $e) {
        return '<h2>Migration Failed:</h2><pre>' . $e->getMessage() . '</pre>';
    }
});

// Clear Cache via browser URL
Route::get('/clear-cache', function () {
    try {
        Artisan::call('config:clear');
        Artisan::call('cache:clear');
        Artisan::call('route:clear');
        Artisan::call('view:clear');
        return '<h2>All Laravel Caches Cleared!</h2><br><a href="/">Go Back to Dashboard</a>';
    } catch (\Exception $e) {
        return '<h2>Cache Clear Failed:</h2><pre>' . $e->getMessage() . '</pre>';
    }
});
