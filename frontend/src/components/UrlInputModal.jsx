import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/api/axios";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function UrlInputModal({ open, onClose, onSubmit }) {
  const [url, setUrl] = useState("");
  const [image, setImage] = useState(null);
  const [isProcessingUrls, setIsProcessingUrls] = useState(false);
  const [processedUrls, setProcessedUrls] = useState([]);
  
  useEffect(() => {
    if (image) {
      onSubmit(image);
    }
  }, [image]);
  
  // Enhanced function to check if URL is an image
  const isImageUrl = (url) => {
    try {
      if (!url || typeof url !== 'string') return false;            
      const imageExtensions = /\.(jpg|jpeg|png)(\?.*)?$/i;
      return imageExtensions.test(url);
    } catch (error) {
      console.error('Error validating image URL:', error);
      return false;
    }
  };

  // Function to extract URLs from text
  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Function to fetch image from URL using backend proxy
  const fetchImageFromUrl = async (url) => {
    try {      
      const response = await api.post(`/moodboards/fetch-image-from-url`, {
        url: url,
      });      
      if (!response.data) {
        throw new Error("No data received from backend");
      }

      const { buffer, contentType, filename } = response.data.data;

      // Convert buffer to blob
      const blob = new Blob([new Uint8Array(buffer.data)], {
        type: contentType,
      });

      // Double-check it's an image
      if (!contentType.startsWith("image/")) {
        throw new Error("Response is not an image");
      }

      // Create File object from blob
      const file = new File([blob], filename, { type: contentType });

      return {
        file,
        preview: URL.createObjectURL(blob),
        description: "",
        source: url,
        tags: "",
        fromUrl: true,
        isExisting: false,
      };
    } catch (error) {
      console.error(
        "Error fetching image from URL via backend:",
        url,
        error.message
      );
      return null;
    }
  };

  // Enhanced function to process URLs in text and extract images
  const processUrlsInText = async () => {
    try {
      const urls = extractUrls(url);
      // isImageUrl(url)
      if (!urls || urls.length === 0) {
        toast.error("No URLs found in input")        
        return;
      }      
      let imageUrls = urls;     
      if (imageUrls.length === 0) {
        toast.error("No image URLs found by extension, Try other url")                
        imageUrls = urls;
        return
      }
      // Filter out already processed URLs
      const newUrls = imageUrls.filter((url) => !processedUrls.includes(url));      
      if (newUrls.length === 0) {
        toast.error("No new URLs to process")                
        return;
      }
      setIsProcessingUrls(true);
      // Process URLs and fetch images
      const imagePromises = newUrls.map((url) => fetchImageFromUrl(url));
      const fetchedImages = await Promise.all(imagePromises);      
      const validImages = fetchedImages.filter((img) => img !== null);
      
      if (validImages.length > 0) {
        setImage(validImages);        
        setProcessedUrls(prev => [...prev, ...newUrls]);
      } 
    } catch (error) {      
      toast.error("No valid images could be fetched from the URLs")
      console.error("Error processing image URLs:", error);
    } finally {
      setIsProcessingUrls(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setUrl("");
    setImage(null);
    setProcessedUrls([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Image URL</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder="https://example.com/image.jpg"
            value={url}
            className={"text-white"}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isProcessingUrls) {
                processUrlsInText();
              }
            }}
          />
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={processUrlsInText} 
            disabled={!url.trim() || isProcessingUrls}
          >
            {isProcessingUrls ? (
              <Loader className="size-6 [&>div]:size-full" />
            ) : (
              "Load Image"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}