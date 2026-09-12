<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\PosTestHelpers;
use Tests\TestCase;

/**
 * Default periode Laporan PPOB = HARI INI (keputusan Iwan, 2026-09-12).
 *
 * Sebelumnya defaultnya awal bulan s/d hari ini, sehingga kasir harus mengubah
 * rentang sendiri setiap kali ingin melihat angka hari berjalan.
 */
class PpobReportDefaultPeriodTest extends TestCase
{
    use PosTestHelpers;
    use RefreshDatabase;

    public function test_report_page_defaults_to_today(): void
    {
        $user = $this->createCashierUser(['reports.ppob']);

        $today = now()->toDateString();

        $this->actingAs($user)
            ->get(route('account.reports.ppob'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.start_date', $today)
                ->where('filters.end_date', $today));
    }

    public function test_report_page_keeps_explicit_period(): void
    {
        $user = $this->createCashierUser(['reports.ppob']);

        $this->actingAs($user)
            ->get(route('account.reports.ppob', [
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-10',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.start_date', '2026-09-01')
                ->where('filters.end_date', '2026-09-10'));
    }
}
