import { useEffect, useId, useRef, useState } from "react";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import {
    Html5Qrcode,
    Html5QrcodeSupportedFormats,
} from "html5-qrcode";

const BARCODE_FORMATS = [
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
];

function isCameraSupported() {
    if (typeof Html5Qrcode.isSupported === "function") {
        return Html5Qrcode.isSupported();
    }

    return !!(
        typeof navigator !== "undefined" &&
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
    );
}

export default function BarcodeScanner({ onScan, onClose }) {
    const elementId = useId().replace(/:/g, "");
    const scannerRef = useRef(null);
    const scannedRef = useRef(false);
    const onScanRef = useRef(onScan);
    const [status, setStatus] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!isCameraSupported()) {
            setStatus("unsupported");
            return;
        }

        let active = true;
        const scanner = new Html5Qrcode(elementId, {
            formatsToSupport: BARCODE_FORMATS,
            verbose: false,
        });
        scannerRef.current = scanner;

        const handleScan = (decodedText) => {
            if (scannedRef.current) {
                return;
            }

            scannedRef.current = true;
            const value = decodedText?.trim();
            if (value) {
                onScanRef.current(value);
            }
        };

        const startScanner = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (!active) {
                    return;
                }

                if (!cameras.length) {
                    setStatus("unsupported");
                    setErrorMessage("Kamera tidak ditemukan di perangkat ini.");
                    return;
                }

                const rearCamera =
                    cameras.find((camera) =>
                        /back|rear|belakang|environment/i.test(
                            camera.label,
                        ),
                    ) || cameras[cameras.length - 1];

                await scanner.start(
                    rearCamera.id,
                    {
                        fps: 10,
                        qrbox: { width: 280, height: 140 },
                        aspectRatio: 1.777778,
                    },
                    handleScan,
                    () => {},
                );

                if (active) {
                    setStatus("scanning");
                }
            } catch (error) {
                if (!active) {
                    return;
                }

                setStatus("error");
                setErrorMessage(
                    error?.message ||
                        "Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.",
                );
            }
        };

        startScanner();

        return () => {
            active = false;
            const instance = scannerRef.current;
            scannerRef.current = null;

            if (!instance) {
                return;
            }

            if (instance.isScanning) {
                instance.stop().catch(() => {});
            } else {
                instance.clear();
            }
        };
    }, [elementId]);

    return (
        <div className="barcode-scanner-overlay">
            <div className="barcode-scanner-panel">
                <div className="barcode-scanner-header">
                    <div>
                        <strong>Scan Barcode</strong>
                        <p>Arahkan kamera ke barcode produk</p>
                    </div>
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        aria-label="Tutup scanner"
                        onClick={onClose}
                    />
                </div>

                {status === "loading" && (
                    <div className="barcode-scanner-message">
                        Membuka kamera...
                    </div>
                )}

                {status === "unsupported" && (
                    <div className="barcode-scanner-message">
                        {errorMessage ||
                            "Kamera tidak tersedia di perangkat ini."}
                    </div>
                )}

                {status === "error" && (
                    <div className="barcode-scanner-message barcode-scanner-message--error">
                        {errorMessage}
                    </div>
                )}

                <div
                    id={elementId}
                    className={`barcode-scanner-viewfinder${
                        status === "scanning" ? "" : " is-hidden"
                    }`}
                />

                <div className="barcode-scanner-footer">
                    <Button block onClick={onClose}>
                        Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}
