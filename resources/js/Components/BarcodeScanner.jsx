import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
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

const SCAN_CONFIG = {
    fps: 10,
    qrbox: (viewfinderWidth, viewfinderHeight) => {
        const width = Math.floor(Math.min(viewfinderWidth * 0.9, 300));
        const height = Math.floor(
            Math.min(width * 0.45, viewfinderHeight * 0.6, 160),
        );

        return {
            width: Math.max(width, 200),
            height: Math.max(height, 80),
        };
    },
    aspectRatio: 1.777778,
};

function isCameraSupported() {
    return !!(
        typeof navigator !== "undefined" &&
        navigator.mediaDevices?.getUserMedia
    );
}

function isSecureContext() {
    return typeof window !== "undefined" && window.isSecureContext;
}

async function stopScannerInstance(instance) {
    if (!instance) {
        return;
    }

    try {
        if (instance.isScanning) {
            await instance.stop();
        }
    } catch {
        // ignore stop errors during teardown
    }

    try {
        instance.clear();
    } catch {
        // ignore clear errors during teardown
    }
}

export default function BarcodeScanner({ onScan, onClose }) {
    const elementId = useId().replace(/:/g, "");
    const scannerRef = useRef(null);
    const scannedRef = useRef(false);
    const startingRef = useRef(false);
    const mountedRef = useRef(true);
    const onScanRef = useRef(onScan);
    const [status, setStatus] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const startScanner = useCallback(async () => {
        if (startingRef.current) {
            return;
        }

        if (!isCameraSupported()) {
            setStatus("unsupported");
            setErrorMessage("Browser ini tidak mendukung akses kamera.");
            return;
        }

        if (!isSecureContext()) {
            setStatus("error");
            setErrorMessage(
                "Kamera hanya tersedia di HTTPS. Buka situs melalui https://.",
            );
            return;
        }

        startingRef.current = true;
        setStatus("loading");
        setErrorMessage("");

        await stopScannerInstance(scannerRef.current);
        scannerRef.current = null;

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

        const tryStart = async (cameraConfig) => {
            await scanner.start(
                cameraConfig,
                SCAN_CONFIG,
                handleScan,
                () => {},
            );
        };

        try {
            await tryStart({ facingMode: "environment" });

            if (mountedRef.current) {
                setStatus("scanning");
            }
        } catch (environmentError) {
            try {
                const cameras = await Html5Qrcode.getCameras();

                if (!cameras.length) {
                    throw environmentError;
                }

                const rearCamera =
                    cameras.find((camera) =>
                        /back|rear|belakang|environment/i.test(
                            camera.label,
                        ),
                    ) || cameras[cameras.length - 1];

                await tryStart(rearCamera.id);

                if (mountedRef.current) {
                    setStatus("scanning");
                }
            } catch (cameraListError) {
                try {
                    await tryStart({ facingMode: "user" });

                    if (mountedRef.current) {
                        setStatus("scanning");
                    }
                } catch (fallbackError) {
                    if (!mountedRef.current) {
                        return;
                    }

                    const message =
                        fallbackError?.message ||
                        cameraListError?.message ||
                        environmentError?.message ||
                        "Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.";

                    setStatus("permission");
                    setErrorMessage(message);
                }
            }
        } finally {
            startingRef.current = false;
        }
    }, [elementId]);

    useLayoutEffect(() => {
        startScanner();

        return () => {
            const instance = scannerRef.current;
            scannerRef.current = null;
            stopScannerInstance(instance);
        };
    }, [startScanner]);

    const handleRetry = () => {
        scannedRef.current = false;
        startScanner();
    };

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

                {status !== "unsupported" && status !== "error" && (
                    <div className="barcode-scanner-viewfinder-wrap">
                        <div
                            id={elementId}
                            className="barcode-scanner-viewfinder"
                        />

                        {status === "loading" && (
                            <div className="barcode-scanner-viewfinder-overlay">
                                Membuka kamera...
                            </div>
                        )}

                        {status === "permission" && (
                            <div className="barcode-scanner-viewfinder-overlay barcode-scanner-viewfinder-overlay--permission">
                                <p>{errorMessage}</p>
                                <Button
                                    type="primary"
                                    onClick={handleRetry}
                                >
                                    Aktifkan Kamera
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="barcode-scanner-footer">
                    <Button block onClick={onClose}>
                        Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}
