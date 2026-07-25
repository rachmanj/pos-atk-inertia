<?php

namespace App\Services;

class LegacyInventoryCategoryDetector
{
    /** @var array<string, string> keyword (uppercase) => category name */
    private const KEYWORDS = [
        'STABILO' => 'Stabilo & Highlighter',
        'HIGHLIGHTER' => 'Stabilo & Highlighter',
        'SPIDOL' => 'Spidol',
        'STIP ' => 'Spidol',
        'STIP.' => 'Spidol',
        'MARKER' => 'Spidol',
        'PENSIL' => 'Pensil',
        'PULPEN' => 'Pulpen',
        'PEN ' => 'Pulpen',
        'BOLPEN' => 'Pulpen',
        'BUKU' => 'Buku',
        'AGENDA' => 'Buku & Agenda',
        'NOTEBOOK' => 'Buku & Agenda',
        'KERTAS' => 'Kertas',
        'HVS' => 'Kertas',
        'FOTO COPY' => 'Kertas',
        'FOTOCOPY' => 'Kertas',
        'TIPE-X' => 'Tip Ex & Penghapus',
        'TIP-EX' => 'Tip Ex & Penghapus',
        'TIPEX' => 'Tip Ex & Penghapus',
        'PENGHAPUS' => 'Tip Ex & Penghapus',
        'PENGGARIS' => 'Penggaris',
        'GARISAN' => 'Penggaris',
        'PENGARIS' => 'Penggaris',
        'LEM ' => 'Lem & Perekat',
        'PAKU' => 'Paku & Perkakas',
        'OBENG' => 'Paku & Perkakas',
        'TANG' => 'Paku & Perkakas',
        'KUAS' => 'Kuas & Cat',
        'CAT ' => 'Kuas & Cat',
        'MAP ' => 'Map & Amplop',
        'AMPLop' => 'Map & Amplop',
        'PLASTIK' => 'Plastik & Kemasan',
        'STAPLER' => 'Alat Tulis Kantor',
        'CLIP' => 'Alat Tulis Kantor',
        'KALKULATOR' => 'Alat Tulis Kantor',
        'TAPE' => 'Alat Tulis Kantor',
        'ISOLASI' => 'Alat Tulis Kantor',
        'GUNTING' => 'Alat Tulis Kantor',
        'CUTTER' => 'Alat Tulis Kantor',
    ];

    public function detect(string $title): string
    {
        $upper = strtoupper($title);

        foreach (self::KEYWORDS as $keyword => $category) {
            if (str_contains($upper, $keyword)) {
                return $category;
            }
        }

        return 'ATK Umum';
    }
}
