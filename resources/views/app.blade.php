<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link rel="shortcut icon" href="{{ asset(config('branding.logo_path')) }}" />

    <title inertia>{{ config('app.name', 'POS Kasir') }}</title>

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
