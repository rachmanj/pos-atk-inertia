import { useCallback, useEffect, useState } from "react";

function detectStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

export function usePWA() {
    const [isStandalone, setIsStandalone] = useState(detectStandalone);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const onBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
            setIsInstallable(true);
        };

        const onAppInstalled = () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsStandalone(true);
        };

        const mediaQuery = window.matchMedia("(display-mode: standalone)");
        const onDisplayModeChange = () => {
            setIsStandalone(detectStandalone());
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
        window.addEventListener("appinstalled", onAppInstalled);
        mediaQuery.addEventListener("change", onDisplayModeChange);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                onBeforeInstallPrompt,
            );
            window.removeEventListener("appinstalled", onAppInstalled);
            mediaQuery.removeEventListener("change", onDisplayModeChange);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (!deferredPrompt) {
            return false;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setIsInstallable(false);

        return outcome === "accepted";
    }, [deferredPrompt]);

    return {
        isStandalone,
        isInstallable,
        promptInstall,
    };
}
