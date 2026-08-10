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
        $shop = $request->get('shop');

        // Verify HMAC if present in request from Shopify Admin
        if ($request->has('hmac')) {
            $secret = env('SHOPIFY_API_SECRET', '');
            if (!empty($secret) && !$this->verifyHmac($request->all(), $secret)) {
                return response('Unauthorized request from Shopify', 401);
            }
        }

        // Store clean shop domain in session if provided
        if ($shop) {
            $shopClean = strtolower(trim($shop));
            if (!str_contains($shopClean, '.')) {
                $shopClean .= '.myshopify.com';
            }
            session(['shop_domain' => $shopClean]);
        }

        $token = $request->header('X-Shopify-Access-Token') ?: $request->get('token');
        if ($token) {
            session(['shopify_token' => $token]);
        }

        $response = $next($request);

        // Add Content-Security-Policy to allow embedding inside Shopify Admin iframe
        $response->headers->set('Content-Security-Policy', "frame-ancestors https://*.myshopify.com https://admin.shopify.com;");

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
