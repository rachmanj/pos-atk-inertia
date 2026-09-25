<?php
// Siapkan / bersihkan akun uji produksi. Pakai: php uji_akun.php siap | php uji_akun.php bersih
require __DIR__.'/vendor/autoload.php'; $app=require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\User; use Illuminate\Support\Facades\DB; use Illuminate\Support\Facades\Hash;

$aksi = $argv[1] ?? 'siap';
if ($aksi === 'siap') {
    $u = User::updateOrCreate(['username' => 'zz_dea_smoketest'],
        ['name' => 'ZZ Smoke Test', 'email' => 'zz_dea_smoketest@example.test', 'password' => Hash::make('Sm0keTestDea!2026')]);
    try { $u->syncRoles(['admin']); } catch (\Throwable $e) {}
    if (!DB::table('cashier_shifts')->where('user_id', $u->id)->where('status', 'open')->exists()) {
        DB::table('cashier_shifts')->insert(['user_id'=>$u->id,'opened_at'=>now(),'cash_in_hand'=>0,'status'=>'open','cash_overage'=>0,'expense_amount'=>0,'total_transactions'=>0,'created_at'=>now(),'updated_at'=>now()]);
    }
    echo "siap id={$u->id}\n";
} else {
    $u = User::where('username', 'zz_dea_smoketest')->first();
    if ($u) {
        echo "transaksi uji: ".DB::table('transactions')->where('cashier_id', $u->id)->count()."\n";
        DB::table('cashier_shifts')->where('user_id', $u->id)->delete();
        DB::table('carts')->where('cashier_id', $u->id)->delete();
        DB::table('sessions')->where('user_id', $u->id)->delete();
        try { $u->syncRoles([]); } catch (\Throwable $e) {}
        $u->delete();
    }
}
echo 'users='.User::count().' user_uji='.User::where('username','like','zz_%')->count()
   .' transaksi='.DB::table('transactions')->count()
   .' shift_open='.DB::table('cashier_shifts')->where('status','open')->count()."\n";
