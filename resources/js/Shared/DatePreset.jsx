import { useState } from "react";

const presets = [
    { label: "Hari ini", getRange: () => ({ start: today(), end: today() }) },
    { label: "Kemarin", getRange: () => ({ start: yesterday(), end: yesterday() }) },
    { label: "Minggu ini", getRange: () => weekToDate },
    { label: "Bulan ini", getRange: () => monthToDate },
    { label: "Bulan lalu", getRange: () => lastMonth },
];

function today() {
    return new Date().toISOString().slice(0, 10);
}

function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function weekToDate() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return { start: monday.toISOString().slice(0, 10), end: today() };
}

function monthToDate() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: firstDay.toISOString().slice(0, 10), end: today() };
}

function lastMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
        start: firstDay.toISOString().slice(0, 10),
        end: lastDay.toISOString().slice(0, 10),
    };
}

export default function DatePreset({ onApply }) {
    const [activePreset, setActivePreset] = useState(null);

    const handlePreset = (preset) => {
        const range = preset.getRange();
        setActivePreset(preset.label);
        if (onApply) {
            onApply(range.start, range.end);
        }
    };

    return (
        <div className="d-flex flex-wrap gap-1">
            {presets.map((preset) => (
                <button
                    key={preset.label}
                    type="button"
                    className={`btn btn-sm ${
                        activePreset === preset.label
                            ? "btn-primary"
                            : "btn-outline-secondary"
                    }`}
                    onClick={() => handlePreset(preset)}
                >
                    {preset.label}
                </button>
            ))}
        </div>
    );
}
