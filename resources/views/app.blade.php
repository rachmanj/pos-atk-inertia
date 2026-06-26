<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/v4-shims.min.css">
    <link rel="stylesheet" href="{{ asset('assets/css/styles.css') }}">
    <link rel="shortcut icon" href="{{ asset(config('branding.logo_path')) }}" />

    <title inertia>{{ config('app.name', 'POS Kasir') }}</title>

    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead

    <!-- Midtrans Snap JS -->
    {{-- <script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="{{ config('midtrans.client_key') }}"></script> --}}
</head>

<body class="hold-transition sidebar-mini">

    @inertia

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
