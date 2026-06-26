import { useState } from "react";
import { router } from "@inertiajs/react";

export default function Search({ URL }) {
    const [search, setSearch] = useState("");

    const searchHandler = (e) => {
        e.preventDefault();

        router.get(
            URL,
            {
                q: search,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <form onSubmit={searchHandler}>
            <div className="input-group">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="form-control border-0 shadow-sm"
                    placeholder="Ketik kata kunci lalu tekan Enter..."
                />

                <span className="input-group-text border-0 shadow-sm">
                    <i className="fa fa-search"></i>
                </span>
            </div>
        </form>
    );
}
