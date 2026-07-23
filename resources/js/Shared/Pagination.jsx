import { router } from "@inertiajs/react";
import { Pagination as AntPagination } from "antd";

function parseLinksMeta(links) {
    const numbered = links.filter((link) => /^\d+$/.test(String(link.label).trim()));
    const active = links.find((link) => link.active);
    const current = active ? parseInt(active.label, 10) : 1;
    const lastPage = numbered.length
        ? parseInt(numbered[numbered.length - 1].label, 10)
        : current;

    return { current, lastPage };
}

function findPageUrl(links, page) {
    const link = links.find((item) => String(item.label).trim() === String(page));

    return link?.url ?? null;
}

export default function Pagination({
    links = [],
    align = "end",
    meta,
    onPageChange,
}) {
    const parsed = parseLinksMeta(links);
    const current = meta?.current_page ?? parsed.current;
    const pageSize = meta?.per_page ?? 15;
    const total = meta?.total ?? parsed.lastPage * pageSize;

    const handleChange = (page) => {
        if (onPageChange) {
            onPageChange(page);
            return;
        }

        const url = findPageUrl(links, page);

        if (url) {
            router.visit(url, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const justify =
        align === "start"
            ? "flex-start"
            : align === "center"
              ? "center"
              : "flex-end";

    return (
        <div style={{ display: "flex", justifyContent: justify, marginTop: 16 }}>
            <AntPagination
                current={current}
                pageSize={pageSize}
                total={total}
                onChange={handleChange}
                showSizeChanger={false}
                showTotal={
                    meta?.total
                        ? (count, range) =>
                              `${range[0]}-${range[1]} dari ${count}`
                        : undefined
                }
            />
        </div>
    );
}
