// components/GallerySelector.jsx
import { useState, useEffect } from "react";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { BsGrid } from "react-icons/bs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SmartImage from "@/components/SmartImage";
import { SortDropdown } from "@/components/Common/SortingButton";
import api from "../api/axios.js";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "./ui/button.jsx";

const BASE_API_URL = import.meta.env.VITE_API_URL;

const TABS = {
  UPLOADED: "uploaded",
  GENERATED: "generated",
  SAVED: "saved",
  FINALIZED: "finalized",
};

export default function GallerySelector({ open, onClose, onSelect, selectedImages, setSelectedImages}) {
  const [galleryImages, setGalleryImages] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.UPLOADED);
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(false);
  const [currentSort, setCurrentSort] = useState("created-date-asc");
  const fetchGalleryImages = async () => {
  setLoading(true);
  try {
    let endpoint =
      activeTab === TABS.GENERATED ? "/gallery/generated" : "/gallery";

    const res = await api.get(endpoint, {
      params: { status: activeTab, sorting: currentSort },
    });

    let data = res.data.data || [];
    let normalized = [];

    if (activeTab === TABS.GENERATED) {
      // Generated images (always build URL)
      normalized = data.flatMap((item) =>
        (item.result || []).map((hash) => ({
          id: item.id,
          url: `${BASE_API_URL}/genie-image/${hash}.png`,
          name: `Generated Image - ${item.task_id || item.id}`,
          status: "generated",
        }))
      );
    } else if (activeTab === TABS.SAVED) {
      // Saved images (make URL)
      normalized = data.map((img) => ({
        id: img.id,
        url: `${BASE_API_URL}/genie-image/${img.url}.png`,
        name: img.name,
        status: img.status || "saved",
      }));
    } else {
      // Other tabs (do NOT make URL)
      normalized = data.map((img) => ({
        id: img.id,
        url: img.url, // leave as-is from backend
        name: img.name,
        status: img.status || "uploaded",
      }));
    }

    setGalleryImages(normalized);
  } catch (err) {
    console.error("Failed to fetch gallery images", err);
  } finally {
    setLoading(false);
  }
};

  const handleClose = (isOpen) => {
  if (!isOpen) {
if (typeof onClose === "function") {
      onClose();   // ✅ only call if parent passed it
    }
    }
  };
  useEffect(() => {
    if (open) fetchGalleryImages();
  }, [open, activeTab, currentSort]);

  const toggleImageSelection = (img, index) => {
    const uniqueKey = `${img.id}|${index}`;
    setSelectedImages((prev) => {
      const exists = prev.some((i) => i._uniqueKey === uniqueKey);
      if (exists) return prev.filter((i) => i._uniqueKey !== uniqueKey);
      return [...prev, { ...img, _uniqueKey: uniqueKey }];
    });
  };

const handleConfirm = () => {
  if (typeof onSelect === "function") {
    onSelect(selectedImages);
  }
  if (typeof onClose === "function") onClose();
};


  const filteredImages = galleryImages.filter((img) => {
    switch (activeTab) {
      case TABS.FINALIZED:
        return img.status === "finalized";
      case TABS.SAVED:
        return img.status === "saved";
      case TABS.GENERATED:
        return img.status === "generated";
      default:
        return img.status === "uploaded";
    }
  });

  const GridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {filteredImages.map((img, idx) => {
        const isSelected = selectedImages.some((i) => i._uniqueKey === `${img.id}|${idx}`);
        return (
          <div
            key={`${img.id}|${idx}`}
            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer ${isSelected ? "ring-2 ring-pink-500" : ""}`}
            onClick={() => toggleImageSelection(img, idx)}
          >
            <SmartImage src={img.url} alt={img.name} className="w-full h-full object-cover" />
            {isSelected && (
              <div className="absolute inset-0 bg-pink-500/60 bg-opacity-30 flex items-center justify-center text-white font-semibold">
                Selected
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

 return (
  <Dialog open={open} onOpenChange={handleClose}>
    <DialogContent className="sm:max-w-4xl  text-white border-zinc-700">
      <DialogHeader>
        <DialogTitle className="text-white">Gallery</DialogTitle>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex border-b border-zinc-700 mb-4">
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 cursor-pointer text-sm font-medium ${
              activeTab === tab
                ? "border-b-2 border-pink-500 text-pink-400"
                : "text-white hover:text-pink-400"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* View + Sorting */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center bg-zinc-800 rounded-full p-1">
          <button
            className={`flex items-center px-3 py-1 rounded-full ${
              viewMode === "grid"
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
            onClick={() => setViewMode("grid")}
          >
            <BsGrid size={16} className="mr-2" />
            Grid
          </button>
        </div>
        <SortDropdown onSortChange={setCurrentSort} currentSort={currentSort} />
      </div>

      {/* Gallery */}
      {loading ? (
        <div className="text-center py-8 text-zinc-400">Loading...</div>
      ) : (
        <div className="h-[50dvh] overflow-auto custom-scroll pr-2">
          {viewMode === "grid" && <GridView />}
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex justify-end mt-6 gap-3">
        <Button
          variant="outline"
          className={'text-black'}
          onClick={() => {
            setSelectedImages([]);
            if (typeof onClose === "function") onClose();
          }}
        >
          Cancel
        </Button>
        <Button
        variant="dg_btn"
        onClick={handleConfirm}
        >
          Add Selected
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
}