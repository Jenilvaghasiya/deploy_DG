import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Cell, XAxis, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMinutes } from "@/lib/utils";

// Responsive custom tick
const CustomTick = ({ x, y, payload }) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <foreignObject x={x - 30} y={y + 10} width={60} height={60}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          color: "#FFFFFF",
          fontSize: "12px",
          textAlign: "center",
          overflow: isSmallScreen ? "hidden" : "visible",
          textOverflow: isSmallScreen ? "ellipsis" : "unset",
          whiteSpace: isSmallScreen ? "nowrap" : "normal",
          width: "60px",
        }}
        title={payload.value}
      >
        {payload.value}
      </div>
    </foreignObject>
  );
};

// Loader component
const ChartLoader = () => {
  return (
    <div className="flex items-center justify-center h-[250px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
    </div>
  );
};

const chartConfig = {
  value: {
    label: "Usage",
    color: "#FFFFFF",
  },
};

export function PlatformBarChartCard({ platformData, userHasAdminPermission, PlatformUserFilterDropdown,dataLoader }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {    
    if(dataLoader?.type == "platformFilters"  && dataLoader?.flag ){
      setIsLoading(true);
    }else{
      setIsLoading(false);
    } 
  }, [dataLoader]);

  return (
    <Card className="bg-white/20 !border-white/35 rounded-xl border-shadow-blur gap-0 p-5 grow lg:h-full">
      <style jsx>{`
        .recharts-cartesian-axis-tick-value {
          fill: white !important;
        }
        .recharts-text {
          fill: white !important;
        }
      `}</style>

      <CardHeader className="gap-0 px-0">
        <CardTitle className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
          <span className="inline-block text-white font-medium text-xs lg:text-sm 2xl:text-lg -rotate-90 whitespace-nowrap text-shadow-white origin-left [transform:translateX(-90%)]">
            Time on Platform
          </span>
        </CardTitle>
        <CardDescription className="sr-only"></CardDescription>
        {userHasAdminPermission && (
          <div className="">
            <PlatformUserFilterDropdown />
          </div>
        )}
      </CardHeader>

      <CardContent className="px-0">
        {isLoading ? (
          <ChartLoader />
        ) : (
          <ChartContainer className="grow" config={chartConfig}>
            <BarChart
              data={platformData}
              margin={{ left: 50, top: 20 }}
              width={platformData.length * 80 + 50} // Dynamically grow based on bars
              height={250}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={<CustomTick />}
                interval={0}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0];
                    return (
                      <div className="bg-zinc-900 text-white p-2 rounded shadow-md border border-zinc-700 text-sm">
                        <div className="font-semibold">{item.payload.name}</div>
                        <div>{formatMinutes(item.value || item.payload.value)}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={80}>
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="#FFFFFF"
                  fontSize={12}
                  formatter={(value) => formatMinutes(value)}
                />
                {platformData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === "Abc3" ? "url(#gradientColor)" : "#FFFFFF"}
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
        )}
      </CardContent>
    </Card>
  );
}