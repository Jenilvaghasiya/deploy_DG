import { useState, useEffect, useRef } from "react";
import {
  BsGrid,
  BsList,
  BsPlusCircle,
  BsTrash,
  BsDownload,
  BsBoxArrowUpRight,
  BsArrowRepeat,
  BsCheck,
  BsBookmark,
  BsPencil,
  BsLink,
  BsMagic,
  BsHandThumbsUp,
	BsHandThumbsDown,
  BsImages,
  BsTable
} from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { CgListTree } from "react-icons/cg";
import { MdHd } from "react-icons/md";
import { IoMdShare } from "react-icons/io";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiRename } from "react-icons/bi";
import Button from "../../components/Button";
import api, { multipartRequest } from "../../api/axios.js";
import ImageEditor from "../image_editor/ImageEditor.jsx";
import GeneratedTab from "./GeneratedTab.jsx";
import { useAuthStore } from "../../store/authStore.js";
import { hasPermission } from "../../lib/utils.js";
import Loader from "../../components/Common/Loader.jsx";
import LinkToProjectModal from "../../components/LinkToProjectModal";
import { createPortal } from "react-dom";
import ImageZoomDialog from "@/components/ImageZoomDialog";
import ServiceSelectionModal from "@/components/ServiceSelectionModal";
import SmartImage from "@/components/SmartImage";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import MeasurementTableDialog from "@/components/SizeChart/MeasurementTableDialog";
import { useCredits } from "@/hooks/useCredits";
import { Tabs } from "@radix-ui/react-tabs";
import RenameImageModal from "@/components/RenameImage";
import SelectImagesModal from "@/components/SelectImagesModal";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { SortDropdown } from "@/components/Common/SortingButton";
import { CiZoomIn } from "react-icons/ci";
import ImagePreviewDialog from "../moodboards/ImagePreviewDialog";
import ImageDropdownMenu from "@/components/ImageDropdownMenu";
import GalleryTreeManager from "../../components/TreeView";
import MultipleMeasurementTableDialog from "@/components/SizeChart/MultipleMeasurementTableDialog";
import ApiTour from "@/components/Tour/ApiTour";
import ShareModal from "@/components/Common/ShareModal";
import { filter } from "jszip";
import { useNavigate } from "react-router-dom";
import { useNavigateWithGalleryImage } from "@/hooks/useNavigateWithGalleryImage";
import { FaTable } from "react-icons/fa";
import { useNSFWDetection } from "@/service/useNSFWFilter";
import { Loader2 } from "lucide-react";
import NSFWWarningModal from "@/components/NSFWWarningModal";
// import { galleryTourSteps } from "@/components/Tour/TourSteps";
const BASE_API_URL = import.meta.env.VITE_API_URL;

const BASE_URL = import.meta.env.VITE_SERVER_URL;
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const galleryTourSteps = [
  {
    target: 'body',
    content: 'Welcome to your Gallery! Let me show you around.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.gallery-tabs', // Tab container
    content: 'Use these tabs to filter images by status.',
    // placement: 'bottom',
  },
  {
    target: '.list-grid-view', // View mode toggle
    content: 'Switch between List and Grid view here.',
    placement: 'bottom',
  },
  {
    target: '.upload-image', // Add button
    content: 'Click here to upload new images.',
    placement: 'right',
  },
  {
    target: '.image-actions', // First image
    content: 'Hover over images to see available actions.',
    placement: 'top',
  },
];


// Tab options
const TABS = {
  FINALIZED: "finalized",
  SAVED: "saved",
  GENERATED: "generated",
  UPLOADED: "uploaded",
};

export default function GalleryPage({isSharedWithMe=false, isSharedWithOthers = false}) {
  const { user } = useAuthStore();
  const navigateWithImage = useNavigateWithGalleryImage();
  const [viewMode, setViewMode] = useState("grid");
  const [activeTab, setActiveTab] = useState(TABS.UPLOADED);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChooseAsset, setShowChooseAsset] = useState({ open: false, imageId: null });
  const { fetchCredits } = useCredits();
    const [renameModal, setRenameModal] = useState({
  isOpen: false,
  currentName: '',
    imageId: null,
});
  const [contextMenu, setContextMenu] = useState(() => ({
    visible: false,
    x: 0,
    y: 0,
    imageId: null,
  }));
  const [measurementDialogState, setMeasurementDialogState] = useState({
    open: false,
    measurementTableData: [],
    sizeChartId: null,
    generation_source:null
  });
  const [multipleMeasurementDialogState, setMultipleMeasurementDialogState] = useState({
    open: false,
    sizeCharts: []
  });
const [modalOpen, setModalOpen] = useState(false);
const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
    const [isChecking, setIsChecking] = useState(false);
  const [nsfwWarning, setNsfwWarning] = useState({ isOpen: false, content: null, fileName: '' });
  const replaceInputRef = useRef(null);
  const [replaceImageId, setReplaceImageId] = useState(null);
  const [editorImage, setEditorImage] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState({
    open: false,
    currentProjectId: null,
  });
  const [linkImageId, setLinkImageId] = useState(null);
  const [previewInputState, setPreviewInputState] = useState({
		open: false,
		galleryImageIds: [],
	});

  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const hasCreateGalleryPermission = hasPermission(
    permissionKeys,
    "workspace:my-gallery:create"
  );
  const hasEditGalleryPermission = hasPermission(
    permissionKeys,
    "workspace:my-gallery:update"
  );
  const hasDeleteGalleryPermission = hasPermission(
    permissionKeys,
    "workspace:my-gallery:delete"
  );
  const hasFinaliseGalleryPermission = hasPermission(
    permissionKeys,
    "workspace:my-gallery:finalise"
  );

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceImage, setServiceImage] = useState(null);
  const [currentSort, setCurrentSort] = useState("created-date-asc")
  const fetchGalleryImages = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await api.get('/gallery', 
        {params: 
          { 
            status: activeTab, 
            sorting: currentSort,
            ...(isSharedWithMe ? { isSharedWithMe: true } : {}),
						...(isSharedWithOthers ? {isSharedWithOthers: true} : {})
          }
        }
      );
      const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
      setGalleryImages(
        response.data.data.map((img) => ({
          id: img.id,
          // url: img.url.startsWith("http") ? img.url : `https://terequa.com/${img.url}`,
          url:
            img.status === "saved"
              ? `${BASE_API_URL}/genie-image/${img.url}`
              : img.url.startsWith("http")
              ? img.url
              : `${VITE_BASE_URL}/${img.url}`,
          name: img.name,
          status: img.status || "uploaded", // Default status if none is set
          project: img.project_id,
          created_at: img.created_at,
          feedback:img.feedback,
          gallery_image_ids: img?.gallery_image_ids,
          sizeChart:img?.sizeChart || null,
          sharingPermissons: img?.permissions
        }))
      );
      
      if (showLoader) {
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch gallery images");
      if (showLoader) {
        setLoading(false);
      }
    }
  };
  const { checkImage, isModelLoading, isReady } = useNSFWDetection();
  const handleServiceSelect = (type) => {
    // Close the modal first
    setModalOpen(false);

    // Navigate after modal is closed (next tick)
    if (type === "tech-packs") {
      navigate("/tech-packs", { state: { defaultTab: "generate" } });
    } else if(type === "pattern-cutout") {
      navigate("/pattern-cutout", { state: { defaultTab: "generate" } });
    }else {
      navigate(`/${type}`);
    }
  }
const handleRenameSuccess = (updatedImage) => {
    setGalleryImages((prevImages) =>
      prevImages.map((img) =>
        img.id === updatedImage.id ? updatedImage : img
      )
    );
  };
  // Fetch gallery images
  useEffect(() => {
    fetchGalleryImages();

    // Cleanup previews
    return () => {
      galleryImages.forEach((img) => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  useEffect(() => {
    fetchGalleryImages();
  }, [activeTab,currentSort]);


  // Close context menu on click outside
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
      await uploadFiles(files);
    }
  };

  // define your handler function
const handleEditImage = async (image) => {
  try {    
    const fileName = image.name;
    const res = await fetch(image.url);
    const blob = await res.blob();

    const file = new File([blob], fileName, { type: blob.type });

    if (image.status === "saved" || image.status === "generated") {
      try {
        const res = await api.get(
          `/gallery/deduct-credit?imgID=${image.id}&status=${image.status}&url=${image.url}`
        );
        const data = res.data?.data;

        if (res.data?.status === "success") {
          // handleSetImage(image, data.images.url);
          fetchCredits();
          setEditorImage(file);
          setIsEditorOpen(true);
        } else {
          alert(data?.message || "Credit deduction failed");
        }
      } catch (err) {
        console.error("Error deducting credits:", err);
        alert("Something went wrong, please try again.");
      }
    } else {
      // If not saved/generated, open editor directly
      setEditorImage(file);
      setIsEditorOpen(true);
    }
  } catch (err) {
    console.error("Error while editing image:", err);
  }
};

const handleSetSelectedImageForLinking = (image) => {
  setLinkImageId(image.id);
  setShowLinkModal({
    open: true,
    currentProjectId: image.project || null, // fallback in case it's undefined
  });
};

const handleRename = (image) => {
  setRenameModal({
    isOpen: true,
    currentName: image.name,
    imageId: image.id, // or image._id depending on your backend
  });
};

  // Common upload function for both file input and drag & drop
  const uploadFiles = async (files) => {
    const newImages = files.map((file) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      name: file.name,
      file,
      preview: true,
      status: "uploaded", // Set default status for new images
    }));

    setGalleryImages((prev) => [...newImages, ...prev]);

    try {
      const data = new FormData();
      files.forEach((file) => {
        data.append("images", file);
      });

      const response = await multipartRequest.post("/gallery", data);
      const uploadedImages = response.data.data.map((img) => ({
        id: img.id,
        url: `${img.url}`,
        name: img.name,
        status: "uploaded",
      }));

      // setGalleryImages((prev) =>
      //   prev.filter((img) => !img.preview).concat(uploadedImages)
      // );
      fetchGalleryImages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload images");
      setGalleryImages((prev) => prev.filter((img) => !img.preview));
    }
  };
const handleUploadSafeFiles = async (safeFiles) => {
  // Use your existing uploadFiles function for safe files
  await uploadFiles(safeFiles);
};
  // Handle file selection and upload (new images)
const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    
    if (!files.length) return;

    // Check if model is ready
    if (!isReady) {
      alert('NSFW detection is still loading. Please wait a moment and try again.');
      return;
    }

    setIsChecking(true);
    const safeFiles = [];
    let blockedCount = 0;

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`File too large: ${file.name}`);
          continue;
        }

        // Check for NSFW content
        try {
          const result = await checkImage(file);
          
          if (result.isNSFW) {
            blockedCount++;
            // Show warning for the first blocked image
            if (blockedCount === 1) {
              setNsfwWarning({
                isOpen: true,
                content: result,
                fileName: file.name
              });
            }
            console.warn(`Blocked NSFW content: ${file.name} - ${result.reason}`);
          } else {
            safeFiles.push(file);
          }
        } catch (error) {
          console.error(`Error checking file ${file.name}:`, error);
          // Optionally block files that fail to check
          blockedCount++;
        }
      }

      // Process safe files
      if (safeFiles.length > 0) {
        await handleUploadSafeFiles(safeFiles);
      }

      // Show summary if multiple files were blocked
      if (blockedCount > 1) {
        setTimeout(() => {
          alert(`${blockedCount} images were blocked due to inappropriate content.`);
        }, 100);
      }

    } catch (error) {
      console.error('Error processing files:', error);
      alert('An error occurred while processing your images. Please try again.');
    } finally {
      setIsChecking(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  // Handle image replacement
  const handleReplace = async (e) => {
    if (e.target.files && e.target.files[0] && replaceImageId) {
      const file = e.target.files[0];
      const previewImage = {
        id: replaceImageId,
        url: URL.createObjectURL(file),
        name: file.name,
        file,
        preview: true,
        status:
          galleryImages.find((img) => img.id === replaceImageId)?.status ||
          "uploaded",
      };

      // Update UI with preview
      setGalleryImages((prev) =>
        prev.map((img) => (img.id === replaceImageId ? previewImage : img))
      );

      try {
        const data = new FormData();
        data.append("image", file);

        const response = await multipartRequest.put(
          `/gallery/${replaceImageId}`,
          data
        );
        const updatedImage = {
          id: response.data.data.id,
          url: `${response.data.data.url}`,
          name: response.data.data.name,
          status: response.data.data.status || "uploaded",
        };

        setGalleryImages((prev) =>
          prev.map((img) => (img.id === replaceImageId ? updatedImage : img))
        );
        replaceInputRef.current.value = null;
        setReplaceImageId(null);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to replace image");
        setGalleryImages((prev) => prev.filter((img) => !img.preview));
      }
    }
  };

  // Trigger replace input
  const triggerReplace = (imageId) => {
    setReplaceImageId(imageId);
    replaceInputRef.current.click();
  };

  // Handle image deletion
  const handleDelete = async (imageId) => {
    try {
      await api.delete(`/gallery/${imageId}`);
      setIsProcessing(true);
      // setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
      await fetchGalleryImages(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete image");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle individual image download
  const handleDownloadImage = async (image) => {
    try {
      // If image is hosted externally on terequa.com
      if (
        image.url.startsWith(`${VITE_BASE_URL}/`) ||
        image.status === "saved"
      ) {
        const response = await fetch(image.url, { mode: "cors" });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", image.name);
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
      } else {
        const response = await api.get(`/gallery/${image.id}/download`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", image.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download image");
    }
  };

  // Handle download all
  const handleDownloadAll = async ({imgID}) => {
    console.log(activeTab,'active')
    setIsDownloading(true);
    try {
      const urlQuery = imgID
        ? `/gallery/download?status=${activeTab}&imgID=${imgID}`
        : `/gallery/download?status=${activeTab}`;
      const response = await api.get(urlQuery, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `gallery-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      fetchCredits();
    } catch (err) {      
      if (err.response?.status === 403) {
        toast.error("Not enough credits to download gallery");
      } else {
        toast.error(err.response?.data?.message || "Failed to download gallery");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSelected = async (selectedIds = []) => {
    setIsDownloading(true);
    try {
      const imgQuery = selectedIds.length ? `&imgID=${selectedIds.join(",")}` : "";
      const urlQuery = `/gallery/download?status=${activeTab}${imgQuery}`;
      const response = await api.get(urlQuery, { responseType: "blob" });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `gallery-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      fetchCredits();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Not enough credits to download gallery");
      } else {
        toast.error(err.response?.data?.message || "Failed to download gallery");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Trigger file input (new images)
   const handleAddClick = () => {
    // Create a hidden file input and trigger it
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.style.display = 'none';
      input.onchange = handleFileSelect;
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  };
const handleOpenSizeChart = (image) => {
  if (!image?.sizeChart) {
    console.warn("No size chart found for this image");
    return;
  }
  setMultipleMeasurementDialogState({
    open: true,
    sizeCharts: image.sizeChart
  });

  // setMeasurementDialogState({
  //   open: true,
  //   measurementTableData: image.sizeChart.measurements,
  //   sizeChartId: image.sizeChart.id,
  //   generation_source: image.sizeChart.generation_source,
  //   isEditable: false
  // });
};


  // Handle context menu
  // const handleContextMenu = (e, imageId) => {
  //   e.preventDefault();
  //   setContextMenu({
  //     visible: true,
  //     x: e.clientX,
  //     y: e.clientY,
  //     imageId,
  //   });
  // };

  const handleContextMenu = (e, imageId) => {
    e.preventDefault();

    // Get the actual mouse position relative to the document
    const mouseX = e.pageX;
    const mouseY = e.pageY;

    setContextMenu({
      visible: true,
      x: mouseX,
      y: mouseY,
      imageId: imageId,
    });
  };

  // Handle status change
  const handleStatusChange = async (imageId, newStatus) => {
    try {
      console.log(imageId);
      setIsProcessing(true);

      // API call to update status
      await api.patch(`/gallery/${imageId}/status`, {
        status: newStatus,
      });

      // Update local state
      fetchCredits();
      await fetchGalleryImages(false);

      setContextMenu({ ...contextMenu, visible: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update image status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFeedback = async (imageId, feedback) => {
    try {
      console.log(imageId);
      setIsProcessing(true);

      // API call to update status
      await api.patch(`/gallery/${imageId}/status`, {
        feedback,
      });

      // Update local state
      await fetchGalleryImages(false);

      setContextMenu({ ...contextMenu, visible: false });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update image status");
    } finally {
      setIsProcessing(false);
    }
  };

  // const handleGeneratedImgStatusChange = async (imageId, newStatus) => {
  //   try {
  //     console.log(imageId);

  //     // API call to update status
  //     await api.patch(`/gallery/setGeneratedImage/${imageId}`, {
  //       status: newStatus,
  //     });

  //     // Update local state
  //     setGalleryImages((prev) =>
  //       prev.map((img) =>
  //         img.id === imageId ? { ...img, status: newStatus } : img
  //       )
  //     );

  //     setContextMenu({ ...contextMenu, visible: false });
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || "Failed to update image status");
  //   }
  // };

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
console.log(filteredImages, 'filteredImagesfilteredImages');

   const handleSortChange = (sortOption) => {
    setCurrentSort(sortOption)   
  }

  // Tab Component
  const TabSelector = () => (
    <div className="">
      <div className="flex flex-wrap border-b border-zinc-700 mb-4 gallery-tabs">
        <button
          className={`px-4 py-2 text-sm font-medium cursor-pointer upload-tab ${
            activeTab === TABS.UPLOADED
              ? "border-b-2 border-pink-500 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.UPLOADED)}
        >
          Uploaded Images
        </button>
        {!isSharedWithMe &&
        <button
          className={`px-4 py-2 text-sm font-medium cursor-pointer generated-tab ${
            activeTab === TABS.GENERATED && !isSharedWithMe && (
              <GeneratedTab
                hasCreateGalleryPermission={hasCreateGalleryPermission}
                hasDeleteGalleryPermission={hasDeleteGalleryPermission}
                hasEditGalleryPermission={hasEditGalleryPermission}
                hasFinaliseGalleryPermission={hasFinaliseGalleryPermission}
              />
            )
              ? "border-b-2 border-pink-500 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.GENERATED)}
        >
          Generated
        </button>
        }
        <button
          className={`px-4 py-2 text-sm font-medium cursor-pointer saved-for-later-tab ${
            activeTab === TABS.SAVED
              ? "border-b-2 border-pink-500 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.SAVED)}>Saved for Later</button>
        <button
          className={`px-4 py-2 text-sm font-medium cursor-pointer finalized-tab ${
            activeTab === TABS.FINALIZED
              ? "border-b-2 border-pink-500 text-pink-400"
              : "text-white hover:text-pink-400"
          }`}
          onClick={() => setActiveTab(TABS.FINALIZED)}
        >
          Finalized
        </button>
      </div>
      <div className="tab-content mt-4">
        {activeTab === TABS.GENERATED && !isSharedWithMe && (
          <GeneratedTab
            hasCreateGalleryPermission={hasCreateGalleryPermission}
            hasDeleteGalleryPermission={hasDeleteGalleryPermission}
            hasEditGalleryPermission={hasEditGalleryPermission}
            hasFinaliseGalleryPermission={hasFinaliseGalleryPermission}
          />
        )}
      </div>
    </div>
  );

  // Context Menu Component
  const ContextMenuComponent = () => {
    if (!contextMenu.visible) return null;

    return createPortal(
      <div
        className="bg-zinc-800 shadow-lg rounded p-2 min-w-48 text-white"
        style={{
          position: "fixed",
          left: contextMenu.x,
          top: contextMenu.y,
          zIndex: 1000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasFinaliseGalleryPermission && (
          <button
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
            onClick={() => handleStatusChange(contextMenu.imageId, "finalized")}
          >
            <BsCheck size={16} className="text-green-500" />
            Mark as Finalized
          </button>
        )}
        {hasEditGalleryPermission && (
          <button
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
            onClick={() => handleStatusChange(contextMenu.imageId, "saved")}
          >
            <BsBookmark size={16} className="text-blue-500" />
            Save for Later
          </button>
        )}
        {hasEditGalleryPermission && (
          <button
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
            onClick={() => handleStatusChange(contextMenu.imageId, "uploaded")}
          >
            <BsArrowRepeat size={16} className="text-yellow-500" />
            Move to Uploaded
          </button>
        )}
         <button
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
            onClick={() => navigateWithImage(`tech-packs?tab=generate`,contextMenu.imageId )}
          >
            <FaTable  size={16} className="text-yellow-500" />
            Use in TechPacks
          </button>
        {hasEditGalleryPermission && (
          <button
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
            onClick={() => {
              setLinkImageId(contextMenu.imageId);
              setShowLinkModal(true);
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            <BsLink size={16} className="text-purple-400" />
            Link to Project
          </button>
        )}
        <div className="border-t border-zinc-700 my-1"></div>
        {hasDeleteGalleryPermission && !isSharedWithMe && (
        <ConfirmDeleteDialog
          onDelete={() => {
            handleDelete(contextMenu.imageId);
            setContextMenu({ ...contextMenu, visible: false });
          }}
          title="Delete Image"
          message="Are you sure you want to delete this image? This action cannot be undone."
        >
          <button
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded text-red-500"
          >
            <BsTrash size={16} />
            Delete Image
          </button>
        </ConfirmDeleteDialog>
      )}

      </div>,
      document.body
    );
  };
  // Grid View Component
  const GridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-3">
      {/* Add New Card - only show in Uploaded tab */}
      {activeTab === TABS.UPLOADED && hasCreateGalleryPermission && !isSharedWithMe && !isSharedWithOthers && (
        <div
          onClick={!isChecking ? handleAddClick : undefined}
          className={`upload-image flex upload-image-btn items-center justify-center border-shadow-blur rounded-xl aspect-square cursor-pointer transition-colors border border-dashed border-white hover:bg-zinc-800 ${
            isChecking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-12 h-12 flex items-center justify-center">
            {isChecking ? (
              <Loader2 size={24} className="text-white animate-spin" />
            ) : (
              <BsPlusCircle size={24} className="text-white" />
            )}
          </div>
          {isModelLoading && (
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <span className="text-xs text-gray-500">Loading safety check...</span>
            </div>
          )}
        </div>
      )}

      {/* Gallery Items */}
      {filteredImages.map((image) => (
        
        <div
          key={image.id}
          className="relative aspect-square border-shadow-blur rounded-xl overflow-hidden group image-actions"
          onContextMenu={(e) => handleContextMenu(e, image.id)}
        >
          {(isSharedWithMe || isSharedWithOthers) && image?.sharingPermissons?.edit !== true ? (
            <ImagePreviewDialog imageUrl={image.url} imageData={image}>
              {/* DialogTrigger asChild will clone this native element and attach handlers */}
              <button
                type="button"
                className="p-0 m-0 w-full h-full block"
                title="Open image preview"
              >
                <SmartImage
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover cursor-pointer"
                />
              </button>
            </ImagePreviewDialog>
          ) : (
            <SmartImage
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />
          )}
          {/* Bottom White Strip */}
          <div className="absolute bottom-0 left-0 w-ful border border-solid shadow-sm text-black !bg-white/55 border-white/35 max-w-full w-full rounded-b-xl backdrop-blur-md text-xs px-2 py-1">
            <div className="truncate">{image.name}</div>
            <div>{new Date(image.created_at).toLocaleDateString()}</div>

            {image.project?.name && <div> Linked to: {image.project.name}</div>}
          </div>

          {/* Status Badge */}
          {/*  */}
          {image.status === "saved" && (
            <div className="absolute top-2 left-2 z-[2] bg-blue-500 text-white text-xs px-1.5 xl:px-2 py-0.5 xl:py-1 rounded-full">
              <BsBookmark size={14} className="inline-block mr-1" />
              Saved
            </div>
          )}
          {/* Compact Hover Overlay */}
          {((!isSharedWithMe || image?.sharingPermissons?.edit === true)) &&
          <div className=" hidden sm:flex absolute inset-0 bg-black/35 backdrop-blur-sm flex-col justify-center items-center gap-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
            {/* Primary Actions Row */}
            <div
              className="flex gap-1 max-w-[85%] mx-auto w-full 
            flex-wrap items-center justify-center"
            >
              {activeTab !== TABS.UPLOADED &&
                activeTab !== TABS.SAVED &&
                activeTab !== TABS.FINALIZED &&
                hasEditGalleryPermission && (
                  <button
                    onClick={() => handleStatusChange(image.id, "saved")}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded"
                    title="Save for later"
                  >
                    <BsBookmark size={14} />
                  </button>
                )}
              {activeTab !== TABS.UPLOADED &&
                activeTab !== TABS.FINALIZED &&
                hasFinaliseGalleryPermission && (
                  <button
                    onClick={() => handleStatusChange(image.id, "finalized")}
                    className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded"
                    title="Mark as finalized"
                  >
                    <BsCheck size={14} />
                  </button>
                )}
              {activeTab !== TABS.UPLOADED && !isSharedWithMe && (
                <button
                  onClick={() => handleDownloadAll({ imgID: image.id })}
                  className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                  title="Download"
                >
                  <BsDownload size={14} />
                </button>
              )}
              {/* {activeTab !== TABS.UPLOADED && (

              <button
                onClick={() =>
                  handleFeedback(
                    image.id,
                    image?.feedback === "liked" ? "none" : "liked"
                  )
                }
                className={`p-1.5 rounded ${
                  image?.feedback === "liked"
                    ? "bg-pink-600 text-white"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}

                title="Like"
              >
                <BsHandThumbsUp size={14} />
              </button>
                            )} */}
              {/* {activeTab !== TABS.UPLOADED && (

              <button
                onClick={() =>
                  handleFeedback(
                    image.id,
                    image?.feedback === "disliked" ? "none" : "disliked"
                  )
                }
                className={`p-1.5 rounded ${
                  image?.feedback === "disliked"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
                title="Dislike"
              >
                <BsHandThumbsDown size={14} />
              </button>
              )} */}
              {/* <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Open"
              >
                <BsBoxArrowUpRight size={14} />
              </a> */}
              {/* Like/Dislike Buttons */}
              <ImagePreviewDialog imageUrl={image.url} imageData={image}>
                <button
                  className="bg-black text-white p-1.5 hover:bg-zinc-600 rounded cursor-pointer"
                  title="Open Large View"
                >
                  <CiZoomIn size={14} />
                </button>
              </ImagePreviewDialog>

              {/* {!isSharedWithMe && hasEditGalleryPermission && (
                <button
                  onClick={() => handleEditImage(image)}
                  className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                  title="Edit"
                >
                  <BsPencil size={14} />
                </button>
              )} */}
              <button
                onClick={() => handleSetSelectedImageForLinking(image)}
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Link to Project"
              >
                <BsLink size={14} />
              </button>

              <button
                onClick={() => {
                  setServiceImage(image);
                  setShowServiceModal(true);
                }}
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Use in Service"
              >
                <BsMagic size={14} />
              </button>
              <button
                onClick={() => handleRename(image)}
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Rename Image Name"
              >
                <BiRename size={14} />
              </button>
              <ImagePreviewDialog imageUrl={image.url} imageData={image} enableHD={true}>
                <button
                  className="bg-black text-white p-1 sm:p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                  title="Scale to HD"
                >
                <MdHd size={14} />
              </button>
              </ImagePreviewDialog>
              {!isSharedWithMe && 
              <ShareModal resourceType={'GalleryImage'} resourceId={image.id}>
              <button
                  className="bg-black text-white p-1 sm:p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                  title="Scale to HD"
                >
                <IoMdShare size={14} />
              </button>
              </ShareModal>
              }
              {/* <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Open"
              >
                <BsBoxArrowUpRight size={14} />
              </a> */}
              {/* <button
                onClick={() => triggerReplace(image.id)}
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Replace"
              >
                <BsArrowRepeat size={14} />
              </button> */}
              {/* {hasEditGalleryPermission && (
                <button
                  onClick={() => {
                    const fileName = image.name;
                    fetch(image.url)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const file = new File([blob], fileName, {
                          type: blob.type,
                        });
                        setEditorImage(file);
                        setIsEditorOpen(true);
                      });
                  }}
                  className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                  title="Edit"
                >
                  <BsPencil size={14} />
                </button>
              )} */}
              {image?.sizeChart && image?.sizeChart?.length > 0 && (
                <button
                  onClick={() => handleOpenSizeChart(image)}
                  className="p-1.5 rounded cursor-pointer  hover:bg-zinc-600 bg-black"
                  title="Size Chart"
                >
                  <BsTable size={14} />
                </button>
              )}
              {activeTab !== TABS.UPLOADED && (
                <button
                  disabled={!image?.gallery_image_ids?.length > 0}
                  onClick={() => {
                    console.log("preview....", image);
                    setPreviewInputState({
                      open: true,
                      galleryImageIds:
                        image?.gallery_image_ids?.length > 0
                          ? image?.gallery_image_ids
                          : [],
                    });
                  }}
                  className={`p-1.5 rounded bg-black ${
                    image?.gallery_image_ids?.length > 0
                      ? "cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                  title="View Input Image(s)"
                >
                  <BsImages size={14} />
                </button>
              )}
              {activeTab !== TABS.UPLOADED && (
                 <button
          className="p-1.5 rounded cursor-pointer bg-black"
          onClick={() => setShowChooseAsset({ open: true, imageId: image.id })}
        >
          <CgListTree size={14} />
        </button>
              )}
              {hasDeleteGalleryPermission && !isSharedWithMe && (
                <ConfirmDeleteDialog
                  onDelete={() => handleDelete(image.id)}
                  title="Delete Image"
                  message="Are you sure you want to delete this image? This action cannot be undone."
                >
                  <button
                    className="max-md:right-9 absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Delete image"
                  >
                    <BsTrash size={16} className="text-white" />
                  </button>
                </ConfirmDeleteDialog>
              )}
            </div>
          </div>
          }
          {((!isSharedWithMe || image?.sharingPermissons?.edit === true)) &&
          <div className="absolute top-2 right-2 md:hidden">
            <ImageDropdownMenu
              activeTab={activeTab}
              image={image}
              hasEditGalleryPermission={hasEditGalleryPermission}
              hasFinaliseGalleryPermission={hasFinaliseGalleryPermission}
              handleDownloadImage={handleDownloadImage}
              handleEditImage={handleEditImage}
              handleStatusChange={handleStatusChange}
              // handleLikeDislike={handleLikeDislike}
              setPreviewInputState={setPreviewInputState}
              setSelectedImageForLinking={handleSetSelectedImageForLinking}
              setServiceImage={setServiceImage}
              setShowServiceModal={setShowServiceModal}
              setShowRenameModal={handleRename}
              handleOpenSizeChart={handleOpenSizeChart}
              setShowChooseAsset={setShowChooseAsset}
            />
          </div>
          }
        </div>
      ))}
    </div>
  );

  // List View Component
  const ListView = () => (
    <div className="space-y-3 md:p-4">
      {/* Add New Button - only show in Uploaded tab */}
      {activeTab === TABS.UPLOADED && hasCreateGalleryPermission && !isSharedWithMe && !isSharedWithOthers && (
        <div
          onClick={handleAddClick}
          className="flex items-center justify-center bg-zinc-900 rounded-lg lg:h-14 cursor-pointer hover:bg-zinc-800 transition-colors border border-dashed border-zinc-700"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-10 h-10 flex items-center justify-center">
            <BsPlusCircle size={20} className="text-white" />
          </div>
        </div>
      )}

      {/* Gallery Items */}
      {filteredImages.map((image) => (
        <div
          key={image.id}
          className="flex bg-zinc-900 rounded-lg border border-solid border-white/10 overflow-hidden"
          onContextMenu={(e) => handleContextMenu(e, image.id)}
        >
          <div className="w-20 md:w-32 min-h-full shrink-0 bg-zinc-800 overflow-hidden relative">
            <SmartImage
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
            />
            {/* Status Badge */}
            {image.status === "finalized" && (
              <div className="absolute top-1 cursor-pointer left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
                <BsCheck className="size-2.5 inline-block mr-0.5" />
                Finalized
              </div>
            )}
            {image.status === "saved" && (
              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                <BsBookmark size={10} className="inline-block mr-0.5" />
                Saved
              </div>
            )}
          </div>
          <div className="flex-grow p-2 flex flex-wrap gap-2 justify-end w-24 sm:w-28 md:grow md:w-1/3 items-start">
            <div className="text-sm text-white w-10 grow">
              <h3 className="font-medium text-sm whitespace-nowrap overflow-hidden max-w-full text-ellipsis">
                {image.name}
              </h3>
              <div className="text-xs text-zinc-500">
                {new Date(image.created_at).toLocaleDateString()}
              </div>
              {image.project?.name && (
                <div className="text-xs text-zinc-400">
                  Linked to: {image.project.name}
                </div>
              )}
            </div>
          {((!isSharedWithMe || image?.sharingPermissons?.edit === true)) &&
            <div className="flex flex-wrap gap-2 justify-end w-24 sm:w-28 md:grow md:w-1/3">
              {activeTab !== TABS.UPLOADED &&
                hasFinaliseGalleryPermission &&
                activeTab !== TABS.FINALIZED && (
                  <button
                    onClick={() => handleStatusChange(image.id, "finalized")}
                    className="text-white cursor-pointer hover:text-green-500 bg-zinc-700 p-1 sm:p-1.5 rounded hover:bg-zinc-600"
                    title="Mark as finalized"
                  >
                    <BsCheck className="size-3 sm:size-4" />
                  </button>
                )}
              {activeTab !== TABS.UPLOADED &&
                activeTab !== TABS.FINALIZED &&
                hasEditGalleryPermission &&
                activeTab !== TABS.SAVED && (
                  <button
                    onClick={() => handleStatusChange(image.id, "saved")}
                    className="text-white hover:text-blue-500 cursor-pointer"
                    title="Save for later"
                  >
                    <BsBookmark className="size-3 sm:size-4" />
                  </button>
                )}
              {activeTab !== TABS.UPLOADED && (
                <button
                  onClick={() => handleDownloadAll({ imgID: image.id })}
                  className="text-white hover:text-blue-500 bg-zinc-700 p-1 sm:p-1.5 rounded hover:bg-zinc-600"
                  title="Download image"
                >
                  <BsDownload className="size-3 sm:size-4 cursor-pointer" />
                </button>
              )}
              {/* {activeTab !== TABS.UPLOADED && (

              <button
                onClick={() =>
                  handleFeedback(
                    image.id,
                    image?.feedback === "liked" ? "none" : "liked"
                  )
                }
                className={`p-1.5 rounded ${
                  image?.feedback === "liked"
                    ? "bg-pink-600 text-white"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}

                title="Like"
              >
                <BsHandThumbsUp size={14} />
              </button>
              )}
              {activeTab !== TABS.UPLOADED && (

              <button
                onClick={() =>
                  handleFeedback(
                    image.id,
                    image?.feedback === "disliked" ? "none" : "disliked"
                  )
                }
                className={`p-1.5 rounded ${
                  image?.feedback === "disliked"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
                title="Dislike"
              >
                <BsHandThumbsDown size={14} />
              </button>
              )} */}
              <ImagePreviewDialog imageUrl={image.url} imageData={image}>
                <button
                  className="bg-black text-white p-1 sm:p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                  title="Open Large View"
                >
                  <CiZoomIn className="size-3 sm:size-4" />
                </button>
              </ImagePreviewDialog>
              {/* {!isSharedWithMe && hasEditGalleryPermission && (
                <button
                  onClick={() => {
                    const fileName = image.name;
                    fetch(image.url)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const file = new File([blob], fileName, {
                          type: blob.type,
                        });
                        setEditorImage(file);
                        setIsEditorOpen(true);
                      });
                  }}
                  className="bg-black text-white cursor-pointer hover:bg-zinc-600 p-1 sm:p-1.5 rounded"
                  title="Edit image"
                >
                  <BsPencil className="size-3 sm:size-4" />
                </button>
              )} */}
              <button
                onClick={() => {
                  setLinkImageId(image.id);
                  setShowLinkModal({
                    open: true,
                    currentProjectId: image.project, // can be null or actual ID
                  });
                }}
                className="bg-black text-white p-1 sm:p-1.5 rounded hover:bg-zinc-600 cursor-pointer "
                title="Link to Project"
              >
                <BsLink className="size-3 sm:size-4" />
              </button>
              <button
                onClick={() => {
                  setServiceImage(image);
                  setShowServiceModal(true);
                }}
                className="bg-black text-white p-1 sm:p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Use in Service"
              >
                <BsMagic className="size-3 sm:size-4" />
              </button>
              <button
                onClick={() =>
                  setRenameModal({
                    isOpen: true,
                    currentName: image.name,
                    imageId: image.id, // or image._id depending on your data
                  })
                }
                className="bg-black text-white p-1 sm:p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Rename Image Name"
              >
                <BiRename className="size-3 sm:size-4" />
              </button>
              {hasDeleteGalleryPermission && !isSharedWithMe && (
                <ConfirmDeleteDialog
                  onDelete={() => handleDelete(image.id)}
                  title="Delete Image"
                  message="Are you sure you want to delete this image? This action cannot be undone."
                >
                  <button
                    className="text-white hover:text-red-500 p-1 sm:p-1.5 rounded hover:bg-zinc-600 bg-black cursor-pointer"
                    title="Delete image"
                  >
                    <BsTrash className="size-3 sm:size-4" />
                  </button>
                </ConfirmDeleteDialog>
              )}
              {/* <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-500 p-1.5 rounded hover:bg-zinc-600 bg-zinc-700"
                title="Open in new tab"
              >
                <BsBoxArrowUpRight size={16} />
              </a> */}
              {/* <button
                onClick={() => triggerReplace(image.id)}
                className="text-white hover:text-green-500"
                title="Replace image"
              >
                <BsArrowRepeat size={16} />
              </button> */}
              {image?.sizeChart && image?.sizeChart?.length > 0 && (
                <button
                  onClick={() => handleOpenSizeChart(image)}
                  className="p-1.5 rounded cursor-pointer  hover:bg-zinc-600 bg-black"
                  title="Size Chart"
                >
                  <BsTable className="size-2 sm:size-4" />
                </button>
              )}
              {activeTab !== TABS.UPLOADED && (
                <button
                  disabled={!image?.gallery_image_ids?.length > 0}
                  onClick={() => {
                    console.log("preview....", image);
                    setPreviewInputState({
                      open: true,
                      galleryImageIds:
                        image?.gallery_image_ids?.length > 0
                          ? image?.gallery_image_ids
                          : [],
                    });
                  }}
                  className={`p-1 sm:p-1.5 rounded bg-zinc-700 ${
                    image?.gallery_image_ids?.length > 0
                      ? "cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                  title="Like"
                >
                  <BsImages className="size-3 sm:size-4" />
                </button>
              )}
              {activeTab !== TABS.UPLOADED && (
                <button
                  className="p-1.5 rounded cursor-pointer bg-black"
                  onClick={() => setShowChooseAsset({ open: true, imageId: image.id })}
                  title='Tree View'
                >
                  <CgListTree size={14} />
                </button>
              )}
              <ImagePreviewDialog imageUrl={image.url} imageData={image} enableHD={true}>
                <button
                  className="bg-black text-white p-1 sm:p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                  title="Scale to HD"
                >
                <MdHd size={14} />
              </button>
              </ImagePreviewDialog>
            </div>
          }
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    // return <div className="text-center text-zinc-400">Loading...</div>;
    return <Loader />;
  }

  return (
    <div
      className={`text-white min-h-screen `}
      // onDragOver={handleDragOver}
      // onDragLeave={handleDragLeave}
      // onDrop={handleDrop}
    >
      
        	
      {/* Drag overlay */}
      {/* {dragOver && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center">
            <BsPlusCircle size={48} className="text-white mx-auto mb-4" />
            <p className="text-white text-xl font-semibold">
              Drop images here to upload
            </p>
          </div>
        </div>
      )} */}

      <div className="container mx-auto p-4 lg:p-6 space-y-6">
        {/* Tabs */}
        <ApiTour
          tourName="galleryTour" 
          steps={galleryTourSteps}
        />
        <TabSelector />
        {activeTab !== TABS.GENERATED && (
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
            <div className="flex flex-wrap gap-2 items-center bg-zinc-800 rounded-full p-1 list-grid-view">
              <button
                className={`text-sm lg:text-base cursor-pointer flex items-center px-3 py-1 rounded-full ${
                  viewMode === "list"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
                onClick={() => setViewMode("list")}
              >
                <BsList size={16} className="mr-2" />
                List
              </button>
              <button
                className={`text-sm lg:text-base flex items-center px-3 py-1 rounded-full cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
                onClick={() => setViewMode("grid")}
              >
                <BsGrid size={16} className="mr-2 " />
                Grid
              </button>
            </div>
            <div className="md:ml-auto mr-4">
              <SortDropdown onSortChange={handleSortChange} currentSort={currentSort} />
            </div>
            {activeTab !== TABS.UPLOADED && !isSharedWithMe && !isSharedWithOthers && (
              <>
                <Button
                  loading={isDownloading}
                  loadingText="Downloading..."
                  onClick={() => setOpen(true)}
                  fullWidth={false}
                >
                  Download Images
                </Button>

                <SelectImagesModal
                  open={open}
                  onClose={() => setOpen(false)}
                  images={galleryImages}
                  onDownload={handleDownloadSelected}
                  activeTab={activeTab}   // 👈 pass active tab here
                />
              </>
            )}
          </div>
        )}

        {/* File inputs */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
        />
        <input
          type="file"
          ref={replaceInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleReplace}
        />

        {isProcessing && (
          <div className="fixed bottom-0 left-0 right-0 text-center py-4 z-50 ">
            <div
              role="status"
              class="flex flex-col items-center justify-center gap-2"
            >
              <svg
                aria-hidden="true"
                class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
            </div>
          </div>
        )}

        {viewMode === "grid" ? <GridView /> : <ListView />}

        {/* Context Menu */}
        <ContextMenuComponent />
      </div>

      {isEditorOpen && (
        <ImageEditor
          source={editorImage}
          onSave={async (editedImage) => {
  setIsEditorOpen(false);

  // Fix missing extension before sending
  let fileToUpload = editedImage.file;
  if (!fileToUpload.name.includes(".")) {
    const mimeExtMap = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const ext = mimeExtMap[fileToUpload.type] || "";
    fileToUpload = new File([fileToUpload], fileToUpload.name + ext, { type: fileToUpload.type });
  }

  const formData = new FormData();
  formData.append("image", fileToUpload);

  try {
    const res = await multipartRequest.post("/gallery/edited", formData);
    const newImg = res.data.data;
    const formatted = {
      id: newImg.id,
      url: newImg.url,
      name: newImg.name,
      status: newImg.status || "saved",
    };
    setGalleryImages((prev) => [formatted, ...prev]);
  } catch (e) {
    alert("Failed to save edited image.");
  }
}}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}

{showChooseAsset.open && (
    <GalleryTreeManager
      isOpen={showChooseAsset.open}
      imageId={showChooseAsset.imageId}
      onClose={() => setShowChooseAsset({ open: false, imageId: null })}
    />
  )}
      <LinkToProjectModal
        open={showLinkModal.open}
        imageId={linkImageId}
        currentProjectId={showLinkModal.currentProjectId}
        onClose={() =>
          setShowLinkModal({ open: false, currentProjectId: null })
        }
        onLinkSuccess={(projectId) => {
          // optionally refetch or toast
          fetchGalleryImages();
          console.log("Linked to project", projectId);
        }}
        fetchGalleryImages={fetchGalleryImages}
      />

      <InputImagePreviewDialog
            open={previewInputState.open}
            galleryImageIds={previewInputState.galleryImageIds}
            setOpen={(show) =>
              setPreviewInputState((prev) => ({ ...prev, open: show }))
            }
          />

      <ServiceSelectionModal
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        image={serviceImage}
        onSelect={handleServiceSelect} 
        handleEditImage={handleEditImage}
      />
      <RenameImageModal
        open={renameModal.isOpen}
        currentName={renameModal.currentName}
        onClose={() => setRenameModal((p) => ({ ...p, isOpen: false }))}
        onSubmit={async (newNameInput) => {
          try {
            // Get extension from currentName (including dot), e.g. ".png"
            const extensionMatch = renameModal.currentName.match(/\.[^/.]+$/);
            const extension = extensionMatch ? extensionMatch[0] : "";

            // Check if user included extension in new name
            const hasExtension = newNameInput.toLowerCase().endsWith(extension.toLowerCase());

            // Append extension if missing
            const newName = hasExtension ? newNameInput : newNameInput + extension;

            const res = await api.put(`gallery/${renameModal.imageId}/rename`, { newName });

            handleRenameSuccess(res.data.image);
            setRenameModal((p) => ({ ...p, isOpen: false }));
          } catch (err) {
            alert("Unexpected error: " + err.message);
          }
        }}
      />
      {/* <MeasurementTableDialog
        open={measurementDialogState.open}
        setOpen={(val) => setMeasurementDialogState(prev => ({ ...prev, open: val }))}
        measurementTableData={measurementDialogState.measurementTableData}
        isAIGenerated={["ai_generated", "ai_generated_edited"].includes(measurementDialogState.generation_source)}
        setMeasurementTableData={(data) =>
          setMeasurementDialogState(prev => ({ ...prev, measurementTableData: data }))
        }
        sizeChartId={measurementDialogState.sizeChartId}
      /> */}

    <MultipleMeasurementTableDialog
      open={multipleMeasurementDialogState.open}
      setOpen={(val) => setMultipleMeasurementDialogState(prev => ({ ...prev, open: val }))}
      sizeCharts= {multipleMeasurementDialogState.sizeCharts}
    />
    <NSFWWarningModal
        isOpen={nsfwWarning.isOpen}
        onClose={() => setNsfwWarning({ isOpen: false, content: null, fileName: '' })}
        detectedContent={nsfwWarning.content}
        fileName={nsfwWarning.fileName}
      />

    </div>
  );
}
