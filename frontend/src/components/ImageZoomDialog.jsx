import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CiZoomIn, CiZoomOut } from "react-icons/ci";
import { BsBoxArrowUpRight } from "react-icons/bs";
const SmartImage = (props) => {
  return <img {...props} />;
};

export default function ImageZoomDialog({
  imageUrl,
  triggerLabel = "Preview Image",
  className = "bg-black text-white p-1.5 rounded cursor-pointer",
  showTitle = false
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const dragStart = useRef({ x: 0, y: 0 });
  const fallbackUrl = "https://g-mxtlc2zquep.vusercontent.net/placeholder.svg";

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  const handleOpenChange = (isOpen) => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsFallback(false); // Reset fallback state when dialog opens
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild> 
        <button
          className={className}
          title={triggerLabel}
        >
          <CiZoomIn size={14} /> { showTitle && <span className="ml-1">{triggerLabel}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>
            Drag the image to move and use buttons to zoom in/out.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 flex justify-center  items-center overflow-hidden relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: dragging ? "grabbing" : "grab" }}
        >
          <button
            onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
            className="absolute z-10 right-0 top-0 rounded-tr-none bg-zinc-700 text-white p-3 cursor-pointer rounded hover:bg-zinc-600"
            title="Open in new tab"
            >
            <BsBoxArrowUpRight size={14} />
          </button>
          <SmartImage
            src={imageUrl}
            alt="Preview"
            draggable={false}
            onMouseDown={handleMouseDown}
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = fallbackUrl;
              setIsFallback(true);
            }}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transition: dragging ? "none" : "transform 0.2s ease",
              maxWidth: "100%",
              width :"100%",
              maxHeight: "100%",
              userSelect: "none",
              objectFit: "contain", // prevent cropping
              cursor: dragging ? "grabbing" : "grab",
            }}
          />

          {/* ✅ Show zoom controls only if NOT fallback */}
          {!isFallback && (
            <div className="absolute bottom-4 right-4 flex z-10">
              {/* <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
              >
                <CiZoomOut size={16} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
              >
                <CiZoomIn size={16} />
              </Button> */}

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
