import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Copy,
  Palette,
  RefreshCw,
  History,
  Lightbulb,
  Sparkles,
  Calendar,
  ChartLine,
  Star,
  Snowflake,
  Sun,
  CircleSlash2,
  Eye,
} from "lucide-react";
import ImagePreviewDialog from "@/pages/moodboards/ImagePreviewDialog";

const ColorAnalysisDisplay = ({ data }) => {
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (data?.saved_palette_id) {
      navigator.clipboard.writeText(data.saved_palette_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const getMatchQualityColor = (quality) => {
    switch (quality?.toLowerCase()) {
      case "excellent":
        return "text-green-400";
      case "good":
        return "text-blue-400";
      case "fair":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getHarmonyTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "analogous":
        return "bg-purple-900/50 text-purple-300 border-purple-700";
      case "complementary":
        return "bg-blue-900/50 text-blue-300 border-blue-700";
      case "triadic":
        return "bg-green-900/50 text-green-300 border-green-700";
      default:
        return "bg-gray-900/50 text-gray-300 border-gray-700";
    }
  };

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case "timeless":
        return "bg-indigo-900/50 text-indigo-300 border-indigo-700";
      case "trending":
        return "bg-green-900/50 text-green-300 border-green-700";
      case "emerging":
        return "bg-yellow-900/50 text-yellow-300 border-yellow-700";
      default:
        return "bg-gray-900/50 text-gray-300 border-gray-700";
    }
  };

  const getVersatilityColor = (score) => {
    switch (score?.toLowerCase()) {
      case "high":
        return "text-green-400";
      case "medium":
        return "text-blue-400";
      case "low":
        return "text-orange-400";
      default:
        return "text-gray-400";
    }
  };

  if (!data) {
    return <div className="text-gray-400">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {data?.saved_palette_id && (
        <Alert className="bg-green-900/20 border-green-800/50 backdrop-blur-sm">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-green-300">
                Palette saved successfully!
              </strong>
              <div className="text-sm mt-1 text-green-400">
                ID:{" "}
                <span className="font-mono font-semibold bg-green-900/30 px-2 py-1 rounded">
                  {data.saved_palette_id}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-green-600/80 hover:bg-green-600 text-white border-green-500/50"
                onClick={handleCopyId}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedId ? "Copied!" : "Copy ID"}
              </Button>
              <Button
                size="sm"
                className="bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500/50"
              >
                <Palette className="h-3 w-3 mr-1" />
                Use in Color Variations
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Saved Palettes Section */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
          <CardTitle className="flex items-center text-white">
            <History className="h-5 w-5 mr-2 text-purple-400" />
            Your Saved Palettes
          </CardTitle>
          {/* <Button
            size="sm"
            variant="outline"
            className="bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border-purple-500/50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button> */}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Palette Card */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all ">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-mono text-sm text-gray-300">
                    {data?.saved_palette_id?.substring(0, 12)}...
                  </p>
                  <p className="text-xs text-gray-500">
                    {data?.created_at
                      ? new Date(data.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/10 text-gray-300 border-white/20"
                >
                  {data?.data?.dominant_colors?.length || 0} colors
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {data?.data?.dominant_colors
                  ?.slice(0, 6)
                  .map((color, index) => (
                    <div
                      key={index}
                      title={color?.hex}
                      className="w-6 h-6 rounded-full border border-white/30"
                      style={{ backgroundColor: color?.hex || "#ccc" }}
                    />
                  ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border-indigo-500/50"
                >
                  Color Variations
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 bg-green-600/20 text-green-300 hover:bg-green-600/30 border-green-500/50"
                >
                  Image Generation
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-2 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border-purple-500/50"
                >
                  Image Fusion
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {data?.gallery_image_ids?.[0]?.url && (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 flex flex-col justify-between mt-2">
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Source Image</span>
            </div>
            <p className="text-white font-semibold">Original garment</p>
          </div>
          <ImagePreviewDialog imageUrl={data?.gallery_image_ids[0].url}>
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

      {/* Dominant Colors Section */}
      {data?.data?.dominant_colors?.length > 0 && (
        <Card className="bg-zinc-900/50 backdrop-blur-sm border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center text-white">
              <Palette className="h-5 w-5 mr-2 text-blue-400" />
              Dominant Colors ({data.data.dominant_colors.length})
            </CardTitle>

            <div className="flex items-center space-x-2 mt-2">
              {data?.data?.processing_info?.color_library && (
                <Badge
                  variant="outline"
                  className="text-gray-300 bg-white/10 border-white/20"
                >
                  <Palette className="h-3 w-3 mr-1 text-blue-400" />
                  {data.data.processing_info.color_library}
                </Badge>
              )}
              {data?.data?.processing_info?.matching_method && (
                <Badge
                  variant="outline"
                  className="text-gray-300 bg-white/10 border-white/20"
                >
                  <CircleSlash2 className="h-3 w-3 mr-1 text-purple-400" />
                  {data.data.processing_info.matching_method}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.data.dominant_colors.map((color, index) => (
                <div
                  key={index}
                  className="bg-zinc-900/50 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-white/20"
                      style={{ backgroundColor: color?.hex || "#ccc" }}
                    />
                    <div>
                      <h4 className="font-semibold text-white">
                        {color?.fashion_match?.fashion_color_name || "Unknown"}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {color?.percentage?.toFixed(1) || 0}% coverage
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hex:</span>
                      <span className="font-mono text-gray-300">
                        {color?.hex || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RGB:</span>
                      <span className="text-gray-300">
                        {color?.rgb?.join(", ") || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category:</span>
                      <span className="capitalize text-gray-300">
                        {color?.fashion_match?.category?.replace(/_/g, " ") ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Match Quality:</span>
                      <span
                        className={`font-semibold uppercase ${getMatchQualityColor(
                          color?.fashion_match?.match_quality
                        )}`}
                      >
                        {color?.fashion_match?.match_quality || "N/A"}
                      </span>
                    </div>
                    {color?.freetone_match && (
                      <div className="pt-2 mt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 font-medium">
                            FreeTone Match:
                          </span>
                          <span className="text-right">
                            <span className="font-semibold text-gray-200">
                              {color.freetone_match?.name || "N/A"}
                            </span>
                            <span className="ml-2 font-mono text-gray-400">
                              {color.freetone_match?.hex || ""}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>Method</span>
                          <span>{color.freetone_match?.method || "N/A"}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>Confidence</span>
                          <span>
                            {color.freetone_match?.confidence
                              ? Math.round(
                                  color.freetone_match.confidence * 100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color Harmony Analysis */}
      {data?.data?.harmony_analysis && (
        <Card className="bg-zinc-900/50 backdrop-blur-sm border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center text-white">
              <CircleSlash2 className="h-5 w-5 mr-2 text-purple-400" />
              Color Harmony Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-white">Harmony Type</h4>
                <Badge
                  className={`border ${getHarmonyTypeColor(
                    data.data.harmony_analysis?.harmony_type
                  )}`}
                >
                  {data.data.harmony_analysis?.harmony_type?.toUpperCase() ||
                    "N/A"}
                </Badge>
                <p className="text-sm text-gray-400 mt-2">
                  {data.data.harmony_analysis?.description || ""}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">
                  Color Temperature
                </h4>
                <div className="flex items-center space-x-2">
                  {data.data.harmony_analysis?.color_temperature
                    ?.temperature === "cool" ? (
                    <Snowflake className="h-4 w-4 text-blue-400" />
                  ) : (
                    <Sun className="h-4 w-4 text-orange-400" />
                  )}
                  <span className="capitalize font-medium text-gray-300">
                    {data.data.harmony_analysis?.color_temperature
                      ?.temperature || "N/A"}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {data.data.harmony_analysis?.color_temperature?.description ||
                    ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold mb-2 text-white">
                  Saturation Level
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-300">
                    {data.data.harmony_analysis?.saturation_analysis?.value ||
                      0}
                    %
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {data.data.harmony_analysis?.saturation_analysis
                    ?.description || ""}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">
                  Brightness Level
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  {data.data.harmony_analysis?.brightness_analysis
                    ?.description || ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Fashion Insights */}
      {data?.data?.fashion_insights && (
        <Card className="bg-zinc-900/50 backdrop-blur-sm border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center text-white">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
              Fashion Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-white">
                  Trend Analysis
                </h4>
                <Badge
                  className={`border ${getTrendColor(
                    data.data.fashion_insights?.trend_analysis?.style
                  )}`}
                >
                  <ChartLine className="h-3 w-3 mr-1" />
                  {data.data.fashion_insights?.trend_analysis?.style?.toUpperCase() ||
                    "N/A"}
                </Badge>
                <p className="text-sm text-gray-400 mt-2">
                  {data.data.fashion_insights?.trend_analysis?.description ||
                    ""}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-white">
                  Versatility Score
                </h4>
                <div
                  className={`flex items-center space-x-2 ${getVersatilityColor(
                    data.data.fashion_insights?.versatility_score?.score
                  )}`}
                >
                  <Star className="h-4 w-4" />
                  <span className="font-medium capitalize">
                    {data.data.fashion_insights?.versatility_score?.score ||
                      "N/A"}
                  </span>
                  <span className="text-sm">
                    (
                    {data.data.fashion_insights?.versatility_score
                      ?.percentage || 0}
                    %)
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {data.data.fashion_insights?.versatility_score?.description ||
                    ""}
                </p>
              </div>
            </div>
            {data.data.fashion_insights?.seasonal_analysis && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-white">
                  Seasonal Appropriateness
                </h4>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-gray-300">
                    {data.data.fashion_insights.seasonal_analysis}
                  </span>
                </div>
              </div>
            )}
            {data.data.fashion_insights?.insights?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-white">Key Insights</h4>
                <ul className="list-disc list-inside space-y-1">
                  {data.data.fashion_insights.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-gray-300">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.data.fashion_insights?.recommendations?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 text-white">
                  Recommendations
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {data.data.fashion_insights.recommendations.map(
                    (recommendation, index) => (
                      <li key={index} className="text-sm text-gray-300">
                        {recommendation}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Styling Recommendations */}
      <Card className="bg-zinc-900/50 backdrop-blur-sm border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="flex items-center text-white">
            <Sparkles className="h-5 w-5 mr-2 text-pink-400" />
            Styling Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-white">
                Color Coordination
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li className="text-sm text-gray-300">
                  Harmonious color flow - perfect for sophisticated, elegant
                  pieces
                </li>
                <li className="text-sm text-gray-300">
                  Add a pop of complementary color for visual interest
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-white">
                Accessory Colors
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li className="text-sm text-gray-300">
                  Neutral tones (black, white, beige) for versatility
                </li>
                <li className="text-sm text-gray-300">
                  Metallic accents to elevate the look
                </li>
                <li className="text-sm text-gray-300">
                  Monochromatic shades for tonal dressing
                </li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h4 className="font-semibold mb-2 text-white">
                Brand Positioning
              </h4>
              <ul className="list-disc list-inside space-y-1">
                <li className="text-sm text-gray-300">
                  Market as classic, investment pieces with enduring appeal
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorAnalysisDisplay;
