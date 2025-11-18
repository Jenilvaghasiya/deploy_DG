import { useState, useEffect } from "react";
import { AiOutlinePlus, AiOutlineClose, AiOutlineTag } from "react-icons/ai";
import {Button} from "../../components/ui/button";
import InputField from "../../components/InputField";
import api, { multipartRequest } from "../../api/axios.js";
import Select from "../../components/Select.jsx";
import { fetchProjects } from "../../features/projects/projectService.js";
import Loader from "../../components/Common/Loader.jsx";
import TagSuggestions from "./TagSuggestions";
import TagsInput from "@/components/TagInput";
import SmartImage from "@/components/SmartImage";
import toast from 'react-hot-toast';
import NSFWWarningModal from "@/components/NSFWWarningModal";
import { useNSFWDetection } from "@/service/useNSFWFilter";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

function EditMoodboardForm({ moodboardId, onCancel, isSharedWithMe, isSharedWithOthers }) {
	const [images, setImages] = useState([]);
	const [removedImageIds, setRemovedImageIds] = useState([]);
	const [isFocused, setIsFocused] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		project_ids: [],
		comment: "",
		notes: "",
	});
	const [projectOptions, setProjectOptions] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [dragOver, setDragOver] = useState(false);
	const [textData, setTextData] = useState([]);
	const [newText, setNewText] = useState("");
	const [newTextSource, setNewTextSource] = useState("");
	const [newTextTags, setNewTextTags] = useState("");
	const [showAddTextInput, setShowAddTextInput] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isProcessingUrls, setIsProcessingUrls] = useState(false);
	const [processedUrls, setProcessedUrls] = useState([]);
	const { checkImage, isModelLoading, modelError, isReady } = useNSFWDetection();
	const [nsfwModalOpen, setNSFWModalOpen] = useState(false);
	const [nsfwFileName, setNSFWFileName] = useState("");
	const [isCheckingNSFW, setIsCheckingNSFW] = useState(false);

	// Function to check if URL is an image
	const isImageUrl = (url) => {
		const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
		return imageExtensions.test(url);
	};

	// Function to extract URLs from text
	const extractUrls = (text) => {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.match(urlRegex) || [];
	};

	// Function to fetch image from URL using backend proxy
	const fetchImageFromUrl = async (url) => {
		try {
			// Make API call to backend endpoint
			const response = await api.post(`/moodboards/fetch-image-from-url`, {
				url: url
			});
			
			// Check if the response is successful
			if (!response.data) {
				throw new Error('No data received from backend');
			}
			
			const { buffer, contentType, filename } = response.data.data;

			// Convert buffer to blob
			const blob = new Blob([new Uint8Array(buffer.data)], { type: contentType });
			
			// Double-check it's an image
			if (!contentType.startsWith('image/')) {
				throw new Error('Response is not an image');
			}
			
			// Create File object from blob
			const file = new File([blob], filename, { type: contentType });

			if (isReady) {
				const result = await checkImage(file);
				if (result.isNSFW) {
					console.warn(`NSFW content detected in URL image ${filename}:`, {
						reason: result.reason,
						score: result.score
					});
					toast.error(`Image from URL rejected: ${result.reason}`);
					return null;
				}
			}
			
			return {
				file,
				preview: URL.createObjectURL(blob),
				description: "",
				source: url,
				tags: "",
				fromUrl: true,
				isExisting: false
			};
		} catch (error) {
			console.error('Error fetching image from URL via backend:', url, error.message);
			return null;
		}
	};

	// Function to process URLs in text and extract images
	const processUrlsInText = async (text) => {
		const urls = extractUrls(text);
		const imageUrls = urls;

		if (imageUrls?.length === 0) return;

		// Filter out already processed URLs
		const newUrls = imageUrls?.filter(url => !processedUrls.includes(url));
		if (newUrls.length === 0) return;

		setIsProcessingUrls(true);

		try {
			const imagePromises = newUrls.map(url => fetchImageFromUrl(url));
			const fetchedImages = await Promise.all(imagePromises);

			const validImages = fetchedImages.filter(img => img !== null);
			if (validImages.length > 0) {
				setImages(prev => [...prev, ...validImages]);
				setProcessedUrls(prev => [...prev, ...newUrls]);
			}
		} catch (error) {
			console.error("Error processing image URLs:", error);
		} finally {
			setIsProcessingUrls(false);
		}
	};

	// Debounced URL processing
	useEffect(() => {
		if (!newText.trim()) return;

		const timeoutId = setTimeout(() => {
			processUrlsInText(newText);
		}, 1000); // Wait 1 second after user stops typing

		return () => clearTimeout(timeoutId);
	}, [newText]);

	useEffect(() => {
		const fetchProjectOptions = async () => {
			try {
				const response = await fetchProjects();
				const projects = response.map((project) => ({
					id: project?.id,
					label: project?.name,
				}));
				setProjectOptions(projects);
			} catch (err) {
				setError(
					err.response?.data?.message || "Failed to fetch projects"
				);
			}
		};

		fetchProjectOptions();
	}, []);

	useEffect(() => {
		const fetchMoodboard = async () => {
			try {
				const response = await api.get(`/moodboards/${moodboardId}`, {
					params: { populate: true },
				});

				const moodboard = response?.data?.data;
				console.log(moodboard, 'moodboard.images');

				setFormData({
					name: moodboard?.name || "",
					project_ids:
						moodboard?.project_ids?.map((project) => ({
							id: project?.id,
							label: project?.name,
						})) || [],
					comment: moodboard?.comment || "",
					notes: moodboard?.notes || "",
				});

				setImages(
					moodboard?.gallery_images?.map((img) => ({
						_id: img?._id,
						galleryImage: img?.galleryImage?._id,
						name: img?.name || "",
						url: img?.galleryImage?.url,
						description: img?.description || "",
						source: img?.source || "",
						tags: img?.tags?.join(', ') || "",
						isExisting: true,
					})) || []
				);

				setTextData(
					moodboard?.textData?.map((item) => ({
						text: item?.text,
						source: item?.source || "",
						tags: item?.tags?.join(', ') || "",
					})) || []
				);

				setLoading(false);
			} catch (err) {
				console.log('Error fetching moodboard images:', err);
				setError(
					err?.response?.data?.message || "Failed to fetch moodboard"
				);
				setLoading(false);
			}
		};

		fetchMoodboard();
	}, [moodboardId]);


	useEffect(() => {
		return () => {
			images.forEach((img) => {
				if (!img.isExisting && img.preview) {
					URL.revokeObjectURL(img.preview);
				}
			});
		};
	}, [images]);

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
			if (!file || !file.type) continue;
			
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
				setNSFWFileName(nsfw[0].file.name);
				setNSFWModalOpen(true);
				toast.error(`${nsfw.length} image(s) rejected due to inappropriate content`);
			}

			if (safe.length > 0) {
				const newImages = safe.map((file) => ({
					file,
					preview: URL.createObjectURL(file),
					description: "",
					source: "",
					tags: "",
					isExisting: false,
				}));
				setImages((prev) => [...prev, ...newImages]);
				
				if (nsfw.length > 0) {
					toast.success(`${safe.length} safe image(s) added`);
				}
			}
		}
	};

	// Updated handleAddText to clear processed URLs
	const handleAddText = () => {
		if (newText.trim()) {
			setTextData((prev) => [
				...prev, 
				{ 
					text: newText.trim(),
					source: newTextSource.trim(),
					tags: newTextTags.trim()
				}
			]);
			setNewText("");
			setNewTextSource("");
			setNewTextTags("");
			setProcessedUrls([]); // Clear processed URLs
			setShowAddTextInput(false);
		}
	};

	const handleRemoveText = (index) => {
		setTextData((prev) => prev.filter((_, i) => i !== index));
	};

	const handleImageChange = async (e) => {
		const files = Array.from(e.target.files);
		
		if (files.length === 0) return;

		const { safe, nsfw } = await checkImagesForNSFW(files);
		
		if (nsfw.length > 0) {
			setNSFWFileName(nsfw[0].file.name);
			setNSFWModalOpen(true);
			toast.error(`${nsfw.length} image(s) rejected due to inappropriate content`);
		}

		if (safe.length > 0) {
			const newImages = safe.map((file) => ({
				file,
				preview: URL.createObjectURL(file),
				description: "",
				source: "",
				tags: "",
				isExisting: false,
			}));
			setImages((prev) => [...prev, ...newImages]);
			
			if (nsfw.length > 0) {
				toast.success(`${safe.length} safe image(s) added`);
			}
		}
		
		e.target.value = '';
	};

	const handleRemoveImage = (index) => {
		const image = images[index];
		if (image.isExisting) {
			setRemovedImageIds((prev) => [...prev, image._id]);
		} else {
			URL.revokeObjectURL(image.preview);
		}
		setImages((prev) => prev.filter((_, i) => i !== index));
	};

	const handleDescriptionChange = (index, value) => {
		setImages((prev) =>
			prev.map((img, i) =>
				i === index ? { ...img, description: value } : img
			)
		);
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	// Utility to split text into links and non-links
	function parseTextWithLinks(text) {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		const parts = text.split(urlRegex); // This will split into text and links
		return parts.map((part, index) => {
			if (urlRegex.test(part)) {
				return (
					<a
						key={index}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-400 underline hover:text-blue-300"
					>
						{part}
					</a>
				);
			}
			return <span key={index}>{part}</span>;
		});
	}

	// Add handlers for source and tags
	const handleImageFieldChange = (index, field, value) => {
		setImages((prev) =>
			prev.map((img, i) =>
				i === index ? { ...img, [field]: value } : img
			)
		);
	};

	const handleTextDataFieldChange = (index, field, value) => {
		setTextData((prev) =>
			prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
		);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!formData?.name?.trim()) {
			setError("Moodboard name is required.");
			return; // Stop submit
		}

		setIsEditing(true);

		try {
			const data = new FormData();
			data.append("name", formData?.name);
			data.append(
				"project_ids",
				JSON.stringify(formData?.project_ids?.map((p) => p?.id) || [])
			);
			data.append("comment", formData?.comment || "");
			data.append("notes", formData?.notes || "");

			// Process images
			const newImages = images?.filter((img) => !img?.isExisting) || [];
			const existingImages = images?.filter((img) => img) || [];
			console.log(images, 'images');

			for (let i = 0; i < images.length; i++) {
			const img = images[i];
			if (!img.description?.trim()) {
				toast.error(`Description is required for image #${i + 1}`);
				return;
			}
			}
			// For new images
			newImages.forEach((img, index) => {
				data.append("images", img?.file);
				data.append(`descriptions[${index}]`, img?.description || "");
				data.append(`sources[${index}]`, img?.source || "");
				data.append(`tags[${index}]`, img?.tags || "");
			});

			// For existing images
			const processedExistingImages = existingImages.map((img) => ({
				_id: img?._id,
				description: img?.description || "",
				source: img?.source || "",
				tags: img?.tags || "",
				galleryImage: img?.galleryImage,
				name: img?.name || "",
			}));
			data.append("existingImages", JSON.stringify(processedExistingImages));

			// For removed images
			data.append("removedImageIds", JSON.stringify(removedImageIds || []));

			// Process text data
			textData?.forEach((item, index) => {
				data.append(`textData[${index}][text]`, item?.text || "");
				data.append(`textData[${index}][source]`, item?.source || "");
				data.append(`textData[${index}][tags]`, item?.tags || "");
			});

			const response = await multipartRequest.put(
				`/moodboards/${moodboardId}`,
				data
			);
			console.log("Moodboard updated successfully:", response?.data);
			onCancel?.();
		} catch (err) {
			setError(err?.response?.data?.message || "Failed to update moodboard");
		} finally {
			setIsEditing(false);
		}
	};


	if (loading) {
		return <Loader />;
	}

	return (
		<div
			className={`space-y-6 pb-4 ${dragOver ? "bg-zinc-900/50" : ""}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
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
				<div className="bg-red-900/20 border border-red-600 rounded-lg p-3 text-red-400 text-sm mb-4">
					Content safety check unavailable. Images will be uploaded without screening.
				</div>
			)}
			{dragOver && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 pointer-events-none">
					<div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center">
						<AiOutlinePlus
							size={48}
							className="text-white mx-auto mb-4"
						/>
						<p className="text-white text-xl font-semibold">
							Drop images here to add to moodboard
						</p>
						{isReady && (
							<p className="text-white/80 text-sm mt-2">
								Images will be checked for inappropriate content
							</p>
						)}
					</div>
				</div>
			)}

			<div className="bg-zinc-950 p-6 rounded-xl border border-zinc-900 mb-4">
				<h2 className="text-xl font-semibold mb-6">
					Edit Moodboard Images
				</h2>
				{error && <div className="text-red-500 mb-4">{error}</div>}
				
				{/* Show processing indicator */}
				{isProcessingUrls && (
					<div className="text-blue-400 mb-4 flex items-center">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
						Processing image URLs...
					</div>
				)}

				<div
					className={`grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-3 p-4 rounded-lg border-2 border-dashed transition-colors ${dragOver
							? "border-pink-500 bg-zinc-800/50"
							: "border-zinc-800"
						}`}
				>
					{images.map((img, index) => (
						<div
							key={img._id || `new-${index}`}
							className="group relative bg-zinc-900 border border-solid border-gray-800 flex flex-col"
						>
							<SmartImage
								src={img.preview || img.url}
								alt={`Image ${index + 1}`}
								className="w-full h-40 object-cover aspect-square rounded-t-lg"
							/>
							{/* Show indicator if image came from URL */}
							{img.fromUrl && (
								<div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
									URL
								</div>
							)}
							<button
								className="bg-black bg-opacity-50 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 z-[2]"
								onClick={() => handleRemoveImage(index)}
							>
								<AiOutlineClose
									size={16}
									className="text-white"
								/>
							</button>
							<div className="w-full bg-black bg-opacity-50 text-white text-sm p-2 space-y-1">
								<input
									type="text"
									placeholder="Description"
									value={img.description}
									onChange={(e) =>
										handleImageFieldChange(index, 'description', e.target.value)
									}
									className="w-full bg-transparent outline-none text-zinc-300 py-2 border-b border-solid border-gray-600"
									required
								/>
								<input
									type="text"
									placeholder="Source (e.g. Vogue Magazine)"
									value={img.source}
									onChange={(e) =>
										handleImageFieldChange(index, 'source', e.target.value)
									}
									className="w-full bg-transparent outline-none text-zinc-300 py-2 border-b border-solid border-gray-600"
								/>
								<div className="flex flex-wrap items-center gap-3 py-2">
									<AiOutlineTag className="size-5 shrink-0" />
									<TagsInput
										value={img.tags}
										onChange={(e) => handleImageFieldChange(index, 'tags', e.target.value)}
										onFocus={() => setIsFocused("one")}
										placeholder="Add tag"
									/>
								</div>
							</div>
						</div>
					))}
					<label className="aspect-square flex items-center justify-center bg-zinc-950 rounded-lg border-2 border-dashed border-zinc-800 cursor-pointer hover:bg-zinc-900 transition-colors">
						<input
							type="file"
							accept="image/jpeg,image/png"
							multiple
							onChange={handleImageChange}
							className="hidden"
							disabled={isCheckingNSFW}
						/>
						<div className="flex flex-col items-center">
							<AiOutlinePlus
								size={24}
								className="text-pink-500 mb-2"
							/>
							<span className="text-sm text-zinc-400">
								{isCheckingNSFW ? "Checking..." : "Add Image"}
							</span>
						</div>
					</label>
				</div>
				{images.length === 0 && !dragOver && (
					<p className="text-center text-zinc-500 mt-4">
						Drag and drop images here or click "Add Image" to upload
					</p>
				)}
			</div>
			
			{/* Existing textData preview */}
			<h2 className="text-xl font-semibold mb-4 mt-6">Edit Text Snippets</h2>

			<div className="space-y-4 mb-4">
				{textData.length === 0 ? (
					<div className="text-zinc-400 text-center p-4 bg-zinc-900 rounded-xl border border-zinc-800">
						No text snippets added yet
					</div>
				) : (
					textData.map((item, index) => (
						<div
							key={index}
							className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl"
						>
							<div className="flex justify-between items-start mb-3">
								<div className="text-zinc-200 pr-2 break-words">
									{parseTextWithLinks(item.text)}
								</div>
								<button
									type="button"
									className="text-red-500 hover:text-red-400 p-1 rounded-full bg-white flex-shrink-0 ml-2"
									onClick={() => handleRemoveText(index)}
								>
									<AiOutlineClose size={16} />
								</button>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								<div>
									<label className="text-xs text-zinc-300 block mb-1">Source</label>
									<input
										type="text"
										placeholder="Where is this from? (e.g. Mahatma Gandhi)"
										value={item.source}
										onChange={(e) =>
											handleTextDataFieldChange(index, 'source', e.target.value)
										}
										className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
									/>
								</div>

								<div>
									<label className="text-xs text-zinc-400 mb-1 flex items-center">
										<AiOutlineTag className="mr-1" /> Tags
									</label>
									<TagsInput
										value={item.tags}
										onChange={(e) => handleTextDataFieldChange(index, 'tags', e.target.value)}
										onFocus={() => setIsFocused("two")}
										placeholder="Comma separated tags"
										inputClass="py-1.5"
									/>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Add New Text Input */}
			<div className="mb-6">
				{showAddTextInput ? (
					<div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
						<div className="mb-3">
							<label className="block text-sm font-medium text-zinc-300 mb-1">
								Add New Text Snippet
							</label>
							<div className="relative">
								<textarea
									value={newText}
									onChange={(e) => setNewText(e.target.value)}
									placeholder="Paste your text here... (Images from URLs will be automatically detected and added)"
									className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-purple-500 focus:outline-none"
								/>
								{isProcessingUrls && (
									<div className="absolute bottom-2 right-2 text-blue-400 text-xs flex items-center">
										<div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400 mr-1"></div>
										Detecting images...
									</div>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
							<div>
								<label className="text-xs text-zinc-400 block mb-1">Source</label>
								<input
									type="text"
									placeholder="Where is this from?"
									value={newTextSource}
									onChange={(e) => setNewTextSource(e.target.value)}
									className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
								/>
							</div>

							<div>
								<label className="text-xs text-zinc-400 mb-1 flex items-center">
									<AiOutlineTag className="mr-1" /> Tags
								</label>
								<TagsInput
									value={newTextTags}
									onChange={(e) => setNewTextTags(e.target.value)}
									onFocus={() => setIsFocused("three")}
									placeholder="Add tag"
									inputClass="py-1.5"
								/>
							</div>
						</div>

						<div className="flex gap-2">
							<Button
								variant="dg_btn"
								onClick={handleAddText}
								className="!w-fit"
							>
								Add Text
							</Button>
							<Button
								variant="secondary"
								onClick={() => {
									setShowAddTextInput(false);
									setNewText("");
									setNewTextSource("");
									setNewTextTags("");
									setProcessedUrls([]); // Clear processed URLs
								}}
								className="!w-fit"
							>
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<Button variant="secondary" className="!w-fit min-w-40 !mx-auto" onClick={() => setShowAddTextInput(true)}>
						+ Add Text Snippet
					</Button>
				)}
			</div>

			<div className="bg-zinc-950 p-6 rounded-xl border border-zinc-900 mb-4">
				<div className="max-w-xl space-y-3">
					<h2 className="text-xl font-semibold mb-4">
						Moodboard Details
					</h2>
					<InputField
						label="Name"
						name="name"
						placeholder="Enter moodboard name"
						value={formData.name}
						onChange={handleInputChange}
					/>
					{/* <Select
						label="Projects"
						name="project_ids"
						options={projectOptions}
						value={formData.project_ids}
						onChange={(options) =>
							setFormData((prev) => ({
								...prev,
								project_ids: options || [],
							}))
						}
						placeholder="Select projects (optional)"
						multiSelect={true}
					/> */}
					<InputField
						label="Description"
						name="comment"
						placeholder="Write vision, idea or reason here (optional)"
						value={formData.comment}
						onChange={handleInputChange}
					/>
					<InputField
						label="Notes"
						name="notes"
						placeholder="Working Notes (Optional)"
						value={formData.notes}
						onChange={handleInputChange}
					/>
				</div>
			</div>

			<div className="flex justify-center gap-4">
				<Button
					variant="dg_btn"
					onClick={handleSubmit}
					fullWidth={false}
					loading={isEditing}
					loadingText="Saving..."
				>
					Save Changes
				</Button>
				<Button
					variant="secondary"
					onClick={onCancel}
					fullWidth={false}
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}

export default EditMoodboardForm;