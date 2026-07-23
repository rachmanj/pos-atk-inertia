import { useState } from "react";
import { router } from "@inertiajs/react";
import { Button, Modal, notification } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

export function confirmDelete({
    url,
    title = "Apakah Anda yakin?",
    text = "Data yang dihapus tidak dapat dikembalikan.",
    confirmText = "Ya, hapus",
    onSuccess,
}) {
    return new Promise((resolve) => {
        Modal.confirm({
            title,
            content: text,
            okText: confirmText,
            cancelText: "Batal",
            okType: "danger",
            onOk: () =>
                new Promise((resolveModal, rejectModal) => {
                    router.delete(url, {
                        preserveScroll: true,
                        onSuccess: () => {
                            notification.success({
                                message: "Berhasil",
                                description: "Data berhasil dihapus.",
                                duration: 2,
                            });
                            onSuccess?.();
                            resolve(true);
                            resolveModal();
                        },
                        onError: () => {
                            rejectModal();
                        },
                    });
                }),
            onCancel: () => resolve(false),
        });
    });
}

export default function Delete({
    URL,
    id,
    title,
    text,
    confirmText,
}) {
    const [loading, setLoading] = useState(false);
    const deleteUrl = id != null ? `${URL}/${id}` : URL;

    const handleClick = () => {
        Modal.confirm({
            title: title ?? "Apakah Anda yakin?",
            content: text ?? "Data yang dihapus tidak dapat dikembalikan.",
            okText: confirmText ?? "Ya, hapus",
            cancelText: "Batal",
            okType: "danger",
            onOk: () =>
                new Promise((resolve, reject) => {
                    setLoading(true);

                    router.delete(deleteUrl, {
                        preserveScroll: true,
                        onSuccess: () => {
                            notification.success({
                                message: "Berhasil",
                                description: "Data berhasil dihapus.",
                                duration: 2,
                            });
                            resolve();
                        },
                        onError: () => {
                            reject();
                        },
                        onFinish: () => {
                            setLoading(false);
                        },
                    });
                }),
        });
    };

    return (
        <Button
            type="primary"
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={loading}
            onClick={handleClick}
        />
    );
}
