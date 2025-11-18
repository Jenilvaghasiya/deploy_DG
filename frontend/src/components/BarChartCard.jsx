import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useEffect, useState } from "react"

export const description = "A bar chart with a label"

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#ff0000",
  },
}

export default function BarChartCard({data,BarKey="", ChartTitle="", XAxisDataKey="title",           BarColor = "#ff0000"  ,   
  BarLabel = "Value"   }) {
  // console.log(data,'data>>>>>>>>>>>>>>>>>>>>')
  console.log(data,ChartTitle ,'data>>>>>>>>>>>>>>>>>>>>')
   const [isMobile, setIsMobile] = useState(false);

   useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1399);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

const formatMonthLabel = (value) => {
  if (!value) return '';

  if (isMobile && value.length > 4) {
    return value.substring(0, 4) + '...';
  }

  return value; // This is already the title (from dataKey="title")
};

//  const chartConfig = {
//     [BarKey]: {
//       label: BarLabel,
//       color: BarColor,
//     },
//   };


  return (
    <Card className="bg-white/20 !border-white/35 rounded-xl border-shadow-blur gap-0 p-5 grow">
       <style jsx>{`
        .recharts-cartesian-axis-tick-value {
          fill: white !important;
        }
        .recharts-text {
          fill: white !important;
        }
      `}</style>
      <CardHeader className={'gap-0'}>
        <CardTitle className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
          <span className="inline-block text-white font-medium text-xs lg:text-sm 2xl:text-lg -rotate-90 whitespace-nowrap text-shadow-white origin-left [transform:translateX(-50%)]">
            {ChartTitle && ChartTitle}
          </span>
        </CardTitle>
        <CardDescription className="sr-only"></CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer className={'grow'} config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
            }}
          >
            <CartesianGrid vertical={false} />
              <XAxis
                dataKey={XAxisDataKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fill: 'white',fontSize: isMobile ? 10 : 12 }}
                tickFormatter={formatMonthLabel}
                interval={0}
              />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey={BarKey} fill="var(--color-desktop)" radius={[12, 12, 0, 0]}>
              <LabelList position="top" offset={12} className="fill-white font-medium" fontSize={12} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
