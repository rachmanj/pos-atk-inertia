import React, { useMemo } from "react";
import { Link } from "@inertiajs/react";
import { Menu } from "antd";
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

            const group = groupMap.get(groupKey);

            if (groupKey === "__dashboard__") {
                Object.assign(group, item);
            } else {
                group.children.push(item);
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

export default function Sidebar({
    collapsed = false,
    storeName = "VASIA STORE",
    storeLogo = null,
    permissions = {},
    selectedKey = "",
    onMenuClick,
}) {
    const menuItems = useSidebarMenuItems(permissions);

    return (
        <>
            <div
                style={{
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: 12,
                    padding: collapsed ? "0 8px" : "0 16px",
                    overflow: "hidden",
                }}
            >
                {storeLogo ? (
                    <img
                        src={storeLogo}
                        alt={storeName}
                        style={{
                            width: 32,
                            height: 32,
                            objectFit: "contain",
                            flexShrink: 0,
                        }}
                    />
                ) : (
                    <ShopOutlined style={{ fontSize: 24, color: "#fff" }} />
                )}
                {!collapsed && (
                    <strong
                        style={{
                            color: "#fff",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {storeName}
                    </strong>
                )}
            </div>

            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={selectedKey ? [selectedKey] : []}
                items={menuItems}
                onClick={onMenuClick}
            />
        </>
    );
}
