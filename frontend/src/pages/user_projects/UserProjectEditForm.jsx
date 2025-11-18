import { useState, useEffect } from "react";
import { AiOutlinePlus, AiOutlineClose } from "react-icons/ai";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import api, { multipartRequest } from "../../api/axios.js";
import Select from "../../components/Select.jsx";
import { BsGrid, BsList } from "react-icons/bs";
import { useCredits } from "@/hooks/useCredits";
import { fetchProjects } from "../../features/projects/projectService.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MeasurementTable } from "../image_generator/MeasurementTable";
import SmartImage from "@/components/SmartImage";
import { SortDropdown } from "@/components/Common/SortingButton";
import GallerySelector from "@/components/GallerySelector";
import toast from "react-hot-toast";
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
function UserProjectEditForm({ projectId, onCancel, onSuccess, isSharedWithMe }) {
  const [images, setImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.UPLOADED);
  const [isSaving, setIsSaving] = useState(false); // ✅ Add this
  const [open, setOpen] = useState(false);
  const { fetchCredits } = useCredits();
  const [sizeChartIndex, setSizeChartIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    parent_id: null,
    size_charts: [],
    moodboard_ids: [],
  });
  
  const [viewMode, setViewMode] = useState("grid");
  const [projectOptions, setProjectOptions] = useState([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState([]);
  const [error, setError] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [moodboardOptions, setMoodboardOptions] = useState([]);
  const [currentSort, setCurrentSort] = useState("created-date-asc");
  const [gallerySelectorOpen, setGallerySelectorOpen] = useState(false);
  const [existingImages, setExistingImages] = useState(formData.existingImages || []);
  const { checkImage, isModelLoading, modelError, isReady } = useNSFWDetection();
  const [nsfwModalOpen, setNSFWModalOpen] = useState(false);
  const [nsfwFileName, setNSFWFileName] = useState("");
  const [isCheckingNSFW, setIsCheckingNSFW] = useState(false);
  useEffect(() => {
    const fetchProjectOptions = async () => {
      try {
        const response = await fetchProjects();

        // Filter out current project to prevent self-reference
        
        const filteredProjects = response
          .filter((project) => project.id !== projectId)
          .map((project) => ({
            id: project.id,
            label: project.name || project.title,
            moodboard_ids: project.moodboard_ids, // include moodboards
          }));
        setProjectOptions(filteredProjects);
        console.log(filteredProjects, "filteredProjects");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
      }
    };

    fetchProjectOptions();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`, {
        params: { 
          populate: true,
          ...(isSharedWithMe ? { isShared: true } : {}), 
        },
      });
      const project = response.data.data;

      // Format dates for input fields (YYYY-MM-DD format)
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      // Determine parent_id from either parent_id field or parent object
      let parentIdValue = null;
      if (project.parent_id) {
        parentIdValue =
          typeof project.parent_id === "object"
            ? {
                id: project.parent_id.id,
                label: project.parent_id.name,
              }
            : { id: project.parent_id, label: "Unknown" };
      } else if (project.parent) {
        parentIdValue =
          typeof project.parent === "object"
            ? {
                id: project.parent.id,
                label: project.parent.name,
              }
            : { id: project.parent, label: "Unknown" };
      }

      setFormData({
        _id: project.id,
        name: project.name || project.title || "",
        description: project.description || "",
        start_date: formatDateForInput(project.start_date),
        end_date: formatDateForInput(project.end_date),
        parent_id: parentIdValue,
        existingImages: project.images || [], // or mapped as needed
        size_charts: project.size_charts || [],
        moodboard_ids : project?.moodboards?.map((moodboard) => ({
          id: moodboard?._id,
          name: moodboard?.name
        }))
      });

      setImages(
        (project.images || []).map((img) => ({
          _id: img.id,
          url:
            img.status === "saved"
              ? `${BASE_API_URL}/genie-image/${img.url}`
              : img.url,
          description: img.description || "",
          isExisting: true,
        }))
      );
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch project");
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProject();
  }, [projectId]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (!img.isExisting && img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [images]);

    useEffect(() => {
    const fetchMoodboards = async () => {
      try {
        const response = await api.get("/moodboards");
        console.log(response, ',,,,,,,,,,,,,,,,,,,,,,,,,,,,');
        
        const moodboards = response.data.data.map((moodboard) => ({
            id : moodboard.id || moodboard._id,
            label: moodboard. name
        }));
        setMoodboardOptions(moodboards);
      } catch (err) {
        console.error("Failed to fetch moodboards:", err);
      }
    };

    fetchMoodboards();
  }, []);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
          let response;
        if (activeTab === "generated") {
          // special endpoint
          response = await api.get("/gallery/generated");
        } else {
          // generic endpoint with status param
          response = await api.get("/gallery", {params: { status: activeTab, sorting: currentSort }});
        }
        setGalleryImages(
          response.data.data.map((img) => ({
            id: img.id,
            // url: `${img.url}`,
            url:
              img.status === "saved"
                ? `${img.url}`
                : img.url,
            name: img.name,
            status: img.status || "uploaded", // Default status if none is set
          }))
        );
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch gallery images"
        );
        setLoading(false);
      }
    };

    // Only fetch when dialog is opened
    if (open) {
      fetchGalleryImages();
    }

    // Cleanup previews
    return () => {
      galleryImages.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [open]);

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
          isExisting: false,
        }));
        setImages((prev) => [...prev, ...newImages]);
        
        if (nsfw.length > 0) {
          toast.success(`${safe.length} safe image(s) added`);
        }
      }
    }
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
        isExisting: false,
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
    const image = images[index];

    if (image.isExisting && image._id) {
      setRemovedImageIds((prev) => [...prev, image._id]);
    } else {
      URL.revokeObjectURL(image.preview);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
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
            params: { sorting: currentSort }
          });
  
          let data = res.data.data || [];
  
          // 🔑 Normalize the shape based on active tab
          let normalized;
          if (activeTab === TABS.GENERATED) {
            console.log(data.flatMap((item)=> (item)), '111111111111111');
            
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

    // Basic fields 
    data.append("name", formData.name); 
    data.append("description", formData.description); 
    data.append("start_date", formData.start_date); 
    data.append("end_date", formData.end_date); 
    const parentId = formData.parent_id?.id || formData.parent_id || ""; 
    data.append("parent_id", parentId); 

    // Moodboards as JSON array 
    if (Array.isArray(formData.moodboard_ids)) { 
      data.append(
        "moodboard_ids", 
        JSON.stringify(formData.moodboard_ids.map((m) => m.id))
      ); 
    } 

    // Size charts as JSON array 
    if (formData.size_charts && formData.size_charts.length > 0) { 
      data.append(
        "size_charts", 
        JSON.stringify(formData.size_charts.map((sizeChart) => sizeChart.id))
      ); 
    } 

    // ✅ Existing images 
    if (existingImages?.length) { 
      data.append(
        "existing_images", 
        JSON.stringify(
          existingImages.map((img) => ({
            id: img.id, 
            ai_task_id: img.ai_task_id || null, 
            url: img.url || null, 
            description: img.description || "", 
          }))
        )
      ); 
    } 

    // ✅ Removed images 
    if (removedImageIds?.length) { 
      data.append("removed_image_ids", JSON.stringify(removedImageIds)); 
    } 

    // ✅ New file uploads (non-gallery) 
    const newFileUploads = images?.filter((img) => !img.isFromGallery && img.file) || []; 
    newFileUploads.forEach((img, index) => { 
      data.append("images", img.file); 
      if (img.description) { 
        data.append(`descriptions[${index}]`, img.description); 
      } 
    }); 

    // ✅ New gallery images (AI-generated or new selection) 
    const newGalleryPayload = selectedGalleryImages.map((img) => { 
      if (img.status === "generated") { 
        return { task_id: img.id, url: img.url }; 
      } 
      return {id: img.id, status: img.status}; 
    }); 
    data.append("new_gallery_image_ids", JSON.stringify(newGalleryPayload)); 

    // Ensure project ID exists 
    if (!formData._id) throw new Error("Project ID missing for update."); 

    // PUT request to update 
    const response = await multipartRequest.put(`/projects/${formData._id}`, data); 
    const updatedProject = response.data?.data; 

    // Update state 
    setFormData((prev) => ({ 
      ...prev, 
      existingImageIds: updatedProject.images.map((img) => img._id), 
    })); 

    setRemovedImageIds([]); 
    onSuccess(); 
    fetchCredits() 
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

  const sizeCharts = formData.size_charts || [];

  const handlePrev = () => {
    setSizeChartIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setSizeChartIndex((prev) => Math.min(prev + 1, sizeCharts.length - 1));
  };

  // if (sizeCharts.length === 0) return null;

  const currentChart = sizeCharts[sizeChartIndex];

  if (loading) {
    return <div className="text-center text-zinc-400">Loading...</div>;
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
            onClick={() => toggleGalleryImageSelection(image, index)}
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

  const GalleryContent = () => {
    if (loading) {
      return <div className="text-center text-zinc-400 py-8">Loading...</div>;
    }

    return (
      <div className="space-y-4 flex flex-col">
        {/* Tabs */}
        <TabSelector />

        <div className="flex justify-between items-center">
          <div className="flex items-center bg-zinc-800 rounded-full p-1">
            {/* <button
              className={`flex items-center px-3 py-1 rounded-full ${
                viewMode === "list"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setViewMode("list")}
            >
              <BsList size={16} className="mr-2" />
              List
            </button> */}
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

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* Display view */}
        <div className="h-[50dvh] grow overflow-auto">
          {viewMode === "grid" ? <GridView /> : <ListView />}
        </div>
      </div>
    );
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

  return (
    <div className={`space-y-6 ${dragOver ? "bg-zinc-900/50" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <NSFWWarningModal
        isOpen={nsfwModalOpen}
        onClose={() => setNSFWModalOpen(false)}
        fileName={nsfwFileName}
        detectedContent="NSFW content detected"
      />

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

      <div className="bg-white/10 p-4 lg:p-6 rounded-xl border border-solid border-white/35 mb-4">
        <h2 className="text-xl font-semibold mb-6">Edit Project Images</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 min-h-[120px] p-4 rounded-lg border-2 border-dashed transition-colors ${
            dragOver ? "border-pink-400 bg-zinc-800/50" : "border-zinc-400"
          }`}
        >
          {images.map((img, index) => (
            <div key={img._id || `new-${index}`} className="group relative aspect-square bg-zinc-400 rounded-lg overflow-hidden">
              <SmartImage src={img.preview || img.url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
              <button className="absolute top-2 right-2 bg-white/10 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => handleRemoveImage(index)}>
                <AiOutlineClose size={16} className="text-white" />
              </button>
              {/* <input
                type="text"
                placeholder="Description"
                value={img.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white text-sm p-1"
              /> */}
            </div>
          ))}
          {selectedGalleryImages.map((img, index) => (
            <div key={img._id} className="group relative aspect-square bg-white/10 rounded-lg overflow-hidden">
              <SmartImage src={img.url} alt={`Gallery Selected ${index + 1}`} className="w-full h-full object-cover" />
              <button className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setSelectedGalleryImages((prev) => prev.filter((i) => i.id !== img.id))}>
                <AiOutlineClose size={16} className="text-white" />
              </button>
            </div>
          ))}

          <label className="flex items-center justify-center !bg-black border-shadow-blur rounded-lg border-2 border-dashed border-white/35 cursor-pointer hover:!bg-zinc-900 transition-colors duration-150">
            <input type="file" accept="image/jpeg,image/png" multiple onChange={handleImageChange} className="hidden" disabled={isCheckingNSFW}/>
            <div className="flex flex-col items-center">
              <AiOutlinePlus size={24} className="text-pink-400 mb-2" />
              <span className="text-sm text-zinc-200 text-center">{isCheckingNSFW ? "Checking..." : "Upload Image"}</span>
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
          <p className="text-center text-zinc-500 mt-4">
            Drag and drop images here or click "Add Image" to upload
          </p>
        )}
      </div>

      {formData.size_charts?.length > 0 && (
  <div>
    <h3 className="text-sm text-zinc-300 mb-3">Size Chart</h3>

    {/* Render only current chart based on sizeChartIndex */}
    {(() => {
      const data = formData.size_charts[sizeChartIndex] || {};
      return (
        <div key={data.id} className="mb-4">
          <MeasurementTable
            measurements={data.measurements}
            tolerance={data?.tolerance || []}
            grading_rules={data?.grading_rules || []}
            size_conversion={data?.size_conversion || []}
            setMeasurement={() => fetchProject()}
            isEditable={true}
            sizeChartId={data.id}
            sizeChartImage={data.results?.[0]}
            showLinkProjectButton={false}
            isAIGenerated={["ai_generated", "ai_generated_edited"].includes(data.generation_source)}
            customButton={
              <Button
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    size_charts: prev.size_charts.filter(
                      (chart) => chart.id !== data.id
                    ),
                  }));
                  // Reset index if needed
                  if (sizeChartIndex > 0) setSizeChartIndex(sizeChartIndex - 1);
                }}
                variant="dg_btn"
                className="dg-btn max-w-fit p-4 py-1 h-9 rounded-lg bg-black/20 backdrop-blur-2xl border border-solid border-gray-300 hover:border-transparent text-base text-white font-medium cursor-pointer ml-auto"
              >
                Unlink Table
              </Button>
            }
            otherData={data}
          />

          {/* Pagination Controls */}
          {formData.size_charts.length > 1 && (
            <div className="flex justify-between mt-2">
              <Button
                onClick={() => setSizeChartIndex((prev) => Math.max(prev - 1, 0))}
                disabled={sizeChartIndex === 0}
                variant="dg_btn"
                className="w-fit bg-black/15 px-5"
              >
                Previous
              </Button>
              <span className="text-gray-400">
                {sizeChartIndex + 1} of {formData.size_charts.length}
              </span>
              <Button
                onClick={() =>
                  setSizeChartIndex((prev) =>
                    Math.min(prev + 1, formData.size_charts.length - 1)
                  )
                }
                disabled={sizeChartIndex >= formData.size_charts.length - 1}
                variant="dg_btn"
                className="w-fit bg-black/15 px-5"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      );
    })()}
  </div>
)}


      <div className="bg-white/10 p-4 lg:p-6 rounded-xl border border-solid border-white/35 mb-4">
        <div className="max-w-xl space-y-4">
          <h2 className="text-xl font-semibold mb-4">Project Details</h2>
          <InputField
            label="Title"
            name="name"
            placeholder="Enter project name"
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
  value={moodboardOptions?.filter(option =>
    formData?.moodboard_ids?.some(mb => mb._id || mb.id === option.id)
  )}
  onChange={(selectedOptions) =>
    setFormData((prev) => ({
      ...prev,
      moodboard_ids: selectedOptions || [], // keep full objects for display
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
        <Button variant="primary" onClick={handleSubmit} fullWidth={false}>
          Save Changes
        </Button>
        <Button variant="secondary" onClick={onCancel} fullWidth={false}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default UserProjectEditForm;
