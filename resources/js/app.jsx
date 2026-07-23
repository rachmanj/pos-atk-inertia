import "../css/app.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { ConfigProvider } from "antd";
import { zenTheme } from "./theme/zenTheme";

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),

    setup({ el, App, props }) {
        createRoot(el).render(
            <ConfigProvider theme={zenTheme}>
                <App {...props} />
            </ConfigProvider>,
        );
    },
});
