import { useEffect, useState } from "react";
import { AiOutlinePlus, AiOutlineClose, AiOutlineTag } from "react-icons/ai";
import {Button} from "../../components/ui/button";
import InputField from "../../components/InputField";
import api, { multipartRequest } from "../../api/axios.js";
import Select from "../../components/Select.jsx";
import { fetchProjects } from "../../features/projects/projectService.js";
import TagSuggestions from "./TagSuggestions";
import TagsInput from "@/components/TagInput";
import SmartImage from "@/components/SmartImage";
import toast from "react-hot-toast";
import { useNSFWDetection } from "@/service/useNSFWFilter";
import NSFWWarningModal from "@/components/NSFWWarningModal";

function CreateMoodboardForm({ onCancel }) {
	const [images, setImages] = useState([]);
	const [isFocused, setIsFocused] = useState("");
	const [formData, setFormData] = useState({
		name: "",
		project_ids: [],
		comment: "",
		notes: "",
		textData: []
	});
	const [projectOptions, setProjectOptions] = useState([]);
	const [error, setError] = useState(null);
	const [dragOver, setDragOver] = useState(false);
	const [newText, setNewText] = useState("");
	const [newTextSource, setNewTextSource] = useState("");
	const [newTextTags, setNewTextTags] = useState("");
	const [showAddTextInput, setShowAddTextInput] = useState(false);
	const [isProcessingUrls, setIsProcessingUrls ] = useState(false);
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
				// Skip if it's not a file object (for URL-fetched images that are already processed)
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

	// Frontend function to fetch image via backend API
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
			
			// Check for NSFW content
			if (isReady) {
				const result = await checkImage(file);
				if (result.isNSFW) {
					console.warn(`NSFW content detected in URL image ${filename}:`, {
						reason: result.reason,
						score: result.score
					});
					toast.error(`Image from URL rejected: ${result.reason}`);
					return null; // Return null for NSFW images
				}
			}
			
			return {
				file,
				preview: URL.createObjectURL(blob),
				description: "",
				source: url,
				tags: "",
				fromUrl: true
			};
		} catch (error) {
			console.error('Error fetching image from URL via backend:', url, error.message);
			return null;
		}
	};

	// Function to process URLs in text and extract images
	const processUrlsInText = async (text) => {
	const urls = extractUrls(text);
	const imageUrls = urls.filter(isImageUrl);

	if (imageUrls.length === 0) return;

	// Filter out already processed URLs
	const newUrls = imageUrls.filter(url => !processedUrls.includes(url));
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

	console.log(newText,'newText')
	useEffect(() => {
		const fetchProjectOptions = async () => {
			try {
				const response = await fetchProjects();
				const projects = response.map((project) => ({
					id: project.id,
					label: project.name,
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
		return () => {
			images.forEach((img) => URL.revokeObjectURL(img.preview));
		};
	}, [images]);

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
					source: "",
					tags: "",
				}));
				setImages((prev) => [...prev, ...newImages]);
				
				if (nsfw.length > 0) {
					toast.success(`${safe.length} safe image(s) added`);
				}
			}
		}
	};

	// Update handleAddText
	const handleAddText = () => {
	if (newText.trim()) {
		setFormData((prev) => ({
			...prev,
			textData: [
				...prev.textData, 
				{ 
					text: newText.trim(), 
					source: newTextSource.trim(), 
					tags: newTextTags.trim() 
				}
			],
		}));
		setNewText("");
		setNewTextSource("");
		setNewTextTags("");
		setProcessedUrls([]); // <--- Clear processed URLs
		setShowAddTextInput(false);
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
				source: "",
				tags: "",
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

	// Update handler for image fields
	const handleImageFieldChange = (index, field, value) => {
		setImages((prev) =>
			prev.map((img, i) =>
				i === index ? { ...img, [field]: value } : img
			)
		);
	};

	// Update handler for textData fields
	const handleTextDataFieldChange = (index, field, value) => {
		setFormData((prev) => {
			const newTextData = [...prev.textData];
			newTextData[index] = { ...newTextData[index], [field]: value };
			return { ...prev, textData: newTextData };
		});
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

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			setError("Moodboard name is required.");
			return; // Stop submit
		}

		try {
			const data = new FormData();
			data.append("name", formData.name);
			data.append(
				"project_ids",
				JSON.stringify(formData.project_ids.map((p) => p.id))
			);
			data.append("comment", formData.comment);
			data.append("notes", formData.notes);
			// Append textData with source and tags
			formData.textData.forEach((item, index) => {
				data.append(`textData[${index}][text]`, item.text);
				data.append(`textData[${index}][source]`, item.source);
				data.append(`textData[${index}][tags]`, item.tags);
			});
			for (let i = 0; i < images.length; i++) {
			const img = images[i];
			if (!img.description?.trim()) {
				toast.error(`Description is required for image #${i + 1}`);
				return;
			}
			}
			// Append image metadata
			images.forEach((img, index) => {
				data.append("images", img.file);
				data.append(`descriptions[${index}]`, img.description);
				data.append(`sources[${index}]`, img.source);
				data.append(`tags[${index}]`, img.tags);
			});

			const response = await multipartRequest.post("/moodboards", data);
			console.log("Moodboard created:", response.data);
			onCancel();
		} catch (err) {
			setError(
				err.response?.data?.message || "Failed to create moodboard"
			);
		}
	};

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

	return (
		<div className={`space-y-6 pb-4 ${dragOver ? "bg-zinc-900/50" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
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
				<div className="bg-red-900/20 border border-red-600 rounded-lg p-3 text-red-400 text-sm mb-4">
					Content safety check unavailable. Images will be uploaded without screening.
				</div>
			)}
			{dragOver && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 pointer-events-none">
					<div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-8 text-center">
						<AiOutlinePlus size={48} className="text-white mx-auto mb-4" />
						<p className="text-white text-xl font-semibold">Drop images here to add to moodboard</p>
						{isReady && (
							<p className="text-white/80 text-sm mt-2">
								Images will be checked for inappropriate content
							</p>
						)}
					</div>
				</div>
			)}
			<div className="border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur p-6 mb-4">
				<h2 className="text-xl font-semibold mb-6">Add Images to Moodboard</h2>
				{error && <div className="text-red-500 mb-4">{error}</div>}
				
				{/* Show processing indicator */}
				{isProcessingUrls && (
					<div className="text-blue-400 mb-4 flex items-center">
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
						Processing image URLs...
					</div>
				)}

				<div className={`grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-3 p-4 rounded-lg border-2 border-dashed transition-colors ${dragOver ? "border-pink-500 bg-zinc-500" : "border-zinc-500"}`}>
					{images.map((img, index) => (
						<div key={index} className="group relative bg-zinc-500 border border-solid border-gray-400 flex flex-col">
							<SmartImage
								src={img.preview}
								alt={`Preview ${index + 1}`}
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
					<label className="aspect-square flex items-center justify-center border-2 border-dashed shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur cursor-pointer hover:bg-zinc-900 transition-colors">
						<input type="file" accept="image/jpeg,image/png" multiple onChange={handleImageChange} className="hidden" disabled={isCheckingNSFW}/>
						<div className="flex flex-col items-center">
							<AiOutlinePlus size={24} className="text-pink-500 mb-2" />
							<span className="text-sm text-zinc-400">
								{isCheckingNSFW ? "Checking..." : "Add Image"}
							</span>
						</div>
					</label>
				</div>
				{images.length === 0 && !dragOver && (
					<p className="text-center text-zinc-200 mt-4">Drag and drop images here or click "Add Image" to upload</p>
				)}
			</div>
			<h2 className="text-xl font-semibold mb-4 mt-6">Add Text Snippets</h2>

			{/* Updated Text Snippets Preview */}
			<div className="space-y-4 mb-4">
				{formData.textData.length === 0 ? (
					<div className="text-zinc-200 text-center p-4 border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur">
						No text snippets added yet
					</div>
				) : (
					formData.textData.map((item, index) => (
						<div
							key={index}
							className="border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur"
						>
							<div className="flex justify-between items-start mb-3">
								<div className="text-zinc-200 pr-2 break-words">
									{parseTextWithLinks(item.text)}
								</div>
								<button
									type="button"
									className="text-red-500 hover:text-red-400 p-1 rounded-full bg-white flex-shrink-0 ml-2"
									onClick={() =>
										setFormData(prev => ({
											...prev,
											textData: prev.textData.filter((_, i) => i !== index),
										}))
									}
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
										className="w-full bg-black/10 border border-solid border-zinc-500 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
										placeholder="Add tag"
									/>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Updated Add Text Input */}
			<div className="mb-6">
				{showAddTextInput ? (
					<div className="p-4 border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur">
						<div className="mb-3">
							<label className="block text-sm font-medium text-zinc-200 mb-1">Add New Text Snippet</label>
							<div className="relative">
								<textarea
									value={newText}
									onChange={(e) => setNewText(e.target.value)}
									placeholder="Paste your text here... (Images from URLs will be automatically detected and added)"
									className="w-full px-3 py-2 text-sm min-h-24 border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
								<label className="text-xs text-zinc-200 block mb-1">Source</label>
								<input type="text" placeholder="Where is this from?" value={newTextSource} onChange={(e) => setNewTextSource(e.target.value)} className="w-full rounded-lg bg-black/10 border border-solid border-zinc-500 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none" />
							</div>

							<div>
								<label className="text-xs text-zinc-400 mb-1 flex items-center">
									<AiOutlineTag className="mr-1" /> Tags
								</label>
								<TagsInput value={newTextTags} onChange={(e) => setNewTextTags(e.target.value)} onFocus={() => setIsFocused("three")} placeholder="Comma separated tags" inputClass="py-2  bg-black/10 rounded-lg border border-solid border-zinc-500" />
							</div>
						</div>

						<div className="flex gap-2">
							<Button variant="dg_btn" onClick={handleAddText} className="!w-fit">Add Text</Button>
							<Button variant="secondary" onClick={() => {setShowAddTextInput(false); setNewText(""); setNewTextSource(""); setNewTextTags(""); setProcessedUrls([]); }} className="!w-fit">Cancel</Button>
						</div>
					</div>
				) : (
					<Button variant="secondary" onClick={() => setShowAddTextInput(true)} className="!w-fit min-w-40 !mx-auto">+ Add Text Snippet</Button>
				)}
			</div>

			<div className="border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur p-6 mb-4">
				<div className="space-y-3">
					<h2 className="text-xl font-semibold mb-4">Moodboard Details</h2>
					<div className="grid md:grid-cols-2 gap-4">
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
			</div>

			<div className="flex justify-center gap-4">
				<Button
					variant="dg_btn"
					onClick={handleSubmit}
					fullWidth={false}
				>
					Save Moodboard
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

export default CreateMoodboardForm;