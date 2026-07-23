import React, { useState } from "react";
import {
    Alert,
    Button,
    Drawer,
    Dropdown,
    Flex,
    Grid,
    Layout,
    Space,
    theme,
} from "antd";
import {
    BulbFilled,
    BulbOutlined,
    DownOutlined,
    KeyOutlined,
    LogoutOutlined,
    MenuOutlined,
} from "@ant-design/icons";
import { usePage, router, Link } from "@inertiajs/react";
import InstallPrompt from "../Components/InstallPrompt";
import MenuSearchPalette from "../Components/MenuSearch/MenuSearchPalette";
import Sidebar, { resolveMenuSelectedKey } from "../Components/Sidebar";
import useMobile from "../Hooks/useMobile";
import { useTheme } from "../theme/ThemeContext";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export default function LayoutAccount({ children }) {
    const page = usePage();
    const { auth, store, flash } = page.props;
    const { url } = page;
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { mode, toggleTheme } = useTheme();
    const { token } = theme.useToken();
    const isMobile = useMobile();
    const screens = useBreakpoint();
    const isCompact = isMobile || !screens.md;

    const storeName = store?.name || "VASIA STORE";
    const storeLogo = store?.logo_url;
    const userName = auth?.user?.name || "User";
    const permissions = auth?.permissions || {};

    const selectedKey = resolveMenuSelectedKey(url);

    const logoutHandler = () => {
        router.post("/logout");
    };

    const userMenuItems = [
        {
            key: "password",
            icon: <KeyOutlined />,
            label: <Link href="/account/password">Ubah Kata Sandi</Link>,
        },
        { type: "divider" },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Keluar",
            onClick: logoutHandler,
        },
    ];

    const sidebarProps = {
        collapsed: isCompact ? false : collapsed,
        storeName,
        storeLogo,
        permissions,
        selectedKey,
        onMenuClick: isCompact ? () => setDrawerOpen(false) : undefined,
    };

    const headerActions = (
        <Space>
            <Button
                type="text"
                aria-label={
                    mode === "dark"
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                }
                icon={mode === "dark" ? <BulbFilled /> : <BulbOutlined />}
                onClick={toggleTheme}
            />
            <Dropdown menu={{ items: userMenuItems }}>
                <Space style={{ cursor: "pointer" }}>
                    <span style={{ fontWeight: 600 }}>{userName}</span>
                    <DownOutlined />
                </Space>
            </Dropdown>
        </Space>
    );

    return (
        <Layout style={{ minHeight: "100vh" }}>
            {!isCompact && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    collapsedWidth={64}
                    width={240}
                    theme="dark"
                >
                    <Sidebar {...sidebarProps} />
                </Sider>
            )}

            {isCompact && (
                <Drawer
                    title={storeName}
                    placement="left"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    width={280}
                    styles={{
                        body: { padding: 0 },
                        header: { background: "#001529", color: "#fff" },
                    }}
                    className="pos-mobile-drawer"
                >
                    <div style={{ background: "#001529", minHeight: "100%" }}>
                        <Sidebar {...sidebarProps} />
                    </div>
                </Drawer>
            )}

            <Layout>
                <Header
                    style={{
                        background: token.colorBgContainer,
                        padding: isCompact ? "8px 12px" : "0 16px",
                        lineHeight: "normal",
                        height: "auto",
                        minHeight: 64,
                    }}
                >
                    {isCompact ? (
                        <Flex vertical gap={8}>
                            <Flex
                                justify="space-between"
                                align="center"
                                style={{ minHeight: 44 }}
                            >
                                <Button
                                    type="text"
                                    aria-label="Buka menu navigasi"
                                    icon={<MenuOutlined />}
                                    onClick={() => setDrawerOpen(true)}
                                    style={{ minWidth: 44, minHeight: 44 }}
                                />
                                {headerActions}
                            </Flex>
                            <MenuSearchPalette fullWidth />
                        </Flex>
                    ) : (
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{ height: 64 }}
                        >
                            <MenuSearchPalette />
                            {headerActions}
                        </Flex>
                    )}
                </Header>

                <Content
                    style={{
                        margin: isCompact ? 8 : 16,
                        padding: isCompact ? 12 : 16,
                        background: token.colorBgContainer,
                        borderRadius: 8,
                    }}
                >
                    <InstallPrompt />
                    {flash?.success && (
                        <Alert
                            message={flash.success}
                            type="success"
                            showIcon
                            closable
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    {flash?.error && (
                        <Alert
                            message={flash.error}
                            type="error"
                            showIcon
                            closable
                            style={{ marginBottom: 16 }}
                        />
                    )}
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
