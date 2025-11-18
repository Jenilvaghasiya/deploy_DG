
// TechPacksDisplay.jsx
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Palette,
  Scissors,
  Sparkles,
  FileText,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Calendar,
  Hash,
  User,
  Layers,
  Ruler,
  Box,
  Tag,
  Info,
  ChevronLeft,
  Edit,
  Save,
  X,
  Plus,
  Trash2
} from "lucide-react";
import ImagePreviewDialog from "@/pages/moodboards/ImagePreviewDialog";
import ReactMarkdown from "react-markdown";

// Editable Field Component

export function EditableField({ label, value, onChange, type = "text", isEditMode, options = [], multiline = false }) {
  if (!isEditMode) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-white font-semibold">{value || "N/A"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder={`Select ${label}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : multiline ? (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white min-h-[100px]"
          placeholder={`Enter ${label}`}
        />
      ) : (
        <Input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
          placeholder={`Enter ${label}`}
        />
      )}
    </div>
  );
}

// Editable List Component
export function EditableList({ title, items = [], onChange, isEditMode, icon: Icon }) {
  const handleAdd = () => {
    onChange([...items, ""]);
  };

  const handleRemove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleUpdate = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        {title}
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3">
            {isEditMode ? (
              <div className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleUpdate(index, e.target.value)}
                  className="bg-white/10 border-white/20 text-white flex-1"
                  placeholder={`Enter ${title.toLowerCase()} item`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(index)}
                  className="text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p className="text-white">{item}</p>
            )}
          </div>
        ))}
        {isEditMode && (
          <Button
            onClick={handleAdd}
            variant="outline"
            size="sm"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>
    </div>
  );
}