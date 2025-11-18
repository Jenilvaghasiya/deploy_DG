// components/GalleryImagesTab.jsx
import { useState, useEffect } from "react";
import SmartImage from "@/components/SmartImage";
import { Button } from "@/components/ui/button";
import api from "@/api/axios.js";

const BASE_API_URL = import.meta.env.VITE_API_URL;

const TABS = {
  SAVED: "saved",
  FINALIZED: "finalized",
};

export default function GalleryImagesTab({ selectedImages, setSelectedImages, onSelect, linkedImages = [] }) {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.SAVED);
  const [currentSort, setCurrentSort] = useState("created-date-asc");

  // 🔹 Fetch gallery images
  const fetchGalleryImages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/gallery", {
        params: { status: activeTab, sorting: currentSort, type : "ProjectFilter" },
      });
      const data = res.data.data || [];
      const normalized = data.map((img) => ({
        id: img.id,
        url:
            img.status === "saved"
              ? `${BASE_API_URL}/genie-image/${img.url}`
              : img.url.startsWith("http")
              ? img.url
              : `${VITE_BASE_URL}/${img.url}`,
        // url: `${BASE_API_URL}/genie-image/${img.url}.png`,
        name: img.name,
        status: img.status || activeTab,
      }));
      setGalleryImages(normalized);
    } catch (err) {
      console.error("Failed to fetch gallery images", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryImages();
  }, [activeTab, currentSort]);

  const selectImage = (img, idx) => {
    if (img.isLinked) return; // 🚫 block linked image
    const uniqueKey = `${img.id}|${idx}`;
 if (selectedImages[0]?._uniqueKey === uniqueKey) {
     // If same image clicked again → unselect
    setSelectedImages([]);
   } else {
     // Otherwise select new image
     setSelectedImages([{ ...img, _uniqueKey: uniqueKey }]);
   }
};

  return (
    <div className="flex flex-col h-full">
      {/* Tabs inside GalleryImagesTab */}
      <div className="flex border-b border-zinc-700 mb-4">
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 cursor-pointer text-sm font-medium text-white ${
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

      {/* Grid */}
      <div className="h-20 grow overflow-auto custom-scroll">
        {loading ? (
          <div className="text-center py-8 text-zinc-400">Loading images...</div>
        ) : galleryImages.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">No {activeTab} images found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {galleryImages.map((img, idx) => {
              const uniqueKey = `${img.id}|${idx}`;
              const isSelected = selectedImages[0]?._uniqueKey === uniqueKey;
              const isLinked = linkedImages.includes(img.id);
              console.log(img.id , '1');
              console.log(linkedImages, '2');
              
              
              return (
                <div
                  key={`${img.id}|${idx}`}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer 
                    ${isLinked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
                    ${isSelected ? "ring-2 ring-pink-500" : ""}`}
                  onClick={() => {if (!isLinked) selectImage(img, idx)}}
                >
                  <SmartImage
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  {isLinked && (
                    <div className="absolute inset-0 bg-green-600/60 flex items-center justify-center text-white font-semibold">
                      Already Linked
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-pink-500/60 flex items-center justify-center text-white font-semibold">
                      Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
