import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Package,
  Palette,
  Scissors,
  Sparkles,
  FileText,
  Info,
  Layers,
  Tag,
  Box,
  Check,
  MousePointer
} from "lucide-react";

export default function TechPackDataPicker({ data, onClose }) {
  const [hoveredSection, setHoveredSection] = useState(null);

  // Extract data from the tech pack
  const techPack = data?.tech_pack || {};
  const notes = data?.notes || [];

  // Handle section selection
  const handleSectionClick = (sectionId, sectionData, metadata) => {
    const selectedData = {
      sectionId,
      sectionName: metadata.name,
      dataType: metadata.type,
      data: sectionData,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        sourceTaskId: data?.task_id,
        sourceStyleNumber: techPack?.product_overview?.style_number,
        sourceStyleName: techPack?.product_overview?.style_name
      }
    };
    
    // Close the picker after selection
    if (onClose) {
      onClose(selectedData);
    }
  };

  // Section component with hover effects
  const SelectableSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children, 
    data, 
    metadata,
    isEmpty = false 
  }) => {
    const isHovered = hoveredSection === id;

    return (
      <div
        className={cn(
          "relative backdrop-blur-md rounded-xl border transition-all duration-300 cursor-pointer",
          isHovered 
            ? "bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/20 scale-[1.02]" 
            : "bg-white/10 border-white/20 hover:bg-white/15",
          isEmpty && "opacity-50"
        )}
        onMouseEnter={() => setHoveredSection(id)}
        onMouseLeave={() => setHoveredSection(null)}
        onClick={() => !isEmpty && handleSectionClick(id, data, metadata)}
      >
        {/* Hover indicator */}
        {isHovered && !isEmpty && (
          <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-2 shadow-lg animate-pulse">
            <MousePointer className="w-4 h-4" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              {Icon && <Icon className={cn("w-5 h-5", isHovered && "text-purple-400")} />}
              {title}
            </h3>
            {isHovered && !isEmpty && (
              <span className="text-xs text-purple-400 font-medium">Click to select</span>
            )}
          </div>
          
          <div className={cn(
            "transition-opacity duration-300",
            isHovered && !isEmpty && "opacity-90"
          )}>
            {children}
          </div>

          {isEmpty && (
            <p className="text-gray-500 text-sm text-center mt-4">No data available</p>
          )}
        </div>
      </div>
    );
  };

  // Render data preview for each section
  const renderProductOverview = () => {
    const overview = techPack.product_overview || {};
    const generalInfo = techPack.general_info || {};
    const hasData = overview.style_name || overview.style_number || overview.garment_type;

    return (
      <SelectableSection
        id="product_overview"
        title="Product Overview"
        icon={Info}
        data={{ product_overview: overview, general_info: generalInfo }}
        metadata={{
          name: "Product Overview",
          type: "product_info",
          fields: ["style_name", "style_number", "garment_type", "season", "gender", "description", "market", "designer"]
        }}
        isEmpty={!hasData}
      >
        <div className="space-y-2">
          {overview.style_name && (
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Style Name:</span>
              <span className="text-white font-medium">{overview.style_name}</span>
            </div>
          )}
          {overview.style_number && (
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Style Number:</span>
              <span className="text-white font-medium">{overview.style_number}</span>
            </div>
          )}
          {overview.garment_type && (
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Garment Type:</span>
              <span className="text-white font-medium">{overview.garment_type}</span>
            </div>
          )}
        </div>
      </SelectableSection>
    );
  };

  const renderFabricsTrims = () => {
    const fabrics = techPack.suggested_fabrics_and_trims || {};
    const hasData = fabrics.main_fabric?.composition || (fabrics.trims && fabrics.trims.length > 0);

    return (
      <SelectableSection
        id="fabrics_trims"
        title="Fabrics & Trims"
        icon={Layers}
        data={{ suggested_fabrics_and_trims: fabrics }}
        metadata={{
          name: "Fabrics & Trims",
          type: "materials",
          fields: ["main_fabric", "trims"]
        }}
        isEmpty={!hasData}
      >
        <div className="space-y-3">
          {fabrics.main_fabric?.composition && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Main Fabric:</p>
              <p className="text-white">{fabrics.main_fabric.composition}</p>
            </div>
          )}
          {fabrics.trims && fabrics.trims.length > 0 && (
            <div>
              <p className="text-gray-400 text-sm mb-1">Trims ({fabrics.trims.length}):</p>
              <div className="flex flex-wrap gap-2">
                {fabrics.trims.slice(0, 3).map((trim, idx) => (
                  <span key={idx} className="bg-white/10 px-2 py-1 rounded text-xs text-white">
                    {typeof trim === 'string' ? trim : trim.name}
                  </span>
                ))}
                {fabrics.trims.length > 3 && (
                  <span className="text-gray-400 text-xs">+{fabrics.trims.length - 3} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </SelectableSection>
    );
  };

  const renderPrintsEmbellishments = () => {
    const prints = techPack.prints_and_embellishments || {};
    const hasData = (prints.print_techniques?.length > 0) || 
                   (prints.embellishments?.length > 0) || 
                   (prints.placements?.length > 0);

    return (
      <SelectableSection
        id="prints_embellishments"
        title="Prints & Embellishments"
        icon={Sparkles}
        data={{ prints_and_embellishments: prints }}
        metadata={{
          name: "Prints & Embellishments",
          type: "decorations",
          fields: ["print_techniques", "embellishments", "placements"]
        }}
        isEmpty={!hasData}
      >
        <div className="space-y-2">
          {prints.print_techniques?.length > 0 && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Techniques:</span> {prints.print_techniques.length} items
            </p>
          )}
          {prints.embellishments?.length > 0 && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Embellishments:</span> {prints.embellishments.length} items
            </p>
          )}
          {prints.placements?.length > 0 && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Placements:</span> {prints.placements.length} items
            </p>
          )}
        </div>
      </SelectableSection>
    );
  };

  const renderConstructionNotes = () => {
    const construction = techPack.construction_notes || {};
    const hasData = (construction.seam_types?.length > 0) || 
                   (construction.stitch_details?.length > 0) || 
                   (construction.special_techniques?.length > 0) ||
                   (construction.assembly_sequence?.length > 0);

    return (
      <SelectableSection
        id="construction_notes"
        title="Construction Notes"
        icon={Scissors}
        data={{ construction_notes: construction }}
        metadata={{
          name: "Construction Notes",
          type: "construction",
          fields: ["seam_types", "stitch_details", "special_techniques", "assembly_sequence"]
        }}
        isEmpty={!hasData}
      >
        <div className="space-y-2">
          {construction.seam_types?.length > 0 && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Seam Types:</span> {construction.seam_types.length} items
            </p>
          )}
          {construction.assembly_sequence?.length > 0 && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Assembly Steps:</span> {construction.assembly_sequence.length} steps
            </p>
          )}
        </div>
      </SelectableSection>
    );
  };

  const renderPackagingInstructions = () => {
    const packaging = techPack.packaging_instructions || {};
    const hasData = (packaging.care_label_instructions?.length > 0) || 
                   packaging.polybag_packaging?.type ||
                   packaging.master_packaging?.quantity ||
                   packaging.carton_packing?.quantity;

    return (
      <SelectableSection
        id="packaging_instructions"
        title="Packaging Instructions"
        icon={Package}
        data={{ packaging_instructions: packaging }}
        metadata={{
          name: "Packaging Instructions",
          type: "packaging",
          fields: ["care_label_instructions", "polybag_packaging", "master_packaging", "carton_packing"]
        }}
        isEmpty={!hasData}
      >
        <div className="space-y-2">
          {packaging.care_label_instructions?.length > 0 && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Care Instructions:</span> {packaging.care_label_instructions.length} items
            </p>
          )}
          {packaging.polybag_packaging?.type && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Polybag:</span> {packaging.polybag_packaging.type}
            </p>
          )}
          {packaging.carton_packing?.quantity && (
            <p className="text-white text-sm">
              <span className="text-gray-400">Carton Qty:</span> {packaging.carton_packing.quantity}
            </p>
          )}
        </div>
      </SelectableSection>
    );
  };

  const renderNotes = () => {
    const hasData = notes.length > 0;

    return (
      <SelectableSection
        id="notes"
        title="Notes"
        icon={FileText}
        data={{ notes }}
        metadata={{
          name: "Notes",
          type: "notes",
          noteTypes: notes.map(n => n.type),
          noteCount: notes.length
        }}
        isEmpty={!hasData}
      >
        <div className="space-y-2">
          {notes.map((note, idx) => (
            <div key={idx} className="bg-white/5 rounded p-2">
              <p className="text-white text-sm font-medium">{note.name}</p>
              <p className="text-gray-400 text-xs">
                {note.type.replace('_', ' ')} • {note.items?.length || 0} items
              </p>
            </div>
          ))}
        </div>
      </SelectableSection>
    );
  };

  return (
    <div className="min-h-screen p-6 ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-6 ">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Select Tech Pack Data</h1>
              <p className="text-gray-300">Click on any section to select its data</p>
            </div>
            {onClose && (
              <Button
                onClick={() => onClose(null)}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderProductOverview()}
          {renderFabricsTrims()}
          {renderPrintsEmbellishments()}
          {renderConstructionNotes()}
          {renderPackagingInstructions()}
          {renderNotes()}
        </div>

        {/* Instructions */}
        <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-4 text-center">
          <p className="text-gray-400 text-sm">
            Hover over sections to preview • Click to select data • Selected data will be logged to console
          </p>
        </div>
      </div>
    </div>
  );
}