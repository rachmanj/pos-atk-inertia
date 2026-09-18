<?php

namespace App\Http\Controllers\Account\Concerns;

use App\Models\CashierShift;
use Illuminate\Http\Request;

trait AuthorizesCashierShift
{
    protected function authorizeShiftOwnerOrAdmin(Request $request, CashierShift $cashierShift): void
    {
        $user = $request->user();

        if ($cashierShift->user_id !== $user->id && !$user->isAdminUser()) {
            abort(403);
        }
    }

    protected function authorizeShiftAdmin(Request $request): void
    {
        if (!$request->user()->isAdminUser()) {
            abort(403);
        }
    }
}
