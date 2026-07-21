<?php

namespace Tests\Unit\Telegram;

use App\Services\Telegram\TelegramCommandParser;
use App\Services\Telegram\TelegramMoneyParser;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TelegramMoneyParserTest extends TestCase
{
    private TelegramMoneyParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new TelegramMoneyParser;
    }

    #[DataProvider('validAmountProvider')]
    public function test_parses_indonesian_money_formats(string $input, int $expected): void
    {
        $this->assertSame($expected, $this->parser->parse($input));
    }

    public static function validAmountProvider(): array
    {
        return [
            ['1jt', 1_000_000],
            ['1 jt', 1_000_000],
            ['500rb', 500_000],
            ['500 ribu', 500_000],
            ['1.000.000', 1_000_000],
            ['1000000', 1_000_000],
            ['Rp 1.000.000', 1_000_000],
            ['rp 25rb', 25_000],
            ['10rb', 10_000],
        ];
    }

    public function test_rejects_invalid_money(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->parser->parse('abc');
    }
}
