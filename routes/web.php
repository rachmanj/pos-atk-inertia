<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Account\DashboardController;
use App\Http\Controllers\Account\RoleController;
use App\Http\Controllers\Account\UserController;
use App\Http\Controllers\Account\CategoryController;
use App\Http\Controllers\Account\SupplierController;
use App\Http\Controllers\Account\CustomerController;
use App\Http\Controllers\Account\ProductController;
use App\Http\Controllers\Account\ProductImportController;
use App\Http\Controllers\Account\StockMovementController;
use App\Http\Controllers\Account\StockOpnameController;
use App\Http\Controllers\Account\PurchaseController;
use App\Http\Controllers\Account\SupplierReturnController;
use App\Http\Controllers\Account\CashierShiftController;
use App\Http\Controllers\Account\CartController;
use App\Http\Controllers\Account\TransactionController;
use App\Http\Controllers\Account\TransactionHistoryController;
use App\Http\Controllers\Account\ReturnTransactionController;
use App\Http\Controllers\Account\ExpenseController;
use App\Http\Controllers\Account\SalesReportController;
use App\Http\Controllers\Account\ProfitReportController;
use App\Http\Controllers\Account\StockReportController;
use App\Http\Controllers\Account\ProductSalesReportController;
use App\Http\Controllers\Account\PpobReportController;
use App\Http\Controllers\Account\ExpenseReportController;
use App\Http\Controllers\Account\CustomerReportController;
use App\Http\Controllers\Account\SettingController;
use App\Http\Controllers\Account\PpobAccountController;
use App\Http\Controllers\Account\PpobBalanceLogController;
use App\Http\Controllers\Account\UnitController;
use App\Http\Controllers\Account\PasswordController;
use App\Http\Controllers\Telegram\TelegramWebhookController;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('account.dashboard')
        : redirect()->route('login');
});

Route::middleware(['guest'])->group(function () {
    Route::get('/login', [LoginController::class, 'index'])
        ->name('login');

    Route::post('/login', [LoginController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('login.store');
});

Route::post('/logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::post('/midtrans/callback', [TransactionController::class, 'callback'])
    ->name('midtrans.callback');

Route::post('/telegram/webhook', [TelegramWebhookController::class, 'handle'])
    ->middleware([\App\Http\Middleware\VerifyTelegramWebhook::class, 'throttle:60,1'])
    ->name('telegram.webhook');

Route::middleware(['auth'])
    ->prefix('account')
    ->name('account.')
    ->group(function () {
        Route::get('/dashboard', DashboardController::class)
            ->middleware('permission:dashboard.index')
            ->name('dashboard');

        Route::get('/password', [PasswordController::class, 'edit'])
            ->name('password.edit');

        Route::put('/password', [PasswordController::class, 'update'])
            ->name('password.update');

        Route::resource('/roles', RoleController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:roles.index')
            ->middlewareFor(['create', 'store'], 'permission:roles.create')
            ->middlewareFor(['edit', 'update'], 'permission:roles.edit')
            ->middlewareFor('destroy', 'permission:roles.delete');

        Route::resource('users', UserController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:users.index')
            ->middlewareFor(['create', 'store'], 'permission:users.create')
            ->middlewareFor(['edit', 'update'], 'permission:users.edit')
            ->middlewareFor('destroy', 'permission:users.delete');

        Route::resource('units', UnitController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:units.index')
            ->middlewareFor(['create', 'store'], 'permission:units.create')
            ->middlewareFor(['edit', 'update'], 'permission:units.edit')
            ->middlewareFor('destroy', 'permission:units.delete');

        Route::resource('ppob-accounts', PpobAccountController::class)
            ->except(['show', 'destroy'])
            ->middlewareFor('index', 'permission:ppob-accounts.index')
            ->middlewareFor(['create', 'store'], 'permission:ppob-accounts.create')
            ->middlewareFor(['edit', 'update'], 'permission:ppob-accounts.edit');

        Route::get('ppob-balance-logs', [PpobBalanceLogController::class, 'index'])
            ->middleware('permission:ppob-balance-logs.index')
            ->name('ppob-balance-logs.index');

        Route::post('ppob-balance-logs', [PpobBalanceLogController::class, 'store'])
            ->middleware('permission:ppob-balance-logs.store')
            ->name('ppob-balance-logs.store');

        Route::get('/settings', [SettingController::class, 'index'])
            ->middleware('permission:settings.index')
            ->name('settings.index');

        Route::put('/settings', [SettingController::class, 'update'])
            ->middleware('permission:settings.edit')
            ->name('settings.update');

        Route::resource('categories', CategoryController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:categories.index')
            ->middlewareFor(['create', 'store'], 'permission:categories.create')
            ->middlewareFor(['edit', 'update'], 'permission:categories.edit')
            ->middlewareFor('destroy', 'permission:categories.delete');

        Route::resource('suppliers', SupplierController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:suppliers.index')
            ->middlewareFor(['create', 'store'], 'permission:suppliers.create')
            ->middlewareFor(['edit', 'update'], 'permission:suppliers.edit')
            ->middlewareFor('destroy', 'permission:suppliers.delete');

        Route::get('customers/search', [CustomerController::class, 'search'])
            ->middleware('permission:transactions.create')
            ->name('customers.search');

        Route::resource('customers', CustomerController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:customers.index')
            ->middlewareFor(['create', 'store'], 'permission:customers.create')
            ->middlewareFor(['edit', 'update'], 'permission:customers.edit')
            ->middlewareFor('destroy', 'permission:customers.delete');

        Route::get('products/print-barcodes', [ProductController::class, 'printBarcodes'])
            ->middleware('permission:products.index')
            ->name('products.print_barcodes');

        Route::get('products/import/template', [ProductImportController::class, 'template'])
            ->middleware('permission:products.create')
            ->name('products.import_template');

        Route::post('products/import', [ProductImportController::class, 'store'])
            ->middleware('permission:products.create')
            ->name('products.import');

        Route::resource('products', ProductController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:products.index')
            ->middlewareFor(['create', 'store'], 'permission:products.create')
            ->middlewareFor(['edit', 'update'], 'permission:products.edit')
            ->middlewareFor('destroy', 'permission:products.delete');

        Route::resource('stock-movements', StockMovementController::class)
            ->only(['index', 'create', 'store'])
            ->middlewareFor('index', 'permission:stock_movements.index')
            ->middlewareFor(['create', 'store'], 'permission:stock_movements.create');

        Route::resource('stock-opnames', StockOpnameController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters([
                'stock-opnames' => 'code',
            ])
            ->middlewareFor('index', 'permission:stock_opnames.index')
            ->middlewareFor(['create', 'store'], 'permission:stock_opnames.create')
            ->middlewareFor('show', 'permission:stock_opnames.show');

        Route::resource('purchases', PurchaseController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->parameters([
                'purchases' => 'invoice',
            ])
            ->middlewareFor('index', 'permission:purchases.index')
            ->middlewareFor(['create', 'store'], 'permission:purchases.create')
            ->middlewareFor('show', 'permission:purchases.show');

        Route::get('supplier-returns', [SupplierReturnController::class, 'index'])
            ->middleware('permission:supplier_returns.index')
            ->name('supplier-returns.index');

        Route::get('supplier-returns/create/{invoice}', [SupplierReturnController::class, 'create'])
            ->middleware('permission:supplier_returns.create')
            ->name('supplier-returns.create');

        Route::post('supplier-returns', [SupplierReturnController::class, 'store'])
            ->middleware('permission:supplier_returns.create')
            ->name('supplier-returns.store');

        Route::get('supplier-returns/{invoice}', [SupplierReturnController::class, 'show'])
            ->middleware('permission:supplier_returns.show')
            ->name('supplier-returns.show');

        Route::resource('/cashier-shifts', CashierShiftController::class)
            ->only(['index', 'create', 'store', 'show'])
            ->middlewareFor('index', 'permission:cashier_shifts.index')
            ->middlewareFor(['create', 'store'], 'permission:cashier_shifts.open')
            ->middlewareFor('show', 'permission:cashier_shifts.index');

        Route::put('/cashier-shifts/{cashierShift}/close', [CashierShiftController::class, 'close'])
            ->middleware('permission:cashier_shifts.close')
            ->name('cashier-shifts.close');

        Route::post('/carts', [CartController::class, 'store'])
            ->middleware('permission:transactions.create')
            ->name('carts.store');

        Route::put('/carts/{cart}', [CartController::class, 'update'])
            ->middleware('permission:transactions.create')
            ->name('carts.update');

        Route::delete('/carts/{cart}', [CartController::class, 'destroy'])
            ->middleware('permission:transactions.create')
            ->name('carts.destroy');

        Route::patch('/carts/{cart}/hold', [CartController::class, 'hold'])
            ->middleware('permission:transactions.create')
            ->name('carts.hold');

        Route::get('/transactions', [TransactionHistoryController::class, 'index'])
            ->middleware('permission:transactions.index')
            ->name('transactions.index');

        Route::get('/transactions/create', [TransactionController::class, 'create'])
            ->middleware('permission:transactions.create')
            ->name('transactions.create');

        Route::post('/transactions', [TransactionController::class, 'store'])
            ->middleware('permission:transactions.create')
            ->name('transactions.store');

        Route::put('/transactions/{invoice}/void', [TransactionController::class, 'void'])
            ->middleware('permission:transactions.void')
            ->name('transactions.void');

        Route::get('/transactions/{invoice}', [TransactionController::class, 'show'])
            ->middleware('permission:transactions.show')
            ->name('transactions.show');

        Route::get('/returns', [ReturnTransactionController::class, 'index'])
            ->middleware('permission:returns.index')
            ->name('returns.index');

        Route::get('/returns/create/{invoice}', [ReturnTransactionController::class, 'create'])
            ->middleware('permission:returns.create')
            ->name('returns.create');

        Route::post('/returns', [ReturnTransactionController::class, 'store'])
            ->middleware('permission:returns.create')
            ->name('returns.store');

        Route::get('/returns/{invoice}', [ReturnTransactionController::class, 'show'])
            ->middleware('permission:returns.show')
            ->name('returns.show');

        Route::put('/returns/{id}', [ReturnTransactionController::class, 'update'])
            ->middleware('permission:returns.approve')
            ->name('returns.update');

        Route::get('/reports/sales', [SalesReportController::class, 'index'])
            ->middleware('permission:reports.sales')
            ->name('reports.sales');

        Route::get('/reports/profit', [ProfitReportController::class, 'index'])
            ->middleware('permission:profits.index')
            ->name('reports.profit');

        Route::get('/reports/stock', [StockReportController::class, 'index'])
            ->middleware('permission:reports.stock')
            ->name('reports.stock');

        // Export endpoints
        Route::get('/reports/sales/export', [SalesReportController::class, 'export'])
            ->middleware('permission:reports.export')
            ->name('reports.sales.export');

        Route::get('/reports/profit/export', [ProfitReportController::class, 'export'])
            ->middleware('permission:reports.export')
            ->name('reports.profit.export');

        Route::get('/reports/stock/export', [StockReportController::class, 'export'])
            ->middleware('permission:reports.export')
            ->name('reports.stock.export');

        // New reports
        Route::get('/reports/product-sales', [ProductSalesReportController::class, 'index'])
            ->middleware('permission:reports.product_sales')
            ->name('reports.product_sales');

        Route::get('/reports/product-sales/export', [ProductSalesReportController::class, 'export'])
            ->middleware('permission:reports.export')
            ->name('reports.product_sales.export');

        Route::get('/reports/ppob', [PpobReportController::class, 'index'])
            ->middleware('permission:reports.ppob')
            ->name('reports.ppob');

        Route::get('/reports/ppob/export', [PpobReportController::class, 'export'])
            ->middleware('permission:reports.export')
            ->name('reports.ppob.export');

        Route::get('/reports/expense', [ExpenseReportController::class, 'index'])
            ->middleware('permission:reports.expense')
            ->name('reports.expense');

        Route::get('/reports/expense/export', [ExpenseReportController::class, 'export'])
            ->middleware('permission:reports.export')
            ->name('reports.expense.export');

        Route::get('/reports/customers', [CustomerReportController::class, 'index'])
            ->middleware('permission:reports.customers')
            ->name('reports.customers');

        Route::get('/reports/customers/export', [CustomerReportController::class, 'export'])
            ->middleware('permission:reports.export')
            ->name('reports.customers.export');

        Route::resource('/expenses', ExpenseController::class)
            ->except(['show'])
            ->middlewareFor('index', 'permission:expenses.index')
            ->middlewareFor(['create', 'store'], 'permission:expenses.create')
            ->middlewareFor(['edit', 'update'], 'permission:expenses.edit')
            ->middlewareFor('destroy', 'permission:expenses.delete');
    });
