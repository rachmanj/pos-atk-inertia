<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'ppob_admin_fee'],
            [
                'value' => '2000',
                'group' => 'ppob',
            ],
        );

        Setting::updateOrCreate(
            ['key' => 'ppob_min_balance_default'],
            [
                'value' => '100000',
                'group' => 'ppob',
            ],
        );

        Setting::updateOrCreate(
            ['key' => 'ppob_token_fee'],
            [
                'value' => '4500',
                'group' => 'ppob',
            ],
        );

        Setting::updateOrCreate(
            ['key' => 'ppob_token_markup_below_1jt'],
            [
                'value' => '5000',
                'group' => 'ppob',
            ],
        );

        Setting::updateOrCreate(
            ['key' => 'ppob_token_markup_1jt_up'],
            [
                'value' => '10000',
                'group' => 'ppob',
            ],
        );

        Setting::updateOrCreate(
            ['key' => 'ppob_token_product_ids'],
            [
                'value' => '3207',
                'group' => 'ppob',
            ],
        );
    }
}
