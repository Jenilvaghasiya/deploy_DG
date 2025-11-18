// ImageEditorPage.jsx
import React, { useState, useEffect, useRef } from "react";
import {
	AiOutlinePlus,
	AiOutlineEdit,
	AiOutlineDelete,
	AiOutlineDownload,
} from "react-icons/ai";
import placeholderImage from "../../assets/images/placeholder.svg";
import { useCredits } from "@/hooks/useCredits";
import Button from "../../components/Button";
import ImageEditor from "./ImageEditor";
import api, { multipartRequest } from "../../api/axios";
import { SelectImageTabs } from "../../components/SelectImageTabs";
import SmartImage from "@/components/SmartImage";
import UrlInputModal from "@/components/UrlInputModal";
import toast from "react-hot-toast";
import { Formik } from "formik";
import ApiTour from "@/components/Tour/ApiTour";
import { imageEditorTourSteps } from "@/components/Tour/TourSteps";

function ImageEditorPage() {
	const fileInputRef = useRef(null);
	const fileInputComputerRef = useRef(null);
  	const [showUrlModal, setUrlShowModal] = useState(false);
	const [image, setImage] = useState(null);
	const [isEditorOpen, setIsEditorOpen] = useState(false);
	const [editHistory, setEditHistory] = useState([]);
	const [previewImage, setPreviewImage] = useState(placeholderImage);
	const [dragOver, setDragOver] = useState(false);
	const { fetchCredits } = useCredits();

	// Clean up object URLs when component unmounts
	useEffect(() => {
		return () => {
			if (image?.url) {
				URL.revokeObjectURL(image.url);
			}

			// Clean up history previews
			editHistory.forEach((historyItem) => {
				if (historyItem.url) {
					URL.revokeObjectURL(historyItem.url);
				}
			});
		};
	}, [image, editHistory]);

	// Drag and drop handlers
	const handleDragOver = (e) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setDragOver(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);

		const files = Array.from(e.dataTransfer.files).filter((file) =>
			file.type.startsWith("image/")
		);

		if (files.length > 0) {
			// Use the first image file
			const file = files[0];
			processImageFile(file);
		}
	};
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // returns data URL
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
	// Common function to process image files from both file input and drag & drop
const processImageFile = async (file, existingImage = null) => {
  // clean up old url
  if (image?.url) {
    URL.revokeObjectURL(image.url);
  }

  try {
    let newImage;

    if (existingImage) {
      // ✅ Backend/gallery image (full object from SelectImageTabs)
      newImage = {
        id: existingImage.id,
        url: existingImage.url,
        name: existingImage.name || "image.jpg",
        status: existingImage.status,
        type: existingImage.type || "unknown",
        size: existingImage.size || 0,
        lastModified: existingImage.lastModified || Date.now(),
        timestamp: new Date().toISOString(),
      };
    } else if (file) {
	const base64 = await fileToBase64(file); // convert blob to data URL
      // ✅ Local file
      newImage = {
        file,
        url: base64,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        timestamp: new Date().toISOString(),
      };
    }

    if (newImage) {
      setImage(newImage);
      setEditHistory((prev) => [...prev, newImage]);
    }
  } catch (error) {
    console.error("Error processing image:", error);
  }
};

	const uploadFromUrl = async (file) => {
		const formData = new FormData();
		formData.append("image", file);
		try {
			await multipartRequest.post("/gallery/edited", formData);
		} catch (err) {
			console.warn("Failed to save URL image to gallery");
		}
	};

	const handleUrlPaste = (data) => {		
		if(data){			
			setImage(data[0])
			setEditHistory((prev) => [...prev, data[0]]);
			setUrlShowModal(false)
		}
		
	};

	const handleImageSelect = (e) => {
		if (e.target.files && e.target.files[0]) { 			
			const file = e.target.files[0];
			processImageFile(file);
		} else {
			toast.error("No file selected or e.target.files is undefined")			
		}
	};

	const handleSetImage = async (img, overrideOriginalUrl = null) => {
	if (!img) return;

	let finalUrl = img.url;
	setImage({
		...img,
		originalUrl: finalUrl,
	});
	};

const handleEditStart = async (imgID, status, imageObj) => {
  if (!imgID) {
    handleSetImage(imageObj);
    setIsEditorOpen(true);
    return;
  }

  if (status === "saved" || status === "generated") {
    try {
      const res = await api.get(
        `/gallery/deduct-credit?imgID=${imgID}&status=${status}&url=${imageObj.url}`
      );
      const data = res.data;

      if (res?.status === 200) {
        handleSetImage(imageObj, data?.data?.images?.url);
        fetchCredits();
        setIsEditorOpen(true);
      } else {
        toast.error(data?.message || "Credit deduction failed ❌");
      }
    } catch (err) {
      console.error("Error deducting credits:", err);
      toast.error("Something went wrong, please try again.");
    }
  } else {
    handleSetImage(imageObj);
    setIsEditorOpen(true);
  }
};


	const handleSaveEdit = async (editedImage) => {
		setIsEditorOpen(false);

		// Upload to backend
		const formData = new FormData();
		formData.append("image", editedImage.file);

		try {
			const response = await multipartRequest.post(
				"/gallery/edited",
				formData
			);
			const saved = response.data.data;

			// Add to edit history and set as current image
			const newImage = {
				file: editedImage.file,
				url: URL.createObjectURL(editedImage.file),
				name: saved.name,
				timestamp: new Date().toISOString(),
			};

			setImage(newImage);
			setEditHistory((prev) => [...prev, newImage]);
			alert("Edited image saved to gallery!");
		} catch (err) {
			console.error("Failed to save edited image:", err);
			alert("Failed to save edited image");
		}
	};

	const downloadImage = () => {
		if (!image?.url) return;

		const link = document.createElement("a");
		link.href = image.url;
		link.download = image.file.name || "edited-image.jpg";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleDelete = () => {
		if (image?.url) {
			URL.revokeObjectURL(image.url);
		}
		setImage(null);
	};

	const selectHistoryItem = (historyItem) => {
		// First, create a new object from the history item data
		// This ensures we're not modifying the history item directly
		const newCurrent = {
			file: historyItem.file,
			url: URL.createObjectURL(historyItem.file),
			name: historyItem.name || historyItem.file.name,
			timestamp: new Date().toISOString(),
		};

		// Clean up current url if it exists
		if (image?.url) {
			URL.revokeObjectURL(image.url);
		}

		setImage(newCurrent);
	};

	if (isEditorOpen && image) {		
		return (
			<ImageEditor
				source={image}
				onSave={handleSaveEdit}
				onCancel={() => setIsEditorOpen(false)}
			/>
		);
	}

	const directFileInputTest = () => {
		// Create and click a file input directly
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = handleImageSelect;
		input.click();
	};

	const triggerFileSelect = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const triggerComputerFileSelect = () => {
		if (fileInputComputerRef.current) {
			fileInputComputerRef.current.click();
		}
	};


const handleImageUpload = (
  e,
  _setFieldValue = () => {},
  existingImage = null
) => {
  const file = e?.target?.files?.[0];

  // Case 1: Full image object passed (when imageEditor = true in SelectImageTabs)
  if (existingImage && !file) {
    console.log("🖼️ Using existing image object:", existingImage);
    processImageFile(null, existingImage);
    return;
  }

  // Case 2: File selected from input
  if (file) {
    if (existingImage) {
      console.log("✅ Updating existing image with ID:", existingImage.id);
      processImageFile(file, existingImage, existingImage.galleryImageId);
    } else {
      console.log("🆕 Uploading new image");
      processImageFile(file);
    }
  } else {
    console.warn("⚠️ No file or image object received");
  }
};




	return (
		<div className="text-white p-4 lg:p-6 main-content" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
			<div>
			<ApiTour
				tourName="imageEditorTour" 
				steps={imageEditorTourSteps}
			/>
			{/* Drag overlay */}
			{dragOver && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 pointer-events-none">
					<div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center">
						<AiOutlinePlus size={48} className="text-white mx-auto mb-4" />
						<p className="text-white text-xl font-semibold">Drop image here to start editing</p>
					</div>
				</div>
			)}
			<div className="w-full">
				<div className="mb-4 lg:mb-8">
					<h1 className="text-lg lg:text-2xl font-bold mb-1 lg:mb-2">Image Editor Basic</h1>
					<p className="text-zinc-300 text-sm md:text-base">Edit and transform your images with powerful tools</p>
				</div>
				<Formik>
					{({ values, setFieldValue, handleChange, handleBlur, errors }) => {
						return (
					<div className="SelectImageTabs">
						<form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
							<SelectImageTabs
							handleImageUpload={handleImageUpload}
							setFieldValue={setFieldValue} 
							imageEditor={true}                   
							/>
						</form>
						</div>
						);
					}}
				</Formik>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6">
					<div className="lg:col-span-2 space-y-6 mb-6">
						{/* Main Image Area */}
						<div className="lg:p-4 lg:rounded-xl mt-6 lg:border lg:border-white/35 main-area">
							{image ? (
								<div className="relative group rounded-xl overflow-hidden">
									<SmartImage src={image.url} alt="Current image" className="max-w-full rounded-lg" />
									<div className="absolute bottom-4 right-4 flex gap-2">
										<Button variant="primary" onClick={() => handleEditStart(image.id, image.status, image)} icon={<AiOutlineEdit size={18} />} fullWidth={false}>Edit Image</Button>
										<Button variant="secondary" onClick={downloadImage} icon={<AiOutlineDownload size={18} />} fullWidth={false}>Download</Button>
										<Button variant="danger" onClick={handleDelete} icon={<AiOutlineDelete size={18} />} fullWidth={false}>Delete</Button>
									</div>
								</div>
							) : (
								<div className={`flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed min-h-[400px] transition-colors border-shadow-blur ${dragOver ? "bg-zinc-800 border-purple-500" : "bg-zinc-900 border-gray-300"}`}>
									<p className="text-zinc-400 mb-4">{dragOver ? "Drop image here" : "No image selected"}</p>
									{/* Update this part */}
									<input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden"/>
									{/* {!dragOver && (
										<Button variant="primary" className="text-sm px-4" icon={<AiOutlinePlus size={18} />} onClick={triggerFileSelect} fullWidth={false}>Select Image</Button>
									)} */}
								</div>
							)}
						</div>

						{/* Image Details */}
						{image && (
							<div className="border-shadow-blur p-6 rounded-xl border border-gray-300">
								<h2 className="text-xl font-semibold mb-4">Image Details</h2>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-gray-200 text-sm">File Name</p>
										<p>{image.name}</p>
									</div>
									<div>
										<p className="text-gray-200 text-sm">File Size</p>
										<p>{(image.size / 1024).toFixed(2)}{" "} KB</p>
									</div>
									<div>
										<p className="text-gray-200 text-sm">File Type</p>
										<p>{image.type}</p>
									</div>
									<div>
										<p className="text-gray-200 text-sm">Last Modified</p>
										<p>{new Date(image.lastModified).toLocaleString()}</p>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Upload Options */}
						{/* <div className="border-shadow-blur p-4 lg:p-6 rounded-xl border border-gray-700 flex flex-col items-center">
							<SelectImageTabs title="Select Image" handleImageUpload={handleImageUpload} setFieldValue={() => {}} showUploadExistingField={false} />
							<button fullWidth={true} className="w-full !text-white p-1.5 px-4 text-base font-medium !rounded-xl cursor-pointer bg-gradient-to-r from-purple-600 to-blue-500" onClick={() => setUrlShowModal(true)}>Paste from URL</button>
							<UrlInputModal open={showUrlModal} onClose={() => setUrlShowModal(false)} onSubmit={handleUrlPaste} />
						</div> */}

						{/* Edit History */}
						{editHistory.length > 0 && (
							<div className="!bg-black/50 border-shadow-blur mt-6 p-6 rounded-xl border border-white/35 mb-4">
								<h2 className="text-xl font-semibold mb-4">Edit History</h2>
								<div className="space-y-3 max-h-96 overflow-y-auto pr-2">
									{editHistory.map((item, index) => (
										<div key={item.timestamp} className={`flex items-center p-2 rounded-lg hover:bg-zinc-900 cursor-pointer ${image?.timestamp === item.timestamp ? "bg-zinc-800 border border-pink-500" : ""}`} onClick={() => selectHistoryItem(item)}>
											<div className="size-16 flex-shrink-0 bg-black/25 rounded overflow-hidden mr-3">
												<SmartImage src={item.url} alt={`History ${index}`} className="h-full w-full object-cover" />
											</div>
											<div className="w-2/4 flex-grow">
												<p className="text-sm truncate max-w-full">{item.name || `Edit ${index + 1}`}</p>
												<p className="text-xs text-zinc-400">{new Date(item.timestamp).toLocaleTimeString()}</p>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			</div>
		</div>
	);
}

export default ImageEditorPage;