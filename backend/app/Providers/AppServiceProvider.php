<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // No custom bindings required for this application.
    }

    public function boot(): void
    {
        // Application-specific boot logic is handled in middleware and route files.
    }
}
