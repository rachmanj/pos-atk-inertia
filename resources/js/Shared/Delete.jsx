import { router } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function Delete({ URL, id }) {
    const destroy = (id) => {
        Swal.fire({
            title: "Apakah Anda yakin?",
            text: "Data yang dihapus tidak dapat dikembalikan.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Ya, hapus",
            cancelButtonText: "Batal",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`${URL}/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: "Berhasil",
                            text: "Data berhasil dihapus.",
                            icon: "success",
                            showConfirmButton: false,
                            timer: 1500,
                        });
                    },
                });
            }
        });
    };

    return (
        <button
            type="button"
            onClick={() => destroy(id)}
            className="btn btn-danger btn-sm"
        >
            <i className="fa fa-trash"></i>
        </button>
    );
}
