<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="shopify-api-key" content="d234e2fe788685b9b37f041b968428ef" />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <title>BeforeBuy - Private Customer Feedback</title>
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
