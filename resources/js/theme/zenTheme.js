import { theme } from "antd";

export function getZenTheme(mode) {
    const isDark = mode === "dark";

    return {
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
            colorPrimary: "#0d9488",
            colorSuccess: "#22c55e",
            colorWarning: "#f59e0b",
            colorError: "#ef4444",
            colorInfo: "#3b82f6",
            borderRadius: 8,
            fontFamily: "'Instrument Sans', 'Quicksand', sans-serif",
        },
        components: {
            Layout: {
                siderBg: "#1e293b",
                triggerBg: "#1e293b",
            },
            Menu: {
                darkItemBg: "#1e293b",
                darkItemSelectedBg: "#0f172a",
            },
            Card: {
                borderRadiusLG: 12,
            },
            Table: {
                headerBg: isDark ? "#1e293b" : "#f8fafc",
                headerColor: isDark ? "#f1f5f9" : "#0f172a",
                borderColor: isDark ? "#334155" : "#e2e8f0",
                rowHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "#f8fafc",
                rowSelectedBg: isDark ? "rgba(13, 148, 136, 0.15)" : "#e0f2f1",
                rowSelectedHoverBg: isDark
                    ? "rgba(13, 148, 136, 0.22)"
                    : "#ccfbf1",
            },
        },
    };
}
