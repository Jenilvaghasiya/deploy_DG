// CreateTechPackCard.jsx
import React from "react";
import { Plus } from "lucide-react";

export const CreateTechPackCard = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="group relative backdrop-blur-md bg-white/10 rounded-xl border border-white/20 shadow-lg hover:shadow-2xl hover:bg-white/15 transition-all duration-300 cursor-pointer overflow-hidden h-full min-h-[300px] flex flex-col items-center justify-center"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10 text-center p-6">
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all duration-300" />
            <div className="relative bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
          Create New Tech Pack
        </h3>
        <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
          Start from scratch and build your technical package
        </p>
        
        {/* Decorative elements */}
        <div className="mt-4 flex justify-center gap-2">
          <div className="w-12 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
      </div>
    </div>
  );
};