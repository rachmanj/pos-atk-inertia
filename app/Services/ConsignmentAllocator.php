<?php

namespace App\Services;

use App\Models\ConsignmentItem;
use Illuminate\Support\Collection;

class ConsignmentAllocator
{
    /**
     * @return list<array{
     *     qty_base: int,
     *     buy_price: int,
     *     consignment_item_id: int|null,
     *     consignment_item: ConsignmentItem|null
     * }>
     */
    public function allocateFifo(int $productId, int $qtyInBase, int $avgCost): array
    {
        if ($qtyInBase <= 0) {
            return [];
        }

        /** @var Collection<int, ConsignmentItem> $items */
        $items = ConsignmentItem::query()
            ->select('consignment_items.*')
            ->join('consignments', 'consignments.id', '=', 'consignment_items.consignment_id')
            ->where('consignment_items.product_id', $productId)
            ->whereRaw('consignment_items.qty_in - consignment_items.qty_sold - consignment_items.qty_returned > 0')
            ->orderBy('consignments.received_date')
            ->orderBy('consignment_items.id')
            ->lockForUpdate()
            ->get();

        if ($items->isEmpty()) {
            return [
                [
                    'qty_base' => $qtyInBase,
                    'buy_price' => $avgCost,
                    'consignment_item_id' => null,
                    'consignment_item' => null,
                ],
            ];
        }

        $remaining = $qtyInBase;
        $slices = [];

        foreach ($items as $item) {
            if ($remaining <= 0) {
                break;
            }

            $available = $item->remainingQty();

            if ($available <= 0) {
                continue;
            }

            $take = min($remaining, $available);

            $slices[] = [
                'qty_base' => $take,
                'buy_price' => (int) $item->cost_price,
                'consignment_item_id' => (int) $item->id,
                'consignment_item' => $item,
            ];

            $remaining -= $take;
        }

        if ($remaining > 0) {
            $slices[] = [
                'qty_base' => $remaining,
                'buy_price' => $avgCost,
                'consignment_item_id' => null,
                'consignment_item' => null,
            ];
        }

        return $slices;
    }
}