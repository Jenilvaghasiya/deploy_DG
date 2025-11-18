import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GalleryPageNew from "../../pages/gallery/GalleryPage";
import MoodboardPage from "@/pages/moodboards/MoodboardPage";
import {
    FaHeart,
} from "react-icons/fa";
import { BsImages } from "react-icons/bs";
import { AiOutlineProject } from "react-icons/ai";
import UserProjectPage from "@/pages/user_projects/UserProjectPage";
import { SizeChartViewer } from "../Assets/Tab/SizeChartViewer";
import ChooseSizeChart from "../Assets/Tab/ChooseSizeChart";
import SizeChartSharingManager from "../SizeChart/SizeChartSharingManager";
import { MdWork } from "react-icons/md";
import { ImTable2 } from "react-icons/im";
import moodboardNew from '../../assets/images/moodboard-new.png';
import combinedRuler from '../../assets/images/ruler_combined.svg';

export default function SharedWithOthers() {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="h-full flex flex-col bg-transparent">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="px-4 lg:px-5 xl:px-6 pt-4 lg:pt-5 xl:pt-6">
          <div className="container">
            <TabsList className="grid w-full max-w-full grid-cols-4 h-10 sm:h-12 p-1 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg">
              <TabsTrigger 
                value="projects" 
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-blue-600/20 
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg"
                title="Projects"
              >
                <MdWork className="w-4 h-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="gallery" 
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-blue-600/20 
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg"
                title="Gallery"
              >
                <BsImages className="w-4 h-4" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="moodboards" 
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-blue-600/20 
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg"
                title="Moodboards"
              >
                <img src={moodboardNew} alt="moodboard" className="size-5"/>
                <span className="hidden sm:inline">Moodboards</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="sizecharts" 
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/20 data-[state=active]:to-blue-600/20 
                  data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white/20
                  data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                  text-zinc-400 hover:text-zinc-200 rounded-lg"
                title="Sizecharts"
              >
                <img src={combinedRuler} alt="Image Variations" className="size-5"/>
                <span className="hidden sm:inline">Sizecharts</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="projects" className="flex-1 mt-0 overflow-auto custom-scroll">
          <UserProjectPage 
            customTitle={true}
            isSharedWithOthers={true}
             heading="View and manage projects shared with others in this section."
            subHeading="Select a project from the tree view."
          />
        </TabsContent>
        
        <TabsContent value="gallery" className="flex-1 mt-0 overflow-auto custom-scroll">
          <div className="text-white p-4 lg:p-5 xl:p-6 h-full">
            <div className="container">
              <h1 className="text-lg xl:text-2xl font-bold flex items-center gap-2">
                <BsImages className="w-5 h-5" />
                Gallery
              </h1>
              <GalleryPageNew
                isSharedWithOthers={true}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="moodboards" className="flex-1 mt-0 overflow-auto custom-scroll">
          <div className="text-white p-4 lg:p-5 xl:p-6 h-full">
            <div className="container">
              <h1 className="text-lg xl:text-2xl font-bold flex items-center gap-2">
                 <img src={moodboardNew} alt="moodboard" className="size-5"/>
                Moodboards
              </h1>
              <MoodboardPage
                customTitle={true}
                isSharedWithOthers={true}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sizecharts" className="flex-1 mt-0 overflow-auto custom-scroll">
          <div className="text-white p-4 lg:p-5 xl:p-6 h-full">
            <div className="container">
              <h1 className="text-lg xl:text-2xl font-bold mb-3 flex items-center gap-2">
                <img src={combinedRuler} alt="Image Variations" className="size-5"/>
                Sizecharts
              </h1>
              <SizeChartSharingManager
                isOpen={true}
                viewOnly={true}
                isSharedWithOthers={true}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}