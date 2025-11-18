// components/DateRangePicker.tsx
import { useState } from "react";

interface DateRangePickerProps {
  startDate: any;
  endDate: any;
  onStartDateChange: (date: any) => void;
  onEndDateChange: (date: any) => void;
  onApply: () => void;
  onCancel: () => void;
}

const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  onCancel,
}: DateRangePickerProps) => {
  const [relativeValue, setRelativeValue] = useState("");
  const [relativeUnit, setRelativeUnit] = useState<"days" | "months">("days");

  const handleRelativeDateApply = () => {
    if (!relativeValue) return;

    const value = parseInt(relativeValue);
    const end = new Date();
    const start = new Date();

    if (relativeUnit === "days") {
      start.setDate(start.getDate() - value);
    } else {
      start.setMonth(start.getMonth() - value);
    }

    onStartDateChange(start.toISOString());
    onEndDateChange(end.toISOString());
  };

  const CustomDatePicker = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string | null;
    onChange: (value: string | null) => void;
  }) => {
    const currentYear = new Date().getFullYear();
    const years: number[] = Array.from(
      { length: 30 },
      (_, i) => currentYear - i
    );
    const months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

    const getDaysInMonth = (y: number, m: number) =>
      new Date(y, m, 0).getDate();

    const parsedDate = value ? new Date(value) : null;
    const [year, setYear] = useState<number | "">(
      parsedDate ? parsedDate.getFullYear() : ""
    );
    const [month, setMonth] = useState<number | "">(
      parsedDate ? parsedDate.getMonth() + 1 : ""
    );
    const [day, setDay] = useState<number | "">(
      parsedDate ? parsedDate.getDate() : ""
    );

    const days: number[] =
      year && month
        ? Array.from(
            { length: getDaysInMonth(Number(year), Number(month)) },
            (_, i) => i + 1
          )
        : [];

    const handleChange = (y: number | "", m: number | "", d: number | "") => {
      if (y && m && d) {
        const dateObj = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
        onChange(dateObj.toISOString());
      } else {
        onChange(null);
      }
    };

    return (
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-300 mb-1">
          {label}
        </label>
        <div className="flex gap-2">
          <select
            value={year}
            onChange={(e) => {
              const newYear = e.target.value ? Number(e.target.value) : "";
              setYear(newYear);
              handleChange(newYear, month, day);
            }}
            className="border border-gray-600 bg-[#181826] text-[#f5f5f5] px-2 py-1 rounded text-sm"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => {
              const newMonth = e.target.value ? Number(e.target.value) : "";
              setMonth(newMonth);
              handleChange(year, newMonth, day);
            }}
            className="border border-gray-600 bg-[#181826] text-[#f5f5f5] px-2 py-1 rounded text-sm"
          >
            <option value="">Month</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={day}
            onChange={(e) => {
              const newDay = e.target.value ? Number(e.target.value) : "";
              setDay(newDay);
              handleChange(year, month, newDay);
            }}
            className="border border-gray-600 bg-[#181826] text-[#f5f5f5] px-2 py-1 rounded text-sm"
          >
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        zIndex: 10,
        background: "#181826",
        border: "1px solid #333",
        borderRadius: "0.5rem",
        padding: "1rem",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.4)",
        minWidth: "350px",
        color: "#f5f5f5",
      }}
    >
      {/* Header with X button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ fontSize: "1rem", fontWeight: "bold", color: "#f5f5f5" }}>
          Select Date Range
        </h3>
        <button
          onClick={onCancel}
          style={{
            fontSize: "1.2rem",
            fontWeight: "bold",
            cursor: "pointer",
            color: "#f5f5f5",
          }}
        >
          ❌
        </button>
      </div>

      {/* Quick Filter Buttons */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {["Today", "Yesterday", "Last 7 Days"].map((label, idx) => (
          <button
            key={label}
            onClick={() => {
              const today = new Date();
              if (label === "Today") {
                const iso = today.toISOString().split("T")[0];
                onStartDateChange(`${iso}T00:00:00.000Z`);
                onEndDateChange(`${iso}T23:59:59.999Z`);
              } else if (label === "Yesterday") {
                today.setDate(today.getDate() - 1);
                const iso = today.toISOString().split("T")[0];
                onStartDateChange(`${iso}T00:00:00.000Z`);
                onEndDateChange(`${iso}T23:59:59.999Z`);
              } else {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 6);
                const startIso = start.toISOString().split("T")[0];
                const endIso = end.toISOString().split("T")[0];
                onStartDateChange(`${startIso}T00:00:00.000Z`);
                onEndDateChange(`${endIso}T23:59:59.999Z`);
              }
            }}
            style={{
              padding: "6px 12px",
              border: "1px solid #555",
              borderRadius: "6px",
              background: "#2a2a3d",
              color: "#f5f5f5",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Relative Date Input */}
      <div style={{ marginBottom: "1rem" }}>
        <label className="text-xs font-medium text-gray-300 mb-1">
          Relative Date Filter
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={relativeValue}
            onChange={(e) => setRelativeValue(e.target.value)}
            placeholder="Enter number"
            className="border border-gray-600 bg-[#181826] text-[#f5f5f5] px-2 py-1 rounded text-sm w-20"
            min="1"
          />
          <select
            value={relativeUnit}
            onChange={(e) =>
              setRelativeUnit(e.target.value as "days" | "months")
            }
            className="border border-gray-600 bg-[#181826] text-[#f5f5f5] px-2 py-1 rounded text-sm"
          >
            <option value="days">Days</option>
            <option value="months">Months</option>
          </select>
          <button
            onClick={handleRelativeDateApply}
            style={{
              padding: "6px 12px",
              border: "1px solid #1e3a8a",
              borderRadius: "6px",
              background: "#1e40af",
              color: "white",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Date Inputs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <CustomDatePicker
          label="Start Date"
          value={startDate}
          onChange={onStartDateChange}
        />
        <CustomDatePicker
          label="End Date"
          value={endDate}
          onChange={onEndDateChange}
        />
      </div>

      {/* Submit + Clear */}
      <div
        style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
      >
        <button
          onClick={onApply}
          style={{
            padding: "6px 12px",
            border: "1px solid #1e3a8a",
            borderRadius: "6px",
            background: "#1e40af",
            color: "white",
            fontSize: "0.9rem",
            cursor: "pointer",
          }}
        >
          Submit
        </button>
        {(startDate || endDate) && (
          <button
            onClick={onCancel}
            style={{
              padding: "6px 12px",
              border: "1px solid #555",
              borderRadius: "6px",
              background: "#2a2a3d",
              color: "#f5f5f5",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;
