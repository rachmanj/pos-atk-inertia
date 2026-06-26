import React, { useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";

export default function Login() {
    const { errors = {}, store = {} } = usePage().props;
    const storeName = store.name ?? "POS Kasir";
    const loginLogo = store.logo_url ?? "/assets/logo.png";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const loginHandler = async (e) => {
        e.preventDefault();

        router.post("/login", {
            email: email,
            password: password,
        });
    };

    return (
        <>
            <Head title={`Login POS - ${storeName}`} />
            <main className="pos-login-page">
                <section className="pos-login-shell">
                    <div className="pos-login-brand">
                        <div className="pos-login-brand-header">
                            <div className="pos-login-logo-wrap">
                                <img
                                    src={loginLogo}
                                    className="pos-login-logo"
                                    alt={`${storeName} logo`}
                                />
                            </div>
                            <div>
                                <span className="pos-login-kicker">
                                    Point of Sale
                                </span>
                                <h1>{storeName}</h1>
                            </div>
                        </div>

                        <div className="pos-login-brand-copy">
                            <p>
                                Sistem kasir modern untuk menjaga operasional
                                toko tetap rapi, cepat, dan mudah dipantau.
                            </p>
                        </div>
                    </div>

                    <div className="pos-login-card">
                        <div className="pos-login-card-header">
                            <span className="pos-login-card-icon">
                                <i className="fas fa-user-lock"></i>
                            </span>
                            <div>
                                <h2>Masuk ke POS</h2>
                                <p>Gunakan akun kasir atau admin toko.</p>
                            </div>
                        </div>

                        <form
                            onSubmit={loginHandler}
                            className="pos-login-form"
                        >
                            <div className="pos-login-field">
                                <label>Email</label>
                                <div className="pos-login-input">
                                    <i className="fas fa-envelope"></i>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="nama@toko.com"
                                        autoComplete="email"
                                    />
                                </div>
                                {errors.email && (
                                    <div className="pos-login-error">
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            <div className="pos-login-field">
                                <label>Password</label>
                                <div className="pos-login-input">
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Masukkan password"
                                        autoComplete="current-password"
                                    />
                                </div>
                                {errors.password && (
                                    <div className="pos-login-error">
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            <button className="pos-login-button" type="submit">
                                <i className="fas fa-sign-in-alt"></i>
                                Masuk
                            </button>
                        </form>
                    </div>
                </section>
            </main>
        </>
    );
}
