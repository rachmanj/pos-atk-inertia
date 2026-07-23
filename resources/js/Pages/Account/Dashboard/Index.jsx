import LayoutAccount from "../../../Layouts/Account";
import { Head, usePage } from "@inertiajs/react";
import { formatRupiah } from "../../../Utils/format";

export default function Dashboard() {
    const {
        auth,
        summary = {},
    } = usePage().props;

    return (
        <>
            <Head>
                <title>Dashboard - ZenPOS</title>
            </Head>
            <LayoutAccount>
                <div style={{ padding: 24 }}>
                    <h1 style={{ color: '#0d9488', marginBottom: 16 }}>
                        Dashboard Loaded ✅
                    </h1>
                    <pre style={{
                        background: '#f5f5f5',
                        padding: 16,
                        borderRadius: 8,
                        overflow: 'auto',
                        fontSize: 13,
                    }}>
                        {JSON.stringify({
                            user: auth?.user?.name,
                            summary,
                        }, null, 2)}
                    </pre>
                </div>
            </LayoutAccount>
        </>
    );
}
