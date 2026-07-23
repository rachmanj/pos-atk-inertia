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
            Table: isDark
                ? {}
                : {
                      headerBg: "#f8fafc",
                      headerColor: "#0f172a",
                  },
        },
    };
}
