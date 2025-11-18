
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
import { EditableField, EditableList } from './Editable';

// Section Components


export function ProductOverviewSection({ data, isEditMode, onDataChange }) {
  const overview = data?.tech_pack?.product_overview || {};
  const generalInfo = data?.tech_pack?.general_info || {};

  const updateOverview = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        product_overview: {
          ...overview,
          [field]: value
        }
      }
    });
  };

  const updateGeneralInfo = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        general_info: {
          ...generalInfo,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Product Overview */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Product Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="Style Name"
            value={overview.style_name}
            onChange={(value) => updateOverview('style_name', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Style Number"
            value={overview.style_number}
            onChange={(value) => updateOverview('style_number', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Garment Type"
            value={overview.garment_type}
            onChange={(value) => updateOverview('garment_type', value)}
            isEditMode={isEditMode}
            type="select"
            options={["T-Shirt", "Shirt", "Dress", "Pants", "Jacket", "Sweater", "Skirt", "Other"]}
          />
          <EditableField
            label="Season"
            value={overview.season || generalInfo.season}
            onChange={(value) => updateOverview('season', value)}
            isEditMode={isEditMode}
            type="select"
            options={["Spring", "Summer", "Fall", "Winter", "All Season"]}
          />
          <EditableField
            label="Gender"
            value={overview.gender || data?.analysis?.gender}
            onChange={(value) => updateOverview('gender', value)}
            isEditMode={isEditMode}
            type="select"
            options={["Men", "Women", "Unisex", "Boys", "Girls"]}
          />
          <EditableField
            label="Market"
            value={generalInfo.market}
            onChange={(value) => updateGeneralInfo('market', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Designer"
            value={generalInfo.designer}
            onChange={(value) => updateGeneralInfo('designer', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Revision"
            value={overview.revision}
            onChange={(value) => updateOverview('revision', value)}
            isEditMode={isEditMode}
          />
        </div>
      </div>

      {/* Description */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Description
        </h3>
        <EditableField
          label=""
          value={overview.description}
          onChange={(value) => updateOverview('description', value)}
          isEditMode={isEditMode}
          multiline={true}
        />
      </div>
    </div>
  );
}

export function FabricsTrimsSection({ data, isEditMode, onDataChange }) {
  const fabrics = data?.tech_pack?.suggested_fabrics_and_trims || {};
  const materials = data?.tech_pack?.materials || {};

  const updateFabrics = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        suggested_fabrics_and_trims: {
          ...fabrics,
          [field]: value
        }
      }
    });
  };

  const updateMainFabric = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        suggested_fabrics_and_trims: {
          ...fabrics,
          main_fabric: {
            ...fabrics.main_fabric,
            [field]: value
          }
        }
      }
    });
  };

  const updateTrims = (newTrims) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        suggested_fabrics_and_trims: {
          ...fabrics,
          trims: newTrims
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Fabric */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Main Fabric
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="Composition"
            value={fabrics.main_fabric?.composition || materials.material_composition}
            onChange={(value) => updateMainFabric('composition', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Weight"
            value={fabrics.main_fabric?.weight}
            onChange={(value) => updateMainFabric('weight', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Characteristics"
            value={fabrics.main_fabric?.characteristics}
            onChange={(value) => updateMainFabric('characteristics', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Supplier"
            value={fabrics.main_fabric?.supplier}
            onChange={(value) => updateMainFabric('supplier', value)}
            isEditMode={isEditMode}
          />
        </div>
      </div>

      {/* Trims */}
      <EditableList
        title="Trims"
        items={fabrics.trims?.map(t => typeof t === 'string' ? t : t.name) || []}
        onChange={updateTrims}
        isEditMode={isEditMode}
        icon={Tag}
      />
    </div>
  );
}

export function PrintsEmbellishmentsSection({ data, isEditMode, onDataChange }) {
  const prints = data?.tech_pack?.prints_and_embellishments || {};

  const updatePrints = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        prints_and_embellishments: {
          ...prints,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <EditableList
        title="Print Techniques"
        items={prints.print_techniques || []}
        onChange={(value) => updatePrints('print_techniques', value)}
        isEditMode={isEditMode}
        icon={Sparkles}
      />

      <EditableList
        title="Embellishments"
        items={prints.embellishments || []}
        onChange={(value) => updatePrints('embellishments', value)}
        isEditMode={isEditMode}
      />

      <EditableList
        title="Placements"
        items={prints.placements || []}
        onChange={(value) => updatePrints('placements', value)}
        isEditMode={isEditMode}
      />
    </div>
  );
}

export function ConstructionNotesSection({ data, isEditMode, onDataChange }) {
  const construction = data?.tech_pack?.construction_notes || {};

  const updateConstruction = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        construction_notes: {
          ...construction,
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <EditableList
        title="Seam Types"
        items={construction.seam_types || []}
        onChange={(value) => updateConstruction('seam_types', value)}
        isEditMode={isEditMode}
        icon={Scissors}
      />

      <EditableList
        title="Stitch Details"
        items={construction.stitch_details || []}
        onChange={(value) => updateConstruction('stitch_details', value)}
        isEditMode={isEditMode}
      />

      <EditableList
        title="Special Techniques"
        items={construction.special_techniques || []}
        onChange={(value) => updateConstruction('special_techniques', value)}
        isEditMode={isEditMode}
      />

      {/* Assembly Sequence with numbering */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Assembly Sequence</h3>
        <div className="space-y-2">
          {(construction.assembly_sequence || []).map((step, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </span>
              {isEditMode ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={step}
                    onChange={(e) => {
                      const updated = [...(construction.assembly_sequence || [])];
                      updated[index] = e.target.value;
                      updateConstruction('assembly_sequence', updated);
                    }}
                    className="bg-white/10 border-white/20 text-white flex-1"
                    placeholder="Enter assembly step"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const updated = (construction.assembly_sequence || []).filter((_, i) => i !== index);
                      updateConstruction('assembly_sequence', updated);
                    }}
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-white">{step}</p>
              )}
            </div>
          ))}
          {isEditMode && (
            <Button
              onClick={() => {
                updateConstruction('assembly_sequence', [...(construction.assembly_sequence || []), ""]);
              }}
              variant="outline"
              size="sm"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PackagingInstructionsSection({ data, isEditMode, onDataChange }) {
  const packaging = data?.tech_pack?.packaging_instructions || {};

  const updatePackaging = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        packaging_instructions: {
          ...packaging,
          [field]: value
        }
      }
    });
  };

  const updatePolybag = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        packaging_instructions: {
          ...packaging,
          polybag_packaging: {
            ...packaging.polybag_packaging,
            [field]: value
          }
        }
      }
    });
  };

  const updateMaster = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        packaging_instructions: {
          ...packaging,
          master_packaging: {
            ...packaging.master_packaging,
            [field]: value
          }
        }
      }
    });
  };

  const updateCarton = (field, value) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        packaging_instructions: {
          ...packaging,
          carton_packing: {
            ...packaging.carton_packing,
            [field]: value
          }
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Care Label Instructions */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Care Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(packaging.care_label_instructions || []).map((instruction, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              {isEditMode ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={instruction}
                    onChange={(e) => {
                      const updated = [...(packaging.care_label_instructions || [])];
                      updated[index] = e.target.value;
                      updatePackaging('care_label_instructions', updated);
                    }}
                    className="bg-white/10 border-white/20 text-white flex-1"
                    placeholder="Enter care instruction"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const updated = (packaging.care_label_instructions || []).filter((_, i) => i !== index);
                      updatePackaging('care_label_instructions', updated);
                    }}
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-white text-sm">{instruction}</p>
                </>
              )}
            </div>
          ))}
          {isEditMode && (
            <Button
              onClick={() => {
                updatePackaging('care_label_instructions', [...(packaging.care_label_instructions || []), ""]);
              }}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Instruction
            </Button>
          )}
        </div>
      </div>

      {/* Polybag Packaging */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Polybag Packaging
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="Type"
            value={packaging.polybag_packaging?.type}
            onChange={(value) => updatePolybag('type', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Folding"
            value={packaging.polybag_packaging?.folding}
            onChange={(value) => updatePolybag('folding', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Accessories"
            value={packaging.polybag_packaging?.accessories}
            onChange={(value) => updatePolybag('accessories', value)}
            isEditMode={isEditMode}
          />
        </div>
      </div>

      {/* Master Packaging */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Box className="w-5 h-5" />
          Master Packaging
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <EditableField
            label="Quantity"
            value={packaging.master_packaging?.quantity}
            onChange={(value) => updateMaster('quantity', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Bundling"
            value={packaging.master_packaging?.bundling}
            onChange={(value) => updateMaster('bundling', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Protection"
            value={packaging.master_packaging?.protection}
            onChange={(value) => updateMaster('protection', value)}
            isEditMode={isEditMode}
          />
        </div>
      </div>

      {/* Carton Packing */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Carton Packing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="Quantity"
            value={packaging.carton_packing?.quantity}
            onChange={(value) => updateCarton('quantity', value)}
            isEditMode={isEditMode}
          />
          <EditableField
            label="Dimensions"
            value={packaging.carton_packing?.dimensions}
            onChange={(value) => updateCarton('dimensions', value)}
            isEditMode={isEditMode}
          />
          <div className="md:col-span-2">
            <EditableField
              label="Carton Marking"
              value={packaging.carton_packing?.carton_marking}
              onChange={(value) => updateCarton('carton_marking', value)}
              isEditMode={isEditMode}
              multiline={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}