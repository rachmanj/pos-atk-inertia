import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Swal from "sweetalert2";

export default function ExpenseCreate() {
    const {
        errors = {},
        categories = [],
        defaultExpenseDate = "",
    } = usePage().props;

    const [expenseDate, setExpenseDate] = useState(defaultExpenseDate);
    const [category, setCategory] = useState("");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");

    const storeExpense = (e) => {
        e.preventDefault();

        router.post(
            "/account/expenses",
            {
                expense_date: expenseDate,
                category,
                title,
                amount,
                note,
            },
            {
                onSuccess: () => {
                    Swal.fire({
                        title: "Berhasil",
                        text: "Pengeluaran berhasil disimpan.",
                        icon: "success",
                        showConfirmButton: false,
                        timer: 1500,
                    });
                },
            },
        );
    };

    const resetForm = () => {
        setExpenseDate(defaultExpenseDate);
        setCategory("");
        setTitle("");
        setAmount("");
        setNote("");
    };

    return (
        <>
            <Head title="Tambah Pengeluaran" />

            <LayoutAccount>
                <div className="row mt-4">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm rounded-3">
                            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fa fa-plus-circle me-2"></i>
                                    TAMBAH PENGELUARAN
                                </h5>

                                <Link
                                    href="/account/expenses"
                                    className="btn btn-secondary shadow-sm rounded-sm"
                                >
                                    <i className="fa fa-arrow-left me-2"></i>
                                    BACK
                                </Link>
                            </div>

                            <div className="card-body">
                                <form onSubmit={storeExpense}>
                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Tanggal Pengeluaran
                                            </label>
                                            <input
                                                type="date"
                                                className={`form-control ${
                                                    errors.expense_date
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={expenseDate}
                                                onChange={(e) =>
                                                    setExpenseDate(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.expense_date && (
                                                <div className="invalid-feedback">
                                                    {errors.expense_date}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-6 mb-4">
                                            <label className="fw-bold mb-2">
                                                Kategori
                                            </label>
                                            <select
                                                className={`form-select ${
                                                    errors.category
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={category}
                                                onChange={(e) =>
                                                    setCategory(e.target.value)
                                                }
                                            >
                                                <option value="">
                                                    Pilih Kategori
                                                </option>
                                                {categories.map((item) => (
                                                    <option
                                                        key={item.value}
                                                        value={item.value}
                                                    >
                                                        {item.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.category && (
                                                <div className="invalid-feedback">
                                                    {errors.category}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-8 mb-4">
                                            <label className="fw-bold mb-2">
                                                Judul Pengeluaran
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${
                                                    errors.title
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={title}
                                                onChange={(e) =>
                                                    setTitle(e.target.value)
                                                }
                                                placeholder="Contoh: Bayar listrik toko"
                                            />
                                            {errors.title && (
                                                <div className="invalid-feedback">
                                                    {errors.title}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-md-4 mb-4">
                                            <label className="fw-bold mb-2">
                                                Nominal
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                className={`form-control ${
                                                    errors.amount
                                                        ? "is-invalid"
                                                        : ""
                                                }`}
                                                value={amount}
                                                onChange={(e) =>
                                                    setAmount(e.target.value)
                                                }
                                                placeholder="0"
                                            />
                                            {errors.amount && (
                                                <div className="invalid-feedback">
                                                    {errors.amount}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="fw-bold mb-2">
                                            Catatan
                                        </label>
                                        <textarea
                                            className={`form-control ${
                                                errors.note ? "is-invalid" : ""
                                            }`}
                                            value={note}
                                            onChange={(e) =>
                                                setNote(e.target.value)
                                            }
                                            rows="3"
                                            placeholder="Catatan tambahan"
                                        ></textarea>
                                        {errors.note && (
                                            <div className="invalid-feedback">
                                                {errors.note}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className="btn btn-success shadow-sm rounded-sm"
                                        >
                                            <i className="fa fa-save me-2"></i>
                                            SAVE
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-warning shadow-sm rounded-sm ms-2 text-white"
                                            onClick={resetForm}
                                        >
                                            <i className="fa fa-redo me-2"></i>
                                            RESET
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutAccount>
        </>
    );
}
