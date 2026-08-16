import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Spin,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    RedoOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

export default function ExpenseCreate() {
    const {
        errors = {},
        categories = [],
        defaultExpenseDate = "",
    } = usePage().props;
    const loading = useInertiaLoading();

    const [expenseDate, setExpenseDate] = useState(defaultExpenseDate);
    const [category, setCategory] = useState(undefined);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState(null);
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
                    notification.success({
                        message: "Berhasil",
                        description: "Pengeluaran berhasil disimpan.",
                        duration: 1.5,
                    });
                },
            },
        );
    };

    const resetForm = () => {
        setExpenseDate(defaultExpenseDate);
        setCategory(undefined);
        setTitle("");
        setAmount(null);
        setNote("");
    };

    return (
        <>
            <Head>
                <title>Tambah Pengeluaran - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Title level={4} style={{ margin: 0 }}>
                                TAMBAH PENGELUARAN
                            </Title>
                        }
                        extra={
                            <Link href="/account/expenses">
                                <Button icon={<ArrowLeftOutlined />}>
                                    Kembali
                                </Button>
                            </Link>
                        }
                    >
                        <form onSubmit={storeExpense}>
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Tanggal Pengeluaran"
                                        validateStatus={
                                            errors.expense_date ? "error" : ""
                                        }
                                        help={errors.expense_date}
                                        required
                                    >
                                        <DatePicker
                                            style={{ width: "100%" }}
                                            format="YYYY-MM-DD"
                                            value={
                                                expenseDate
                                                    ? dayjs(expenseDate)
                                                    : null
                                            }
                                            onChange={(_, dateString) =>
                                                setExpenseDate(dateString)
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Kategori"
                                        validateStatus={
                                            errors.category ? "error" : ""
                                        }
                                        help={errors.category}
                                        required
                                    >
                                        <Select
                                            placeholder="Pilih Kategori"
                                            value={category}
                                            onChange={setCategory}
                                            options={categories.map((item) => ({
                                                value: item.value,
                                                label: item.label,
                                            }))}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col xs={24} md={16}>
                                    <Form.Item
                                        label="Judul Pengeluaran"
                                        validateStatus={
                                            errors.title ? "error" : ""
                                        }
                                        help={errors.title}
                                        required
                                    >
                                        <Input
                                            value={title}
                                            onChange={(e) =>
                                                setTitle(e.target.value)
                                            }
                                            placeholder="Contoh: Bayar listrik toko"
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Nominal"
                                        validateStatus={
                                            errors.amount ? "error" : ""
                                        }
                                        help={errors.amount}
                                        required
                                    >
                                        <InputNumber
                                            min={1}
                                            style={{ width: "100%" }}
                                            placeholder="0"
                                            value={amount}
                                            onChange={setAmount}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                label="Catatan"
                                validateStatus={errors.note ? "error" : ""}
                                help={errors.note}
                            >
                                <Input.TextArea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Catatan tambahan"
                                />
                            </Form.Item>

                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                >
                                    Simpan
                                </Button>
                                <Button
                                    icon={<RedoOutlined />}
                                    onClick={resetForm}
                                >
                                    Reset
                                </Button>
                            </Space>
                        </form>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
