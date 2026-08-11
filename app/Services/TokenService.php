<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TokenService
{
    /**
     * Get a valid access token for a given shop domain, refreshing it if expired or expiring soon.
     */
    public static function getValidToken(string $shop): ?string
    {
        $cleanShop = strtolower(trim($shop));
        if (!str_contains($cleanShop, '.')) {
            $cleanShop .= '.myshopify.com';
        }

        $shortHandle = explode('.myshopify.com', $cleanShop)[0];

        $row = DB::table('app_settings')
            ->where(function ($q) use ($cleanShop, $shortHandle) {
                $q->where('shop_domain', '=', $cleanShop)
                  ->orWhere('shop_domain', '=', $shortHandle)
                  ->orWhere('shop_domain', '=', 'global');
            })
            ->where('key', 'access_token')
            ->orderByDesc('id')
            ->first();

        if (!$row || empty($row->value)) {
            // Fallback: check any latest access_token in app_settings table
            $row = DB::table('app_settings')
                ->where('key', 'access_token')
                ->orderByDesc('id')
                ->first();
        }

        if (!$row || empty($row->value)) {
            return null;
        }

        $data = json_decode($row->value, true);
        if (!is_array($data) || empty($data['token'])) {
            return null;
        }

        $expiresAt = $data['expires_at'] ?? null;
        $refreshToken = $data['refresh_token'] ?? null;

        // If expires_at is set and token is expired or expiring within 5 minutes, attempt refresh
        if ($expiresAt && $refreshToken) {
            $expiryTime = strtotime($expiresAt);
            if ($expiryTime && (time() + 300) >= $expiryTime) {
                Log::info("Token for {$cleanShop} is expiring soon. Attempting refresh...");
                $newToken = self::refreshToken($cleanShop, $refreshToken);
                if ($newToken) {
                    return $newToken;
                }
            }
        }

        return $data['token'];
    }

    /**
     * Refresh the access token using the refresh_token grant type.
     */
    public static function refreshToken(string $shop, string $refreshToken): ?string
    {
        $apiKey = env('SHOPIFY_API_KEY');
        $apiSecret = env('SHOPIFY_API_SECRET');

        if (!$apiKey || !$apiSecret || !$refreshToken) {
            return null;
        }

        try {
            $response = Http::post("https://{$shop}/admin/oauth/access_token", [
                'client_id' => $apiKey,
                'client_secret' => $apiSecret,
                'grant_type' => 'refresh_token',
                'refresh_token' => $refreshToken,
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
                    } else {
                        $tokenValue['refresh_token'] = $refreshToken; // retain existing if not rotated
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

                    Log::info("Access token successfully refreshed for shop: {$shop}");
                    return $accessToken;
                }
            } else {
                Log::error("Failed to refresh token for shop {$shop}: " . $response->body());
            }
        } catch (\Throwable $e) {
            Log::error("Exception during token refresh for shop {$shop}: " . $e->getMessage());
        }

        return null;
    }
}
