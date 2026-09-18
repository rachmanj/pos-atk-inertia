import React from "react";
import { Button, Input, InputNumber, Space, Table, Typography } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { formatRupiah } from "../../../Utils/format";

const { Text } = Typography;

export default function ShiftExpenseLinesEditor({
    lines,
    onChange,
    readOnly = false,
    totalAmount,
}) {
    const updateLine = (index, field, value) => {
        if (!onChange) {
            return;
        }
        onChange(
            lines.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line,
            ),
        );
    };

    const addLine = () => {
        if (!onChange) {
            return;
        }
        onChange([...lines, { title: "", amount: 0 }]);
    };

    const removeLine = (index) => {
        if (!onChange || lines.length <= 1) {
            return;
        }
        onChange(lines.filter((_, lineIndex) => lineIndex !== index));
    };

    const columns = [
        {
            title: "Keterangan",
            render: (_, line, index) =>
                readOnly ? (
                    <Text>{line.title || "-"}</Text>
                ) : (
                    <Input
                        value={line.title}
                        maxLength={150}
                        placeholder="Beli bensin"
                        onChange={(e) => updateLine(index, "title", e.target.value)}
                    />
                ),
        },
        {
            title: "Nominal",
            align: "right",
            width: 160,
            render: (_, line, index) =>
                readOnly ? (
                    <Text>{formatRupiah(line.amount || 0)}</Text>
                ) : (
                    <InputNumber
                        min={0}
                        style={{ width: "100%" }}
                        value={line.amount}
                        onChange={(value) => updateLine(index, "amount", value ?? 0)}
                        formatter={(v) => formatRupiah(v)}
                        parser={(v) => v?.replace(/\D/g, "")}
                    />
                ),
        },
    ];

    if (!readOnly) {
        columns.push({
            title: "Aksi",
            align: "center",
            width: 70,
            render: (_, __, index) => (
                <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeLine(index)}
                    disabled={lines.length === 1}
                />
            ),
        });
    }

    const displayTotal =
        totalAmount ??
        lines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

    const dataSource = readOnly && lines.length === 0
        ? [{ title: "-", amount: 0, _empty: true }]
        : lines;

    return (
        <>
            <Table
                rowKey={(_, index) => index}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                scroll={{ x: "max-content" }}
                size="small"
                style={{ marginBottom: 8 }}
            />
            {!readOnly && (
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={addLine}
                    block
                    style={{ marginBottom: 8 }}
                >
                    Tambah Baris
                </Button>
            )}
            <Space direction="vertical" size={0} style={{ width: "100%" }}>
                <Text>
                    Total Pengeluaran dari Laci:{" "}
                    <Text strong>{formatRupiah(displayTotal)}</Text>
                </Text>
            </Space>
        </>
    );
}
