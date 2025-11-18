import React from "react";
import { cn, hasPermission } from "@/lib/utils";
import {
  FileText,
  Calendar,
  Package,
  Sparkles,
  Palette,
  Scissors,
  Box,
  Trash2,
  Copy,
} from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import toast from "react-hot-toast";
import useSocket from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export default function TechPacksSummaryCard({
  techPack,
  onSelect,
  fetchTechPacks,
}) {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);

  const styleNumber =
    techPack?.tech_pack?.product_overview?.style_number || "N/A";
  const styleName =
    techPack?.tech_pack?.product_overview?.style_name || "Untitled";
  const garmentType =
    techPack?.tech_pack?.product_overview?.garment_type || "N/A";
  const gender =
    techPack?.tech_pack?.product_overview?.gender ||
    techPack?.analysis?.gender ||
    "N/A";
  const generationSource = techPack?.generation_source || "manual";
  const createdAt = techPack?.createdAt;
  const hasImage = techPack?.gallery_image_ids?.length > 0;

  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);

  const hasDeleteTechPackPermission = hasPermission(
    permissionKeys,
    "ai-design-lab:tech-packs:delete"
  );
  const hasCreateTechPackPermission = hasPermission(
    permissionKeys,
    "ai-design-lab:tech-packs:create"
  );

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/image-variation/tech-packs/delete/${id}`);
      toast.success(res.data?.message || "Tech Pack deleted successfully!");
      fetchTechPacks?.();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete Tech Pack."
      );
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await api.post(`/image-variation/tech-packs/duplicate/${id}`);
      toast.success(res.data?.message || "Tech Pack duplicated successfully!");
      fetchTechPacks?.();
    } catch (error) {
      console.error("Duplicate failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to duplicate Tech Pack."
      );
    }
  };

  return (
    <div
      onClick={() => onSelect(techPack)}
      className="group relative backdrop-blur-md bg-white/10 rounded-xl border border-white/20 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-white/30 cursor-pointer overflow-hidden"
    >
      {/* Background animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white truncate">
              {styleNumber}
            </h3>
            <p className="text-sm text-gray-300 truncate mt-1">{styleName}</p>
          </div>

          {/* Generation Badge */}
          {generationSource === "ai_generated" ? (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs font-medium bg-purple-600 text-purple-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-purple-600 shadow-sm tracking-wide uppercase">
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-200 animate-pulse-slow" />
              <span className="font-semibold">AI Generated</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 whitespace-nowrap text-[9px] sm:text-[10px] md:text-xs font-medium bg-sky-600 text-sky-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-sky-500 shadow-sm tracking-wide uppercase">
              <FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-sky-100" />
              <span className="font-semibold">Manual</span>
            </span>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoBlock label="Type" value={garmentType} icon={Package} />
          <InfoBlock label="Gender" value={gender} icon={Sparkles} />
        </div>

        {/* Section indicators */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <div className="flex gap-2">
            <IconIndicator
              active={techPack?.tech_pack?.product_overview}
              icon={FileText}
              color="green"
            />
            <IconIndicator
              active={techPack?.tech_pack?.suggested_fabrics_and_trims}
              icon={Palette}
              color="blue"
            />
            <IconIndicator
              active={techPack?.tech_pack?.construction_notes}
              icon={Scissors}
              color="purple"
            />
            <IconIndicator
              active={techPack?.tech_pack?.packaging_instructions}
              icon={Box}
              color="orange"
            />
          </div>

          {hasImage && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Has Image
            </div>
          )}
        </div>

        {/* Footer */}
        {createdAt && (
          <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 border-t border-white/10">
            <Calendar className="w-3 h-3" />
            {new Date(createdAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Floating action buttons (bottom-right corner) */}
      <div
        className="absolute bottom-3 right-3 flex flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {hasCreateTechPackPermission && <Button
          variant="ghost"
          size="icon"
          className="text-blue-400 hover:text-blue-500 hover:bg-blue-500/10"
          onClick={() => handleDuplicate(techPack?._id)}
        >
          <Copy className="w-4 h-4" />
        </Button>}

        {hasDeleteTechPackPermission && (
          <ConfirmDeleteDialog
            title="Delete Tech Pack"
            message="Are you sure you want to delete this Tech Pack? This action cannot be undone."
            onDelete={() => handleDelete(techPack?._id)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </ConfirmDeleteDialog>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

const InfoBlock = ({ label, value, icon: Icon }) => (
  <div className="backdrop-blur-md bg-white/5 p-2 rounded-lg">
    <div className="flex items-center gap-1 text-gray-400 mb-1">
      <Icon className="w-3 h-3" />
      <span className="text-xs">{label}</span>
    </div>
    <p className="font-semibold text-white capitalize text-xs">{value}</p>
  </div>
);

const IconIndicator = ({ active, icon: Icon, color }) => (
  <div
    className={cn(
      "w-8 h-8 rounded-lg flex items-center justify-center",
      active
        ? `bg-${color}-500/20 text-${color}-400`
        : "bg-gray-500/20 text-gray-500"
    )}
  >
    <Icon className="w-4 h-4" />
  </div>
);
