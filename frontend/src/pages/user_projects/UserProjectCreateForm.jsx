import { useEffect, useState } from "react";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import { multipartRequest } from "../../api/axios.js";
import Select from "../../components/Select.jsx";
import { BsGrid, BsList } from "react-icons/bs";
import { toast } from "react-hot-toast"
import api from "../../api/axios.js";
import { useCredits } from "@/hooks/useCredits";
import { fetchProjects } from "../../features/projects/projectService.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MeasurementsDialogViewer } from "../image_generator/MeasurementsDialogViewer";
import SmartImage from "@/components/SmartImage";
import { SortDropdown } from "@/components/Common/SortingButton";
import GallerySelector from "@/components/GallerySelector";
import { useNSFWDetection } from "@/service/useNSFWFilter";
import NSFWWarningModal from "@/components/NSFWWarningModal";
const BASE_URL = import.meta.env.VITE_SERVER_URL;
const BASE_API_URL = import.meta.env.VITE_API_URL;

const TABS = {
  FINALIZED: "finalized",
  SAVED: "saved",
  GENERATED: "generated",
  UPLOADED: "uploaded",
};

function UserProjectCreateForm({
  onCancel,
  onSuccess,
  parentId = null,
  parentName = "",
  moodboard_ids= [],
  mooodboard_name = ""
}) {
  const [images, setImages] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(false); // Changed: Don't start with loading=true
  const [activeTab, setActiveTab] = useState(TABS.UPLOADED);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [sizeChartIDs, setSizeChartIDs] = useState([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false); // Added: Track if gallery has been loaded
  const [moodboardOptions, setMoodboardOptions] = useState([]);
  const [currentSort, setCurrentSort] = useState("created-date-asc");
  const [gallerySelectorOpen, setGallerySelectorOpen] = useState(false);
  const { fetchCredits } = useCredits();
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    imageId: null,
  });
  const [formData, setFormData] = useState({
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  parent_id: parentId ? { id: parentId, label: parentName } : null,
  moodboard_ids:  []
});
  const [projectOptions, setProjectOptions] = useState([]);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { checkImage, isModelLoading, modelError, isReady } = useNSFWDetection();
    const [nsfwModalOpen, setNSFWModalOpen] = useState(false);
  const [nsfwFileName, setNSFWFileName] = useState("");
  const [isCheckingNSFW, setIsCheckingNSFW] = useState(false);


  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  useEffect(() => {
    const fetchProjectOptions = async () => {
      try {
        const response = await fetchProjects();
        const projects = response.map((project) => ({
          id: project.id,
          label: project.name || project.name,
        }));
        setProjectOptions(projects);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
      }
    };
    fetchProjectOptions();
  }, []);

    useEffect(() => {
    const fetchMoodboards = async () => {
      try {
        const response = await api.get("/moodboards");
        console.log(response);
        
        const moodboards = response.data.data.map((moodboard) => ({
            id : moodboard.id,
            label: moodboard. name
        }));
        setMoodboardOptions(moodboards);
      } catch (err) {
        console.error("Failed to fetch moodboards:", err);
      }
    };

    fetchMoodboards();
  }, []);

  // Clean up image URLs when component unmounts
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);

  const fetchGalleryImages = async () => {
    if (galleryLoaded) return;
    
    try {
      setLoading(true);
       let response;
        if (activeTab === "generated") {
          // special endpoint
          response = await api.get("/gallery/generated", {params: { sorting: currentSort }});
        } else {
          // generic endpoint with status param
          response = await api.get("/gallery", {params: { status: activeTab, sorting: currentSort }});
        }
      setGalleryImages(
        response.data.data.map((img) => ({
          id: img.id,
          url: `${img.url}`,
          name: img.name,
          status: img.status || "uploaded",
        }))
      );
      setGalleryLoaded(true); // Mark as loaded
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch gallery images"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog open - fetch gallery images on first open
  const handleDialogOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && !galleryLoaded) {
      fetchGalleryImages();
    }
  };
   const checkImagesForNSFW = async (files) => {
    if (!isReady) {
      console.warn("NSFW model not ready, proceeding without check");
      return { safe: files, nsfw: [] };
    }

    setIsCheckingNSFW(true);
    const safeImages = [];
    const nsfwImages = [];

    try {
      for (const file of files) {
        try {
          const result = await checkImage(file);
          
          if (result.isNSFW) {
            nsfwImages.push({
              file,
              reason: result.reason,
              score: result.score,
              topCategory: result.topCategory
            });
            
            // Log detailed info for debugging
            console.warn(`NSFW content detected in ${file.name}:`, {
              reason: result.reason,
              score: result.score,
              predictions: result.predictions,
              combinedScore: result.combinedNSFW
            });
          } else {
            safeImages.push(file);
          }
        } catch (error) {
          console.error(`Error checking image ${file.name}:`, error);
          // On error, be conservative and treat as potentially NSFW
          nsfwImages.push({
            file,
            reason: 'Error during check',
            score: 0
          });
        }
      }
    } finally {
      setIsCheckingNSFW(false);
    }

    return { safe: safeImages, nsfw: nsfwImages };
  };


  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

   const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      const { safe, nsfw } = await checkImagesForNSFW(files);
      
      if (nsfw.length > 0) {
        // Show warning for first NSFW image
        setNSFWFileName(nsfw[0].file.name);
        setNSFWModalOpen(true);
        
        // Show toast with details
        toast.error(`${nsfw.length} image(s) rejected due to inappropriate content`);
      }

      if (safe.length > 0) {
        const newImages = safe.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          description: "",
        }));
        setImages((prev) => [...prev, ...newImages]);
        
        if (nsfw.length > 0) {
          toast.success(`${safe.length} safe image(s) added`);
        }
      }
    }
  };

const toggleGalleryImageSelection = (image, index) => {
  // uniqueKey ensures each image in Generated tab is independent
  const uniqueKey = `${image.id}|${index}`; // id + index guarantees uniqueness

  setSelectedGalleryImages((prev) => {
        const exists = prev.some((img) => img._uniqueKey === uniqueKey);


    if (exists) {
            return prev.filter((img) => img._uniqueKey !== uniqueKey);

    } else {
      return [...prev, { ...image, _uniqueKey: uniqueKey }];
    }
  });
};

  const handleContextMenu = (e, imageId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      imageId,
    });
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    const { safe, nsfw } = await checkImagesForNSFW(files);
    
    if (nsfw.length > 0) {
      // Show warning for first NSFW image
      setNSFWFileName(nsfw[0].file.name);
      setNSFWModalOpen(true);
      
      // Show toast with count
      toast.error(`${nsfw.length} image(s) rejected due to inappropriate content`);
    }

    if (safe.length > 0) {
      const newImages = safe.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        description: "",
      }));
      setImages((prev) => [...prev, ...newImages]);
      
      if (nsfw.length > 0) {
        toast.success(`${safe.length} safe image(s) added`);
      }
    }
    
    // Reset input
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDescriptionChange = (index, value) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, description: value } : img))
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If start_date is being changed and end_date exists, validate end_date
    if (
      name === "start_date" &&
      formData.end_date &&
      value > formData.end_date
    ) {
      setFormData((prev) => ({ ...prev, [name]: value, end_date: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

useEffect(() => {
  const fetchData = async () => {
    try {
      let endpoint = "";

      switch (activeTab) {
        case TABS.UPLOADED:
        case TABS.SAVED:
        case TABS.FINALIZED:
          endpoint = "/gallery";
          break;
        case TABS.GENERATED:
          endpoint = "/gallery/generated";
          break;
      }

      if (endpoint) {
        const res = await api.get(endpoint, {
         params: { sorting: currentSort } // ✅ pass sorting param
       });

        let data = res.data.data || [];

        // 🔑 Normalize the shape based on active tab
        let normalized;
        if (activeTab === TABS.GENERATED) {
          
          normalized = data.flatMap((item) =>
            (item.result || []).map((hash, idx) => ({
              id: `${item.id}`,
              url: `${BASE_API_URL}/genie-image/${hash}.png`, // 🔥 build full URL
              name: `Generated Image - ${item.task_id || item.id}`,
              status: "generated",
            }))
          );
        } else {
          normalized = data.map((img) => ({
            id: img.id,
            url: img.url,
            name: img.name,
            status: img.status || "uploaded",
          }));
        }

        console.log("Normalized data for", activeTab, normalized);
        setGalleryImages(normalized);
      }
    } catch (err) {
      console.error("Error fetching gallery data:", err);
    }
  };

  fetchData();
}, [activeTab, currentSort]);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSaving(true);
  try {
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("start_date", formData.start_date);
    data.append("end_date", formData.end_date);
    data.append("parent_id", formData.parent_id?.id || "");
    data.append(
      "moodboard_ids",
      JSON.stringify(formData.moodboard_ids.map((m) => m.id))
    );

    sizeChartIDs.forEach(id => {
      data.append("size_charts[]", id);
    });

    // Upload only non-gallery images
    images.forEach((img, index) => {
      if (!img.isFromGallery) {
        data.append("images", img.file);
        if (img.description) {
          data.append(`descriptions[${index}]`, img.description);
        }
      }
    });

    // Send gallery image IDs correctly (from 'id' key)
    const galleryPayload = selectedGalleryImages.map((img) => {
      if (img.id && img.url && img.status === "generated") {
        return { task_id: img.id, url: img.url };
      }
      return { id: img.id, status : img.status }
    })
    data.append("image_ids", JSON.stringify(galleryPayload));

    const response = await multipartRequest.post("/projects", data);
    onSuccess(); // Refresh and return to list view
    fetchCredits()
    fetchProjects();
  } catch (err) {
  if (err.response?.status === 413) {
      toast.error("File is too large. Please upload a smaller file.");
    } else {
      toast.error(err.response?.data?.message || "Failed to create project");
    }
  } finally {
    setIsSaving(false);
  }
};

  const handleSortChange = (sortOption) => {
    setCurrentSort(sortOption)   
  }

  const TabSelector = () => (
    <div className="flex border-b border-zinc-700 mb-4">
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === TABS.UPLOADED
            ? "border-b-2 border-pink-500 text-pink-400"
            : "text-white hover:text-pink-400"
        }`}
        onClick={() => setActiveTab(TABS.UPLOADED)}
      >
        Uploaded Images
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === TABS.GENERATED
            ? "border-b-2 border-pink-500 text-pink-400"
            : "text-white hover:text-pink-400"
        }`}
        onClick={() => setActiveTab(TABS.GENERATED)}
      >
        Generated
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === TABS.SAVED
            ? "border-b-2 border-pink-500 text-pink-400"
            : "text-white hover:text-pink-400"
        }`}
        onClick={() => setActiveTab(TABS.SAVED)}
      >
        Saved for Later
      </button>
      <button
        className={`px-4 py-2 text-sm font-medium ${
          activeTab === TABS.FINALIZED
            ? "border-b-2 border-pink-500 text-pink-400"
            : "text-white hover:text-pink-400"
        }`}
        onClick={() => setActiveTab(TABS.FINALIZED)}
      >
        Finalized
      </button>
    </div>
  );

  const GridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {filteredImages.map((image, index) => {        
      const uniqueKey = `${image.id}|${index}`;

          const isSelected = selectedGalleryImages.some(
    (img) => img._uniqueKey === `${image.id}|${index}`
  );


        return (
          <div
      key={`${image.id}|${index}`} // unique key for React
            onClick={() => toggleGalleryImageSelection(image,index)}
            className={`relative aspect-square border rounded-xl overflow-hidden group cursor-pointer ${
              isSelected ? "ring-2 ring-pink-500" : ""
            }`}
          >
            <SmartImage
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <span className="text-white font-semibold">Selected</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Filter images based on active tab
  const filteredImages = galleryImages.filter((img) => {
    switch (activeTab) {
      case TABS.FINALIZED:
        return img.status === "finalized";
      case TABS.SAVED:
        return img.status === "saved";
      case TABS.GENERATED:
        return img.status === "generated";
      case TABS.UPLOADED:
      default:
        return img.status === "uploaded";
    }
  });

  // List View Component
  const ListView = () => (
    <div className="space-y-3 p-4">
      {/* Gallery Items */}
      {filteredImages.map((image) => (
        <div
          key={image.id}
          className="flex bg-zinc-900 rounded-lg overflow-hidden"
          onContextMenu={(e) => handleContextMenu(e, image.id)}
        >
          <div className="w-24 h-24 bg-zinc-800 overflow-hidden relative">
            <SmartImage
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      ))}
    </div>
  );

  // const GalleryContent = () => {
  //   if (loading) {
  //     return <div className="text-center text-zinc-400 py-8">Loading...</div>;
  //   }

  //   return (
  //     <div className="space-y-4 flex flex-col">
  //       {/* Tabs */}
  //       <TabSelector />

  //       <div className="flex justify-between items-center">
  //         <div className="flex items-center bg-zinc-800 rounded-full p-1">
  //           <button
  //             className={`flex items-center px-3 py-1 rounded-full ${
  //               viewMode === "grid"
  //                 ? "bg-zinc-700 text-white"
  //                 : "text-zinc-400 hover:text-white"
  //             }`}
  //             onClick={() => setViewMode("grid")}
  //           >
  //             <BsGrid size={16} className="mr-2" />
  //             Grid
  //           </button>
  //         </div>
  //           <div className="md:ml-auto mr-4">
  //               <SortDropdown onSortChange={handleSortChange} currentSort={currentSort} />
  //           </div>
  //       </div>

  //       {error && <div className="text-red-500 mb-4">{error}</div>}

  //       {/* Display view */}
  //       <div className="h-[50dvh] grow overflow-auto">
  //         {viewMode === "grid" ? <GridView /> : <ListView />}
  //       </div>
  //     </div>
  //   );
  // };

  return (
    <div
      className={`space-y-6 ${dragOver ? "bg-zinc-900/50" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* NSFW Warning Modal */}
      <NSFWWarningModal
        isOpen={nsfwModalOpen}
        onClose={() => setNSFWModalOpen(false)}
        fileName={nsfwFileName}
        detectedContent="NSFW content detected"
      />

      {/* Show loading indicator when checking NSFW */}
      {isCheckingNSFW && (
        <div className="fixed top-4 right-4 bg-zinc-800 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Checking images for inappropriate content...</span>
          </div>
        </div>
      )}

      {/* Model error indicator */}
      {modelError && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 text-red-400 text-sm">
          Content safety check unavailable. Images will be uploaded without screening.
        </div>
      )}
      {/* Drag overlay */}
       {dragOver && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center">
            <AiOutlinePlus size={48} className="text-white mx-auto mb-4" />
            <p className="text-white text-xl font-semibold">
              Drop images here to add to project
            </p>
            {isReady && (
              <p className="text-white/80 text-sm mt-2">
                Images will be checked for inappropriate content
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white/10 border border-solid border-white/35 border-shadow-blur rounded-xl p-4 lg:p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold">Add Images to Project</h2>
          {/* <MeasurementsDialogViewer btnClass="ml-auto mr-0" buttonTitle={'Link Size Chart'} measurementTableData={{}} projectButtonType={'CREATE'} setSizeChartIDs={setSizeChartIDs} sizeChartIDs={sizeChartIDs}/> */}
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 min-h-[120px] p-4 rounded-lg border-2 border-dashed transition-colors ${
            dragOver ? "border-pink-500 bg-zinc-800/50" : "border-zinc-400"
          }`}
        >
          {images.map((img, index) => (
            <div
              key={index}
              className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden"
            >
              <SmartImage
                src={img.preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => handleRemoveImage(index)}
              >
                <AiOutlineClose size={16} className="text-white" />
              </button>
              <input
                type="text"
                placeholder="Description"
                value={img.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white text-sm p-1"
              />
            </div>
          ))}
          {selectedGalleryImages.map((img, index) => (
            <div
              key={img.id}
              className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden"
            >
              <SmartImage
                src={img.url}
                alt={`Gallery Selected ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() =>
                  setSelectedGalleryImages((prev) =>
                    prev.filter((i) => i.id !== img.id)
                  )
                }
              >
                <AiOutlineClose size={16} className="text-white" />
              </button>
            </div>
          ))}

          <label className="flex items-center justify-center bg-white/10 rounded-lg border-2 border-dashed border-white/35 cursor-pointer hover:bg-zinc-900 transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleImageChange}
              className="hidden"
              disabled={isCheckingNSFW}
            />
            <div className="flex flex-col items-center">
              <AiOutlinePlus size={24} className="text-pink-400 mb-2" />
              <span className="text-sm text-zinc-200">
                {isCheckingNSFW ? "Checking..." : "Add Image"}
              </span>
            </div>
          </label>

          <div
            className="p-1 flex items-center justify-center bg-white/10 rounded-lg border-2 border-dashed border-white/35 cursor-pointer hover:bg-zinc-900 transition-colors"
            onClick={() => setGallerySelectorOpen(true)}
          >
            <div className="flex flex-col items-center">
              <AiOutlinePlus size={24} className="text-pink-400 mb-2" />
              <span className="text-sm text-zinc-200 text-center">
                Choose from gallery
              </span>
            </div>
          </div>

{/* Render GallerySelector */}
{gallerySelectorOpen && (
  <GallerySelector
    open={gallerySelectorOpen}
    onClose={() => setGallerySelectorOpen(false)}
    selectedImages={selectedGalleryImages}
    setSelectedImages={setSelectedGalleryImages}
    selectionMode="multiple"
  />
)}
        </div>
        {images.length === 0 && !dragOver && (
          <p className="text-center text-zinc-200 mt-4">
            Drag and drop images here or click "Add Image" to upload
          </p>
        )}
      </div>

      <div className="bg-white/10 p-4 lg:p-6 rounded-xl border border-white/35 border-shadow-blur mb-4">
        <div className="max-w-xl space-y-4">
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          <InputField
            label="Title"
            name="name"
            placeholder="Enter project name"
            required={true}
            value={formData.name}
            onChange={handleInputChange}
          />
          <InputField
            label="Description"
            name="description"
            placeholder="Enter project description"
            value={formData.description}
            onChange={handleInputChange}
            multiline={true}
            rows={4}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Start Date"
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
            />
            <InputField
              label="End Date"
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              disabled={!formData.start_date}
              min={formData.start_date || undefined}
            />
          </div>

          <Select
            label="Moodboards"
            name="moodboard_ids"
            options={moodboardOptions}
            value={formData.moodboard_ids}
            onChange={(options) =>
              setFormData((prev) => ({
                ...prev,
                moodboard_ids: options || [], // store selected moodboards as array
              }))
            }
            placeholder="Select moodboards (optional)"
            multiSelect={true}
          />
          <Select
            label="Parent Project"
            name="parent_project"
            options={projectOptions}
            value={formData.parent_id}
            onChange={(option) =>
              setFormData((prev) => ({
                ...prev,
                parent_id: option,
              }))
            }
            placeholder="Select a parent project (optional)"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="primary"
          onClick={handleSubmit}
          fullWidth={false}
          loading={isSaving}
          loadingText="Saving...."
        >
          Save Project
        </Button>
        <Button variant="secondary" onClick={onCancel} fullWidth={false}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default UserProjectCreateForm;