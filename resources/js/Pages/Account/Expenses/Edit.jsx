import { useState } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, router, usePage } from "@inertiajs/react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { BRAND } from "../../../theme/colors";
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
    EditOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function ExpenseEdit() {
    const { errors = {}, expense = {}, categories = [] } = usePage().props;
    const loading = useInertiaLoading();

    const [expenseDate, setExpenseDate] = useState(expense.expense_date || "");
    const [category, setCategory] = useState(expense.category || "");
    const [title, setTitle] = useState(expense.title || "");
    const [amount, setAmount] = useState(expense.amount || "");
    const [note, setNote] = useState(expense.note || "");

    const updateExpense = (e) => {
        e.preventDefault();

        router.put(
            `/account/expenses/${expense.id}`,
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
                        description: "Pengeluaran berhasil diperbarui.",
                        duration: 1.5,
                    });
                },
            },
        );
    };

    return (
        <>
            <Head>
                <title>Edit Pengeluaran - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading}>
                    <Card
                        title={
                            <Space>
                                <EditOutlined style={{ color: BRAND.primary }} />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>
                                        EDIT PENGELUARAN
                                    </Title>
                                    <Text type="secondary">
                                        Kode: {expense.code}
                                    </Text>
                                </div>
                            </Space>
                        }
                        extra={
                            <Link href="/account/expenses">
                                <Button icon={<ArrowLeftOutlined />}>
                                    KEMBALI
                                </Button>
                            </Link>
                        }
                    >
                        <form onSubmit={updateExpense}>
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
                                            value={category || undefined}
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

                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                            >
                                SIMPAN PERUBAHAN
                            </Button>
                        </form>
                    </Card>
                </Spin>
            </LayoutAccount>
        </>
    );
}
