import { useMemo } from "react";
import LayoutAccount from "../../../Layouts/Account";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import useInertiaLoading from "../../../Hooks/useInertiaLoading";
import { formatRupiah } from "../../../Utils/format";
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
    Table,
    Typography,
    notification,
} from "antd";
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    PlusOutlined,
    RedoOutlined,
    SaveOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const createEmptyLine = () => ({
    category: undefined,
    title: "",
    amount: null,
});

export default function ExpenseCreate() {
    const { categories = [], defaultExpenseDate = "" } = usePage().props;
    const loading = useInertiaLoading();

    const { data, setData, post, processing, errors, reset } = useForm({
        expense_date: defaultExpenseDate,
        note: "",
        lines: [createEmptyLine()],
    });

    const totalAmount = useMemo(
        () =>
            data.lines.reduce(
                (sum, line) => sum + Number(line.amount || 0),
                0,
            ),
        [data.lines],
    );

    const updateLine = (index, field, value) => {
        setData(
            "lines",
            data.lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line,
            ),
        );
    };

    const addLine = () => {
        setData("lines", [...data.lines, createEmptyLine()]);
    };

    const removeLine = (index) => {
        if (data.lines.length === 1) return;

        setData(
            "lines",
            data.lines.filter((_, lineIndex) => lineIndex !== index),
        );
    };

    const lineError = (index, field) => errors[`lines.${index}.${field}`];

    const storeExpense = (e) => {
        e.preventDefault();

        post("/account/expenses", {
            onSuccess: () => {
                notification.success({
                    message: "Berhasil",
                    description: "Pengeluaran berhasil disimpan.",
                    duration: 1.5,
                });
            },
        });
    };

    const resetForm = () => {
        reset();
        setData({
            expense_date: defaultExpenseDate,
            note: "",
            lines: [createEmptyLine()],
        });
    };

    const columns = [
        {
            title: "Kategori",
            width: 200,
            render: (_, line, index) => (
                <>
                    <Select
                        placeholder="Pilih Kategori"
                        style={{ width: "100%" }}
                        value={line.category}
                        onChange={(value) =>
                            updateLine(index, "category", value)
                        }
                        status={lineError(index, "category") ? "error" : undefined}
                        options={categories.map((item) => ({
                            value: item.value,
                            label: item.label,
                        }))}
                    />
                    {lineError(index, "category") && (
                        <Text
                            type="danger"
                            style={{ fontSize: 12, display: "block" }}
                        >
                            {lineError(index, "category")}
                        </Text>
                    )}
                </>
            ),
        },
        {
            title: "Judul",
            render: (_, line, index) => (
                <>
                    <Input
                        value={line.title}
                        maxLength={150}
                        placeholder="Contoh: Bayar listrik toko"
                        onChange={(e) =>
                            updateLine(index, "title", e.target.value)
                        }
                        status={lineError(index, "title") ? "error" : undefined}
                    />
                    {lineError(index, "title") && (
                        <Text
                            type="danger"
                            style={{ fontSize: 12, display: "block" }}
                        >
                            {lineError(index, "title")}
                        </Text>
                    )}
                </>
            ),
        },
        {
            title: "Nominal",
            align: "right",
            width: 160,
            render: (_, line, index) => (
                <>
                    <InputNumber
                        min={1}
                        precision={0}
                        style={{ width: "100%" }}
                        placeholder="0"
                        value={line.amount}
                        onChange={(value) =>
                            updateLine(index, "amount", value ?? null)
                        }
                        status={lineError(index, "amount") ? "error" : undefined}
                    />
                    {lineError(index, "amount") && (
                        <Text
                            type="danger"
                            style={{ fontSize: 12, display: "block" }}
                        >
                            {lineError(index, "amount")}
                        </Text>
                    )}
                </>
            ),
        },
        {
            title: "Aksi",
            align: "center",
            width: 70,
            render: (_, __, index) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeLine(index)}
                    disabled={data.lines.length === 1}
                />
            ),
        },
    ];

    return (
        <>
            <Head>
                <title>Tambah Pengeluaran - VASIA Stationery</title>
            </Head>

            <LayoutAccount>
                <Spin spinning={loading || processing}>
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
                                                data.expense_date
                                                    ? dayjs(data.expense_date)
                                                    : null
                                            }
                                            onChange={(_, dateString) =>
                                                setData(
                                                    "expense_date",
                                                    dateString,
                                                )
                                            }
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Keterangan"
                                        validateStatus={
                                            errors.note ? "error" : ""
                                        }
                                        help={errors.note}
                                    >
                                        <Input.TextArea
                                            value={data.note}
                                            onChange={(e) =>
                                                setData("note", e.target.value)
                                            }
                                            rows={3}
                                            placeholder="Keterangan tambahan (opsional)"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {errors.lines && (
                                <Text
                                    type="danger"
                                    style={{ display: "block", marginBottom: 12 }}
                                >
                                    {errors.lines}
                                </Text>
                            )}

                            <Table
                                rowKey={(_, index) => index}
                                columns={columns}
                                dataSource={data.lines}
                                pagination={false}
                                scroll={{ x: "max-content" }}
                                style={{ marginBottom: 16 }}
                            />

                            <Row
                                justify="space-between"
                                align="middle"
                                style={{ marginBottom: 16 }}
                            >
                                <Col>
                                    <Button
                                        icon={<PlusOutlined />}
                                        onClick={addLine}
                                    >
                                        Tambah Baris
                                    </Button>
                                </Col>
                                <Col>
                                    <Card
                                        size="small"
                                        style={{ background: "var(--bg-subtle)" }}
                                    >
                                        <Text
                                            type="secondary"
                                            style={{ fontSize: 12 }}
                                        >
                                            Total
                                        </Text>
                                        <div>
                                            <Text
                                                strong
                                                style={{
                                                    color: "var(--semantic-error)",
                                                }}
                                            >
                                                {formatRupiah(totalAmount)}
                                            </Text>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>

                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={processing}
                                >
                                    Simpan
                                </Button>
                                <Button
                                    icon={<RedoOutlined />}
                                    onClick={resetForm}
                                    disabled={processing}
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
