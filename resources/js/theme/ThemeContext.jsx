import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "pos-theme";

const ThemeContext = createContext(null);

function readStoredMode() {
    if (typeof window === "undefined") {
        return "dark";
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
}

function applyThemeToDocument(mode) {
    document.documentElement.setAttribute("data-theme", mode);
}

export function ThemeProvider({ children }) {
    const [mode, setMode] = useState(readStoredMode);

    useEffect(() => {
        applyThemeToDocument(mode);
        localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode((current) => (current === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
}
