import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/api/axios";
import SmartImage from "@/components/SmartImage";
import { Loader2, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import imageNotFoundSVG from "../../src/assets/images/image_not_found.svg";
import Loader from "./Common/Loader";

const BASE_URL = import.meta.env.VITE_SERVER_URL;
const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;
const BASE_API_URL = import.meta.env.VITE_API_URL;

export default function InputImagePreviewDialog({
  open,
  setOpen,
  galleryImageIds = [],
  setError,
  isSharedWithMe = false,
}) {
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (open && galleryImageIds.length > 0) {
      fetchGalleryImages();
      setCurrentIndex(0);
    }
  }, [open, galleryImageIds]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/gallery/by-ids`, {
        params: {
          gallery_image_ids: galleryImageIds.join(","),
          ...(isSharedWithMe ? { isSharedWithMe: true } : {}),
        },
      });
      setImages(
        (response.data.data.map((img) => ({
          ...img,
          url:
              img.status === "saved"
                ? `${BASE_API_URL}/genie-image/${img.url}`
                : img.url.startsWith("http")
                ? img.url
                : `${VITE_BASE_URL}/${img.url}`,
        }))) 
        || []
      );
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch gallery images";
      setError?.(errorMessage);
      console.error("Error fetching gallery images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setOpen(false);
const handleNext = () => {
  if (images.length === 0) return;

  setLoading(true); // show loader
  setTimeout(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setLoading(false); // hide loader after index update
  }, 150); // optional delay to show loader smoothly
};

const handlePrev = () => {
  if (images.length === 0) return;

  setLoading(true); // show loader
  setTimeout(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setLoading(false); // hide loader after index update
  }, 150);
};

  const currentImage = images[currentIndex];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4 z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-100">
            Input Image{images.length > 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          {loading ? (
            <div className="flex justify-center items-center h-[70vh]">
             <Loader />
            </div>
          ) : images.length > 0 ? (
            <>
              <div className="w-full flex items-center justify-center border border-zinc-800 rounded-lg bg-zinc-900">
                {currentImage && (
                  <SmartImage
                    src={`${currentImage.url}`}
                    alt={currentImage.name || "Gallery image"}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              {currentImage?.name && (
                <p className="text-sm text-gray-300 mt-1 overflow-hidden text-ellipsis max-w-full">
                  {currentImage.name}
                </p>
              )}

              {images.length > 1 && (
                <div className="flex justify-center items-center mt-4 w-full">
                      {console.log("✅ Rendering pagination, images length:", images.length)}
                  <div className="flex flex-col items-center gap-2">
                    {/* Buttons in a row */}
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={handlePrev}
                        variant={"dg_btn"}
                        size="sm"
                        className="flex items-center gap-1 min-w-[100px] justify-center"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      <Button
                        onClick={handleNext}
                        variant={"dg_btn"}
                        size="sm"
                        className="flex items-center gap-1 min-w-[100px] justify-center"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Pagination count below */}
                    <span className="text-sm text-gray-400 mt-1">
                      {currentIndex + 1} of {images.length}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[70vh] text-gray-400 gap-4">
              <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M41.7494 26.6667L36.416 21.3333H117.333V102.251L112 96.9173V93.2373L95.3814 76.6133L93.2747 78.192L89.4667 74.384L94.0213 70.9707C94.5373 70.5834 95.1755 70.3951 95.8191 70.4401C96.4626 70.4852 97.0684 70.7606 97.5253 71.216L112 85.6907V26.6667H41.7494ZM16 106.667V103.899L31.7174 88.1813C32.8365 88.7492 34.0731 89.0469 35.328 89.0507C36.3166 89.0513 37.2955 88.856 38.2082 88.4761C39.1208 88.0962 39.9492 87.5392 40.6454 86.8373L56.1973 71.2853L52.432 67.5147L36.88 83.0667C36.6279 83.2917 36.3332 83.464 36.0134 83.5732C35.6935 83.6824 35.3551 83.7264 35.0179 83.7025C34.6808 83.6786 34.3519 83.5874 34.0507 83.4342C33.7494 83.281 33.4819 83.069 33.264 82.8107C32.7577 82.3244 32.081 82.056 31.3791 82.0629C30.6771 82.0699 30.0059 82.3518 29.5094 82.848L16 96.3573V31.0827L10.6667 25.7493V112H96.9174L91.584 106.667H16ZM90.6667 45.3333C90.6667 46.9156 90.1975 48.4623 89.3184 49.7779C88.4394 51.0935 87.19 52.1189 85.7281 52.7244C84.2663 53.3299 82.6578 53.4883 81.106 53.1796C79.5541 52.8709 78.1286 52.109 77.0098 50.9902C75.891 49.8714 75.1291 48.4459 74.8204 46.8941C74.5117 45.3422 74.6701 43.7337 75.2756 42.2719C75.8811 40.8101 76.9065 39.5606 78.2221 38.6816C79.5377 37.8025 81.0844 37.3333 82.6667 37.3333C84.7884 37.3333 86.8232 38.1762 88.3235 39.6765C89.8238 41.1768 90.6667 43.2116 90.6667 45.3333ZM85.3333 45.3333C85.3333 44.8059 85.177 44.2903 84.8839 43.8518C84.5909 43.4133 84.1744 43.0715 83.6872 42.8697C83.1999 42.6678 82.6637 42.615 82.1464 42.7179C81.6292 42.8208 81.154 43.0748 80.7811 43.4477C80.4081 43.8207 80.1541 44.2958 80.0513 44.8131C79.9484 45.3304 80.0012 45.8666 80.203 46.3538C80.4048 46.8411 80.7466 47.2576 81.1852 47.5506C81.6237 47.8436 82.1393 48 82.6667 48C83.3739 48 84.0522 47.7191 84.5523 47.219C85.0524 46.7189 85.3333 46.0406 85.3333 45.3333ZM115.445 119.221L119.216 115.451L12.5494 8.784L8.77869 12.5547L115.445 119.221Z" fill="white"/>
                </svg>

              <p className="text-center max-w-xs">
                No images found. They may have been deleted or are no longer
                available.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
