import { Bar, BarChart, XAxis, LabelList, Cell, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Total",
    color: "#FFFFFF", // Keep consistent with chart text color
  },
};

export default function PlatformTotalBarChart({ data, formatMinutes }) {
  return (
    <div className="w-10 ml-2">
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart data={data} height={250} width={300} margin={{ left: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#FFFFFF", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0];
                return (
                  <div className="bg-zinc-900 text-white p-2 rounded shadow-md border border-zinc-700 text-sm min-w-[100px]">
                    <div className="font-semibold">{item.payload.name}</div>
                    <div>{formatMinutes(item.value || item.payload.value)}</div>
                </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={99}>
            <LabelList
              dataKey="value"
              position="top"
              fill="#FFFFFF"
              fontSize={12}
              formatter={(value) => formatMinutes(value)}
            />
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.name === "Abc3" // Optional: highlight specific entry
                    ? "url(#gradientColor)"
                    : "#FFFFFF"
                }
              />
            ))}
          </Bar>
          <defs>
            <linearGradient id="gradientColor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#dd1799" />
              <stop offset="100%" stopColor="#823deb" />
            </linearGradient>
          </defs>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
