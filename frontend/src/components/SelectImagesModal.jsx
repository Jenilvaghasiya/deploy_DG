import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import SmartImage from "./SmartImage"; // assuming you have this

const TABS = {
  FINALIZED: "finalized",
  SAVED: "saved",
  GENERATED: "generated",
  UPLOADED: "uploaded",
};

export default function SelectImagesModal({
  open,
  onClose,
  images = [],
  onDownload,
  isGenerated = false,
  activeTab,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filter images based on activeTab
  // const filteredImages =
  //   activeTab === TABS.SAVED
  //     ? images.filter((img) => img.status === "saved")
  //     : images;


  // Filter images based on activeTab
  const filteredImages = (() => {
    switch (activeTab) {
      case TABS.SAVED:
        return images.filter((img) => img.status === "saved");
      case TABS.FINALIZED:
        return images.filter((img) => img.status === "finalized");
      case TABS.GENERATED:
        return images.filter((img) => img.status === "generated");
      case TABS.UPLOADED:
        return images.filter((img) => img.status === "uploaded");
      default:
        return images;
    }
  })();

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSelectAll(false);
    }
  }, [open]);

  useEffect(() => {
    setSelectAll(
      filteredImages.length > 0 && selectedIds.length === filteredImages.length
    );
  }, [selectedIds, filteredImages]);

  const toggleImage = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredImages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredImages.map((img) => img.id));
    }
  };

  const handleDownloadClick = () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one image to download.");
      return;
    }
    onDownload(selectedIds);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl 2xl:max-w-3xl !rounded-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Images to Download</DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex items-center gap-2 text-white">
          <Checkbox
            checked={selectAll}
            className={"cursor-pointer"}
            onCheckedChange={handleSelectAll}
          />
          <span>Select All</span>
        </div>

        <div className="grid grid-cols-3 gap-3 grow overflow-y-auto custom-scroll">
          {filteredImages.map((img, index) => (
            <label key={img.id || index} className="relative cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.includes(img.id)}
                onChange={() => toggleImage(img.id)}
                className="absolute top-2 left-2 z-10 cursor-pointer"
              />
              <SmartImage
                src={
                  isGenerated
                    ? `${import.meta.env.VITE_API_URL}/genie-image/${
                        img.url || ""
                      }`
                    : img.galleryImage?.url || img.url || ""
                }
                alt={img.name}
                className={`w-full h-24 object-cover rounded ${
                  selectedIds.includes(img.id) ? "ring-2 ring-pink-500" : ""
                }`}
              />
            </label>
          ))}
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleDownloadClick}>Download Selected</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
