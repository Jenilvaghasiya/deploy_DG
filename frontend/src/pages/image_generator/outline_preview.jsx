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
import { Button } from "@/components/ui/button";
import { AiOutlineTag } from "react-icons/ai";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { MdHd } from "react-icons/md";
import { ZoomIn, ZoomOut, Maximize2, Move, Loader2 } from "lucide-react";
import api from "@/api/axios";
import toast from "react-hot-toast";

// Outline Mode Selection Component
const OutlineModeSelector = ({ onSelect, onCancel }) => {
  const modes = [
    {
      id: 'base',
      title: 'Base',
      description: 'Simple silhouette outline',
      features: ['Fast processing', 'Basic garment shape', 'Quick results'],
      icon: '📋'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'Structural details included',
      features: ['Better accuracy', 'Seams & stitching', 'Moderate detail'],
      icon: '⚙️',
      recommended: false
    },
    {
      id: 'professional',
      title: 'Professional',
      description: 'Complete technical flat',
      features: ['Highest detail level', 'All hardware & trims', 'Production ready'],
      icon: '🏆',
      recommended: true
    }
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Outline Mode</h3>
        <p className="text-sm text-gray-400">Choose the level of detail for your garment outline</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => onSelect(mode.id)}
            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg hover:scale-105 ${
              mode.recommended 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-slate-600 bg-slate-800/50 hover:border-purple-400'
            }`}
          >
            {mode.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                  RECOMMENDED
                </span>
              </div>
            )}
            
            <div className="text-center mb-3">
              <div className="text-4xl mb-2">{mode.icon}</div>
              <h4 className="font-semibold text-white">{mode.title}</h4>
              <p className="text-xs text-gray-400 mt-1">{mode.description}</p>
            </div>
            
            <ul className="space-y-2">
              {mode.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-3 mt-6">
        <Button
          onClick={onCancel}
          variant="outline"
          className="bg-slate-700 hover:bg-slate-600"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

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
          Generating {mode.charAt(0).toUpperCase() + mode.slice(1)} Outline
        </h3>
        <p className="text-sm text-gray-400">
          {progress === 'queued' ? 'Task queued, waiting for processing...' : 'Processing your garment outline...'}
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

// Main Component
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
  const [isFallback, setIsFallback] = useState(false);
  const [hdLoading, setHdLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const [isHD, setIsHD] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Outline feature states
  const [showOutline, setShowOutline] = useState(false);
  const [outlineUrl, setOutlineUrl] = useState(imageData?.outline_image || null);
  const [outlineMode, setOutlineMode] = useState(imageData?.outline_mode || null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [outlineProgress, setOutlineProgress] = useState('idle');
  const [currentTaskId, setCurrentTaskId] = useState(null);

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const statusCheckInterval = useRef(null);
  const fallbackUrl = "https://g-mxtlc2zquep.vusercontent.net/placeholder.svg";

  // Calculate container size on mount and resize
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Cleanup status check interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  // Handle image load to get natural dimensions
  const handleImageLoad = (e) => {
    const img = e.target;
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  // Convert image URL to File object
  const urlToFile = async (url, filename) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  // Start outline generation
  const startOutlineGeneration = async (mode) => {
    try {
      setGeneratingOutline(true);
      setOutlineProgress('queued');
      setShowModeSelector(false);

      // Convert image URL to file
      const filename = imageUrl.split('/').pop() || 'garment.jpg';
      const file = await urlToFile(imageUrl, filename);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outline_mode', mode);

      // Call outline generation API
      const response = await fetch('https://ai.design-genie.ai/garment-outline/async', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start outline generation');
      }

      const data = await response.json();
      
      if (data.task_id) {
        setCurrentTaskId(data.task_id);
        setOutlineMode(mode);
        toast.success('Outline generation started!');
        
        // Start checking status
        checkOutlineStatus(data.task_id, mode);
      } else {
        throw new Error('No task ID received');
      }
    } catch (error) {
      console.error('Error starting outline generation:', error);
      toast.error('Failed to start outline generation');
      setGeneratingOutline(false);
      setOutlineProgress('idle');
    }
  };

  // Check outline generation status
  const checkOutlineStatus = (taskId, mode) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 seconds * 60)

    statusCheckInterval.current = setInterval(async () => {
      try {
        attempts++;
        
        if (attempts > maxAttempts) {
          clearInterval(statusCheckInterval.current);
          toast.error('Outline generation timeout');
          setGeneratingOutline(false);
          setOutlineProgress('idle');
          return;
        }

        const response = await fetch(`https://ai.design-genie.ai/task/status/${taskId}`);
        
        if (!response.ok) {
          throw new Error('Failed to check status');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(statusCheckInterval.current);
          
          // Extract outline URL
          const cleanOutlinePath = data.result?.result?.clean_outline_path;
          if (cleanOutlinePath) {
            const filename = cleanOutlinePath.split('/').pop();
            const fullOutlineUrl = `https://ai.design-genie.ai/outputs/${filename}`;
            
            // Save outline to gallery
            await saveOutlineToGallery(fullOutlineUrl, mode, taskId);
            
            setOutlineUrl(fullOutlineUrl);
            setShowOutline(true);
            setCurrentImage(fullOutlineUrl);
            setGeneratingOutline(false);
            setOutlineProgress('completed');
            
            toast.success('Outline generated successfully!');
          }
        } else if (data.status === 'failed' || data.status === 'error') {
          clearInterval(statusCheckInterval.current);
          toast.error('Outline generation failed');
          setGeneratingOutline(false);
          setOutlineProgress('idle');
        }
        // If still queued or processing, continue checking
      } catch (error) {
        console.error('Error checking outline status:', error);
        clearInterval(statusCheckInterval.current);
        toast.error('Failed to check outline status');
        setGeneratingOutline(false);
        setOutlineProgress('idle');
      }
    }, 5000); // Check every 5 seconds
  };

  // Save outline to gallery
  const saveOutlineToGallery = async (outlineUrl, mode, taskId) => {
    try {
      const response = await api.patch(`/gallery/${galleryImageId}`, {
        outline_image: outlineUrl,
        outline_mode: mode,
        outline_task_id: taskId
      });

      if (response.status === 200) {
        // Notify parent component
        if (onOutlineGenerated) {
          onOutlineGenerated({
            outline_image: outlineUrl,
            outline_mode: mode,
            outline_task_id: taskId
          });
        }
      }
    } catch (error) {
      console.error('Error saving outline to gallery:', error);
      toast.error('Failed to save outline to gallery');
    }
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

  // Fit to view - resets zoom and centers image
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
    
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  // Reset on dialog close
  const handleOpenChange = (isOpen) => {
    if (!isOpen && !hdLoading && !generatingOutline) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsFallback(false);
      setCurrentImage(showOutline && outlineUrl ? outlineUrl : imageUrl);
      setIsHD(false);
      setHdLoading(false);
      setShowModeSelector(false);
      
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
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
        variant="outline"
        size="sm"
        className={`ml-4 ${
            showOutline
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-slate-700 hover:bg-slate-600'
        } text-black`}
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
              onSelect={(mode) => startOutlineGeneration(mode)}
              onCancel={() => setShowModeSelector(false)}
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

          {/* Recreate Outline Button (when viewing outline) */}
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

          {/* Drag indicator when zoomed */}
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
            {/* Image with transform */}
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
                onLoad={handleImageLoad}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = fallbackUrl;
                  setIsFallback(true);
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
            {showOutline && outlineMode && (
              <div className="mb-3 flex items-start gap-3">
                <h3 className="text-sm xl:text-base font-semibold text-white mb-1 min-w-[100px]">
                  Outline Mode
                </h3>
                <p className="text-white text-sm xl:text-base capitalize">{outlineMode}</p>
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