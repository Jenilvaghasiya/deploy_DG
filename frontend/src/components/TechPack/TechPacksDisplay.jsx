// TechPacksDisplay.jsx
import React, { useState, useEffect } from 'react';
// ADD these imports
import FilesDialog from './TechPacksDisplay/FilesDialog';

import { FileSpreadsheet } from "lucide-react"; // ADD this
import BOMModal from "@/pages/image_generator/take_packs/BOMModal"; // ADD this
import api from "@/api/axios"; // ADD this
import toast from "react-hot-toast"; // ADD this
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Trash2,
  PlusCircle,
  List, 
  Clock, 
  CheckSquare, 
  ChevronUp, 
  ChevronDown,
  Check,
  CheckIcon
} from "lucide-react";
import ImagePreviewDialog from "@/pages/moodboards/ImagePreviewDialog";
import ReactMarkdown from "react-markdown";
import { ChecklistEditor, GeneralNotesEditor, SequentialNotesEditor, TimeLogsEditor } from './TechPacksDisplay/GeneralNotesEditor';
import TechPackPickerModal from './TechPacksDisplay/TechPackDataPickerModal';
import { generatePDF } from './TechPacksDisplay/Generatepdf';
import { ColorPickerField } from './ColorPickerField'; // Import the color picker
import NotesSection from './TechPacksDisplay/NotesSection';



// Default empty tech pack structure for create mode
function getEmptyTechPack() {
  // Add some randomness to style_number, revision, and task_id
  function randomString(length = 4) {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  }
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  const now = Date.now();
  const randSuffix = randomString(3) + randomInt(10, 99);
  const styleNumber = `ST-${new Date().getFullYear()}-${randSuffix}`;
  const revision = `${randomInt(1, 3)}.${randomInt(0, 9)}`;
  const taskId = `TASK-${now}-${randomString(2)}${randomInt(100, 999)}`;

  return {
    tech_pack: {
      product_overview: {
        style_name: "",
        style_number: styleNumber,
        garment_type: "",
        season: "",
        gender: "",
        revision: revision,
        description: ""
      },
      general_info: {
        market: "",
        designer: "",
        season: ""
      },
      suggested_fabrics_and_trims: {
        main_fabric: {
          composition: "",
          weight: "",
          characteristics: "",
          supplier: ""
        },
        trims: []
      },
      prints_and_embellishments: {
        print_techniques: [],
        embellishments: [],
        placements: []
      },
      construction_notes: {
        seam_types: [],
        stitch_details: [],
        special_techniques: [],
        assembly_sequence: []
      },
      packaging_instructions: {
        care_label_instructions: [],
        polybag_packaging: {
          type: "",
          folding: "",
          accessories: ""
        },
        master_packaging: {
          quantity: "",
          bundling: "",
          protection: ""
        },
        carton_packing: {
          quantity: "",
          dimensions: "",
          carton_marking: ""
        }
      },
      materials: {
        material_composition: ""
      },
      measurements: {
        fit_type: "",
        measurement_points: []
      },
      colors: {}
    },
    notes: [],
    task_id: taskId,
    generation_source: "manual_creation",
    status: "draft",
    gallery_image_ids: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Editable Field Component
function EditableField({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  isEditMode, 
  options = [], 
  multiline = false,
  placeholder = "",
  required = false 
}) {
  if (!isEditMode) {
    // Optional: Basic regex cleanup — remove extra newlines or unwanted markdown tokens
    const cleanValue = value?.replace(/\n{3,}/g, "\n\n").trim();

    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
        <p className="text-xs text-gray-400 mb-1">
          {label}
          {/*required && <span className="text-red-400 ml-1">*</span>*/}
        </p>

        {/* Markdown rendering */}
        <div className="text-white font-semibold prose prose-invert prose-sm">
          <ReactMarkdown>{cleanValue || "N/A"}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1">
        {label}
        {/*required && <span className="text-red-400 ml-1">*</span>*/}
      </p>
      {type === "select" ? (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue placeholder={placeholder || `Select ${label}`} />
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
          placeholder={placeholder || `Enter ${label}`}
          required={required}
        />
      ) : (
        <Input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white/10 border-white/20 text-white"
          placeholder={placeholder || `Enter ${label}`}
          required={required}
        />
      )}
    </div>
  );
}

// Editable List Component
function EditableList({ title, items = [], onChange, isEditMode, icon: Icon, placeholder = "" }) {
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
      {items.length === 0 && !isEditMode && (
        <p className="text-gray-400 text-sm">No {title.toLowerCase()} added yet</p>
      )}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-3">
            {isEditMode ? (
              <div className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) => handleUpdate(index, e.target.value)}
                  className="bg-white/10 border-white/20 text-white flex-1"
                  placeholder={placeholder || `Enter ${title.toLowerCase()} item`}
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
            Add {title.slice(0, -1)}
          </Button>
        )}
      </div>
    </div>
  );
}



// Section Components
function ProductOverviewSection({ data, isEditMode, onDataChange, colorAnalysisData }) {
  const overview = data?.tech_pack?.product_overview || {};
  const generalInfo = data?.tech_pack?.general_info || {};
  const colors = data?.tech_pack?.colors || {}; // Add this

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

   // Add this function for color updates
  const updateColors = (colorData) => {
    onDataChange({
      ...data,
      tech_pack: {
        ...data.tech_pack,
        colors: colorData
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
            placeholder="e.g., Classic Tee"
            //required={true}
          />
          <EditableField
            label="Style Number"
            value={overview.style_number}
            onChange={(value) => updateOverview('style_number', value)}
            isEditMode={isEditMode}
            placeholder="e.g., ST-2024-001"
            //required={true}
          />
          <EditableField
            label="Garment Type"
            value={overview.garment_type}
            onChange={(value) => updateOverview('garment_type', value)}
            isEditMode={isEditMode}
            type="select"
            options={["T-Shirt", "Shirt", "Dress", "Pants", "Jacket", "Sweater", "Skirt", "Shorts", "Blouse", "Other"]}
            required={true}
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
            //required={true}
          />
          <EditableField
            label="Market"
            value={generalInfo.market}
            onChange={(value) => updateGeneralInfo('market', value)}
            isEditMode={isEditMode}
            placeholder="e.g., USA, Europe, Asia"
          />

            {/* ADD COLOR PICKER HERE - spans 2 columns for better display */}
          <div className="md:col-span-2">
            <ColorPickerField
            value={colors}
            onChange={updateColors}
            isEditMode={isEditMode}
            colorAnalysisData={colorAnalysisData}
          />
          </div>

          <EditableField
            label="Designer"
            value={generalInfo.designer}
            onChange={(value) => updateGeneralInfo('designer', value)}
            isEditMode={isEditMode}
            placeholder="Designer name"
          />
          <EditableField
            label="Revision"
            value={overview.revision}
            onChange={(value) => updateOverview('revision', value)}
            isEditMode={isEditMode}
            placeholder="e.g., 1.0, 2.0"
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
          placeholder="Enter detailed product description..."
        />
      </div>
    </div>
  );
}

function FabricsTrimsSection({ data, isEditMode, onDataChange }) {
  const fabrics = data?.tech_pack?.suggested_fabrics_and_trims || {};
  const materials = data?.tech_pack?.materials || {};

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
            placeholder="e.g., 100% Cotton"
            //required={true}
          />
          <EditableField
            label="Weight"
            value={fabrics.main_fabric?.weight}
            onChange={(value) => updateMainFabric('weight', value)}
            isEditMode={isEditMode}
            placeholder="e.g., 180 GSM"
          />
          <EditableField
            label="Characteristics"
            value={fabrics.main_fabric?.characteristics}
            onChange={(value) => updateMainFabric('characteristics', value)}
            isEditMode={isEditMode}
            placeholder="e.g., Soft, Breathable"
          />
          <EditableField
            label="Supplier"
            value={fabrics.main_fabric?.supplier}
            onChange={(value) => updateMainFabric('supplier', value)}
            isEditMode={isEditMode}
            placeholder="e.g., ABC Textiles"
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
        placeholder="e.g., YKK Zipper, Branded Label"
      />
    </div>
  );
}

function PrintsEmbellishmentsSection({ data, isEditMode, onDataChange }) {
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
        placeholder="e.g., Screen Print, Digital Print"
      />

      <EditableList
        title="Embellishments"
        items={prints.embellishments || []}
        onChange={(value) => updatePrints('embellishments', value)}
        isEditMode={isEditMode}
        placeholder="e.g., Embroidery, Sequins"
      />

      <EditableList
        title="Placements"
        items={prints.placements || []}
        onChange={(value) => updatePrints('placements', value)}
        isEditMode={isEditMode}
        placeholder="e.g., Center Front, Left Chest"
      />
    </div>
  );
}

function ConstructionNotesSection({ data, isEditMode, onDataChange }) {
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
        placeholder="e.g., French Seam, Flat Felled Seam"
      />

      <EditableList
        title="Stitch Details"
        items={construction.stitch_details || []}
        onChange={(value) => updateConstruction('stitch_details', value)}
        isEditMode={isEditMode}
        placeholder="e.g., Double Needle Stitch, Overlock"
      />

      <EditableList
        title="Special Techniques"
        items={construction.special_techniques || []}
        onChange={(value) => updateConstruction('special_techniques', value)}
        isEditMode={isEditMode}
        placeholder="e.g., Bar Tack, Reinforcement"
      />

      {/* Assembly Sequence with numbering */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Assembly Sequence</h3>
        {(construction.assembly_sequence || []).length === 0 && !isEditMode && (
          <p className="text-gray-400 text-sm">No assembly sequence added yet</p>
        )}
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

function PackagingInstructionsSection({ data, isEditMode, onDataChange }) {
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
        {(packaging.care_label_instructions || []).length === 0 && !isEditMode && (
          <p className="text-gray-400 text-sm">No care instructions added yet</p>
        )}
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
                    placeholder="e.g., Machine wash cold"
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
            placeholder="e.g., Clear Polybag"
          />
          <EditableField
            label="Folding"
            value={packaging.polybag_packaging?.folding}
            onChange={(value) => updatePolybag('folding', value)}
            isEditMode={isEditMode}
            placeholder="e.g., Half fold"
          />
          <EditableField
            label="Accessories"
            value={packaging.polybag_packaging?.accessories}
            onChange={(value) => updatePolybag('accessories', value)}
            isEditMode={isEditMode}
            placeholder="e.g., Tissue paper, Hangtag"
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
            placeholder="e.g., 12 pcs"
          />
          <EditableField
            label="Bundling"
            value={packaging.master_packaging?.bundling}
            onChange={(value) => updateMaster('bundling', value)}
            isEditMode={isEditMode}
            placeholder="e.g., Size wise"
          />
          <EditableField
            label="Protection"
            value={packaging.master_packaging?.protection}
            onChange={(value) => updateMaster('protection', value)}
            isEditMode={isEditMode}
            placeholder="e.g., Bubble wrap"
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
            placeholder="e.g., 48 pcs"
          />
          <EditableField
            label="Dimensions"
            value={packaging.carton_packing?.dimensions}
            onChange={(value) => updateCarton('dimensions', value)}
            isEditMode={isEditMode}
            placeholder="e.g., 60x40x30 cm"
          />
          <div className="md:col-span-2">
            <EditableField
              label="Carton Marking"
              value={packaging.carton_packing?.carton_marking}
              onChange={(value) => updateCarton('carton_marking', value)}
              isEditMode={isEditMode}
              multiline={true}
              placeholder="Enter carton marking details..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// NotesSection component
// function NotesSection({ data, isEditMode, onDataChange }) {
//   const initializeNotes = (notesData) => {
//     if (!notesData || !Array.isArray(notesData)) return [];
//     return notesData.map((note, index) => ({
//       ...note,
//       id: note.id || `note-${Date.now()}-${index}`,
//       items: (note.items || []).map((item, itemIndex) => ({
//         ...item,
//         id: item.id || `item-${Date.now()}-${index}-${itemIndex}`,
//         subNotes: (item.subNotes || []).map((subNote, subIndex) => ({
//           ...subNote,
//           id: subNote.id || `sub-${Date.now()}-${index}-${itemIndex}-${subIndex}`
//         }))
//       }))
//     }));
//   };

//   const [notes, setNotes] = useState(() => initializeNotes(data?.notes));
//   const [showCreateMenu, setShowCreateMenu] = useState(false);
//   const [selectedNote, setSelectedNote] = useState(null);
//   const [isCreatingNote, setIsCreatingNote] = useState(false);
//   const [newNoteType, setNewNoteType] = useState(null);

//   console.log("NotesSection render - notes:", notes);

//   // Update parent data when notes change
//   useEffect(() => {
//     if (isEditMode) {
//       console.log("Updating parent with notes:", notes);
//       onDataChange({
//         ...data,
//         notes: notes
//       });
//     }
//   }, [notes]);

//   const createNote = (type) => {
//     console.log("Creating note of type:", type);
    
//     const timestamp = Date.now();
//     const randomSuffix = Math.random().toString(36).substr(2, 9);
    
//     const newNote = {
//       id: `note-${timestamp}-${randomSuffix}`,
//       type,
//       name: getDefaultNoteName(type),
//       summary: type === 'general' ? '' : undefined,
//       items: [],
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString()
//     };
    
//     console.log("New note created:", newNote);
    
//     // Update notes state
//     setNotes(prevNotes => {
//       const updatedNotes = [...prevNotes, newNote];
//       console.log("Updated notes array:", updatedNotes);
//       return updatedNotes;
//     });
    
//     // Set as selected note
//     setSelectedNote(newNote);
//     setShowCreateMenu(false);
//     setIsCreatingNote(false);
//     setNewNoteType(null);
    
//     console.log("Note creation completed, selected note set");
//   };

//   const getDefaultNoteName = (type) => {
//     const defaults = {
//       general: 'General Notes',
//       sequential: 'Sequential Notes',
//       time_logs: 'Time Logs',
//       checklist: 'Checklist'
//     };
//     return defaults[type] || 'New Note';
//   };

//   const updateNote = (noteId, updates) => {
//     console.log("Updating note:", noteId, updates);
//     setNotes(prevNotes => 
//       prevNotes.map(note => 
//         note.id === noteId ? { ...note, ...updates, updatedAt: new Date().toISOString() } : note
//       )
//     );
//   };

//   const deleteNote = (noteId) => {
//     console.log("Deleting note:", noteId);
//     setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
//     if (selectedNote?.id === noteId) {
//       setSelectedNote(null);
//     }
//   };

//   const getNoteIcon = (type) => {
//     switch (type) {
//       case 'general': return <FileText className="w-4 h-4" />;
//       case 'sequential': return <List className="w-4 h-4" />;
//       case 'time_logs': return <Clock className="w-4 h-4" />;
//       case 'checklist': return <CheckSquare className="w-4 h-4" />;
//       default: return <FileText className="w-4 h-4" />;
//     }
//   };

//   return (
//   <div className="space-y-6">
//     {/* Notes List */}
//     <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
//       <div className="flex items-center justify-between mb-6">
//         <h3 className="text-xl font-semibold text-white">Notes</h3>
//         {isEditMode && (
//   <div className="relative">
//     <Button
//       onClick={() => {
//         console.log("Create note button clicked, current state:", showCreateMenu);
//         setShowCreateMenu(!showCreateMenu);
//       }}
//       className="bg-purple-600 hover:bg-purple-700 text-white"
//     >
//       <Plus className="w-4 h-4 mr-2" />
//       Create Note
//     </Button>
    
//     {showCreateMenu && (
//       <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-white/20 overflow-hidden z-[1000]">
//         {/* Compact 2x2 Grid Menu - Small & Compact */}
//         <div className="grid grid-cols-2 gap-0">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               console.log("General note button clicked");
//               createNote('general');
//               setShowCreateMenu(false); // Close menu after selection
//             }}
//             className="p-3 flex flex-col items-center gap-1 text-center text-white hover:bg-white/10 transition-colors"
//           >
//             <FileText className="w-5 h-5 text-blue-400" />
//             <span className="text-xs font-medium">General Notes</span>
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               console.log("Sequential note button clicked");
//               createNote('sequential');
//               setShowCreateMenu(false);
//             }}
//             className="p-3 flex flex-col items-center gap-1 text-center text-white hover:bg-white/10 transition-colors"
//           >
//             <List className="w-5 h-5 text-green-400" />
//             <span className="text-xs font-medium">Sequential</span>
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               console.log("Time logs button clicked");
//               createNote('time_logs');
//               setShowCreateMenu(false);
//             }}
//             className="p-3 flex flex-col items-center gap-1 text-center text-white hover:bg-white/10 transition-colors"
//           >
//             <Clock className="w-5 h-5 text-yellow-400" />
//             <span className="text-xs font-medium">Time Logs</span>
//           </button>
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               console.log("Checklist button clicked");
//               createNote('checklist');
//               setShowCreateMenu(false);
//             }}
//             className="p-3 flex flex-col items-center gap-1 text-center text-white hover:bg-white/10 transition-colors"
//           >
//             <CheckSquare className="w-5 h-5 text-purple-400" />
//             <span className="text-xs font-medium">Checklist</span>
//           </button>
//         </div>
//       </div>
//     )}
//   </div>
// )}
//       </div>
//       {notes.length === 0 ? (
//         <div className="text-center py-12">
//           <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
//           <p className="text-gray-400">No notes created yet</p>
//           {isEditMode && (
//             <p className="text-gray-500 text-sm mt-2">Click "Create Note" to get started</p>
//           )}
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {notes.map((note) => (
//             <div
//               key={note.id}
//               onClick={() => {
//                 console.log("Note clicked:", note);
//                 setSelectedNote(note);
//               }}
//               className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border cursor-pointer transition-all ${
//                 selectedNote?.id === note.id 
//                   ? 'border-purple-400 bg-white/10' 
//                   : 'border-white/10 hover:border-white/30 hover:bg-white/10'
//               }`}
//             >
//               <div className="flex items-start justify-between mb-2">
//                 <div className="flex items-center gap-2">
//                   {getNoteIcon(note.type)}
//                   <span className="text-xs text-gray-400 capitalize">
//                     {note.type.replace('_', ' ')}
//                   </span>
//                 </div>
//                 {isEditMode && (
//                   <Button
//                     size="sm"
//                     variant="ghost"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       deleteNote(note.id);
//                     }}
//                     className="text-red-400 hover:bg-red-500/20 -mr-2 -mt-1"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </Button>
//                 )}
//               </div>
//               <h4 className="text-white font-medium mb-1">{note.name}</h4>
//               <p className="text-gray-400 text-xs">
//                 {note.items.length} {note.items.length === 1 ? 'item' : 'items'}
//               </p>
//               <p className="text-gray-500 text-xs mt-2">
//                 Updated {new Date(note.updatedAt).toLocaleDateString()}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>

//     {/* Selected Note Detail */}
//     {selectedNote && (
//       <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6">
//         {selectedNote.type === 'general' && (
//           <GeneralNotesEditor
//             note={selectedNote}
//             isEditMode={isEditMode}
//             onUpdate={(updates) => updateNote(selectedNote.id, updates)}
//           />
//         )}
//         {selectedNote.type === 'sequential' && (
//           <SequentialNotesEditor
//             note={selectedNote}
//             isEditMode={isEditMode}
//             onUpdate={(updates) => updateNote(selectedNote.id, updates)}
//           />
//         )}
//         {selectedNote.type === 'time_logs' && (
//           <TimeLogsEditor
//             note={selectedNote}
//             isEditMode={isEditMode}
//             onUpdate={(updates) => updateNote(selectedNote.id, updates)}
//           />
//         )}
//         {selectedNote.type === 'checklist' && (
//           <ChecklistEditor
//             note={selectedNote}
//             isEditMode={isEditMode}
//             onUpdate={(updates) => updateNote(selectedNote.id, updates)}
//           />
//         )}
//       </div>
//     )}
//   </div>
// );
// }

// Main TechPacksDisplay Component
export default function TechPacksDisplay({ 
  data, 
  onBack, 
  onSave,
  mode = "view", // "view", "edit", or "create"
  initialData = null,
  isEditable = true, // This should control whether editing is allowed
  onDataChange 
}) {

const [uploadedFiles, setUploadedFiles] = useState([]);

    const [tempBomData, setTempBomData] = useState(null);
   const [showBOMModal, setShowBOMModal] = useState(false);
   const [showNotesDialog, setShowNotesDialog] = useState(false); // ADD THIS LINE

  const [bomData, setBomData] = useState(null);
  const [loadingBOM, setLoadingBOM] = useState(false);


      // Determine initial state based on mode
  const [currentMode, setCurrentMode] = useState(() => {
    // Only start in edit mode if mode is "create"
    // For "edit" mode, start in "view" but allow editing
    return mode === "create" ? "create" : "view";
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  
  const [editedData, setEditedData] = useState(() => {
    if (mode === "create") {
      return initialData || getEmptyTechPack();
    }
    return data || getEmptyTechPack();
  });
    useEffect(() => {
    if (currentMode === "view") {
      setUploadedFiles([]);
    }
  }, [currentMode]);
  const [activeTab, setActiveTab] = useState("overview");
  const [validationErrors, setValidationErrors] = useState({});

  const [colorAnalysisData, setColorAnalysisData] = useState(null);




  useEffect(() => {
  // Only check BOM status for existing tech packs (not in create mode)
  if (currentMode !== "create" && data?._id) {
    const checkBOMStatus = async () => {
      try {
        const response = await api.get(`/image-variation/tech-packs/${data._id}/bom`);
        if (response.data?.data?.bom) {
          setBomData(response.data.data.bom);
        }
      } catch (error) {
        // BOM doesn't exist yet, that's okay
        if (error.response?.status !== 404) {
          console.error("Error checking BOM status:", error);
        }
      }
    };
    
    checkBOMStatus();
  }
}, [data?._id, currentMode]);

// ADD THIS COMPLETE NEW useEffect
useEffect(() => {
  const fetchColorAnalysis = async () => {
    if (data?._id && data?.gallery_image_ids?.[0]) {
      try {
        const imageUrl = data.gallery_image_ids[0].url || data.gallery_image_ids[0];
        
        console.log("TechPack - Searching for color analysis for:", imageUrl);
        
        // Fetch ALL color analyses
        let allAnalyses = [];
        let currentPage = 1;
        let hasMore = true;
        
        while (hasMore && currentPage <= 10) {
          const response = await api.get("/image-variation/color_analysis", {
            params: { page: currentPage, limit: 100 },
          });

          const analyses = response.data?.data?.analyses || [];
          allAnalyses = [...allAnalyses, ...analyses];
          
          const pagination = response.data?.data?.pagination;
          hasMore = pagination?.hasNextPage || false;
          currentPage++;
        }

        console.log(`TechPack - Searched through ${allAnalyses.length} color analyses`);

        // Find matching analysis
        const matchingAnalysis = allAnalyses.find(analysis => 
          analysis.gallery_image_ids?.some(img => {
            const imgUrl = img.url || img;
            return imgUrl === imageUrl;
          })
        );

        if (matchingAnalysis) {
          console.log("✅ TechPack - Found color analysis:", matchingAnalysis._id);
          setColorAnalysisData(matchingAnalysis);
          
          // Auto-fill colors if in edit mode and colors not set
         if ((!editedData.tech_pack?.colors || Object.keys(editedData.tech_pack.colors).length === 0)) {
            const dominantColors = matchingAnalysis.data?.dominant_colors || [];
            if (dominantColors.length > 0) {
              const primaryColor = dominantColors[0];
              handleDataChange({
                ...editedData,
                tech_pack: {
                  ...editedData.tech_pack,
                  colors: {
                    primary_color: primaryColor.fashion_match?.fashion_color_name || 'Main Color',
                    color_name: primaryColor.fashion_match?.fashion_color_name || '',
                    color_code: `Detected from image (${primaryColor.percentage?.toFixed(1)}% coverage)`,
                  }
                }
              });
              toast.success("Auto-filled colors from image analysis!");
            }
          }
        } else {
          console.log("❌ TechPack - No color analysis found");
        }
      } catch (error) {
        console.error("TechPack - Error fetching color analysis:", error);
      }
    }
  };

  fetchColorAnalysis();
}, [data?._id, data?.gallery_image_ids]);


// Add this debugging useEffect right after your state declarations
useEffect(() => {
  console.log("📊 TechPacksDisplay State:", {
    currentMode,
    hasTempBomData: !!tempBomData,
    hasBomData: !!bomData,
    techPackId: data?._id,
    tempBomStructure: tempBomData?.structure,
    tempBomItems: tempBomData?.flatItems?.length || tempBomData?.sections?.length
  });
}, [currentMode, tempBomData, bomData, data?._id]);

const handleOpenBOM = async () => {
  try {
    setLoadingBOM(true);
    console.log("🔍 Opening BOM - Mode:", currentMode, "TechPackId:", data?._id);
    
    if (currentMode === "create") {
      // In create mode, open with temporary data
      console.log("📦 Create mode - Loading temp BOM:", !!tempBomData);
      setBomData(tempBomData);
      setShowBOMModal(true);
    } else if (data?._id) {
      // In edit/view mode, fetch from server
      console.log("🔍 Fetching BOM for tech pack:", data._id);
      
      try {
        const response = await api.get(`/image-variation/tech-packs/${data._id}/bom`);
        console.log("✅ BOM fetch response:", {
          status: response.status,
          hasBom: !!response.data?.data?.bom,
          bomStructure: response.data?.data?.bom?.structure,
          items: response.data?.data?.bom?.flatItems?.length || response.data?.data?.bom?.sections?.length
        });
        
        const fetchedBom = response.data?.data?.bom;
        setBomData(fetchedBom || null);
        setShowBOMModal(true);
        
        if (!fetchedBom) {
          console.log("ℹ️ No BOM found, opening empty modal");
        }
      } catch (fetchError) {
        if (fetchError.response?.status === 404) {
          console.log("ℹ️ BOM not found (404), opening empty modal");
          setBomData(null);
          setShowBOMModal(true);
        } else {
          throw fetchError;
        }
      }
    } else {
      console.error("❌ Cannot open BOM: No tech pack ID and not in create mode");
      toast.error("Cannot open BOM without tech pack");
    }
  } catch (error) {
    console.error("❌ Error opening BOM:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    toast.error(error.response?.data?.message || "Failed to load BOM");
  } finally {
    setLoadingBOM(false);
  }
};

  // ✅ ADD THIS FUNCTION to close BOM modal
const handleCloseBOM = async (shouldRefetch = false, savedBomData = null) => {
  console.log("🔒 Closing BOM modal:", { 
    shouldRefetch, 
    hasSavedBomData: !!savedBomData,
    currentMode,
    techPackId: data?._id
  });
  
  setShowBOMModal(false);
  
  if (currentMode === "create" && savedBomData) {
    console.log("💾 CREATE MODE - Storing BOM temporarily:", {
      structure: savedBomData.structure,
      flatItems: savedBomData.flatItems?.length || 0,
      sections: savedBomData.sections?.length || 0,
      grandTotal: savedBomData.grandTotal
    });
    
    setTempBomData(savedBomData);
    setBomData(savedBomData);
    toast.success("BOM saved locally! It will be attached when you save the tech pack.");
    
  } else if (shouldRefetch && data?._id) {
    console.log("🔄 EDIT MODE - Refetching BOM for:", data._id);
    try {
      const response = await api.get(`/image-variation/tech-packs/${data._id}/bom`);
      const fetchedBom = response.data?.data?.bom;
      
      console.log("✅ BOM refetched:", {
        hasBom: !!fetchedBom,
        structure: fetchedBom?.structure,
        items: fetchedBom?.flatItems?.length || fetchedBom?.sections?.length
      });
      
      setBomData(fetchedBom || null);
    } catch (error) {
      console.error("❌ Error refetching BOM:", error);
      setBomData(null);
      if (error.response?.status !== 404) {
        toast.error("Failed to refresh BOM data");
      }
    }
  } else {
    console.log("ℹ️ BOM modal closed without action");
  }
};

  // Check if editing is allowed based on the mode prop
  const canEdit = mode === "edit" || mode === "create";

  useEffect(() => {
    if (mode !== "create" && data) {
      setEditedData(data);
    }
  }, [data, mode]);



  // useEffect(() => {
  //   setCurrentMode(mode);
  // }, [mode]);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF(editedData, styleNumber);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  // Validation function
  const validateData = () => {
    const errors = {};
   // const overview = editedData?.tech_pack?.product_overview || {};
    
    //if (!overview.style_name) errors.styleName = "Style name is required";
    //if (!overview.style_number) errors.styleNumber = "Style number is required";
    //if (!overview.garment_type) errors.garmentType = "Garment type is required";
    //if (!overview.gender) errors.gender = "Gender is required";
    
    //const mainFabric = editedData?.tech_pack?.suggested_fabrics_and_trims?.main_fabric || {};
    // if (!mainFabric.composition) errors.composition = "Fabric composition is required";
    
    return errors;
  };

  const handleSave = async () => {
    if (currentMode === "create") {
      const errors = validateData();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Please fill in all required fields");
        return;
      }
    }

    const dataToSave = {
      ...editedData,
      uploadedFiles: uploadedFiles
    };

    // Include BOM in create mode
    if (currentMode === "create" && tempBomData) {
      console.log("🚀 Including BOM in save:", {
        structure: tempBomData.structure,
        flatItemsCount: tempBomData.flatItems?.length || 0,
      });
      dataToSave.bom = tempBomData;
    }

  try {
      console.log("📤 Saving tech pack with files:", {
        techPackId: data?._id,
        newFilesCount: uploadedFiles.length,
        fileNames: uploadedFiles.map(f => f.name)
      });

      if (onSave) {
        const result = await onSave(dataToSave);
        console.log("✅ Tech pack saved successfully");
        
        // Clear temporary uploaded files after successful save
        setUploadedFiles([]);
        
        // Update editedData with returned data (which includes uploaded files)
        if (result) {
          setEditedData(result);
        }
      }
      
      // Switch to view mode after saving
      if (currentMode === "edit") {
        setCurrentMode("view");
        toast.success("Tech pack updated successfully!");
      }
    } catch (error) {
      console.error("💥 Error in handleSave:", error);
      toast.error("Failed to save tech pack");
    }
  };

   // ✅ FIX 4: Updated file selection handler
 const handleFilesSelected = (file) => {
    console.log("📎 File selected:", file.name);
    
    // Add to temporary upload queue
    setUploadedFiles(prev => {
      const exists = prev.some(f => f.name === file.name && f.size === file.size);
      if (exists) {
        toast.info(`${file.name} already queued for upload`);
        return prev;
      }
      return [...prev, file];
    });
    
    // Update UI display (for preview purposes)
    const updatedData = {
      ...editedData,
      uploaded_files: [
        ...(editedData?.uploaded_files || []),
        {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type.startsWith('image/') ? 'image' : 'pdf',
          isTemp: true // Mark as temporary/pending upload
        }
      ]
    };
    
    setEditedData(updatedData);
    
    if (onDataChange) {
      onDataChange(updatedData);
    }
    
    toast.success(`Added: ${file.name} (will upload on save)`);
  };

   const handleFileDeleted = (fileId) => {
    if (fileId.startsWith('temp-')) {
      // Remove from temporary upload queue
      const [, fileName] = fileId.split('temp-');
      setUploadedFiles(prev => 
        prev.filter(f => !fileId.includes(f.name))
      );
      
      // Also remove from editedData display
      setEditedData(prev => ({
        ...prev,
        uploaded_files: prev.uploaded_files?.filter(f => 
          !(f.isTemp && f.file_name === fileName.split('-')[0])
        )
      }));
      
      toast.success("Removed from upload queue");
    } else {
      // Remove existing server file from editedData
      // Note: Actual deletion should be handled by the parent/API
      setEditedData(prev => ({
        ...prev,
        uploaded_files: prev.uploaded_files?.filter(f => f._id !== fileId)
      }));
      
      toast.success("File marked for deletion");
    }
  };
  // ✅ FIX 5: Helper to get total file count
  const getTotalFileCount = () => {
    const existingCount = editedData?.uploaded_files?.filter(f => !f.isTemp).length || 0;
    const tempCount = uploadedFiles.length;
    return existingCount + tempCount;
  };

  // ✅ FIX 6: Helper to get combined files for display
    const getCombinedFilesForDisplay = () => {
    // Existing server files (without isTemp flag)
    const serverFiles = (editedData?.uploaded_files || [])
      .filter(file => !file.isTemp)
      .map(file => ({
        ...file,
        isTemp: false
      }));
    
    // Temporary files (pending upload)
    const tempFiles = uploadedFiles.map(file => ({
      _id: `temp-${file.name}-${file.size}`,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type.startsWith('image/') ? 'image' : 'pdf',
      uploaded_at: new Date().toISOString(),
      isTemp: true
    }));
    
    return [...serverFiles, ...tempFiles];
  };



  // Handler for when data is picked from the TechPackPickerModal
  const handlePickedData = (pickedData) => {
    if (!pickedData || !pickedData.data) {
      console.log("No data picked");
      return;
    }

    console.log("Picked data:", pickedData);

    // Create a deep copy of current edited data
    const updatedData = JSON.parse(JSON.stringify(editedData));

    // Map sectionId to tab values
    const sectionToTabMap = {
      'product_overview': 'overview',
      'fabrics_trims': 'fabrics',
      'prints_embellishments': 'prints',
      'construction_notes': 'construction',
      'packaging_instructions': 'packaging',
      'notes': 'notes'
    };

    // Merge the picked data based on the sectionId
    switch (pickedData.sectionId) {
      case 'product_overview':
        // Merge product overview and general info
        if (pickedData.data.product_overview) {
          updatedData.tech_pack.product_overview = {
            ...updatedData.tech_pack.product_overview,
            ...pickedData.data.product_overview
          };
        }
        if (pickedData.data.general_info) {
          updatedData.tech_pack.general_info = {
            ...updatedData.tech_pack.general_info,
            ...pickedData.data.general_info
          };
        }
        break;

      case 'fabrics_trims':
        // Merge fabrics and trims
        if (pickedData.data.suggested_fabrics_and_trims) {
          updatedData.tech_pack.suggested_fabrics_and_trims = {
            ...updatedData.tech_pack.suggested_fabrics_and_trims,
            ...pickedData.data.suggested_fabrics_and_trims
          };
        }
        break;

      case 'prints_embellishments':
        // Merge prints and embellishments
        if (pickedData.data.prints_and_embellishments) {
          updatedData.tech_pack.prints_and_embellishments = {
            ...updatedData.tech_pack.prints_and_embellishments,
            ...pickedData.data.prints_and_embellishments
          };
        }
        break;

      case 'construction_notes':
        // Merge construction notes
        if (pickedData.data.construction_notes) {
          updatedData.tech_pack.construction_notes = {
            ...updatedData.tech_pack.construction_notes,
            ...pickedData.data.construction_notes
          };
        }
        break;

      case 'packaging_instructions':
        // Merge packaging instructions
        if (pickedData.data.packaging_instructions) {
          updatedData.tech_pack.packaging_instructions = {
            ...updatedData.tech_pack.packaging_instructions,
            ...pickedData.data.packaging_instructions
          };
        }
        break;

      case 'notes':
        // Replace or merge notes array
        if (pickedData.data.notes) {
          // Option 1: Replace all notes
          updatedData.notes = pickedData.data.notes;
          
          // Option 2: Append notes (uncomment if you want to append instead)
          // updatedData.notes = [
          //   ...(updatedData.notes || []),
          //   ...pickedData.data.notes
          // ];
        }
        break;

      default:
        console.warn(`Unknown section: ${pickedData.sectionId}`);
        break;
    }

    

    // Update the timestamp
    updatedData.updatedAt = new Date().toISOString();

    // Set the updated data
    setEditedData(updatedData);

    // Switch to the corresponding tab
    const targetTab = sectionToTabMap[pickedData.sectionId];
    if (targetTab) {
      setActiveTab(targetTab);
    }

    // Show a success message (optional)
    console.log(`Successfully imported ${pickedData.sectionName} data and switched to ${targetTab} tab`);
  };


  const handleCancel = () => {
    if (currentMode === "create") {
      if (onBack) {
        onBack();
      }
    } else {
      setEditedData(data);
      setCurrentMode("view");
    }
  };

  const handleEdit = () => {
    setCurrentMode("edit");
  };

  const handleDataChange = (newData) => {
    setEditedData(newData);
    // Clear validation errors when user makes changes
    setValidationErrors({});
  };

  const isEditMode = currentMode === "edit" || currentMode === "create";

  const {
    status,
    task_id,
    gallery_image_ids = [],
    generation_source,
    createdAt,
    updatedAt,
  } = editedData || {};

  const styleNumber = editedData?.tech_pack?.product_overview?.style_number || 
    (currentMode === "create" ? "New Tech Pack" : "Tech Pack");
  const styleName = editedData?.tech_pack?.product_overview?.style_name || "";
  const [showFilesDialog, setShowFilesDialog] = useState(false);
  const [existingServerFiles, setExistingServerFiles] = useState([]); // NEW: Track server files separately

    useEffect(() => {
    if (data?._id && data?.uploaded_files) {
      console.log("📁 Loading existing files from server:", data.uploaded_files);
      setExistingServerFiles(data.uploaded_files || []);
    }
  }, [data?._id, data?.uploaded_files]);
  // Determine header title based on mode
  const getHeaderTitle = () => {
    switch (currentMode) {
      case "create":
        return "Create New Tech Pack";
      case "edit":
        return "Edit Tech Pack";
      default:
        return styleNumber;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br pt-0 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* {onBack && (
          <div>
            <Button 
              variant="dg_btn" 
              className="mb-4 flex items-center gap-2" 
              onClick={onBack}
            >
              <ChevronLeft className="w-4 h-4" />
              {currentMode === "create" ? "Cancel" : "Back to Listing"}
            </Button>
          </div>
        )} */}

        {/* Header */}
        {/* Sticky Action Buttons Row - Only this stays at top */}
      <div className="sticky top-0 z-50 bg-black/50 backdrop-blur-md mb-4">
        <div className="max-w-7xl mx-auto px-2 py-4">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    {/* Left: Back Button */}
    {onBack && (
      <Button 
        variant="dg_btn" 
        className="flex items-center gap-2 w-full sm:w-auto" 
        onClick={onBack}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="truncate">
          {currentMode === "create" ? "Cancel" : "Back to Listing"}
        </span>
      </Button>
    )}

    {/* Right: Action Buttons */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      {/* View Mode Buttons */}
      {currentMode === "view" && canEdit && isEditable && (
        <>
          <Button
            onClick={handleEdit}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto justify-center"
          >
            <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Edit Tech Pack</span>
          </Button>
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto justify-center"
          >
            {isGeneratingPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
                <span className="truncate">Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Download PDF</span>
              </>
            )}
          </Button>
        </>
      )}

      {/* Edit Mode Buttons */}
      {currentMode === "edit" && (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <TechPackPickerModal onPick={handlePickedData} />
          </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full sm:w-auto justify-center"
          >
            <X className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Cancel</span>
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto justify-center"
          >
            <Save className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Save Changes</span>
          </Button>
        </div>
      )}

      {/* Create Mode Buttons */}
      {currentMode === "create" && (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
            <TechPackPickerModal onPick={handlePickedData} />
          </div>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto justify-center"
          >
            <PlusCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Save Tech Pack</span>
          </Button>
        </div>
      )}
    </div>
  </div>
</div>
      </div>

{/* Header Info - Scrolls normally */}
<div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 mb-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white">
          {getHeaderTitle()}
        </h1>
        {styleName && currentMode !== "create" && (
          <p className="text-gray-300 mt-1">{styleName}</p>
        )}
        {currentMode === "create" && (
          <p className="text-gray-300 mt-1">Fill in the details below to create a new tech pack</p>
        )}
      </div>
    </div>
  </div>

  {/* Metadata - Show in all modes */}
  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
  {/* Task ID - First */}
  {currentMode !== "create" && (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Hash className="w-4 h-4" />
        <span className="text-xs">Task ID</span>
      </div>
      <p className="text-white font-mono text-xs truncate">{task_id || "N/A"}</p>
    </div>
  )}

  {/* Source - Second */}
  {currentMode !== "create" && (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs">Source</span>
      </div>
      <p className="text-white font-semibold capitalize">
        {generation_source?.replace(/_/g, " ") || "AI generated"}
      </p>
    </div>
  )}

  {/* Upload/View Files Button - NEW */}
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
    <div className="flex items-center gap-2 text-gray-400 mb-1">
      <FileText className="w-4 h-4" />
      <span className="text-xs">Files</span>
    </div>
        <Button
      onClick={() => setShowFilesDialog(true)}
      variant="outline"
      size="sm"
      className="w-full mt-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30 text-white hover:bg-blue-600/30 hover:border-blue-500/50 text-xs transition-all"
    >
      {getTotalFileCount() > 0 
                  ? `View (${getTotalFileCount()})` 
        : isEditMode ? "Upload" : "View"}
    </Button>
  </div>

  {/* Bill of Materials Button - Keep existing */}
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
    <div className="flex items-center gap-2 text-gray-400 mb-1">
      <FileSpreadsheet className="w-4 h-4" />
      <span className="text-xs">Bill of Materials</span>
    </div>
    <Button
      onClick={handleOpenBOM}
      disabled={loadingBOM}
      variant="outline"
      size="sm"
      className="w-full mt-1 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30 text-white hover:bg-green-600/30 hover:border-green-500/50 text-xs transition-all"
    >
      {loadingBOM ? (
        "Loading..."
      ) : bomData ? (
        "View BOM"
      ) : (
        "Create BOM"
      )}
    </Button>
  </div>

  {/* Notes Button - NEW */}
  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
    <div className="flex items-center gap-2 text-gray-400 mb-1">
      <FileText className="w-4 h-4" />
      <span className="text-xs">Notes</span>
    </div>
    <Button
      onClick={() => setShowNotesDialog(true)}
      variant="outline"
      size="sm"
      className="w-full mt-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 text-white hover:bg-purple-600/30 hover:border-purple-500/50 text-xs transition-all"
    >
      {editedData?.notes?.length > 0 ? `View (${editedData.notes.length})` : "Create"}
    </Button>
  </div>

  {/* Source Image - Last */}
  {currentMode !== "create" && gallery_image_ids?.[0] && (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Eye className="w-4 h-4" />
        <span className="text-xs">Source Image</span>
      </div>
      <ImagePreviewDialog 
        imageUrl={gallery_image_ids[0].url || gallery_image_ids[0]}
        imageData={gallery_image_ids[0]}
        galleryImageId={gallery_image_ids[0]._id || gallery_image_ids[0].id}
        onOutlineGenerated={(outlineData) => {
          console.log('Outline generated:', outlineData);
          const updatedGalleryImages = editedData.gallery_image_ids.map((img, index) => {
            if (index === 0) {
              return {
                ...img,
                outline_image: outlineData.outline_image,
                outline_mode: outlineData.outline_mode,
                outline_task_id: outlineData.outline_task_id
              };
            }
            return img;
          });
          setEditedData({
            ...editedData,
            gallery_image_ids: updatedGalleryImages
          });
          toast.success('Outline saved and data updated!');
        }}
      >
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-1 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
        >
          View
        </Button>
      </ImagePreviewDialog>
    </div>
  )}
</div>
</div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
  <div className="overflow-x-auto pb-2">
    <TabsList className="flex sm:grid sm:grid-cols-5 w-max sm:w-full bg-white/10 backdrop-blur-sm border border-white/20 min-w-full">
      <TabsTrigger 
        value="overview" 
        className="data-[state=active]:bg-white/20 cursor-pointer text-white whitespace-nowrap px-4 flex-1 sm:flex-auto"
      >
        <span className="hidden sm:inline">Product Overview</span>
        <span className="sm:hidden">Overview</span>
      </TabsTrigger>
      <TabsTrigger 
        value="fabrics" 
        className="data-[state=active]:bg-white/20 cursor-pointer text-white whitespace-nowrap px-4 flex-1 sm:flex-auto"
      >
        <span className="hidden sm:inline">Fabrics & Trims</span>
        <span className="sm:hidden">Fabrics</span>
      </TabsTrigger>
      <TabsTrigger 
        value="prints" 
        className="data-[state=active]:bg-white/20 cursor-pointer text-white whitespace-nowrap px-4 flex-1 sm:flex-auto"
      >
        <span className="hidden sm:inline">Prints & Embellishments</span>
        <span className="sm:hidden">Prints</span>
      </TabsTrigger>
      <TabsTrigger 
        value="construction" 
        className="data-[state=active]:bg-white/20 cursor-pointer text-white whitespace-nowrap px-4 flex-1 sm:flex-auto"
      >
        <span className="hidden sm:inline">Construction Notes</span>
        <span className="sm:hidden">Construction</span>
      </TabsTrigger>
      <TabsTrigger 
        value="packaging" 
        className="data-[state=active]:bg-white/20 cursor-pointer text-white whitespace-nowrap px-4 flex-1 sm:flex-auto"
      >
        <span className="hidden sm:inline">Packaging Instructions</span>
        <span className="sm:hidden">Packaging</span>
      </TabsTrigger>
    </TabsList>
  </div>

  <TabsContent value="overview">
    <ProductOverviewSection 
      data={editedData} 
      isEditMode={isEditMode} 
      onDataChange={handleDataChange}
      colorAnalysisData={colorAnalysisData}
    />
  </TabsContent>

  <TabsContent value="fabrics">
    <FabricsTrimsSection 
      data={editedData} 
      isEditMode={isEditMode} 
      onDataChange={handleDataChange}
    />
  </TabsContent>

  <TabsContent value="prints">
    <PrintsEmbellishmentsSection 
      data={editedData} 
      isEditMode={isEditMode} 
      onDataChange={handleDataChange}
    />
  </TabsContent>

  <TabsContent value="construction">
    <ConstructionNotesSection 
      data={editedData} 
      isEditMode={isEditMode} 
      onDataChange={handleDataChange}
    />
  </TabsContent>

  <TabsContent value="packaging">
    <PackagingInstructionsSection 
      data={editedData} 
      isEditMode={isEditMode} 
      onDataChange={handleDataChange}
    />
  </TabsContent>
</Tabs>

          {/* Notes Dialog */}
{showNotesDialog && (
  <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
    <DialogContent className="min-w-[400px] md:min-w-[600px] lg:min-w-[700px] max-h-[75vh]  text-white border border-white/20 overflow-auto">
      <DialogHeader className="sticky top-0 pb-2 border-b border-white/20 z-10">
        <DialogTitle className="text-xl">Notes</DialogTitle>
        <Button
          onClick={() => setShowNotesDialog(false)}
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          {/* <X className="w-5 h-5" /> */}
        </Button>
      </DialogHeader>

      <div className="p-6">
        <NotesSection
          data={editedData}
          isEditMode={isEditMode}
          onDataChange={handleDataChange}
        />
      </div>
    </DialogContent>
  </Dialog>
)}

        {/* ✅ ADD BOM MODAL HERE - right before the closing div tags */}
        {showBOMModal && (
          <BOMModal
            isOpen={showBOMModal}
            onClose={handleCloseBOM}
            techPackId={currentMode === "create" ? null : data._id} // Pass null in create mode
            existingBOM={bomData}
          />
        )}

        {showFilesDialog && (
          <FilesDialog
            isOpen={showFilesDialog}
            onClose={() => setShowFilesDialog(false)}
            techPackId={currentMode === "create" ? null : data?._id}
            isEditMode={isEditMode}
            existingFiles={getCombinedFilesForDisplay()}
            onFilesSelected={handleFilesSelected}
            onFileDeleted={handleFileDeleted}
          />
        )}
      </div>
    </div>
  );
}