<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Barcode</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 10px; }
        .barcode-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .barcode-item {
            text-align: center;
            padding: 8px 12px;
            border: 1px dashed #ccc;
            border-radius: 4px;
            width: 180px;
        }
        .barcode-item img { max-width: 100%; height: auto; }
        .barcode-title { font-size: 10px; margin-top: 4px; word-break: break-word; }
        .barcode-price { font-size: 10px; font-weight: bold; }
        @media print {
            body { padding: 0; }
            .barcode-item { border: 1px solid #eee; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="barcode-grid">
        @foreach($products as $product)
        <div class="barcode-item">
            <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text={{ urlencode($product->barcode) }}&scale=2&height=12&includetext&backgroundcolor=ffffff"
                 alt="{{ $product->barcode }}"
                 data-fallback="{{ $product->barcode }}"
                 onerror="this.onerror=null;this.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;160&quot; height=&quot;50&quot;><rect width=&quot;160&quot; height=&quot;50&quot; fill=&quot;#f0f0f0&quot;/><text x=&quot;80&quot; y=&quot;30&quot; text-anchor=&quot;middle&quot; font-size=&quot;10&quot;>'+this.dataset.fallback+'</text></svg>')">
            <div class="barcode-title">{{ $product->title }}</div>
            <div class="barcode-price">Rp {{ number_format($product->sell_price, 0, ',', '.') }}</div>
        </div>
        @endforeach
    </div>
</body>
</html>
