import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import GalleryTreeManager from "./TreeView";
import ChooseAssetTab from "./Assets/ChooseAssetTab";

const TABS = {
  TREE: "tree",
  ASSETS: "assets",
};

const GalleryTreeDialog = ({
  imageId,
  title = "Tree View",
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.TREE);
  const [selectedImages, setSelectedImages] = useState([]);

  const handleSelectAssets = (assets) => {
    console.log("Selected assets:", assets);
    setSelectedImages(assets);
    setActiveTab(TABS.TREE); // go back to tree tab after selecting
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-6xl bg-zinc-900 text-white border-zinc-700 z-[9999] rounded-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* 🔹 Tab Buttons */}
        <div className="flex border-b border-zinc-700 mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium cursor-pointer ${
              activeTab === TABS.TREE
                ? "border-b-2 border-pink-500 text-pink-400"
                : "text-white hover:text-pink-400"
            }`}
            onClick={() => setActiveTab(TABS.TREE)}
          >
            Tree
          </button>

          <button
            className={`px-4 py-2 text-sm font-medium cursor-pointer ${
              activeTab === TABS.ASSETS
                ? "border-b-2 border-pink-500 text-pink-400"
                : "text-white hover:text-pink-400"
            }`}
            onClick={() => setActiveTab(TABS.ASSETS)}
          >
            Choose Assets
          </button>
        </div>

        {/* 🔹 Tab Content */}
        <div className="mt-4">
          {activeTab === TABS.TREE && (
            <div className="max-h-[70vh] overflow-auto">
              <GalleryTreeManager
                imageId={imageId}
                selectedImages={selectedImages}
              />
            </div>
          )}

          {activeTab === TABS.ASSETS && (
            <ChooseAssetTab
              open={open}
              onClose={() => setActiveTab(TABS.TREE)}
              onSelect={handleSelectAssets}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
            />
          )}
        </div>

        <DialogFooter className="flex justify-end gap-3 mt-4">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryTreeDialog;
