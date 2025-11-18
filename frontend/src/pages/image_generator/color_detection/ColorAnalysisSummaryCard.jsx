import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Calendar,
  ChartLine,
  CircleSlash2,
  Eye,
  Trash,
} from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { hasPermission } from "@/lib/utils";
import useSocket from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";
import SmartImage from "@/components/SmartImage";

const ColorAnalysisSummaryCard = ({ data, onClick, onViewDetails, onDelete }) => {
    const { user } = useAuthStore();
    const socketRef = useSocket(user);
    const permissions = user?.role?.permissions || [];
    const permissionKeys = permissions.map((p) => p.key);
    const hasDeleteColorDetectionPermission = hasPermission(
      permissionKeys,
      "ai-design-lab:color-detections:delete"
    );
  if (!data) return null;

  const dominantColors = data?.data?.dominant_colors || [];
  const harmonyType = data?.data?.harmony_analysis?.harmony_type;
  const trendStyle = data?.data?.fashion_insights?.trend_analysis?.style;
  const createdDate = data?.created_at
    ? new Date(data.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const displayColors = dominantColors.slice(0, 5);

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-white"
      onClick={onClick}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {data?.gallery_image_ids?.[0]?.url ? (
          <>
            <SmartImage
              src={data.gallery_image_ids[0].url}
              alt="Color analysis source"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.();
                }}
               
              >
                <Eye className="h-4 w-4 mr-1" />
                 View Details
              </Button>
            </div>
          </>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center text-gray-400 bg-zinc-400/50 rounded-lg group">
            <Palette className="h-12 w-12" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center rounded-lg">
              <Button
                size="sm"
                variant="secondary"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails?.();
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Color palette strip */}
        <div className="absolute bottom-0 left-0 right-0 backdrop-blur-xs bg-zinc-800/25 p-2 ">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {displayColors.map((color, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-md border border-white/30 shadow-sm"
                  style={{ backgroundColor: color?.hex || "#ccc" }}
                  title={color?.fashion_match?.fashion_color_name || color?.hex}
                />
              ))}
              {dominantColors.length > 5 && (
                <div className="w-8 h-8 rounded-md border border-white/40 bg-zinc-700 flex items-center justify-center text-xs text-white ">
                  +{dominantColors.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4">
        {/* Palette ID and Date */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-sm text-white/80">
              #{data?.data?.saved_palette_id?.substring(0, 8) || "unsaved"}
            </p>
            <div className="flex items-center gap-1 text-xs text-white/70 mt-1">
              <Calendar className="h-3 w-3" />
              <span>{createdDate}</span>
            </div>
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-medium text-white mb-1">Dominant Colors</h4>
            <p className="text-xs text-white/80">
              {dominantColors
                .slice(0, 3)
                .map(
                  (color) => color?.fashion_match?.fashion_color_name || "Unknown"
                )
                .join(", ")}
              {dominantColors.length > 3 && ` +${dominantColors.length - 3} more`}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {harmonyType && (
              <Badge
                variant="secondary"
                className="text-xs text-white bg-white/10 border-white/20"
              >
                <CircleSlash2 className="h-3 w-3 mr-1" />
                {harmonyType}
              </Badge>
            )}
            {trendStyle && (
              <Badge
                variant="secondary"
                className="text-xs text-white bg-white/10 border-white/20"
              >
                <ChartLine className="h-3 w-3 mr-1" />
                {trendStyle}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="text-xs text-white border-white/30"
            >
              <Palette className="h-3 w-3 mr-1" />
              {dominantColors.length} colors
            </Badge>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
            <div>
              <p className="text-xs text-white/70">Temperature</p>
              <p className="text-sm font-medium capitalize text-white">
                {data?.data?.harmony_analysis?.color_temperature?.temperature || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Versatility</p>
              <p className="text-sm font-medium capitalize text-white">
                {data?.data?.fashion_insights?.versatility_score?.score || "N/A"}
              </p>
            </div>
          </div>

          {/* Delete Button */}
          <div className="pt-3">
            {hasDeleteColorDetectionPermission &&
              <ConfirmDeleteDialog
                title="Delete Color Analysis"
                message="Are you sure you want to delete this color analysis?"
                onDelete={() => onDelete?.(data._id)}
              >
                <Button
                  variant={'destructive'}
                  className={'absolute top-6 right-6 z-[1] opacity-0 group-hover:opacity-100'}
                  // className="p-2 text-white-500 bg-red-800 hover:bg-red-700 transition-colors w-full flex items-center justify-center"
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </ConfirmDeleteDialog>
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorAnalysisSummaryCard;
