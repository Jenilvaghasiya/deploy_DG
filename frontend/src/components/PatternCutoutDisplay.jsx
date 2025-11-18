import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  Sparkles,
  Clock,
  Hash,
  CheckCircle,
  AlertCircle,
  Layers,
  Cpu,
  FileImage,
  Calendar,
} from "lucide-react";
import ImagePreviewDialog from "@/pages/moodboards/ImagePreviewDialog";

// Individual Pattern Card Component
function PatternCard({
  component,
  confidence,
  description,
  dimensions,
  image,
  absolute_path,
  onDownload,
  onDetails,
}) {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";

  return (
    <div className="group relative backdrop-blur-md bg-white/10 rounded-xl border border-white/20 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-white/30">
      {/* Animated gradient background */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image Container */}
      <div className="relative bg-black/10 backdrop-blur-sm p-4 rounded-t-xl overflow-hidden">
        <img
          src={`${baseUrl}/${image}`}
          alt={component}
          onError={(e) =>
            (e.currentTarget.src = "/static/img/pattern-placeholder.png")
          }
          className="relative z-10 w-full h-48 object-contain rounded-lg cursor-pointer transition-all duration-500 group-hover:scale-105"
          onClick={onDetails}
        />
      </div>

      {/* Details */}
      <div className="relative z-10 p-4 space-y-3">
        <div className="text-center">
          <h4 className="text-lg font-bold text-white capitalize">
            {component.replace(/_/g, " ")}
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="backdrop-blur-md bg-white/5 p-2 rounded-lg">
            <p className="text-xs text-gray-400">Dimensions</p>
            <p className="font-semibold text-white">{dimensions}</p>
          </div>
          <div className="backdrop-blur-md bg-white/5 p-2 rounded-lg">
            <p className="text-xs text-gray-400">Confidence</p>
            <p className="font-semibold text-white">
              {Math.round(confidence * 100)}%
            </p>
          </div>
        </div>

        <div className="backdrop-blur-md  from-pink-500/10 to-fuchsia-500/10 border-pink-500/80 p-3 rounded-lg border-l-2 ">
          <p className="text-xs text-gray-200">{description}</p>
        </div>

        {/* <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg"
            onClick={() => onDownload(absolute_path)}
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg"
            onClick={() => onDetails(component)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Details
          </Button>
        </div> */}
      </div>
    </div>
  );
}

// Main Pattern Cutout Display Component
export default function PatternCutoutDisplay({ data, onBack }) {
  if (!data) return null;

  const {
    name,
    message,
    status,
    components = [],
    metadata = {},
    task_id,
    tenant_id,
    user_id,
    gallery_image_ids = [],
    generation_source,
    created_at,
    updated_at,
    id,
    market,
    is_deleted,
  } = data;

  const handleDownload = (path) => {
    window.open(`/${path}`, "_blank");
  };

  const handleDetails = (component) => {
    console.log("Show details for", component);
  };

  const handleDownloadAll = () => {
    components.forEach((comp) => {
      window.open(`/${comp.absolute_path}`, "_blank");
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <div className="max-w-7xl mx-auto space-y-6">
         {onBack && 
            <div>
              <Button
                variant="dg_btn"
                className="mb-4 flex items-center gap-2"
                onClick={onBack}
              >
              ← Back to Listing
              </Button>
            </div>        
          }
        {/* Header Metadata Section */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {name || "Pattern Cutouts"}
              </h1>
              <p className="text-gray-300">{message}</p>
            </div>
            <div
              className={cn(
                "px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2",
                status === "completed"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              )}
            >
              {status === "completed" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {status?.toUpperCase()}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-xs">Garment Type</span>
              </div>
              <p className="text-white font-semibold capitalize">
                {metadata.garment_type || "N/A"}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="text-xs">Method</span>
              </div>
              <p className="text-white font-semibold truncate block">
                {metadata.method || "N/A"}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs">Confidence</span>
              </div>
              <p className="text-white font-semibold">
                {metadata.base_confidence
                  ? `${Math.round(metadata.base_confidence * 100)}%`
                  : "N/A"}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <FileImage className="w-4 h-4" />
                <span className="text-xs">Total Pieces</span>
              </div>
              <p className="text-white font-semibold">
                {metadata.total_components || components.length}
              </p>
            </div>
          </div>
          
   {gallery_image_ids?.[0]?.url && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex flex-col justify-between mt-2">
                <div>
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">Source Image</span>
                  </div>
                  <p className="text-white font-semibold">
                    Original garment
                  </p>
                </div>
                <ImagePreviewDialog imageUrl={gallery_image_ids[0].url}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    View Image
                  </Button>
                </ImagePreviewDialog>
              </div>
            )}
          {/* Professional Options */}
          {metadata.professional_options && (
            <div className="mt-4 flex flex-wrap gap-2">
              {metadata.professional_options.include_measurements && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold border border-blue-500/30">
                  ✓ Measurements Included
                </span>
              )}
              {metadata.professional_options.include_seam_allowance && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold border border-purple-500/30">
                  ✓ Seam Allowance
                </span>
              )}
              {metadata.professional && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                  ✓ Professional Grade
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {/* <div className="mt-6 flex gap-3">
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
              onClick={handleDownloadAll}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All Patterns
            </Button>
          </div> */}
        </div>

        {/* Pattern Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {components.map((component, index) => (
            <PatternCard
              key={index}
              {...component}
              onDownload={handleDownload}
              onDetails={handleDetails}
            />
          ))}
        </div>

        {/* Footer Metadata Section */}
        <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Additional Information
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Task ID</p>
              <p className="text-gray-200 font-mono text-xs">{task_id}</p>
            </div>

            <div>
              <p className="text-gray-400 mb-1">Generation Source</p>
              <p className="text-gray-200 capitalize">
                {generation_source?.replace(/_/g, " ") || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 mb-1">Model</p>
              <p className="text-gray-200">{metadata.model || "N/A"}</p>
            </div>

            <div>
              <p className="text-gray-400 mb-1">Created At</p>
              <p className="text-gray-200">
                {created_at ? new Date(created_at).toLocaleString() : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 mb-1">Updated At</p>
              <p className="text-gray-200">
                {updated_at ? new Date(updated_at).toLocaleString() : "N/A"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 mb-1">Gallery Images</p>
              <p className="text-gray-200">
                {gallery_image_ids?.length || 0} images
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
