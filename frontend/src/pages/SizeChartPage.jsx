import { AppWindowIcon, CodeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SizeChart from "./image_generator/SizeChart";
import ManualTable from "./ManualTable";
import { MeasurementsDialogViewer } from "./image_generator/MeasurementsDialogViewer";


export function TabsDemo() {
  return (
    <>
      <h1 className="text-lg lg:text-2xl 2xl:text-3xl font-bold text-white text-left px-5 mt-5">
        Size Chart
      </h1>
      <Tabs defaultValue="size-chart-list" className="p-5 h-20 grow">
        <TabsList className="flex flex-wrap items-center bg-black/10 border border-solid border-zinc-800 p-1 h-auto rounded-full mb-4 py-1.5 px-2">
          <TabsTrigger
            value="size-chart-list"
            className="text-white cursor-pointer text-base 2xl:text-lg font-medium py-1.5 h-auto border border-solid border-transparent data-[state=active]:border-zinc-700 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-full px-4"
          >
            Size Chart List
          </TabsTrigger>
          <TabsTrigger
            value="ai-generated"
            className="text-white cursor-pointer text-base 2xl:text-lg font-medium py-1.5 h-auto border border-solid border-transparent data-[state=active]:border-zinc-700 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-full px-4"
          >
            AI Generated
          </TabsTrigger>

          <TabsTrigger
            value="manual"
            className="text-white cursor-pointer text-base 2xl:text-lg font-medium py-1.5 h-auto border border-solid border-transparent data-[state=active]:border-zinc-700 data-[state=active]:bg-white/10 data-[state=active]:text-white rounded-full px-4"
          >
            Manual
          </TabsTrigger>

        </TabsList>

        <TabsContent value="size-chart-list" className="flex flex-col">
          <MeasurementsDialogViewer />
        </TabsContent>
        <TabsContent value="ai-generated" className="flex flex-col">
          <SizeChart />
        </TabsContent>

        <TabsContent value="manual" className="flex flex-col">
          <ManualTable />
        </TabsContent>

        
      </Tabs>
    </>
  );
}
