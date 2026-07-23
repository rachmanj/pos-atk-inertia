import { useMemo, useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

function getWeekRange() {
    const now = dayjs();
    const dayOfWeek = now.day();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    return [now.subtract(diff, "day").startOf("day"), now.endOf("day")];
}

function getPresets() {
    return [
        {
            label: "Hari ini",
            value: [dayjs().startOf("day"), dayjs().endOf("day")],
        },
        {
            label: "Kemarin",
            value: [
                dayjs().subtract(1, "day").startOf("day"),
                dayjs().subtract(1, "day").endOf("day"),
            ],
        },
        {
            label: "Minggu ini",
            value: getWeekRange(),
        },
        {
            label: "Bulan ini",
            value: [dayjs().startOf("month"), dayjs().endOf("day")],
        },
        {
            label: "Bulan lalu",
            value: [
                dayjs().subtract(1, "month").startOf("month"),
                dayjs().subtract(1, "month").endOf("month"),
            ],
        },
    ];
}

export default function DatePreset({ onApply }) {
    const presets = useMemo(() => getPresets(), []);
    const [dates, setDates] = useState(null);

    const handleChange = (values) => {
        setDates(values);

        if (values?.[0] && values?.[1] && onApply) {
            onApply(
                values[0].format("YYYY-MM-DD"),
                values[1].format("YYYY-MM-DD"),
            );
        }
    };

    return (
        <RangePicker
            value={dates}
            onChange={handleChange}
            presets={presets}
            format="DD/MM/YYYY"
            placeholder={["Tanggal mulai", "Tanggal akhir"]}
            style={{ width: "100%" }}
        />
    );
}
