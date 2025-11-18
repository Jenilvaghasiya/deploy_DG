import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { useEffect, useState } from "react";

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
    <foreignObject x={x - 30} y={y + 10} width={60} height={32}>
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

const GroupedBarChart = ({
  data,
  chartConfig,
  height = 200,
  width = data.length >= 3 ? 900 : 600,
  dataKeyOne = "generated",
  formatter = undefined,
  heading,
  leftDropdown,
  rightDropdown,
  originalData,
  userHasAdminPermission = false,
  zIndex = 10,
  dataLoader
}) => {
  const hasDiscardedData = data.some((item) => item.discarded !== 0);
  const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {         
    if(dataLoader){
      setIsLoading(true);
    }else{
      setIsLoading(false);
    }    
  }, [dataLoader]);

  return (
    <Card
      className="bg-white/20 !border-white/35 rounded-xl border-shadow-blur p-5 relative grow lg:h-full"
      style={{ zIndex }}
    >
      {/* Dropdown Controls */}
      <div className="flex justify-between">
        {leftDropdown}
        {userHasAdminPermission && rightDropdown}
      </div>
      <style jsx>{`
        .recharts-cartesian-axis-tick-value {
          fill: white !important;
        }
        .recharts-text {
          fill: white !important;
        }
      `}</style>

      {/* Left Rotated Heading */}
      <CardHeader className="gap-0 p-0">
        <CardTitle className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
          <span className="inline-block text-white font-medium text-xs lg:text-sm 2xl:text-lg -rotate-90 whitespace-nowrap text-shadow-white origin-left [transform:translateX(-50%)]">
            {heading}
          </span>
        </CardTitle>
        <CardDescription className="sr-only"></CardDescription>
      </CardHeader>

      {/* Chart Section */}
      <CardContent className="px-0">
         {isLoading ? (
          <ChartLoader />
        ) : (
        <ChartContainer config={chartConfig}>
          <BarChart
            data={data}
            barCategoryGap="10%"
            height={height}
            width={width}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="title"
              axisLine={false}
              tickLine={false}
              interval={0}
              height={100}
              tick={<CustomTick />}
            />
            <Tooltip
              cursor={false}
              formatter={formatter}
              content={<ChartTooltipContent hideLabel={false} />}
              wrapperStyle={{
                backgroundColor: "#FFFFFF",
                border: "none",
                borderRadius: "4px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                padding: "8px",
              }}
            />
            <Bar
              dataKey={dataKeyOne}
              fill={chartConfig[dataKeyOne]?.color || "#FFFFFF"}
              radius={[4, 4, 0, 0]}
              barSize={99}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`${dataKeyOne}-${entry.title}-${index}`}
                />
              ))}
            </Bar>

            {hasDiscardedData && (
              <Bar
                dataKey="discarded"
                fill={chartConfig.discarded.color}
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`discarded-${entry.name}-${entry.title}-${index}`}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>

      {/* Group Labels */}
      {originalData && originalData.map((item, groupIndex) => (
        <div
          key={item.name}
          style={{
            position: "absolute",
            top: "150px",
            left: `${(groupIndex * 80) / originalData.length + 6}%`,
            transform: "translateX(-50%)",
            color: "#FFFFFF",
            fontSize: "12px",
            textAlign: "center",
            width: `${100 / originalData.length}%`,
          }}
        >
          {item.name}
        </div>
      ))}
    </Card>
  );
};

export default GroupedBarChart;
