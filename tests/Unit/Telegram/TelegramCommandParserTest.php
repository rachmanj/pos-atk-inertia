<?php

namespace Tests\Unit\Telegram;

use App\Services\Telegram\TelegramCommandParser;
use App\Services\Telegram\TelegramMoneyParser;
use InvalidArgumentException;
use Tests\TestCase;

class TelegramCommandParserTest extends TestCase
{
    private TelegramCommandParser $parser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->parser = new TelegramCommandParser(new TelegramMoneyParser);
    }

    public function test_parses_buy_command_with_total_keyword(): void
    {
        $intent = $this->parser->parseBuyCommand('beli meterai 100 lembar di Kantor Pos total 1jt');

        $this->assertSame('meterai', $intent->productQuery);
        $this->assertSame(100, $intent->qty);
        $this->assertSame('Kantor Pos', $intent->customerRef);
        $this->assertSame(10_000, $intent->unitPpobCost);
        $this->assertNull($intent->adminFee);
    }

    public function test_parses_buy_command_with_at_unit_cost(): void
    {
        $intent = $this->parser->parseBuyCommand('beli meterai 100 @10rb');

        $this->assertSame('meterai', $intent->productQuery);
        $this->assertSame(100, $intent->qty);
        $this->assertSame(10_000, $intent->unitPpobCost);
    }

    public function test_parses_admin_fee_override(): void
    {
        $intent = $this->parser->parseBuyCommand('ppob pulsa 1 total 25rb admin 2000');

        $this->assertSame('pulsa', $intent->productQuery);
        $this->assertSame(1, $intent->qty);
        $this->assertSame(25_000, $intent->unitPpobCost);
        $this->assertSame(2000, $intent->adminFee);
    }

    public function test_rejects_command_without_total_or_at_keyword(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->parser->parseBuyCommand('beli meterai 100 sebesar 1jt');
    }

    public function test_rejects_uneven_division(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('tidak bisa dibagi rata');

        $this->parser->parseBuyCommand('beli meterai 100 total 1000001');
    }
}
