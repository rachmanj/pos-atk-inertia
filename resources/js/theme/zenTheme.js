import { theme } from "antd";
import { SEMANTIC } from "./colors";

export function getZenTheme(mode) {
    const isDark = mode === "dark";

    return {
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
            colorPrimary: isDark ? "#2DD4BF" : "#2A3B8F",
            colorSuccess: isDark ? "#10B981" : SEMANTIC.success,
            colorWarning: isDark ? "#F59E0B" : SEMANTIC.warning,
            colorError: isDark ? "#EF4444" : SEMANTIC.error,
            colorInfo: isDark ? "#0EA5E9" : SEMANTIC.info,
            colorBgLayout: isDark ? "#090E1A" : "#EFEDE3",
            colorBgContainer: isDark ? "#0E1525" : "#FFFFFF",
            borderRadius: 8,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
        components: {
            Layout: {
                siderBg: isDark ? "#0B111E" : "#1e293b",
                triggerBg: isDark ? "#0B111E" : "#1e293b",
            },
            Menu: {
                darkItemBg: isDark ? "#0B111E" : "#1e293b",
                darkItemSelectedBg: isDark
                    ? "rgba(45, 212, 191, 0.16)"
                    : "#0f172a",
                ...(isDark && { darkItemSelectedColor: "#2DD4BF" }),
            },
            Card: {
                borderRadiusLG: 12,
            },
            Table: {
                headerBg: isDark ? "#0E1525" : "#f8fafc",
                headerColor: isDark ? "#F8FAFC" : "#0f172a",
                borderColor: isDark ? "#1D283A" : "#e2e8f0",
                rowHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "#f8fafc",
                rowSelectedBg: isDark
                    ? "rgba(45, 212, 191, 0.14)"
                    : "rgba(42, 59, 143, 0.08)",
                rowSelectedHoverBg: isDark
                    ? "rgba(45, 212, 191, 0.22)"
                    : "rgba(42, 59, 143, 0.12)",
            },
        },
    };
}
