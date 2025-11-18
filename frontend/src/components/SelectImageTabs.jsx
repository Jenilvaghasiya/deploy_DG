import { AppWindowIcon, CodeIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorMessage } from "formik";
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import SmartImage from "./SmartImage";
import { useLocation, useParams, useSearchParams } from "react-router-dom"; // Add useSearchParams
import { cn } from "@/lib/utils";
import ProjectModalForTechPack from "@/pages/image_generator/take_packs/ProjectModalForTechPack";
import ProjectTree from "@/pages/image_generator/Size_chart_Gallery/ProjectTree";
import { useNSFWDetection } from "@/service/useNSFWFilter";
import NSFWWarningModal from "./NSFWWarningModal";

const BASE_URL = import.meta.env.VITE_API_URL;
const GALLERY_TABS = {
  UPLOADED: "uploaded",
  GENERATED: "generated",
  SAVED: "saved",
  FINALIZED: "finalized",
};

export function SelectImageTabs({
  title = "Upload Garment Image",
  handleImageUpload,
  setFieldValue,
  showUploadExistingField = true,
  showMoodboardField = false,
  imageUnicId = "upload-input",
  showGalleryTabs={
    uploaded: true,
    generated: true,
    saved: true,
    finalized: true
  },
  imageEditor = false,
  showProjectsField = false,
  setPreviewImage = null, // Add this prop
  scrollToBottom = null, // Add this prop
}) {
  const nsfw = useNSFWDetection();
   const [nsfwModalOpen, setNSFWModalOpen] = useState(false);
  const [nsfwFileName, setNSFWFileName] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [moodboardImages, setMoodboardImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moodboardLoading, setMoodboardLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moodboardError, setMoodboardError] = useState(null);
  const location = useLocation();
  const [dragActive, setDragActive] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState(GALLERY_TABS.UPLOADED);
  const [searchParams] = useSearchParams(); // Add this
  const [activeTab, setActiveTab] = useState(""); // Add state for main tabs
  const [preselectedImageProcessed, setPreselectedImageProcessed] = useState(false); // Add flag to prevent multiple selections
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [linkedImages, setLinkedImages] = useState([]); // your existing linked images

  // Separate function for handling project image confirmation
const handleProjectImageConfirm = async (images) => {
  if (images.length === 0) return;
  
  const selectedImage = images[0]; // Get first image (single selection)
  
  try {
    // Create a placeholder file for form validation
    const placeholderFile = new File(
      [''], 
      selectedImage.name || 'project-image.jpg', 
      { type: 'image/jpeg' }
    );
    
    // Set the form values
    setFieldValue("garmentImage", placeholderFile);
    setFieldValue("projectImageUrl", selectedImage.url); // Add this for backend
    setFieldValue("projectImageId", selectedImage.id);
    
    // Clear other source fields
    setFieldValue("galleryImageId", null);
    setFieldValue("generatedImageUrl", null);
    setFieldValue("prompt", "");
    
    // Set the preview image directly using the URL
    if (setPreviewImage) {
      setPreviewImage(selectedImage.url);
    }
    
    // Trigger scroll if function is provided
    if (scrollToBottom && typeof scrollToBottom === 'function') {
      setTimeout(() => scrollToBottom(), 100);
    }
    
    // Close modal and clear selection
    setShowProjectModal(false);
    setSelectedImages([]);
    
  } catch (error) {
    console.error("Error setting project image:", error);
    alert("Failed to set project image. Please try again.");
  }
};

 const handleFileChange = async (e) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    if (!nsfw.isReady) {
      alert('NSFW model is still loading. Please wait...');
      return;
    }

    try {
      const result = await nsfw.checkImage(file);
      if (result.isNSFW) {
        setNSFWFileName(file.name);
        setNSFWModalOpen(true);
        return; // Stop upload
      }

      // Safe file: proceed with upload
      handleImageUpload(e, setFieldValue);
    } catch (error) {
      console.error('NSFW check failed:', error);
      alert('Failed to check image. Please try again.');
    }
  };
  // Handle preselected gallery image from URL
  useEffect(() => {
    const galleryImageId = searchParams.get('galleryImageID');
    
    if (galleryImageId && !preselectedImageProcessed && showUploadExistingField) {
      // Set the tab to existing to show gallery
      setActiveTab("existing");
      
      // Fetch the specific image details
      const fetchPreselectedImage = async () => {
        try {
          const response = await api.get(`/gallery/single/${galleryImageId}`);
          const imageData = response.data.data;
          
          if (imageData) {
            // Set the appropriate gallery tab based on image status
            if (imageData.status) {
              setActiveGalleryTab(imageData.status);
            }
            
            // Construct the image object
            const img = {
              id: imageData.id,
              url: imageData.url,
              name: imageData.name,
              status: imageData.status || "uploaded",
            };
            
            // Auto-select the image after a short delay to ensure gallery is loaded
            setTimeout(async () => {
              try {
                const response = await fetch(img.url);
                const blob = await response.blob();
                const file = new File([blob], img.name || "image.jpg", {
                  type: blob.type,
                });

                const event = { target: { files: [file] } };

                if (imageEditor) {
                  handleImageUpload(event, setFieldValue, { ...img });
                } else {
                  handleImageUpload(event, setFieldValue, { galleryImageId: img.id });
                }
                
                setPreselectedImageProcessed(true);
              } catch (err) {
                console.error("Error auto-selecting image:", err);
              }
            }, 500);
          }
        } catch (err) {
          console.error("Error fetching preselected image:", err);
        }
      };
      
      fetchPreselectedImage();
    }
  }, [searchParams, showUploadExistingField, handleImageUpload, setFieldValue, imageEditor, preselectedImageProcessed]);

   const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Only JPG, PNG, WEBP, or GIF files are allowed.");
        return;
      }
      
      handleImageUpload({ target: { files } }, setFieldValue);
    },
    [setFieldValue, handleImageUpload]
  );
  
  const filteredImages = galleryImages.filter((img) => {
    switch (activeGalleryTab) {
      case GALLERY_TABS.FINALIZED:
        return img.status === "finalized";
        case GALLERY_TABS.SAVED:
          return img.status === "saved";
          case GALLERY_TABS.GENERATED:
      return img.status === "generated";
    default:
      return img.status === "uploaded";
    }
  });
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Fetch gallery images
useEffect(() => {
  const fetchGalleryImages = async () => {
    setLoading(true);
    try {
      let endpoint =
        activeGalleryTab === GALLERY_TABS.GENERATED
          ? "/gallery/generated"
          : "/gallery";

      const res = await api.get(endpoint, {
        params: { status: activeGalleryTab },
      });

      let data = res.data.data || [];
      let normalized = [];

      if (activeGalleryTab === GALLERY_TABS.GENERATED) {
        normalized = data.flatMap((item) =>          
          (item.result || []).map((hash) => ({
            id: item.id,
            url: `${BASE_URL}/genie-image/${hash}`,
            name: `Generated Image - ${item.task_id || item.id}`,
            status: "generated",
          }))
        );
      } else if (activeGalleryTab === GALLERY_TABS.SAVED) {
        normalized = data.map((img) => ({
          id: img.id,
          url: `${BASE_URL}/genie-image/${img.url}.png`,
          name: img.name,
          status: img.status || "saved",
        }));
      } else {
        normalized = data.map((img) => ({
          id: img.id,
          url: img.url, // already full URL from backend
          name: img.name,
          status: img.status || "uploaded",
        }));
      }
      
      setGalleryImages(normalized);
    } catch (err) {
      console.error("Failed to fetch gallery images", err);
      setError("Failed to fetch gallery images");
    } finally {
      setLoading(false);
    }
  };
  
  fetchGalleryImages();
  
  // cleanup previews
  return () => {
    galleryImages.forEach((img) => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
  };
}, [activeGalleryTab, location]);

const visibleGalleryTabs = Object.values(GALLERY_TABS).filter(
  (tab) => (showGalleryTabs?.[tab] ?? true) // show if not specified
);
  // Fetch moodboard images
  useEffect(() => {
    if (!showMoodboardField) return;

    const fetchMoodboardImages = async () => {
      try {
        setMoodboardLoading(true);
       const response = await api.get("/moodboards", {
        params: { populate: true },
      });            
        const moodboards = response.data.data || [];
        // Extract images from all moodboards
        const allImages = moodboards.flatMap((moodboard) =>
          moodboard.gallery_images.map((img) => ({
            ...img,
            moodboardId: moodboard.id,
            moodboardName: moodboard.name,
          }))
        );        
        
        setMoodboardImages(allImages);
      } catch (err) {
        console.error("Error fetching moodboard images:", err);
        setMoodboardError(
          err.response?.data?.message || "Failed to fetch moodboard images"
        );
      } finally {
        setMoodboardLoading(false);
      }
    };

    fetchMoodboardImages();
  }, [showMoodboardField]);

  return (
    <div className="flex w-full flex-col gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}> {/* Add value and onValueChange */}
        <TabsList className="gap-4 p-0 bg-transparent flex-wrap mb-4 h-auto">
          <TabsTrigger value="pc" className="grow-0 md:grow text-white p-1.5 px-2.5 sm:px-4 cursor-pointer text-xs sm:text-sm lg:text-base bg-zinc-50/25 font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white" icon={<AppWindowIcon className="mr-2 text-white size-4" />}>Upload From Device</TabsTrigger>

          {showUploadExistingField && (
            <TabsTrigger value="existing" className="grow-0 md:grow text-white p-1.5 px-2.5 sm:px-4 cursor-pointer text-xs sm:text-sm lg:text-base bg-zinc-50/25 font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white" icon={<CodeIcon className="mr-2 text-white size-4" />}>Upload from My Gallery</TabsTrigger>
          )}

          {showMoodboardField && (
            <TabsTrigger 
              value="moodboard" 
              className="grow-0 md:grow text-white p-1.5 px-2.5 sm:px-4 cursor-pointer text-xs sm:text-sm lg:text-base bg-zinc-50/25 font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              Moodboard Images
            </TabsTrigger>
          )}

          {showProjectsField && (
            <TabsTrigger
              value="projects"
              className="grow-0 md:grow text-white p-1.5 px-2.5 sm:px-4 cursor-pointer text-xs sm:text-sm lg:text-base bg-zinc-50/25 font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              onClick={() => setShowProjectModal(true)}
            >
              Project Images
            </TabsTrigger>
          )}
        </TabsList>

         <TabsContent value="pc">
        <div className="">
          <label className="text-sm md:text-base font-medium text-white block mb-1">{title}</label>
          <div
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-3 transition-all duration-300 cursor-pointer group",
              dragActive
                ? "border-pink-400 animate-pulse shadow-pink-500/30 shadow-md"
                : "border-white/35 bg-[rgba(255,255,255,0.1)] backdrop-blur-xs shadow-[inset_0px_0px_30px_8px_rgba(255,255,255,0.20)]"
            )}
            onDragEnter={() => setDragActive(true)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const files = e.dataTransfer.files;
              if (files && files[0]) {
                handleFileChange({ target: { files } });
              }
            }}
          >
            <label
              htmlFor={imageUnicId}
              className={`flex flex-col items-center justify-center gap-2 h-36 cursor-pointer text-white transition-transform duration-300 ${
                dragActive ? 'scale-105' : ''
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-8 w-8 text-white transition-colors ${
                  dragActive ? 'text-pink-400' : 'group-hover:text-pink-400'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4m0 0l-4 4m4-4v12"
                />
              </svg>
              <p
                className={`text-sm transition-colors ${
                  dragActive ? 'text-pink-300 font-semibold' : 'group-hover:text-pink-300'
                }`}
              >
                {dragActive ? 'Drop here to upload' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-white/60">Supports .jpg, .png, etc.</p>
            </label>

            <input
              id={imageUnicId}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <p className="text-xs text-white my-1 px-1">
            For best results, use an image with a clean background and clear view of the garment.
          </p>
        </div>
      </TabsContent>


        {showUploadExistingField && (
          <TabsContent value="existing">
            <div className="mt-3 h-80 border-2 border-dashed rounded-xl p-4 border-shadow-blur flex flex-col">
              {/* Sub-Tabs for Gallery */}
              
              <div className="flex-wrap gap-y-3 flex border-b border-zinc-700 mb-3">
                {visibleGalleryTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-1.5 text-sm cursor-pointer font-medium capitalize ${
                      activeGalleryTab === tab
                        ? "border-b-2 border-pink-500 text-pink-400"
                        : "text-white hover:text-pink-400"
                    }`}
                    onClick={() => setActiveGalleryTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Gallery Grid */}
              <div className="flex-1 overflow-y-auto custom-scroll">
                {loading ? (
                  <p className="text-white text-sm text-center">Loading...</p>
                ) : error ? (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                ) : filteredImages.length === 0 ? (
                  <p className="text-gray-300 text-sm text-center">
                    No images found in {activeGalleryTab}.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredImages.map((img, idx) => {
                      const galleryImageId = searchParams.get('galleryImageID');
                      const isPreselected = galleryImageId && img.id === galleryImageId;
                      
                      return (
                        <div
                          key={`${img.id}|${idx}`}
                          className={cn(
                            "relative border rounded overflow-hidden cursor-pointer group",
                            isPreselected && "ring-2 ring-pink-500 ring-offset-2 ring-offset-black"
                          )}
                          onClick={async () => {
                            try {                    
                              const response = await fetch(img.url);
                              const blob = await response.blob();
                              const file = new File([blob], img.name || "image.jpg", {
                                type: blob.type,
                              });

                              const event = { target: { files: [file] } };

                              // Add extra metadata
                              const extraMeta =
                                activeGalleryTab === GALLERY_TABS.GENERATED
                                  ? { generatedImageUrl: img.url }
                                  : { galleryImageId: img.id };

                              if (imageEditor) {
                                handleImageUpload(event, setFieldValue, { ...img });
                              } else {
                                handleImageUpload(event, setFieldValue, extraMeta);
                              }
                            } catch (err) {
                              console.error("Error using existing image:", err);
                            }
                          }}
                        >
                          <SmartImage
                            src={img.url}
                            alt={img.name}
                            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 truncate">
                            {img.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {showMoodboardField && (
          <TabsContent value="moodboard">
            <div className="mt-3 h-72 border-2 border-dashed rounded-xl p-4 overflow-y-auto border-shadow-blur custom-scroll">
              {moodboardLoading ? (
                <p className="text-white text-sm text-center">
                  Loading moodboard images...
                </p>
              ) : moodboardError ? (
                <p className="text-red-500 text-sm text-center">
                  {moodboardError}
                </p>
              ) : moodboardImages.length === 0 ? (
                <p className="text-gray-300 text-sm text-center">
                  No images found in moodboards.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {moodboardImages.map((img, index) => (
                    <div
                      key={`${img.moodboardId}-${index}`}
                      className="relative border rounded overflow-hidden cursor-pointer group"
                      onClick={async () => {
                        try {
                          // Construct full URL to moodboard image
                          const imageUrl = img?.galleryImage?.url;

                          const response = await fetch(imageUrl);
                          const blob = await response.blob();
                          const file = new File(
                            [blob],
                            img.name ||
                            `moodboard-${img.moodboardName}-${index}.jpg`,
                            { type: blob.type }
                          );

                          const event = { target: { files: [file] } };
                          if (imageEditor) {
                            handleImageUpload(event, setFieldValue, { ...img }); 
                          } else {
                            handleImageUpload(event, setFieldValue, {});
                          }
                        } catch (err) {
                          console.error("Error using moodboard image:", err);
                        }
                      }}
                    >                      
                      <SmartImage
                        src={img?.galleryImage?.url}
                        alt={img.name || `Moodboard: ${img.moodboardName}`}
                        className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 truncate">
                        {img.name || img.moodboardName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        <ProjectModalForTechPack
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedImages([]); // Clear selection on close
          }}
          title="Select Project Image"
        >
          <ProjectTree
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            linkedImages={linkedImages}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            showActions={true}
            onCancel={() => {
              setShowProjectModal(false);
              setSelectedImages([]); // Clear selection
            }}
            onConfirm={handleProjectImageConfirm} // Use the separate function
          />
        </ProjectModalForTechPack>
      </Tabs>
       <NSFWWarningModal
        isOpen={nsfwModalOpen}
        onClose={() => setNSFWModalOpen(false)}
        fileName={nsfwFileName}
        detectedContent="NSFW content detected"
      />
    </div>
  );
}