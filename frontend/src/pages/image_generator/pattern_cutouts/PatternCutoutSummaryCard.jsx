// src/components/PatternCutoutSummaryCard.js
import React from "react";
import { Layers, CheckCircle, Clock, FileImage, CalendarClock } from "lucide-react";
import SmartImage from "@/components/SmartImage";

// Utility to format "time ago"
const getTimeAgo = (dateString) => {
  if (!dateString) return "Unknown";
  const createdAt = new Date(dateString);
  const now = new Date();
  const diffMs = now - createdAt;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return createdAt.toLocaleDateString(); // fallback to normal date after a week
};

const PatternCutoutSummaryCard = ({ cutout, onSelect }) => {
  const { name, status, components = [], metadata = {}, created_at } = cutout;
  const baseUrl = import.meta.env.VITE_BASE_URL || "";

  const imagesToShow = components.slice(0, 3);
  const remainingImageCount = components.length - imagesToShow.length;

  return (
    <div
      className="flex flex-col border border-solid shadow-sm bg-black/20 border-white/35 rounded-xl backdrop-blur-sm overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/50 hover:shadow-xl hover:-translate-y-1"
      onClick={() => onSelect(cutout)}
    >
      {/* Image Grid Section */}
      <div className="p-3 border-b border-solid border-white/35">
        <div className="grid grid-cols-2 gap-2 h-36">
          {imagesToShow.map((comp, index) => (
            <div key={index} className="bg-zinc-800 rounded-md overflow-hidden">
              <SmartImage
                src={`${baseUrl}/${comp.image}`}
                alt={comp.component}
                className="w-full h-full text-xs object-cover"
                onError={(e) =>
                  (e.currentTarget.src = "/static/img/pattern-placeholder.png")
                }
              />
            </div>
          ))}

          {remainingImageCount > 0 && (
            <div className="bg-zinc-800/50 rounded-md flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                +{remainingImageCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Details Section */}
      <div className="p-4 grow flex flex-col gap-3">
        <div>
          <h3 className="font-medium text-lg text-white truncate mb-1">
            {name || "Untitled Cutout"}
          </h3>
          <div className="flex items-center text-sm text-zinc-300">
            {status === "completed" ? (
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
            ) : (
              <Clock className="w-4 h-4 mr-2 text-yellow-400" />
            )}
            <span className="capitalize">{status}</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-zinc-300 mt-auto">
          <div className="flex items-center">
            <Layers className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              Garment:{" "}
              <span className="font-semibold capitalize text-white">
                {metadata.garment_type?.replace(/_/g, " ") || "N/A"}
              </span>
            </span>
          </div>
          <div className="flex items-center">
            <FileImage className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              Pieces:{" "}
              <span className="font-semibold text-white">
                {components.length}
              </span>
            </span>
          </div>

          {/* 🕒 Created At */}
          <div className="flex items-center">
            <CalendarClock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              Created:{" "}
              <span className="font-semibold text-white">
                {getTimeAgo(created_at)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternCutoutSummaryCard;
