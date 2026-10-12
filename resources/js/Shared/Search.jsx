import { useState } from "react";
import { router } from "@inertiajs/react";
import { Button, Flex, Input } from "antd";

export default function Search({
    URL,
    placeholder = "Ketik kata kunci lalu tekan Enter...",
    onSearch,
    value: controlledValue,
    onChange,
    onScannerClick,
}) {
    const [internalSearch, setInternalSearch] = useState("");
    const isControlled = controlledValue !== undefined;
    const search = isControlled ? controlledValue : internalSearch;

    const setSearch = (next) => {
        if (isControlled) {
            onChange?.(next);
        } else {
            setInternalSearch(next);
        }
    };

    const handleSearch = (value) => {
        const query = value ?? search;

        if (onSearch) {
            onSearch(query);
            return;
        }

        router.get(
            URL,
            { q: query },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const searchInput = (
        <Input.Search
            placeholder={placeholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={handleSearch}
            allowClear
            enterButton
            style={onScannerClick ? { flex: 1, minWidth: 0 } : undefined}
        />
    );

    if (!onScannerClick) {
        return searchInput;
    }

    return (
        <Flex
            gap={8}
            align="center"
            className="shared-search-with-scanner"
            style={{ width: "100%" }}
        >
            {searchInput}
            <Button
                type="default"
                className="barcode-scan-trigger"
                aria-label="Buka scanner barcode"
                onClick={onScannerClick}
            >
                📷
            </Button>
        </Flex>
    );
}
