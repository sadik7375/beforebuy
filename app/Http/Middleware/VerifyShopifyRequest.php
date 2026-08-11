<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyShopifyRequest
{
    /**
     * Handle an incoming request and ensure Shopify shop domain & HMAC validity.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip Shopify iframe headers & middleware checks for webhook endpoints
        if ($request->is('webhooks/*') || $request->is('api/webhooks/*')) {
            return $next($request);
        }

        $shop = $request->get('shop');

        // Verify HMAC if present in request from Shopify Admin
        if ($request->has('hmac')) {
            $secret = env('SHOPIFY_API_SECRET');
            if (!empty($secret) && !$this->verifyHmac($request->all(), $secret)) {
                return response('Unauthorized request from Shopify', 401);
            }
        }

        // Set shop clean domain on request attributes if provided and valid
        if ($shop) {
            $shopClean = strtolower(trim($shop));
            if (!str_contains($shopClean, '.')) {
                $shopClean .= '.myshopify.com';
            }
            if (preg_match('/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/', $shopClean)) {
                $request->attributes->set('shop_domain', $shopClean);
            }
        }

        $response = $next($request);

        if ($response instanceof Response) {
            $response->headers->set('Content-Security-Policy', "frame-ancestors https://admin.shopify.com https://*.myshopify.com;");
        }

        return $response;
    }

    /**
     * Verify Shopify HMAC signature
     */
    private function verifyHmac(array $params, string $secret): bool
    {
        $hmac = $params['hmac'] ?? '';
        unset($params['hmac'], $params['signature']);

        ksort($params);
        $computedHmac = hash_hmac('sha256', http_build_query($params), $secret);

        return hash_equals($hmac, $computedHmac);
    }
}
