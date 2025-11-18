import { useState, useEffect } from "react";
import {
  BsCheck,
  BsBookmark,
  BsDownload,
  BsBoxArrowUpRight,
  BsArrowRepeat,
  BsPencil,
  BsTrash,
  BsGrid,
  BsList,
  BsHandThumbsUp,
  BsHandThumbsDown,
  BsLink,
  BsMagic,
  BsImages,
} from "react-icons/bs";
import { CgListTree } from "react-icons/cg";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { BsThreeDotsVertical } from "react-icons/bs";
import api from "../../api/axios.js";
import { useCallback } from "react";
import LinkGeneratedToProjectModal from "../../components/LinkGeneratedToProjectModal";
import ImageZoomDialog from "@/components/ImageZoomDialog.jsx";
import ServiceSelectionModal from "@/components/ServiceSelectionModal";
import SmartImage from "@/components/SmartImage.jsx";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog.jsx";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog.jsx";
import { SortDropdown } from "@/components/Common/SortingButton.jsx";
import SelectImagesModal from "@/components/SelectImagesModal";
import Button from "@/components/Button.jsx";
import ImagePreviewDialog from "../moodboards/ImagePreviewDialog.jsx";
import { CiZoomIn } from "react-icons/ci";
import ImageDropdownMenu from "@/components/ImageDropdownMenu.jsx";
import { useCredits } from "@/hooks/useCredits";

const BASE_API_URL = import.meta.env.VITE_API_URL;

const TABS = {
  GENERATED: "generated",
};
const GeneratedTab = ({
  onImageEdit,
  onError,
  onContextMenu,
  hasDeleteGalleryPermission,
  hasEditGalleryPermission,
  hasCreateGalleryPermission,
  hasFinaliseGalleryPermission,
  // contextMenu,
}) => {
  const [generatedImages, setGeneratedImages] = useState([]);
  const [previewInputState, setPreviewInputState] = useState({
    open: false,
    galleryImageIds: [],
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS.UPLOADED);
  const [imageFeedback, setImageFeedback] = useState({});
  const [viewMode, setViewMode] = useState("grid");
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedImageForLinking, setSelectedImageForLinking] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceImage, setServiceImage] = useState(null);
  const [currentSort, setCurrentSort] = useState("created-date-asc");
  const [isDownloading, setIsDownloading] = useState(false);
  const [open, setOpen] = useState(false);
  const { fetchCredits } = useCredits();
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    imageId: null,
  });
  useEffect(() => {
    fetchGeneratedImages();
  }, [currentSort]);

  const getGeneratedImageFeedback = useCallback(async () => {
    try {
      const response = await api.get("/gallery/generated-feedback");
      if (response.data.data) {
        const feedbackMap = response.data.data.reduce((acc, item) => {
          acc[item.image_url] = item.status;
          return acc;
        }, {});
        setImageFeedback(feedbackMap);
      }
      console.log("Fetched generated image feedback:", response.data.data);
      return response.data.data;
    } catch (err) {
      onError(err.response?.data?.message || "Failed to fetch image feedback");
    }
  }, [onError]);

  useEffect(() => {
    getGeneratedImageFeedback();
  }, [getGeneratedImageFeedback, onError]);

  console.log("Image feedback state:", imageFeedback);




const fetchGeneratedImages = async (showLoading = true) => {
  try {
    if (showLoading) {
      setLoading(true);
    }
    const response = await api.get(
      `/gallery/generated?sorting=${currentSort}`
    );
    
    // CHANGED: Backend now returns an object with two arrays
    const { generatedImages: generatedImagesData, galleryImagesWithOutlines } = response.data.data;
    
    // Process AI-generated images
    const processedGeneratedImages = generatedImagesData.flatMap((item) =>
      item.result.map((url, index) => {
        const galleryImage = item?.gallery_image_ids?.[index];
        return {
          id: `${item.id}-${index}`,
          url,
          name: item.task || "Untitled",
          status: "generated",
          originalId: item.id,
          gallery_image_ids: item?.gallery_image_ids,
          created_at: item.created_at,
          outline_image: galleryImage?.outline_image || null,
          outline_mode: galleryImage?.outline_mode || null,
          has_outline: !!galleryImage?.outline_image,
          is_outline_view: false,
        };
      })
    );
    
    // Create outline images from generated images
    const outlineImagesFromGenerated = generatedImagesData.flatMap((item) =>
      item.result
        .map((url, index) => {
          const galleryImage = item?.gallery_image_ids?.[index];
          
          if (galleryImage?.outline_image) {
            return {
              id: `${item.id}-${index}-outline`,
              url: galleryImage.outline_image,
              name: `${item.task || "Untitled"} (Outline - ${galleryImage.outline_mode || 'N/A'})`,
              status: "generated",
              originalId: item.id,
              gallery_image_ids: item?.gallery_image_ids,
              created_at: item.created_at,
              outline_image: galleryImage.outline_image,
              outline_mode: galleryImage.outline_mode,
              has_outline: true,
              is_outline_view: true,
              original_image_url: url,
            };
          }
          return null;
        })
        .filter(Boolean)
    );
    
    // NEW: Process gallery images with outlines
    const outlineImagesFromGallery = galleryImagesWithOutlines.map((img) => ({
      id: `gallery-${img._id}-outline`,
      url: img.outline_image, // Full URL already
      name: `${img.name || "Untitled"} (Outline - ${img.outline_mode || 'N/A'})`,
      status: img.status || "uploaded",
      originalId: img._id,
      gallery_image_ids: [img],
      created_at: img.created_at,
      outline_image: img.outline_image,
      outline_mode: img.outline_mode,
      has_outline: true,
      is_outline_view: true,
      original_image_url: img.url,
    }));
    
    // Combine ALL images
    const allImages = [
      ...processedGeneratedImages, 
      ...outlineImagesFromGenerated,
      ...outlineImagesFromGallery // NEW
    ];
    
    console.log("Generated images:", processedGeneratedImages.length);
    console.log("Outline from generated:", outlineImagesFromGenerated.length);
    console.log("Outline from gallery:", outlineImagesFromGallery.length);
    console.log("Total images:", allImages.length);
    
    setGeneratedImages(allImages);
  } catch (err) {
    onError(
      err.response?.data?.message || "Failed to fetch generated images"
    );
  } finally {
    setLoading(false);
  }
};



  const handleLikeDislike = async (imageId, like) => {
    console.log("Like/Dislike clicked", imageId, like);
    setIsProcessing(true);
    try {
      const image = generatedImages.find((img) => img.id === imageId);
      if (!image) return;

      const currentStatus = imageFeedback[image.url];
      let newStatus = like ? "liked" : "disliked";

      // If the same action is clicked again, toggle to "none"
      if (
        (like && currentStatus === "liked") ||
        (!like && currentStatus === "disliked")
      ) {
        newStatus = "none";
      }

      await api.put(`/gallery/generated-feedback`, {
        image_url: image.url,
        status: newStatus,
      });

      getGeneratedImageFeedback();
      fetchGeneratedImages(false);
    } catch (err) {
      onError(err.response?.data?.message || "Failed to update image feedback");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (imageId, newStatus) => {
    try {
      setIsProcessing(true);
      const image = generatedImages.find((img) => img.id === imageId);
      if (!image) return;

      await api.patch(`/gallery/setGeneratedImage/${image.originalId}`, {
        status: newStatus,
        imageUrls: [image.url], // Send the URL array
      });
      fetchCredits();

      // setGeneratedImages((prev) =>
      // 	prev.map((img) =>
      // 		img.id === imageId ? { ...img, status: newStatus } : img
      // 	)
      // );
      await fetchGeneratedImages(false);
    } catch (err) {
      onError(err.response?.data?.message || "Failed to update image status");
    } finally {
      setIsProcessing(false);
    }
  };

  console.log(previewInputState, "previewInputState");

  const handleDelete = async (imageId) => {
    try {
      setIsProcessing(true);
      const image = generatedImages.find((img) => img.id === imageId);
      if (!image) return;

      await api.post(`/gallery/generated/delete/${image.originalId}`, {
        imageUrl: image.url, // Send the URL array
      });
      await fetchGeneratedImages(false);
    } catch (err) {
      onError(err.response?.data?.message || "Failed to delete image");
    } finally {
      setIsProcessing(false);
    }
  };

  // const handleDownloadImage = async (imageId, imageName) => {
  // 	try {
  // 		const image = generatedImages.find(img => img.id === imageId);
  // 		if (!image) return;

  // 		const response = await api.get(`/gallery/generated/${image.originalId}/download`, {
  // 			responseType: "blob",
  // 		});
  // 		const url = window.URL.createObjectURL(new Blob([response.data]));
  // 		const link = document.createElement("a");
  // 		link.href = url;
  // 		link.setAttribute("download", imageName);
  // 		document.body.appendChild(link);
  // 		link.click();
  // 		link.remove();
  // 		window.URL.revokeObjectURL(url);
  // 	} catch (err) {
  // 		onError(err.response?.data?.message || "Failed to download image");
  // 	}
  // };

  // handle download
const handleDownloadImage = async (image = null) => {
  try {
    const imageUrl = image.is_outline_view 
      ? image.url  // Outline has full URL
      : `${BASE_API_URL}/genie-image/${image.url}`; // Generated needs base URL
    
    const response = await fetch(imageUrl, {
      mode: "cors",
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${image.name}_${Date.now()}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    onError(err.response?.data?.message || "Failed to download image");
  }
};

  const handleEditImage = (image) => {
  const imageUrl = image.is_outline_view 
    ? image.url 
    : `${BASE_API_URL}/genie-image/${image.url}`;
  
  fetch(imageUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const file = new File([blob], image.name, { type: blob.type });
      onImageEdit(file);
    })
    .catch((err) => {
      console.log("err", err);
      onError("Failed to load image for editing");
    });
};

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      const urlQuery = `/gallery/generated/download`;

      const response = await api.get(
        urlQuery,
        { imageIds: selectedIds }, // send selected IDs in body
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `generated-gallery-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download gallery");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSelected = async (selectedIds = []) => {
    setIsDownloading(true);
    try {
      const urlQuery = `/gallery/generated/download`;
      const response = await api.post(
        urlQuery,
        { imageIds: selectedIds }, // send selected IDs in body
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `gallery-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download gallery");
    } finally {
      setIsDownloading(false);
    }
  };
 
  // Grid View Component
  const GridView = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
    {generatedImages.map((image) => (  // CHANGED THIS LINE
      <div
        key={image.id}
        className="relative aspect-square border-shadow-blur rounded-xl overflow-hidden group"
        onContextMenu={(e) => onContextMenu(e, image.id)}
      >
        <SmartImage
          src={
            image.is_outline_view 
              ? image.url  // Outline images already have full URL
              : `${BASE_API_URL}/genie-image/${image.url}` // Generated images need base URL
          }
          alt={image.name}
          className="w-full h-full object-cover"
        />

        {/* Bottom White Strip */}
        <div className="absolute bottom-0 left-0 w-full bg-white bg-opacity-90 text-black text-[10px] px-2 py-1">
          <div className="truncate">{image.name}</div>
          <div>{new Date(image.created_at).toLocaleDateString()}</div>
        </div>

        {/* Status Badge */}
        {image.status === "finalized" && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            <BsCheck size={14} className="inline-block mr-1" />
            Finalized
          </div>
        )}

        {/* Outline Badge */}
{image.is_outline_view && (
  <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Outline
          </div>
        )}
        {image.status === "saved" && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            <BsBookmark size={14} className="inline-block mr-1" />
            Saved
          </div>
        )}

        {/* ===== Desktop/Laptop Hover Overlay ===== */}
        <div className="absolute inset-0 bg-black/35 backdrop-blur-sm flex flex-col justify-center items-center gap-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
          {/* Action buttons row */}
          <div className="flex gap-1 max-w-[85%] mx-auto w-full flex-wrap items-center justify-center">
            <button
              onClick={() => handleDownloadImage(image)}
              className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
              title="Download"
            >
              <BsDownload size={14} />
            </button>

            {hasEditGalleryPermission && (
              <button
                onClick={() => handleEditImage(image)}
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Edit"
              >
                <BsPencil size={14} />
              </button>
            )}

            <ImagePreviewDialog
              imageUrl={
                image.is_outline_view 
                  ? image.url  // Full URL for outline
                  : `${BASE_API_URL}/genie-image/${image.url}` // Base URL for generated
              }
              imageData={{
                ...image,
                outline_image: image.outline_image,
                outline_mode: image.outline_mode,
              }}     
              galleryImageId={image?.gallery_image_ids?.[0]?._id || image?.gallery_image_ids?.[0]?.id}
            >
              <button
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Open Large View"
              >
                <CiZoomIn size={14} />
              </button>
            </ImagePreviewDialog>

            {hasFinaliseGalleryPermission && (
              <button
                onClick={() => handleStatusChange(image.id, "finalized")}
                className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded cursor-pointer"
                title="Mark as finalized"
              >
                <BsCheck size={14} />
              </button>
            )}

            {hasEditGalleryPermission && (
              <button
                onClick={() => handleStatusChange(image.id, "saved")}
                className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded cursor-pointer"
                title="Save for later"
              >
                <BsBookmark size={14} />
              </button>
            )}

            {/* Like / Dislike */}
            <button
              onClick={() => handleLikeDislike(image.id, true)}
              className={`p-1.5 rounded cursor-pointer ${
                imageFeedback[image.url] === "liked"
                  ? "bg-pink-600 text-white"
                  : "bg-zinc-700 text-white hover:bg-zinc-600"
              }`}
              title="Like"
            >
              <BsHandThumbsUp size={14} />
            </button>
            <button
              onClick={() => handleLikeDislike(image.id, false)}
              className={`p-1.5 rounded cursor-pointer ${
                imageFeedback[image.url] === "disliked"
                  ? "bg-red-600 text-white"
                  : "bg-zinc-700 text-white hover:bg-zinc-600"
              }`}
              title="Dislike"
            >
              <BsHandThumbsDown size={14} />
            </button>

            <button
              disabled={!image?.gallery_image_ids?.length > 0}
              onClick={() =>
                setPreviewInputState({
                  open: true,
                  galleryImageIds: image?.gallery_image_ids ?? [],
                })
              }
              className={`p-1.5 rounded bg-zinc-700 ${
                image?.gallery_image_ids?.length > 0
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
              }`}
              title="Input Image(s)"
            >
              <BsImages size={14} />
            </button>

            <button
              className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
              title="Link to Project"
              onClick={() => {
                setSelectedImageForLinking(image);
                setLinkModalOpen(true);
              }}
            >
              <BsLink size={14} />
            </button>

            <button
              onClick={() => {
                setServiceImage(image);
                setShowServiceModal(true);
              }}
              className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
              title="More actions"
            >
              <BsMagic size={14} />
            </button>
            <button
              onClick={() => {
                setServiceImage(image);
                setShowServiceModal(true);
              }}
              className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
              title="More actions"
            >
              <CgListTree size={14} />
            </button>
           {/* Delete Button (always available) */}
        {hasDeleteGalleryPermission && (
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

        {/* ===== Mobile/Tablet 3-dots Menu ===== */}
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
              // setSelectedImageForLinking={handleSetSelectedImageForLinking}
              setServiceImage={setServiceImage}
              setShowServiceModal={setShowServiceModal}
              // handleOpenSizeChart={handleOpenSizeChart} 
            />
          </div>
      </div>
    ))}
  </div>
);


  // List View Component
  const ListView = () => (
    <div className="space-y-3 md:p-4">
    {generatedImages.map((image) => (  // CHANGED THIS LINE
        <div
          key={image.id}
          className="flex bg-zinc-900 rounded-lg overflow-hidden"
          onContextMenu={(e) => onContextMenu(e, image.id)}
        >
          <div className="w-16 sm:w-24 min-h-full shrink-0 bg-zinc-800 overflow-hidden relative">
<SmartImage
  src={
    image.is_outline_view 
      ? image.url  // Outline images already have full URL
      : `${BASE_API_URL}/genie-image/${image.url}` // Generated images need base URL
  }
  alt={image.name}
  className="w-full min-h-full object-cover"
/>

{/* ADD THIS OUTLINE BADGE */}
{image.is_outline_view && (
  <div className="absolute bottom-1 left-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded-full flex items-center gap-1">
    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
    <span className="text-[8px]">Outline</span>
  </div>
)}

            {/* Status Badge */}
            {image.status === "finalized" && (
              <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
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

          <div className="flex-grow p-2 flex justify-between items-start">
            <div className="text-sm text-white w-10 grow">
              <h3 className="font-medium text-sm whitespace-nowrap overflow-hidden max-w-full text-ellipsis">{image.name}</h3>
              <div className="text-xs text-zinc-500">
                {new Date(image.created_at).toLocaleDateString()}
              </div>
              {image.project?.name && (
                <div className="text-xs text-zinc-400">
                  Linked to: {image.project.name}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end w-24 sm:w-28 md:grow md:w-1/3">
              {/* Status buttons */}
              {hasFinaliseGalleryPermission && (
                <button
                  onClick={() => handleStatusChange(image.id, "finalized")}
                  className="text-white hover:text-green-500 p-1.5 bg-zinc-700 rounded"
                  title="Mark as finalized"
                >
                  <BsCheck className="size-3 sm:size-4" />
                </button>
              )}
              {hasEditGalleryPermission && (
                <button
                  onClick={() => handleStatusChange(image.id, "saved")}
                  className="text-white hover:text-blue-500 p-1.5 bg-zinc-700 rounded"
                  title="Save for later"
                >
                  <BsBookmark className="size-3 sm:size-4" />
                </button>
              )}

              {/* Like/Dislike */}
              <button
                onClick={() => handleLikeDislike(image.id, true)}
                className={`p-1.5 rounded ${
                  imageFeedback[image.url] === "liked"
                    ? "bg-pink-600 p-1.5 text-white"
                    : "bg-zinc-700 text-white hover:bg-zinc-600"
                }`}
                title="Like"
              >
                <BsHandThumbsUp className="size-3 sm:size-4" />
              </button>
              <button
                onClick={() => handleLikeDislike(image.id, false)}
                className={`text-white ${
                  imageFeedback[image.url] === "disliked"
                    ? "text-white p-1.5 bg-red-500 rounded"
                    : "hover:bg-red-500 p-1.5 bg-zinc-700 rounded"
                }`}
                title="Dislike"
              >
                <BsHandThumbsDown className="size-3 sm:size-4" />
              </button>
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
                className={`p-1.5 rounded bg-zinc-700 ${
                  image?.gallery_image_ids?.length > 0
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                }`}
                title="Input Image(s)"
              >
                <BsImages className="size-3 sm:size-4" />
              </button>

              {/* Other actions */}
              <button
                onClick={() => handleDownloadImage(image)}
                className="text-white hover:text-blue-500 p-1.5 bg-zinc-700 rounded"
                title="Download image"
              >
                <BsDownload className="size-3 sm:size-4" />
              </button>
              {/* <a
                href={`${BASE_API_URL}/genie-image/${image.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-500 p-1.5 bg-zinc-700 rounded"
                title="Open in new tab"
              >
                <BsBoxArrowUpRight size={16} />
              </a> */}
              {hasEditGalleryPermission && (
                <button
                  onClick={() => handleEditImage(image)}
                  className="text-white hover:text-purple-500 bg-zinc-700 rounded p-1.5"
                  title="Edit image"
                >
                  <BsPencil className="size-3 sm:size-4" />
                </button>
              )}
             <ImagePreviewDialog
                imageUrl={`${BASE_API_URL}/genie-image/${image.url}`}
                imageData={image}
              >
                <button
                  className="bg-black text-white p-1.5 rounded cursor-pointer"
                  title="Open Large View"
                >
                  <CiZoomIn className="size-3 sm:size-4" />
                </button>
              </ImagePreviewDialog>
              {hasDeleteGalleryPermission && (
                <ConfirmDeleteDialog
                  onDelete={() => handleDelete(image.id)}
                  title="Delete Image"
                  message="Are you sure you want to delete this image? This action cannot be undone."
                >
                  <button
                    className="text-white hover:text-red-500 p-1.5 bg-zinc-700 rounded"
                    title="Delete image"
                  >
                    <BsTrash className="size-3 sm:size-4" />
                  </button>
                </ConfirmDeleteDialog>
              )}

              <button
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="Link to Project"
                onClick={() => {
                  setSelectedImageForLinking(image);
                  setLinkModalOpen(true);
                }}
              >
                <BsLink className="size-3 sm:size-4" />
              </button>

              <button
                onClick={() => {
                  setServiceImage(image);
                  setShowServiceModal(true);
                }}
                className="bg-black text-white p-1.5 rounded hover:bg-zinc-600 cursor-pointer"
                title="More Actions"
              >
                <BsMagic className="size-3 sm:size-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const handleSortChange = (sortOption) => {
    setCurrentSort(sortOption);
  };

  // Context Menu Component
  const ContextMenuComponent = () =>
    contextMenu.visible && (
      <div
        className="fixed bg-zinc-800 shadow-lg rounded p-2 z-50 min-w-48"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
          onClick={() => handleStatusChange(contextMenu.imageId, "finalized")}
        >
          <BsCheck size={16} className="text-green-500" />
          Mark as Finalized
        </button>
        <button
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
          onClick={() => handleStatusChange(contextMenu.imageId, "saved")}
        >
          <BsBookmark size={16} className="text-blue-500" />
          Save for Later
        </button>
        <button
          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded"
          onClick={() => handleStatusChange(contextMenu.imageId, "generated")}
        >
          <BsArrowRepeat size={16} className="text-yellow-500" />
          Move to Generated
        </button>
        <div className="border-t border-zinc-700 my-1"></div>
        {hasDeleteGalleryPermission && (
          <button
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 rounded text-red-500"
            onClick={() => handleDelete(contextMenu.imageId)}
          >
            <BsTrash size={16} />
            Delete Image
          </button>
        )}
      </div>
    );

  if (loading) {
    return (
      <div className="text-center text-zinc-400">
        Loading generated images...
      </div>
    );
  }

  if (generatedImages.length === 0) {
    return (
      <div className="text-center text-zinc-400 py-12">
        <p className="text-lg mb-2">No generated images found</p>
        <p className="text-sm">
          Generated images will appear here once you create them
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-3 space-y-6">
      {/* Tabs */}
      {/* <TabSelector /> */}

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

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center bg-zinc-800 rounded-full p-1">
          <button
            className={`flex items-center px-3 py-1 rounded-full ${
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
          
  

        <div className="md:ml-auto mr-4">
          <SortDropdown onSortChange={handleSortChange} currentSort={currentSort} showNameSort={false} />
        </div>

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
          images={generatedImages}
          onDownload={(ids) => handleDownloadSelected(ids, activeTab)}
          isGenerated={true} // <-- pass the prop here
        />
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Display view */}
      {viewMode === "grid" ? <GridView /> : <ListView />}
      <InputImagePreviewDialog
        open={previewInputState.open}
        galleryImageIds={previewInputState.galleryImageIds}
        setOpen={(show) =>
          setPreviewInputState((prev) => ({ ...prev, open: show }))
        }
      />

      {/* Context Menu */}
      <ContextMenuComponent />

      {selectedImageForLinking && (
        <LinkGeneratedToProjectModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          image={selectedImageForLinking}
          onLinkSuccess={() => {
            fetchGeneratedImages(false);
            setSelectedImageForLinking(null);
          }}
        />
      )}

      <ServiceSelectionModal
        open={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        image={{
          ...serviceImage,
          url: `${BASE_API_URL}/genie-image/${serviceImage?.url}`,
        }}
      />
    </div>
  );
};

export default GeneratedTab;
