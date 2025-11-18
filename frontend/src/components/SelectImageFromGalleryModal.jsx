import { useState, useEffect, useMemo, useCallback } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BsGrid } from "react-icons/bs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SmartImage from "@/components/SmartImage";
import api from "@/api/axios";
import { Button } from "./ui/button";
const BASE_API_URL = import.meta.env.VITE_API_URL;

const TABS = {
  UPLOADED: "uploaded",
  SAVED: "saved",
  FINALIZED: "finalized",
};

function SelectImageFromGalleryModal({
  onImagesSelected,
  buttonText = "Choose from gallery",
  className = "",
  icon = null
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.UPLOADED);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedGalleryImages, setSelectedGalleryImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onSelectLoading,setOnSelectLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch gallery images when modal opens
  useEffect(() => {
    const fetchGalleryImages = async () => {
      if (!open) return;

      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/gallery");
        setGalleryImages(
          response.data.data.map((img) => ({
            id: img.id,
            url: img.status === "saved" ? `${BASE_API_URL}/genie-image/${img.url}` : img.url,
            name: img.name,
            status: img.status || "uploaded",
          }))
        );
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch gallery images"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, [open]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedGalleryImages([]);
    }
  }, [open]);

  // Memoize filtered images to prevent unnecessary re-renders
  const filteredImages = useMemo(() => {
    return galleryImages.filter((img) => {
      switch (activeTab) {
        case TABS.FINALIZED:
          return img.status === "finalized";
        case TABS.SAVED:
          return img.status === "saved";
        case TABS.UPLOADED:
        default:
          return img.status === "uploaded";
      }
    });
  }, [galleryImages, activeTab]);

  // Memoize the toggle function to prevent unnecessary re-renders
  const toggleGalleryImageSelection = useCallback((image) => {
    setSelectedGalleryImages((prevSelected) => {
      const exists = prevSelected.some((img) => img.id === image.id);
      if (exists) {
        return prevSelected.filter((img) => img.id !== image.id);
      } else {
        return [...prevSelected, image];
      }
    });
  }, []);

  const handleConfirmSelection = async() => {
    setOnSelectLoading(true);
    await onImagesSelected(selectedGalleryImages);
    setOpen(false);
    setOnSelectLoading(false)
  };

  // Memoize tab change handler
  const handleTabChange = useCallback((tabValue) => {
    setActiveTab(tabValue);
  }, []);

  const TabSelector = () => (
    <div className="flex border-b border-zinc-700 mb-4">
      {Object.entries(TABS).map(([key, value]) => (
        <button
          key={key}
          className={`px-4 py-2 text-sm font-medium cursor-pointer ${
            activeTab === value
              ? "border-b-2 border-pink-500 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => handleTabChange(value)}
        >
          {key.charAt(0) + key.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );

  // Memoize individual image items to prevent unnecessary re-renders
  const ImageItem = ({ image }) => {
    const isSelected = selectedGalleryImages.some(
      (img) => img.id === image.id
    );

    return (
      <div
        key={image.id}
        onClick={() => toggleGalleryImageSelection(image)}
        className={`relative aspect-square border rounded-xl overflow-hidden group cursor-pointer transition-all ${
          isSelected
            ? "ring-2 ring-pink-500 bg-pink-500/10"
            : "hover:ring-2 hover:ring-pink-300/50"
        }`}
      >
        <SmartImage
          src={image.url}
          alt={image.name}
          className="w-full h-full object-cover"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-black/80 bg-opacity-30 flex items-center justify-center">
            <div className="bg-pink-500 text-white px-2 py-1 rounded text-sm font-semibold">
              Selected
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <div
            className={`w-4 h-4 rounded border-2 ${
              isSelected
                ? "bg-pink-500 border-pink-500"
                : "border-white bg-black/50"
            }`}
          >
            {isSelected && (
              <svg
                className="w-full h-full text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  };

  const GridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {filteredImages.map((image) => (
        <ImageItem key={image.id} image={image} />
      ))}
    </div>
  );

  const GalleryContent = () => {
    if (loading) {
      return (
        <div className="text-center text-zinc-400 py-8">Loading gallery...</div>
      );
    }

    if (error) {
      return <div className="text-center text-red-400 py-8">{error}</div>;
    }

    return (
      <div className="space-y-4 flex flex-col h-full">
        <TabSelector />

        <div className="flex justify-between items-center">
          <div className="text-sm text-zinc-400">
            {filteredImages.length} images • {selectedGalleryImages.length}{" "}
            selected
          </div>

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
        </div>

        <div className="flex-1 overflow-auto pr-2 custom-scroll">
          {filteredImages.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No images found in this category
            </div>
          ) : (
            <GridView />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={selectedGalleryImages.length === 0}
            className={`px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedGalleryImages.length > 0
                ? "bg-pink-500 text-white hover:bg-pink-600"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Select{" "}
            {selectedGalleryImages.length > 0 &&
              `(${selectedGalleryImages.length})`}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={onSelectLoading}
          onClick={() => setOpen(true)}
          variant="dg_btn"
        >
            {/* <Edit className="w-3 h-3 mr-1" /> */}
            {onSelectLoading && (
              <svg
                className="animate-spin h-4 w-4 mr-2 text-pink-500 inline"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {icon && <span className="mr-2">{icon}</span>}  
          {buttonText || "Select from Gallery"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-h-[80vh] text-white border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            Select Images from Gallery
          </DialogTitle>
        </DialogHeader>
        <div className="h-[60vh]">
          <GalleryContent />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SelectImageFromGalleryModal;