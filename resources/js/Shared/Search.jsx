import { useState } from "react";
import { router } from "@inertiajs/react";
import { Input } from "antd";

export default function Search({
    URL,
    placeholder = "Ketik kata kunci lalu tekan Enter...",
    onSearch,
}) {
    const [search, setSearch] = useState("");

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

    return (
        <Input.Search
            placeholder={placeholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={handleSearch}
            allowClear
            enterButton
        />
    );
}
