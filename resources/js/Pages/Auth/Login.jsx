import React, { useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import {
    LockOutlined,
    LoginOutlined,
    SafetyOutlined,
    UserOutlined,
} from "@ant-design/icons";

export default function Login() {
    const { errors = {}, store = {} } = usePage().props;
    const storeName = store.name ?? "POS Kasir";
    const loginLogo = store.logo_url ?? "/assets/logo.png";

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const loginHandler = async (e) => {
        e.preventDefault();

        router.post("/login", {
            login: login,
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

                        <div className="pos-login-torn" aria-hidden="true" />

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
                                <SafetyOutlined />
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
                                <label>Username atau Email</label>
                                <div className="pos-login-input">
                                    <UserOutlined />
                                    <input
                                        type="text"
                                        value={login}
                                        onChange={(e) =>
                                            setLogin(e.target.value)
                                        }
                                        placeholder="username atau nama@toko.com"
                                        autoComplete="username"
                                    />
                                </div>
                                {errors.login && (
                                    <div className="pos-login-error">
                                        {errors.login}
                                    </div>
                                )}
                            </div>

                            <div className="pos-login-field">
                                <label>Password</label>
                                <div className="pos-login-input">
                                    <LockOutlined />
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
                                <LoginOutlined />
                                Masuk
                            </button>
                        </form>
                    </div>
                </section>
            </main>
        </>
    );
}
