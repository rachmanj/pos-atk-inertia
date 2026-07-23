import React, { useState } from "react";
import { Alert, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { usePWA } from "../Hooks/usePWA";

export default function InstallPrompt() {
    const { isStandalone, isInstallable, promptInstall } = usePWA();
    const [dismissed, setDismissed] = useState(false);

    if (isStandalone || !isInstallable || dismissed) {
        return null;
    }

    return (
        <Alert
            message="Install POS Kasir"
            description="Pasang aplikasi di perangkat ini untuk akses lebih cepat."
            type="info"
            showIcon
            closable
            onClose={() => setDismissed(true)}
            action={
                <Button
                    size="small"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={promptInstall}
                >
                    Install
                </Button>
            }
            style={{ marginBottom: 16 }}
        />
    );
}
