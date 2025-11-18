import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BsImages } from "react-icons/bs";
import { MdAddPhotoAlternate } from "react-icons/md";
import ColorDetectionGenerator from "./ColorDetectionGenerator";
import ColorDetectionListing from "./ColorDetectionListing";

export default function ColorDetectionPage() {
  // ✅ Default tab is listing
  const [activeTab, setActiveTab] = useState("listing");

  return (
    <div className="h-full flex flex-col bg-transparent">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        {/* Tab Headers */}
        <div className="px-4 lg:px-5 xl:px-6 pt-4 lg:pt-5 xl:pt-6">
          <div className="container">
            <TabsList className="grid w-full max-w-full grid-cols-2 h-11 sm:h-12 p-1 bg-black/30 backdrop-blur-md border border-white/10 rounded-xl shadow-lg">
              
              {/* Color Detection Listing Tab */}
              <TabsTrigger
                value="listing"
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg px-3 py-2"
              >
                <BsImages className="w-5 h-5" />
                <span className="hidden sm:inline">Color Detection Listing</span>
              </TabsTrigger>

              {/* Generate Color Analysis Tab */}
              <TabsTrigger
                value="generate"
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_15px_rgba(59,130,246,0.4)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg px-3 py-2"
              >
                <MdAddPhotoAlternate className="w-5 h-5" />
                <span className="hidden sm:inline">Generate Color Analysis</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Color Detection Listing Content */}
        <TabsContent value="listing" className="flex-1 mt-0 overflow-auto custom-scroll">
          <div className="text-white p-4 lg:p-6 h-full">
            <div className="container space-y-4 h-full">
              <h1 className="text-lg xl:text-2xl font-bold flex items-center gap-2">
                <BsImages className="w-6 h-6 text-blue-400" />
                Color Detection Listing
              </h1>
              <ColorDetectionListing />
            </div>
          </div>
        </TabsContent>

        {/* Generate Color Analysis Content */}
        <TabsContent value="generate" className="flex-1 mt-0 overflow-auto custom-scroll">
          <div className="text-white p-4 lg:p-6 h-[90%]">
            <div className="container space-y-4 h-full">
              <h1 className="text-lg xl:text-2xl font-bold flex items-center gap-2">
                <MdAddPhotoAlternate className="w-6 h-6 text-purple-400" />
                Generate Color Analysis
              </h1>
              <ColorDetectionGenerator />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
