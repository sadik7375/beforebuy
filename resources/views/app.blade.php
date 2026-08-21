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

        <!-- Crisp Live Chat Integration -->
        <script type="text/javascript">
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="69483358-0847-4a5c-9e02-ed71cbc48f1e";
          (function(){
            d=document;
            s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        </script>
    </body>
</html>
