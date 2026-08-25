import { theme } from "antd";
import { BRAND, SEMANTIC, WARM } from "./colors";

export function getZenTheme(mode) {
    const isDark = mode === "dark";

    return {
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
            colorPrimary: BRAND.primary,
            colorSuccess: SEMANTIC.success,
            colorWarning: SEMANTIC.warning,
            colorError: SEMANTIC.error,
            colorInfo: SEMANTIC.info,
            colorBgLayout: isDark ? "#1a1a18" : WARM.background,
            colorBgContainer: isDark ? "#26241f" : WARM.surface,
            colorText: isDark ? "#f5f2ec" : WARM.text,
            colorBorder: isDark ? "#3a362f" : WARM.border,
            borderRadius: 12,
            fontFamily: "'Inter', system-ui, sans-serif",
        },
        components: {
            Layout: {
                siderBg: isDark ? BRAND.darkSider : WARM.surface,
                triggerBg: isDark ? BRAND.darkSider : WARM.surface,
                triggerColor: isDark ? "#ffffff" : WARM.text,
            },
            Menu: {
                itemBg: "transparent",
                itemColor: WARM.text,
                itemHoverBg: WARM.background,
                itemHoverColor: BRAND.primary,
                itemSelectedBg: "#FDF3F6",
                itemSelectedColor: BRAND.primary,
                groupTitleColor: "rgba(43, 38, 34, 0.6)",
                darkItemBg: BRAND.darkSider,
                darkItemSelectedBg: "rgba(217, 55, 106, 0.22)",
                darkItemSelectedColor: "#ffffff",
            },
            Card: {
                borderRadiusLG: 14,
            },
            Input: {
                borderRadius: 10,
            },
            Button: {
                borderRadius: 12,
            },
            Table: {
                headerBg: isDark ? "#26241f" : WARM.background,
                headerColor: isDark ? "#f5f2ec" : WARM.text,
                borderColor: isDark ? "#3a362f" : WARM.border,
                rowHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : WARM.background,
                rowSelectedBg: isDark
                    ? "rgba(217, 55, 106, 0.15)"
                    : "rgba(217, 55, 106, 0.08)",
                rowSelectedHoverBg: isDark
                    ? "rgba(217, 55, 106, 0.22)"
                    : "rgba(217, 55, 106, 0.12)",
            },
        },
    };
}
