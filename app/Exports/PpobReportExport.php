<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class PpobReportExport implements WithMultipleSheets
{
    public function __construct(
        protected array $filters = []
    ) {}

    public function sheets(): array
    {
        return [
            new PpobReportDataSheetExport($this->filters),
            new PpobReportRekapKasirSheetExport($this->filters),
        ];
    }
}
