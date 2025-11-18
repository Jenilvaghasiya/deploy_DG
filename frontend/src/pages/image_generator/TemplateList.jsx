import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import api from "../../api/axios";
import { MeasurementTable } from "./MeasurementTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, PlusCircle, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

export default function TemplateList({ onSelectTemplate, onCreateManual }) {
  const [templates, setTemplates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get("/image-variation/templates");
      setTemplates(res?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch templates", err);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await api.delete(`/image-variation/templates/${templateId}`);
      // Remove the deleted template from state
      setTemplates(templates.filter(template => template.id !== templateId));
    } catch (err) {
      console.error("Failed to delete template", err);
    }
  };

  const handleNext = () => {
    if (currentIndex < templates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div>
      {/* Manual Section First */}
      <h2 className="text-lg font-semibold mb-4 text-white">
        Start from Scratch
      </h2>
      <div
        onClick={onCreateManual}
        className="flex flex-col items-center justify-center border-2 border-dashed border-pink-500 rounded-lg bg-pink-500/10 shadow-md cursor-pointer hover:bg-pink-500/20 transition h-40"
      >
        <PlusCircle className="h-6 w-6 text-pink-500" />
        <p className="mt-2 text-sm font-medium text-pink-300">
          Create Manually
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center my-8">
        <div className="flex-grow border-t border-gray-700"></div>
        <span className="px-4 text-gray-400 text-sm xl:text-base">OR</span>
        <div className="flex-grow border-t border-gray-700"></div>
      </div>

      {/* Templates Section */}
      <h2 className="text-lg font-semibold mb-4 text-white">
        Select a Template
      </h2>
      {templates.length === 0 ? (
        <p className="text-sm text-gray-500">No templates available</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template?.id}
              className="relative flex flex-col items-center border p-4 rounded-lg bg-white/10 hover:bg-pink-500/10 shadow-md cursor-pointer group"
            >
              {/* Delete Button */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ConfirmDeleteDialog
                  onDelete={() => handleDeleteTemplate(template.id)}
                  title="Delete Template"
                  message="Are you sure you want to delete this template? This action cannot be undone."
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </ConfirmDeleteDialog>
              </div>
              
              <div 
                className="w-full"
                onClick={() => onSelectTemplate(template)}
              >
                <MeasurementTable
                  measurements={template?.measurements || []}
                  isEditable={false}
                  showDuplicateButton={false}
                  showSaveAsTemplate={false}
                  tableTitle={template?.template_name || "Unnamed Template"}
                  showSelectButton={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
