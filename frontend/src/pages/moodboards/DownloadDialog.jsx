// src/pages/moodboards/DownloadDialog.jsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import Button from "../../components/Button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/api/axios";
import SmartImage from "@/components/SmartImage";

const BASE_URL = import.meta.env.VITE_SERVER_URL;

export default function DownloadDialog({ moodboard, onClose, setError }) {
  const [selectedImageIds, setSelectedImageIds] = useState(
    moodboard.images.map(img => img._id)
  );
  const [selectedTextIds, setSelectedTextIds] = useState([]);
  const [includeComment, setIncludeComment] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeTextData, setIncludeTextData] = useState(true);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [loading, setLoading] = useState(false); // <-- added loading state
console.log(moodboard, 'gggggggggggggg');

  const toggleImage = (id) => {
    setSelectedImageIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
   const toggleText = (id) => {
    setSelectedTextIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  useEffect(() => {
  if (includeTextData) {    
    setSelectedTextIds(moodboard.textData.map(txt => txt._id));
  } else {    
    setSelectedTextIds([]);
  }
}, [includeTextData, moodboard.textData]);

  const handleConfirmDownload = async () => {
    try {
      const response = await api.post(`/moodboards/${moodboard._id}/download`, {
        includeImages: selectedImageIds,
        includeTextData: selectedTextIds,
        includeComment,
        includeNotes,
        // includeTextData,
        includeProjects
      }, { responseType: "blob" });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `moodboard-${moodboard.name.replace(/[^a-zA-Z0-9]/g, "-")}.zip`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError?.(err.response?.data?.message || "Download failed");
    } finally {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Download Moodboard: {moodboard.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white">Include Data</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-white">
              <Checkbox checked={includeComment} onCheckedChange={setIncludeComment} />
              Include Comment
            </label>
            <label className="flex items-center gap-2 text-white">
              <Checkbox checked={includeNotes} onCheckedChange={setIncludeNotes} />
              Include Notes
            </label>
            <label className="flex items-center gap-2 text-white">
              <Checkbox checked={includeTextData} onCheckedChange={setIncludeTextData} />
              Include Text Data
            </label>
            <label className="flex items-center gap-2 text-white">
              <Checkbox checked={includeProjects} onCheckedChange={setIncludeProjects} />
              Include Projects
            </label>
          </div>

          <h3 className="text-sm font-medium mt-6 text-white">Select Images</h3>
          <div className="grid grid-cols-3 gap-2">
            {moodboard.gallery_images.map((img) => (
              <label key={img._id} className="relative cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedImageIds.includes(img._id)}
                  onChange={() => toggleImage(img._id)}
                  className="absolute top-2 left-2 z-10"
                />
                <SmartImage
                  src={`${img.galleryImage?.url}`}
                  alt=""
                  className={`w-full h-24 object-cover rounded ${
                    selectedImageIds.includes(img._id) ? "ring-2 ring-pink-500" : ""
                  }`}
                />
              </label>
            ))}
          </div>
          <h3 className="text-sm font-medium mt-6 text-white">Select Text</h3>
          <div className="flex flex-col gap-2">
            {moodboard.textData.map(txt => (
              <label key={txt._id} className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={includeTextData && selectedTextIds.includes(txt._id)}                  
                  onChange={() => toggleText(txt._id)}
                  className="cursor-pointer"
                  disabled={includeTextData ? false : true}
                />
                <span className="select-text break-words">{txt.text}</span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary" className="cursor-pointer">Cancel</Button>
          </DialogClose>
          <Button onClick={handleConfirmDownload} className="cursor-pointer" >Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
