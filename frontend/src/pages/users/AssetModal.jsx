import api from "@/api/axios";
import { FileText, Image } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const AssetModal = ({ isOpen, onClose, onSelectAsset, parentNodeId, rootId }) => {
  const [images, setImages] = useState([]);
  const [sizeCharts, setSizeCharts] = useState([]);
  const [activeTab, setActiveTab] = useState("gallery");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const [imagesRes, sizeChartsRes] = await Promise.all([
        api.get(`gallery/images`),
        api.get(`gallery/sizecharts`),
      ]);

      if (imagesRes.status === 200) {
        setImages(imagesRes.data);
      }

      if (sizeChartsRes.status === 200) {
        setSizeCharts(sizeChartsRes.data);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAsset = async (asset, type) => {
    try {
      const response = await api.post(`gallery/tree/link`, {
        assetId: asset.id,
        assetType: type,
        assetName: asset.name,
        parentId: parentNodeId,
        rootId: rootId,
      });

      if (response.status === 200) {
        onSelectAsset();
        onClose();
      }
    } catch (error) {
      console.error("Error linking asset:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden z-[9999]">
        <DialogHeader>
          <DialogTitle>Select Asset to Link</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab("gallery")}
            className={`px-4 py-2 rounded-tl-lg rounded-bl-lg ${
              activeTab === "gallery"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Gallery ({images.length})
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-tr-lg rounded-br-lg ${
              activeTab === "projects"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Projects ({sizeCharts.length})
          </button>
        </div>

        {/* Content */}
        <div className="max-h-48 overflow-y-auto mb-4">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <>
              {activeTab === "gallery" && (
                <div className="space-y-2">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      onClick={() => handleSelectAsset(image, "image")}
                      className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <Image className="w-4 h-4 text-blue-500 mr-2" />
                      <span>{image.name}</span>
                    </div>
                  ))}
                  {images.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No gallery items available
                    </div>
                  )}
                </div>
              )}

              {activeTab === "projects" && (
                <div className="space-y-2">
                  {sizeCharts.map((chart) => (
                    <div
                      key={chart.id}
                      onClick={() => handleSelectAsset(chart, "sizechart")}
                      className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-green-500 mr-2" />
                      <span>{chart.name}</span>
                    </div>
                  ))}
                  {sizeCharts.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No projects available
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssetModal;
