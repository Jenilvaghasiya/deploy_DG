import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BsImages } from "react-icons/bs";
import { MdAddPhotoAlternate } from "react-icons/md";
import TechPacksListing from "./TechPacksListing";
import TechPackGenerator from "../TechPackGenerator";
import { useLocation, useSearchParams } from "react-router-dom";

export default function TechPacksPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const allowedTabs = ["listing", "generate"];

  const tabFromQuery = searchParams.get("tab");
  const tabFromState = location.state?.defaultTab;

  // ✅ Determine initial tab safely
  const getInitialTab = () => {
    if (allowedTabs.includes(tabFromQuery)) return tabFromQuery;
    if (allowedTabs.includes(tabFromState)) return tabFromState;
    return "listing"; // default fallback (prevents reload issue)
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // ✅ Keep the URL query param synced with activeTab
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", activeTab);
    setSearchParams(newParams, { replace: true });
  }, [activeTab]);

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
              
              <TabsTrigger
                value="listing"
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_15px_rgba(139,92,246,0.4)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg px-3 py-2"
              >
                <BsImages className="w-5 h-5" />
                <span className="hidden sm:inline">Tech Pack Listing</span>
              </TabsTrigger>

              <TabsTrigger
                value="generate"
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/30 data-[state=active]:to-blue-600/30
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_15px_rgba(59,130,246,0.4)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg px-3 py-2"
              >
                <MdAddPhotoAlternate className="w-5 h-5" />
                <span className="hidden sm:inline">Generate Tech Pack</span>
              </TabsTrigger>

            </TabsList>
          </div>
        </div>

        {/* Tab Contents */}
        <TabsContent value="listing" className="flex-1 mt-0 overflow-auto custom-scroll">
          <div className="text-white p-4 lg:p-6 h-full">
            <div className="container space-y-4">
              <TechPacksListing />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="generate" className="flex-1 mt-0 overflow-auto custom-scroll">
          <div className="text-white p-4 lg:p-6 h-[90%]">
            <div className="container space-y-4 h-full">
              <TechPackGenerator />
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
