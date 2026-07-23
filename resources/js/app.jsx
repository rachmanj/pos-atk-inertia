import "../css/app.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ConfigProvider } from "antd";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import { getZenTheme } from "./theme/zenTheme";

function Root({ App, props }) {
    const { mode } = useTheme();

    return (
        <ConfigProvider theme={getZenTheme(mode)}>
            <App {...props} />
        </ConfigProvider>
    );
}

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),

    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider>
                <Root App={App} props={props} />
            </ThemeProvider>,
        );

        if (import.meta.env.PROD && "serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker.register("/sw.js").catch(() => {});
            });
        }
    },
});
