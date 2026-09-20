<?php

namespace Tests\Unit;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PpobTokenDefaultSellPriceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create(['key' => 'ppob_token_markup_below_1jt', 'value' => '5000', 'group' => 'ppob']);
        Setting::create(['key' => 'ppob_token_markup_1jt_up', 'value' => '10000', 'group' => 'ppob']);
    }

    #[DataProvider('tierBoundaryNominalsProvider')]
    public function test_default_sell_price_uses_tiered_markup(int $nominal, int $expectedSellPrice): void
    {
        $this->assertSame($expectedSellPrice, Setting::defaultTokenSellPrice($nominal));
    }

    /**
     * @return array<string, array{int, int}>
     */
    public static function tierBoundaryNominalsProvider(): array
    {
        return [
            'below threshold' => [99_999, 104_999],
            'at lower tier max example' => [100_000, 105_000],
            'just below 1jt' => [999_999, 1_004_999],
            'at 1jt threshold' => [1_000_000, 1_010_000],
            'upper tier' => [1_500_000, 1_510_000],
        ];
    }

    public function test_custom_markup_settings_are_used_for_default_sell_price(): void
    {
        Setting::updateOrCreate(
            ['key' => 'ppob_token_markup_below_1jt'],
            ['value' => '3500', 'group' => 'ppob'],
        );
        Setting::updateOrCreate(
            ['key' => 'ppob_token_markup_1jt_up'],
            ['value' => '7500', 'group' => 'ppob'],
        );

        $settings = Setting::ppobSettings();

        $this->assertSame(3500, $settings['ppob_token_markup_below_1jt']);
        $this->assertSame(7500, $settings['ppob_token_markup_1jt_up']);
        $this->assertSame(103_500, Setting::defaultTokenSellPrice(100_000));
        $this->assertSame(1_007_500, Setting::defaultTokenSellPrice(1_000_000));
    }

    public function test_zero_or_negative_nominal_returns_zero(): void
    {
        $this->assertSame(0, Setting::defaultTokenSellPrice(0));
        $this->assertSame(0, Setting::defaultTokenSellPrice(-1));
    }
}
