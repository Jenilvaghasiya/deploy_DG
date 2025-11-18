// ChooseAssetTab.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TreeGallery from "./Tab/ImageGallery";
import ChooseSizeChart from "./Tab/ChooseSizeChart";

const TABS = {
  IMAGES: "images",
  SIZE_CHARTS: "sizeCharts",
};

const ChooseAssetTab = ({
  open,
  onClose,
  onSelect,
  selectedImages,
  setSelectedImages,
}) => {
  const [activeTab, setActiveTab] = useState(TABS.IMAGES);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] max-w-full text-white flex flex-col p-0">
        {/* 🔹 Sticky Header */}
        <DialogHeader className="shrink-0 sticky top-0 z-20 border-b border-zinc-700 p-6 pb-4">
          <DialogTitle>Choose Asset</DialogTitle>
        </DialogHeader>

        {/* 🔹 Sticky Tabs */}
        <div className="shrink-0 flex border-b border-zinc-700 sticky top-[72px] z-10 px-6">
          {Object.entries(TABS).map(([key, value]) => {
          const label = key
            .toLowerCase()
            .split("_")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          return (
            <button
              key={value}
              className={`px-4 py-2 text-sm font-medium cursor-pointer ${
                activeTab === value
                  ? "border-b-2 border-pink-500 text-pink-400"
                  : "text-white hover:text-pink-400"
              }`}
              onClick={() => setActiveTab(value)}
            >
              {label}
            </button>
          );
        })}
        </div>

        {/* 🔹 Scrollable Tab Content - This is the key change */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === TABS.IMAGES && (
            <TreeGallery
              noDialog
              onSelect={onSelect}
              selectedImages={selectedImages}
              setSelectedImages={setSelectedImages}
            />
          )}

          {activeTab === TABS.SIZE_CHARTS && (
            <ChooseSizeChart
              isOpen={activeTab === TABS.SIZE_CHARTS}
              onSelectSizeChart={(id) => {
                if (onSelect) onSelect([{ type: "sizeChart", id }]);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChooseAssetTab;
