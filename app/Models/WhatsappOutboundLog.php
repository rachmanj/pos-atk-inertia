<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsappOutboundLog extends Model
{
    protected $fillable = [
        'purpose',
        'cashier_shift_id',
        'transaction_id',
        'to_number',
        'message_text',
        'status',
        'wa_message_id',
        'error',
        'created_by',
    ];

    public function cashierShift(): BelongsTo
    {
        return $this->belongsTo(CashierShift::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
