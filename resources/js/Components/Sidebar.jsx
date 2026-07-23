import React, { useMemo } from "react";
import { Link } from "@inertiajs/react";
import {
    DashboardOutlined,
    SafetyOutlined,
    TeamOutlined,
    ShopOutlined,
    TagsOutlined,
    TruckOutlined,
    IdcardOutlined,
    AppstoreOutlined,
    BlockOutlined,
    WalletOutlined,
    UnorderedListOutlined,
    SwapOutlined,
    FileDoneOutlined,
    ShoppingCartOutlined,
    UndoOutlined,
    ClockCircleOutlined,
    MoneyCollectOutlined,
    ReconciliationOutlined,
    LineChartOutlined,
    StarOutlined,
    MobileOutlined,
    DollarOutlined,
    FileTextOutlined,
    BarChartOutlined,
} from "@ant-design/icons";
import { NAV_MENUS } from "../Utils/navMenu";
import hasAnyPermission from "../Utils/Permissions";

const MENU_ICONS = {
    dashboard: DashboardOutlined,
    roles: SafetyOutlined,
    users: TeamOutlined,
    settings: ShopOutlined,
    categories: TagsOutlined,
    suppliers: TruckOutlined,
    customers: IdcardOutlined,
    products: AppstoreOutlined,
    units: BlockOutlined,
    "ppob-accounts": WalletOutlined,
    "ppob-logs": UnorderedListOutlined,
    "stock-mv": SwapOutlined,
    "stock-opname": FileDoneOutlined,
    purchases: ShoppingCartOutlined,
    "supplier-ret": UndoOutlined,
    shifts: ClockCircleOutlined,
    pos: ReconciliationOutlined,
    transactions: FileTextOutlined,
    returns: UndoOutlined,
    expenses: MoneyCollectOutlined,
    "report-sales": LineChartOutlined,
    "report-product": StarOutlined,
    "report-ppob": MobileOutlined,
    "report-profit": DollarOutlined,
    "report-expense": FileTextOutlined,
    "report-customers": TeamOutlined,
    "report-stock": BarChartOutlined,
};

export function resolveMenuSelectedKey(url) {
    const matches = NAV_MENUS.filter((menu) => {
        if (!url.startsWith(menu.href)) {
            return false;
        }

        if (
            menu.href === "/account/transactions" &&
            url.startsWith("/account/transactions/create")
        ) {
            return false;
        }

        return true;
    });

    if (matches.length === 0) {
        return "";
    }

    matches.sort((a, b) => b.href.length - a.href.length);

    return matches[0].href;
}

export function useSidebarMenuItems(permissions = {}) {
    return useMemo(() => {
        const visibleMenus = NAV_MENUS.filter((menu) =>
            hasAnyPermission([menu.permission], permissions),
        );

        const groups = [];
        const groupMap = new Map();

        for (const menu of visibleMenus) {
            const groupKey = menu.group || "__dashboard__";

            if (!groupMap.has(groupKey)) {
                const group = {
                    key: groupKey,
                    type: groupKey === "__dashboard__" ? "item" : "group",
                    label: groupKey === "__dashboard__" ? undefined : groupKey,
                    children: groupKey === "__dashboard__" ? undefined : [],
                };

                groupMap.set(groupKey, group);
                groups.push(group);
            }

            const Icon = MENU_ICONS[menu.id];
            const item = {
                key: menu.href,
                icon: Icon ? <Icon /> : null,
                label: <Link href={menu.href}>{menu.label}</Link>,
            };

            if (groupKey === "__dashboard__") {
                Object.assign(group, item);
            } else {
                groupMap.get(groupKey).children.push(item);
            }
        }

        return groups.filter((group) => {
            if (group.type === "group") {
                return group.children.length > 0;
            }

            return true;
        });
    }, [permissions]);
}
