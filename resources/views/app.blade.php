<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#2A3B8F">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <link rel="manifest" href="/manifest.json">
    <link rel="shortcut icon" href="{{ asset(config('branding.logo_path')) }}" />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">

    <title inertia>{{ config('app.name', 'POS Kasir') }}</title>

    <script>
        (function () {
            var stored = localStorage.getItem("pos-theme");
            document.documentElement.setAttribute(
                "data-theme",
                stored === "light" ? "light" : "dark"
            );
        })();
    </script>

    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead

    <!-- Midtrans Snap JS -->
    {{-- <script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="{{ config('midtrans.client_key') }}"></script> --}}
</head>

<body>

    @inertia
</body>

</html>
