// components/LinkSizeChartToImageModal.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProjectTree from "@/pages/image_generator/Size_chart_Gallery/ProjectTree";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import GalleryImagesTab from "./GalleryImagesTab";
import api from "@/api/axios";
import { toast } from "react-hot-toast";

export default function LinkSizeChartToImageModal({
  open,
  onClose,
  sizeChartId,
  linkedImages = [],
  onSuccess = () => {},
}) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [activeTab, setActiveTab] = useState("images");
  const [loading, setLoading] = useState(false);

  // Reset selections when modal opens or tabs change
  useEffect(() => {
    if (open) {
      setSelectedImages([]);
      setSelectedProject(null);
    }
  }, [open, activeTab]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      // Normalize payload: always send array of objects like gallery
      const imagesPayload =
      activeTab === "projects"
      ? selectedImages // project tab should provide same format
      : selectedImages;

      if (!sizeChartId || imagesPayload.length === 0) return;

      await api.post("/image-variation/link-images-to-sizechart", {
      size_chart_id: sizeChartId,
      gallery_image_ids: imagesPayload,
      });
      toast.success("Image linked to size chart");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error linking images:", err);
      toast.error("Failed to link image to size chart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[80vh] max-w-full  text-white overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-zinc-700 pb-2">
          <DialogTitle>
            Select {activeTab === "projects" ? "Project Image" : "Gallery Images"}
          </DialogTitle>
        </DialogHeader>

        {/* 🔹 Body with Tabs */}
        <div className="grow h-60 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-20 grow flex flex-col">
            {/* Tabs Switcher */}
            <TabsList className="bg-zinc-800 w-fit mb-3">
              <TabsTrigger className={'text-white cursor-pointer data-[state=active]:text-black'} value="projects">Projects</TabsTrigger>
              <TabsTrigger className={'text-white cursor-pointer data-[state=active]:text-black'} value="images">Images</TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects" className="flex-1 custom-scroll">
              <ProjectTree
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                selectedImages={selectedImages}
                setSelectedImages={setSelectedImages}
                linkedImages={linkedImages}
              />
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="">
              <GalleryImagesTab
                selectedImages={selectedImages}
                setSelectedImages={setSelectedImages}
                onSelect={(imgs) => console.log("Selected images:", imgs)}
                linkedImages={linkedImages}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* 🔹 Footer */}
        <DialogFooter className="border-t border-zinc-700 pt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="dg_btn"
            disabled={
              loading ||
              (activeTab === "projects" && !selectedProject) ||
              (activeTab === "images" && selectedImages.length === 0)
            }
            onClick={handleConfirm}
          >
            {loading ? "Linking..." : "Link Images"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
