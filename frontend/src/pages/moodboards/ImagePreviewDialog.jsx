// components/ImagePreviewDialog.jsx
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { AiOutlineTag } from "react-icons/ai";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { MdHd } from "react-icons/md";
import toast from "react-hot-toast";
import { ZoomIn, ZoomOut, Maximize2, Move, Loader2 } from "lucide-react";
import OutlineModeSelector from "./OutlineModeSelector";

// HD Scaling Loader Component
const HDScalingLoader = ({ size = 80 }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 430 430" 
          xmlns="http://www.w3.org/2000/svg"
          className="animate-spin"
          style={{ animationDuration: '7s' }}
        >
          <defs>
            <clipPath id="__lottie_element_16">
              <rect width="430" height="430" x="0" y="0"/>
            </clipPath>
          </defs>
          <g clipPath="url(#__lottie_element_16)">
            <g opacity="1" transform="matrix(1,0,0,1,250,100.12100219726562)">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fillOpacity="0" 
                stroke="rgb(246,51,154)" 
                strokeOpacity="1" 
                strokeWidth="12.04" 
                d="M58.25709533691406,9.58665943145752 C58.25709533691406,9.965660095214844 58.25209426879883,10.345234870910645 58.2360954284668,10.724235534667969 C57.84809494018555,22.398235321044922 51.424095153808594,32.94623565673828 41.23909378051758,40.662235260009766 C36.72609329223633,43.30523681640625 5.840848922729492,19.638669967651367 0.0008489544270560145,10.779670715332031 C-5.839150905609131,19.638669967651367 -36.71590805053711,43.30523681640625 -41.228904724121094,40.662235260009766 C-51.41390609741211,32.94623565673828 -57.83748245239258,22.398235321044922 -58.22548294067383,10.724235534667969 C-58.24148178100586,10.345234870910645 -58.246482849121094,9.965660095214844 -58.246482849121094,9.58665943145752 C-58.246482849121094,9.207659721374512 -58.24148178100586,8.828235626220703 -58.22548294067383,8.449234962463379 C-57.83748245239258,-3.224764823913574 -51.41390609741211,-13.772340774536133 -41.228904724121094,-21.488340377807617 C-30.68190574645996,-29.46234130859375 -16.10490608215332,-34.39776611328125 0.005093726329505444,-34.39776611328125 C16.115093231201172,-34.39776611328125 30.692092895507812,-29.46234130859375 41.23909378051758,-21.488340377807617 C51.424095153808594,-13.772340774536133 57.84809494018555,-3.224764823913574 58.2360954284668,8.449234962463379 C58.25209426879883,8.828235626220703 58.25709533691406,9.207659721374512 58.25709533691406,9.58665943145752z"
                className="animate-pulse"
              />
            </g>
          </g>
        </svg>
      </div>
      
      <div className="mt-3 text-center">
        <div className="text-[#f6339a] font-medium text-sm animate-pulse">
          Scaling to HD...
        </div>
        <div className="flex justify-center mt-2 space-x-1">
          <div className="w-1.5 h-1.5 bg-[#f6339a] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 bg-[#ad46ff] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 bg-[#f6339a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

// Outline Mode Selection Component
// const OutlineModeSelector = ({ onSelect, onCancel }) => {
//   const modes = [
//     {
//       id: 'base',
//       title: 'Base',
//       description: 'Simple silhouette outline',
//       features: ['Fast processing', 'Basic garment shape', 'Quick results'],
//       icon: '📋'
//     },
//     {
//       id: 'advanced',
//       title: 'Advanced',
//       description: 'Structural details included',
//       features: ['Better accuracy', 'Seams & stitching', 'Moderate detail'],
//       icon: '⚙️',
//       recommended: false
//     },
//     {
//       id: 'professional',
//       title: 'Professional',
//       description: 'Complete technical flat',
//       features: ['Highest detail level', 'All hardware & trims', 'Production ready'],
//       icon: '🏆',
//       recommended: true
//     }
//   ];

//   return (
//     <div className="space-y-4 p-4">
//       <div className="text-center mb-6">
//         <h3 className="text-lg font-semibold mb-2">Select Outline Mode</h3>
//         <p className="text-sm text-gray-400">Choose the level of detail for your garment outline</p>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {modes.map((mode) => (
//           <div
//             key={mode.id}
//             onClick={() => onSelect(mode.id)}
//             className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg hover:scale-105 ${
//               mode.recommended 
//                 ? 'border-purple-500 bg-purple-500/10' 
//                 : 'border-slate-600 bg-slate-800/50 hover:border-purple-400'
//             }`}
//           >
//             {mode.recommended && (
//               <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
//                 <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
//                   RECOMMENDED
//                 </span>
//               </div>
//             )}
            
//             <div className="text-center mb-3">
//               <div className="text-4xl mb-2">{mode.icon}</div>
//               <h4 className="font-semibold text-white">{mode.title}</h4>
//               <p className="text-xs text-gray-400 mt-1">{mode.description}</p>
//             </div>
            
//             <ul className="space-y-2">
//               {mode.features.map((feature, idx) => (
//                 <li key={idx} className="flex items-start gap-2 text-sm">
//                   <span className="text-green-500 mt-0.5">✓</span>
//                   <span className="text-gray-300">{feature}</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </div>
      
//       <div className="flex justify-center gap-3 mt-6">
//         <Button
//           onClick={onCancel}
//           variant="outline"
//           className="bg-slate-700 hover:bg-slate-600"
//         >
//           Cancel
//         </Button>
//       </div>
//     </div>
//   );
// };

// Outline Generation Loader
const OutlineGenerationLoader = ({ mode, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-3xl">
          ✨
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <h3 className="text-lg font-semibold text-white">
          Generating {mode?.charAt(0).toUpperCase() + mode?.slice(1)} Outline
        </h3>
        <p className="text-sm text-gray-400">
          {progress === 'queued' ? 'Task queued, waiting for processing...' : 
           progress === 'processing' ? 'Processing your garment outline...' :
           'Initializing...'}
        </p>
        
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

function ImagePreviewDialog({
  imageUrl,
  imageData,
  children,
  customButton,
  enableHD = false,
  isSharedWithMe = false,
  galleryImageId,
  onOutlineGenerated
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hdLoading, setHdLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const [isHD, setIsHD] = useState(false);
  
  // Outline feature states
  const [showOutline, setShowOutline] = useState(false);
  const [outlineUrl, setOutlineUrl] = useState(imageData?.outline_image || null);
  const [outlineMode, setOutlineMode] = useState(imageData?.outline_mode || null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [outlineProgress, setOutlineProgress] = useState('idle');

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const pollIntervalRef = useRef(null);
  const fallbackUrl = "https://g-mxtlc2zquep.vusercontent.net/placeholder.svg";

   const handleModeSelect = (mode) => {
    startOutlineGeneration(mode);
  };
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Check for pending outline task on mount
  useEffect(() => {
    if (imageData?.outline_task_id && !imageData?.outline_image) {
      checkPendingOutlineTask();
    }
  }, [imageData]);

  // Check if there's a pending outline task
  const checkPendingOutlineTask = async () => {
    try {
      const response = await api.get(`/gallery/${galleryImageId}/outline-status`);
      const { status, outline_image, outline_mode } = response.data.data;

      if (status === 'processing' || status === 'queued') {
        setGeneratingOutline(true);
        setOutlineProgress(status);
        setOutlineMode(outline_mode);
        startPollingOutlineStatus();
      } else if (status === 'completed' && outline_image) {
        setOutlineUrl(outline_image);
        setOutlineMode(outline_mode);
      }
    } catch (error) {
      console.error('Error checking pending outline task:', error);
    }
  };

  // Start outline generation
  const startOutlineGeneration = async (mode) => {
      if (!galleryImageId) {
        toast.error('No gallery image ID provided');
        return;
      }

      try {
        setGeneratingOutline(true);
        setOutlineProgress('queued');
        setShowModeSelector(false);
        setOutlineMode(mode);

        console.log('Calling outline generation API...', { galleryImageId, mode });

        // Call backend to start outline generation
        const response = await api.post(`/gallery/${galleryImageId}/create-outline`, {
          outline_mode: mode
        });

        console.log('Outline generation response:', response);

        // ✅ FIX: Check response.data.success instead of response.data.success
        if (response.data?.success || response.status === 200) {
          toast.success('Outline generation started!');
          startPollingOutlineStatus();
        } else {
          throw new Error(response.data?.message || 'Failed to start outline generation');
        }
      } catch (error) {
        console.error('Error starting outline generation:', error);
        toast.error(error.response?.data?.message || error.message || 'Failed to start outline generation');
        setGeneratingOutline(false);
        setOutlineProgress('idle');
      }
    };

  // Poll outline status
  const startPollingOutlineStatus = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    pollIntervalRef.current = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollIntervalRef.current);
        toast.error('Outline generation timeout');
        setGeneratingOutline(false);
        setOutlineProgress('idle');
        return;
      }

      try {
        const response = await api.get(`/gallery/${galleryImageId}/outline-status`);
        const { status, outline_image, outline_mode } = response.data.data;

        setOutlineProgress(status);

        if (status === 'completed' && outline_image) {
          clearInterval(pollIntervalRef.current);
          setOutlineUrl(outline_image);
          setOutlineMode(outline_mode);
          setShowOutline(true);
          setCurrentImage(outline_image);
          setGeneratingOutline(false);
          setOutlineProgress('completed');
          toast.success('Outline generated successfully!');

          if (onOutlineGenerated) {
            onOutlineGenerated({
              outline_image,
              outline_mode
            });
          }
        } else if (status === 'failed' || status === 'error') {
          clearInterval(pollIntervalRef.current);
          toast.error('Outline generation failed');
          setGeneratingOutline(false);
          setOutlineProgress('idle');
        }
      } catch (error) {
        console.error('Error polling outline status:', error);
        clearInterval(pollIntervalRef.current);
        toast.error('Failed to check outline status');
        setGeneratingOutline(false);
        setOutlineProgress('idle');
      }
    }, 5000); // Poll every 5 seconds
  };

  // Handle outline toggle
  const handleOutlineToggle = () => {
    if (outlineUrl && !generatingOutline) {
      const newShowOutline = !showOutline;
      setShowOutline(newShowOutline);
      setCurrentImage(newShowOutline ? outlineUrl : imageUrl);
      handleFitToView();
    } else if (!outlineUrl && !generatingOutline) {
      setShowModeSelector(true);
    }
  };

  // Handle recreate outline
  const handleRecreateOutline = () => {
    setShowModeSelector(true);
  };

  // Fit to view
  const handleFitToView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 5);
    
    if (newZoom !== zoom) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const scale = newZoom / zoom;
      
      setPosition(prev => ({
        x: x + (prev.x - x) * scale,
        y: y + (prev.y - y) * scale
      }));
      
      setZoom(newZoom);
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));

  // Reset on dialog close
  const handleOpenChange = (isOpen) => {
    if (!isOpen && !hdLoading && !generatingOutline) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setCurrentImage(showOutline && outlineUrl ? outlineUrl : imageUrl);
      setIsHD(false);
      setHdLoading(false);
      setShowModeSelector(false);
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }
  };

  // Open image in new tab
  const openImageInNewTab = (src) => {
    if (src.startsWith("data:image")) {
      const byteString = atob(src.split(",")[1]);
      const mimeString = src.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } else {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  };

  // HD scaling handler
  const handleScaleToHD = async () => {
    try {
      setHdLoading(true);
      const imageName = imageUrl.split("/").pop();
      const res = await api.post("/gallery/image/scale-to-hd", { imageName });
      const data = res.data.data;

      if (res.status === 200 && data.hdImage) {
        setCurrentImage(data.hdImage);
        setIsHD(true);
      } else {
        toast.error(data.error || "Failed to scale image");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error scaling image");
    } finally {
      setHdLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(isOpen) => !hdLoading && !generatingOutline && handleOpenChange(isOpen)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-hidden !rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              Image Preview {isHD && "(HD)"} {showOutline && "(Outline)"}
            </span>
            
            {/* Outline Toggle Button */}
            {!isSharedWithMe && galleryImageId && (
              <Button
                onClick={handleOutlineToggle}
                disabled={generatingOutline}
                variant="dg_btn"
                className={`ml-2 mr-auto px-6 py-2 rounded-lg font-medium transition-all cursor-pointer 
                  ${generatingOutline
                    ? 'bg-gray-500 cursor-not-allowed text-gray-300'
                    : showOutline
                      ? 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
                      : 'bg-slate-700 text-white hover:bg-slate-800 hover:scale-105'
                  }`}
              >
                {generatingOutline && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {outlineUrl
                  ? showOutline
                    ? 'Show Original'
                    : 'Show Outline'
                  : 'Create Outline'}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Mode Selector Overlay */}
        {showModeSelector && !generatingOutline && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm">
            <OutlineModeSelector
        open={showModeSelector}
        onOpenChange={setShowModeSelector}
        onSelect={handleModeSelect}
      />
          </div>
        )}

        {/* Generation Progress Overlay */}
        {generatingOutline && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <OutlineGenerationLoader mode={outlineMode} progress={outlineProgress} />
          </div>
        )}

        {/* Image Container */}
        <div className="relative">
          {/* Zoom Controls */}
          <div className="absolute top-3 left-3 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              className="p-2 text-white hover:bg-white/20 rounded transition-colors"
              title="Zoom Out"
              disabled={zoom <= 0.5}
            >
              <ZoomOut size={18} />
            </button>
            <span className="p-2 text-white text-sm flex items-center px-2 justify-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-white hover:bg-white/20 rounded transition-colors"
              title="Zoom In"
              disabled={zoom >= 5}
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-px bg-white/30 mx-1" />
            <button
              onClick={handleFitToView}
              className="p-2 text-white hover:bg-white/20 rounded transition-colors"
              title="Fit to View"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Recreate Outline Button */}
          {showOutline && outlineUrl && !isSharedWithMe && (
            <button
              onClick={handleRecreateOutline}
              disabled={generatingOutline}
              className="absolute z-20 top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              title="Recreate Outline"
            >
              <span>🔄</span>
              <span>Recreate Outline</span>
            </button>
          )}

          {/* Open in new tab button */}
          <button
            onClick={() => openImageInNewTab(currentImage)}
            className="absolute z-20 top-3 right-3 bg-black/50 backdrop-blur-sm text-white p-3 cursor-pointer rounded-lg hover:bg-black/70 transition-colors"
            title="Open in new tab"
          >
            <BsBoxArrowUpRight size={18} />
          </button>

          {/* Drag indicator */}
          {zoom > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <Move size={14} />
              Drag to pan
            </div>
          )}

          {/* Image Viewport */}
          <div
            ref={containerRef}
            className="relative overflow-hidden bg-black/5 rounded-lg"
            style={{ 
              height: '60vh',
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* HD Loading Overlay */}
            {hdLoading && (
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <HDScalingLoader size={100} />
              </div>
            )}

            {/* Image */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                transformOrigin: 'center',
              }}
            >
              <img
                ref={imageRef}
                src={currentImage}
                alt="Full Preview"
                className="max-w-full max-h-full object-contain"
                draggable={false}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackUrl;
                }}
                style={{
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Image Metadata */}
        {imageData && (
          <div className="bg-black/25 border border-solid border-black/25 p-3 rounded-lg text-sm mt-4 max-h-40 overflow-y-auto">
            {imageData.description && (
              <div className="mb-3 flex items-start gap-3">
                <h3 className="text-sm xl:text-base font-semibold text-white mb-1 min-w-[100px]">
                  Description
                </h3>
                <p className="text-white text-sm xl:text-base">{imageData.description}</p>
              </div>
            )}
            {imageData.source && (
              <div className="mb-3 flex items-start gap-3">
                <h3 className="text-sm xl:text-base font-semibold text-white mb-1 min-w-[100px]">
                  Source
                </h3>
                <p className="text-white text-sm xl:text-base break-words">{imageData.source}</p>
              </div>
            )}
            {showOutline && outlineMode && (
              <div className="mb-3 flex items-start gap-3">
                <h3 className="text-sm xl:text-base font-semibold text-white mb-1 min-w-[100px]">
                  Outline Mode
                </h3>
                <p className="text-white text-sm xl:text-base capitalize">{outlineMode}</p>
              </div>
            )}
            {imageData.tags && imageData.tags.length > 0 && (
              <div className="flex items-start gap-3">
                <h3 className="text-sm font-medium text-white flex items-center min-w-[100px]">
                  <AiOutlineTag className="mr-1" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {imageData.tags.map((tag, index) => (
                    <span key={index} className="border border-solid border-purple-400 px-2 py-0.5 rounded-md text-sm text-purple-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {enableHD && !isHD && (
              <div className="flex justify-center mt-3">
                <Button
                  variant={'dg_btn'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScaleToHD();
                  }}
                  disabled={hdLoading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    hdLoading 
                      ? "bg-gray-500 cursor-not-allowed text-gray-300" 
                      : "hover:scale-105"
                  }`}
                >
                  {hdLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      Scaling...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MdHd />
                      <span>Scale to HD</span>
                    </div>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!isSharedWithMe && customButton}
          <DialogClose asChild>
            <Button variant="dg_btn" className="hover:text-black cursor-pointer">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImagePreviewDialog;