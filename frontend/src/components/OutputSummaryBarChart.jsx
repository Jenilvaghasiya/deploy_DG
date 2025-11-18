import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

export default function OutputSummaryBarChart({ outputData }) {
  const chartConfig = {
    generated: {
      label: "Generated",
      color: "#EE1B23",
    },
    discarded: {
      label: "Discarded",
      color: "#00A3EB",
    },
  };

  const chartData = [
    {
      name: "Total",
      generated: outputData.reduce(
        (sum, item) =>
          sum +
          item.subCategories.reduce(
            (subSum, sub) => subSum + (sub.generated || 0),
            0
          ),
        0
      ),
      discarded: outputData.reduce(
        (sum, item) =>
          sum +
          item.subCategories.reduce(
            (subSum, sub) => subSum + (sub.discarded || 0),
            0
          ),
        0
      ),
    },
  ];

  return (
    <div className="p-5 xl:pb-20 2xl:pb-24 relative rounded-xl border-shadow-blur shadow-sm">
      <h2 className="text-lg absolute top-1/2 -left-10 -translate-y-1/2 -rotate-90">
        No. of Outputs
      </h2>
      <div className="flex h-full items-end px-5">
        <ChartContainer config={chartConfig} className={'w-5/6 xl:w-5/12 2xl:w-1/5 h-full'}>
          <BarChart data={chartData} height={250}>
            {/* <CartesianGrid vertical={false} /> */}
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
                  return (
                    <div className="bg-zinc-900 text-white p-2 rounded shadow-md border border-zinc-700 text-sm min-w-[100px]">
                      <div className="font-semibold">{payload[0].payload.name}</div>
                      {payload.map((item, idx) => (
                        <div key={idx}>
                          {chartConfig[item.dataKey]?.label}: {item.value}
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="generated" radius={[4, 4, 0, 0]} barSize={50}>
              <LabelList dataKey="generated" position="top" fill="#FFFFFF" fontSize={12} />
              <Cell fill="#EE1B23" />
            </Bar>
            <Bar dataKey="discarded" radius={[4, 4, 0, 0]} barSize={50}>
              <LabelList dataKey="discarded" position="top" fill="#FFFFFF" fontSize={12} />
              <Cell fill="#00A3EB" />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
