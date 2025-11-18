// components/BOM/BOMModal.jsx - ENHANCED VERSION with shadcn/ui Dialog

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, FileText, Save, Plus, Trash2, ArrowLeft, Package, Calendar, Layers } from "lucide-react";
import BOMTableView from "./BOMTableView";
import BOMNotesView from "./BOMNotesView";
import BOMMultiLevelNavigator from "./BOMMultiLevelNavigator";

import api from "@/api/axios";
import toast from "react-hot-toast";

export default function BOMModal({ isOpen, onClose, techPackId, existingBOM }) {
  const [bomStructure, setBomStructure] = useState(existingBOM?.structure || "single");
  const [viewType, setViewType] = useState(existingBOM?.viewType || "table");
  const [flatItems, setFlatItems] = useState(existingBOM?.flatItems || []);
  const [sections, setSections] = useState(existingBOM?.sections || []);
  const [grandTotal, setGrandTotal] = useState(existingBOM?.grandTotal || 0);
  const [inheritedWastageAllowance, setInheritedWastageAllowance] = useState(existingBOM?.inheritedWastageAllowance || 0);
  const [inheritedIncludeCost, setInheritedIncludeCost] = useState(existingBOM?.inheritedIncludeCost !== false);
  
  const [currentPath, setCurrentPath] = useState([]);
  const [isInitialSetup, setIsInitialSetup] = useState(!existingBOM);
  const [isSaving, setIsSaving] = useState(false);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [availableTechPacks, setAvailableTechPacks] = useState([]);
  const [loadingTechPacks, setLoadingTechPacks] = useState(false);
  const [copyTargetSetter, setCopyTargetSetter] = useState(null);

  const [colorAnalysisData, setColorAnalysisData] = useState(null);
  const [loadingColorAnalysis, setLoadingColorAnalysis] = useState(false);
  
  const handleOpenCopyModal = async (targetSetter = null) => {
    setCopyTargetSetter(() => targetSetter);
    try {
      setLoadingTechPacks(true);
      const response = await api.get("/image-variation/tech-packs/get", {
        params: { limit: 100 }
      });
      
      const allTechPacks = response.data?.data?.techpacks || [];
      const otherTechPacks = allTechPacks.filter(tp => tp._id !== techPackId);
      
      setAvailableTechPacks(otherTechPacks);
      setShowCopyModal(true);
    } catch (error) {
      console.error("Error fetching tech packs:", error);
      toast.error("Failed to load tech packs");
    } finally {
      setLoadingTechPacks(false);
    }
  };
  
  const handleCopyFromTechPack = async (selectedTechPackId, targetSetter = null) => {
    try {
      let copiedItems = [];
      
      // Try to get BOM first
      try {
        const bomResponse = await api.get(`/image-variation/tech-packs/${selectedTechPackId}/bom`);
        const sourceBOM = bomResponse.data?.data?.bom;

        if (sourceBOM && sourceBOM.flatItems && sourceBOM.flatItems.length > 0) {
          copiedItems = sourceBOM.flatItems.map((item, idx) => ({
            ...item,
            id: Date.now() + idx,
            _id: undefined,
          }));
          
         if (targetSetter) {
          targetSetter(copiedItems);
        }

        if (bomStructure === 'single') {
          setFlatItems(copiedItems);
        }
          toast.success(`Copied ${copiedItems.length} items from BOM`);
          setShowCopyModal(false);
          return;
        }
      } catch (bomError) {
        console.log("No BOM found, extracting from tech pack data");
      }

      // If no BOM, extract from tech pack data
      const techPackResponse = await api.get(`/image-variation/tech-packs/${selectedTechPackId}`);
      const techPackData = techPackResponse.data?.data;

      if (!techPackData) {
        toast.error("No data found in selected tech pack");
        return;
      }

      const fabricsTrims = techPackData.tech_pack?.suggested_fabrics_and_trims || {};
      const materials = techPackData.tech_pack?.materials || {};
      const productOverview = techPackData.tech_pack?.product_overview || {};
      const colors = techPackData.tech_pack?.colors || {};
      
      let itemCounter = 0;

      // Add main fabric
      if (fabricsTrims.main_fabric && (fabricsTrims.main_fabric.composition || fabricsTrims.main_fabric.weight)) {
        copiedItems.push({
          id: Date.now() + itemCounter++,
          item: 'Fabric',
          subItem: 'Main Fabric',
          ref: productOverview.style_number || '',
          quantity: 0,
          material: fabricsTrims.main_fabric.composition || materials.material_composition || '',
          placement: 'Body',
          color: colors.primary_color || colors.color_name || '',
          size: '',
          unit: 'Kgs',
          weight: fabricsTrims.main_fabric.weight || '',
          includeCost: inheritedIncludeCost,
          cost: 0,
          wastageAllowance: inheritedWastageAllowance,
          totalCost: 0,
          accreditedSupplier: fabricsTrims.main_fabric.supplier || '',
          contactEmail: '',
          contactPhone: '',
        });
      }

      // Add secondary fabrics
      if (fabricsTrims.secondary_fabrics && Array.isArray(fabricsTrims.secondary_fabrics)) {
        fabricsTrims.secondary_fabrics.forEach((fabric) => {
          if (fabric.composition || fabric.name) {
            copiedItems.push({
              id: Date.now() + itemCounter++,
              item: 'Fabric',
              subItem: fabric.name || 'Secondary Fabric',
              ref: productOverview.style_number || '',
              quantity: 0,
              material: fabric.composition || '',
              placement: fabric.placement || '',
              color: fabric.color || '',
              size: '',
              unit: 'Kgs',
              weight: fabric.weight || '',
              includeCost: inheritedIncludeCost,
              cost: 0,
              wastageAllowance: inheritedWastageAllowance,
              totalCost: 0,
              accreditedSupplier: fabric.supplier || '',
              contactEmail: '',
              contactPhone: '',
            });
          }
        });
      }

      // Add trims
      if (fabricsTrims.trims && Array.isArray(fabricsTrims.trims)) {
        fabricsTrims.trims.forEach((trim) => {
          if (trim.name || trim.description) {
            copiedItems.push({
              id: Date.now() + itemCounter++,
              item: 'Trims',
              subItem: trim.name || 'Trim',
              ref: '',
              quantity: 0,
              material: trim.description || '',
              placement: '',
              color: '',
              size: '',
              unit: 'Pcs',
              weight: '',
              includeCost: inheritedIncludeCost,
              cost: 0,
              wastageAllowance: inheritedWastageAllowance,
              totalCost: 0,
              accreditedSupplier: '',
              contactEmail: '',
              contactPhone: '',
            });
          }
        });
      }

      if (copiedItems.length === 0) {
        toast.info("No data found in selected tech pack to copy");
        return;
      }

      if (targetSetter) {
        targetSetter(copiedItems);
      }

      if (bomStructure === 'single') {
        setFlatItems(copiedItems);
      }
      
      toast.success(`Copied ${copiedItems.length} item${copiedItems.length !== 1 ? 's' : ''} from tech pack`);
      setShowCopyModal(false);
    } catch (error) {
      console.error("Error copying from tech pack:", error);
      toast.error(error.response?.data?.message || "Failed to copy from tech pack");
    }
  };

  const handlePrefillFromTechPack = async (targetSetter = null) => {
    try {
      const response = await api.get(`/image-variation/tech-packs/${techPackId}`);
      const techPackData = response.data?.data;

      if (!techPackData) {
        toast.error("No tech pack data found");
        return;
      }

      // Check for color analysis
      const sourceImageUrl = techPackData.gallery_image_ids?.[0]?.url || techPackData.gallery_image_ids?.[0];
      let colorAnalysis = null;
      
      if (sourceImageUrl) {
        console.log("Checking for color analysis for:", sourceImageUrl);
        colorAnalysis = await fetchColorAnalysisForImage(sourceImageUrl);
        if (colorAnalysis) {
          setColorAnalysisData(colorAnalysis);
          console.log("✅ BOM - Set color analysis data:", colorAnalysis._id, "Colors:", colorAnalysis.data?.dominant_colors?.length);
          toast.success("Found color analysis for this image!");
        }
      }

      const fabricsTrims = techPackData.tech_pack?.suggested_fabrics_and_trims || {};
      const materials = techPackData.tech_pack?.materials || {};
      const productOverview = techPackData.tech_pack?.product_overview || {};
      
      // Use color from analysis if available
      const colors = colorAnalysis?.data?.dominant_colors?.[0] 
        ? {
            primary_color: colorAnalysis.data.dominant_colors[0].fashion_match?.fashion_color_name || 
                          colorAnalysis.data.dominant_colors[0].hex,
          }
        : techPackData.tech_pack?.colors || {};
      
      const prefillItems = [];
      let itemCounter = 0;

      // Main fabric
      if (fabricsTrims.main_fabric && (fabricsTrims.main_fabric.composition || fabricsTrims.main_fabric.weight)) {
        prefillItems.push({
          id: Date.now() + itemCounter++,
          item: 'Fabric',
          subItem: 'Main Fabric',
          ref: productOverview.style_number || '',
          quantity: 0,
          material: fabricsTrims.main_fabric.composition || materials.material_composition || '',
          placement: 'Body',
          color: colors.primary_color || colors.color_name || '',
          colorAnalysisId: colorAnalysis?._id,
          size: '',
          unit: 'Kgs',
          weight: fabricsTrims.main_fabric.weight || '',
          includeCost: inheritedIncludeCost,
          cost: 0,
          wastageAllowance: inheritedWastageAllowance,
          totalCost: 0,
          accreditedSupplier: fabricsTrims.main_fabric.supplier || '',
          contactEmail: '',
          contactPhone: '',
        });
      }

      // Secondary fabrics
      if (fabricsTrims.secondary_fabrics && Array.isArray(fabricsTrims.secondary_fabrics)) {
        fabricsTrims.secondary_fabrics.forEach((fabric) => {
          if (fabric.composition || fabric.name) {
            prefillItems.push({
              id: Date.now() + itemCounter++,
              item: 'Fabric',
              subItem: fabric.name || 'Secondary Fabric',
              ref: productOverview.style_number || '',
              quantity: 0,
              material: fabric.composition || '',
              placement: fabric.placement || '',
              color: fabric.color || colors.primary_color || '',
              colorAnalysisId: colorAnalysis?._id,
              size: '',
              unit: 'Kgs',
              weight: fabric.weight || '',
              includeCost: inheritedIncludeCost,
              cost: 0,
              wastageAllowance: inheritedWastageAllowance,
              totalCost: 0,
              accreditedSupplier: fabric.supplier || '',
              contactEmail: '',
              contactPhone: '',
            });
          }
        });
      }

      // Trims
      if (fabricsTrims.trims && Array.isArray(fabricsTrims.trims)) {
        fabricsTrims.trims.forEach((trim) => {
          if (trim.name || trim.description) {
            prefillItems.push({
              id: Date.now() + itemCounter++,
              item: 'Trims',
              subItem: trim.name || 'Trim',
              ref: '',
              quantity: 0,
              material: trim.description || '',
              placement: '',
              color: '',
              colorAnalysisId: colorAnalysis?._id,
              size: '',
              unit: 'Pcs',
              weight: '',
              includeCost: inheritedIncludeCost,
              cost: 0,
              wastageAllowance: inheritedWastageAllowance,
              totalCost: 0,
              accreditedSupplier: '',
              contactEmail: '',
              contactPhone: '',
            });
          }
        });
      }

      if (prefillItems.length === 0) {
        toast.info("No fabric/trim data found in tech pack to pre-fill");
        return;
      }

      if (targetSetter) {
        targetSetter(prefillItems);
      }

      if (bomStructure === 'single') {
        setFlatItems(prefillItems);
      }
      
      toast.success(`Pre-filled ${prefillItems.length} item${prefillItems.length !== 1 ? 's' : ''} from tech pack`);
    } catch (error) {
      console.error("Error prefilling from tech pack:", error);
      toast.error(error.response?.data?.message || "Failed to prefill from tech pack");
    }
  };

  const fetchColorAnalysisForImage = async (imageUrl) => {
    try {
      setLoadingColorAnalysis(true);
      
      // Fetch ALL color analyses
      let allAnalyses = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore && currentPage <= 10) {
        const response = await api.get("/image-variation/color_analysis", {
          params: { 
            page: currentPage, 
            limit: 100
          },
        });

        const analyses = response.data?.data?.analyses || [];
        allAnalyses = [...allAnalyses, ...analyses];
        
        const pagination = response.data?.data?.pagination;
        hasMore = pagination?.hasNextPage || false;
        currentPage++;
      }
      
      console.log(`Searched through ${allAnalyses.length} color analyses`);
      
      // Find analysis matching the image URL
      const matchingAnalysis = allAnalyses.find(analysis => 
        analysis.gallery_image_ids?.some(img => {
          const imgUrl = img.url || img;
          return imgUrl === imageUrl;
        })
      );

      if (matchingAnalysis) {
        console.log("✅ Found matching color analysis:", matchingAnalysis._id);
                return matchingAnalysis;
      } else {
        console.log("❌ No color analysis found for image:", imageUrl);
        return null;
      }
    } catch (error) {
      console.error("Error fetching color analysis:", error);
      return null;
    } finally {
      setLoadingColorAnalysis(false);
    }
  };

  // Calculate grand total whenever items change
  useEffect(() => {
    calculateGrandTotal();
  }, [flatItems, sections]);

  const calculateItemTotal = (item) => {
    if (!item.includeCost || !item.cost || !item.quantity) return 0;
    const wastage = item.wastageAllowance || 0;
    const costWithWastage = item.cost + (item.cost * (wastage / 100));
    return costWithWastage * item.quantity;
  };

  const calculateGrandTotal = () => {
    let total = 0;
    
    if (bomStructure === 'single') {
      flatItems.forEach(item => {
        if (item.includeCost) {
          total += calculateItemTotal(item);
        }
      });
    } else {
      const calculateSectionTotal = (sectionsList) => {
        sectionsList.forEach(section => {
          section.items?.forEach(item => {
            if (item.includeCost) {
              total += calculateItemTotal(item);
            }
          });
          if (section.subsections) {
            calculateSectionTotal(section.subsections);
          }
        });
      };
      calculateSectionTotal(sections);
    }
    
    setGrandTotal(parseFloat(total.toFixed(2)));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const bomData = {
        structure: bomStructure,
        viewType,
        flatItems: bomStructure === 'single' ? flatItems : [],
        sections: bomStructure === 'multi' ? sections : [],
        inheritedWastageAllowance,
        inheritedIncludeCost,
        grandTotal,
      };

      console.log("💾 BOMModal handleSave called", {
        hasTechPackId: !!techPackId,
        isCreateMode: !techPackId,
        bomStructure: bomData.structure,
        flatItemsCount: bomData.flatItems.length,
        sectionsCount: bomData.sections.length
      });

      // If no techPackId (create mode), return the BOM data to parent
      if (!techPackId) {
        console.log("✅ CREATE MODE - Returning BOM to parent:", bomData);
        toast.success("BOM data prepared. It will be saved with the tech pack.");
        onClose(true, bomData); // Pass bomData as second argument
        return;
      }

      // Existing save logic for edit mode (when techPackId exists)
      console.log("📤 EDIT MODE - Saving BOM to server for tech pack:", techPackId);
      const endpoint = existingBOM
        ? `/image-variation/tech-packs/${techPackId}/bom/update`
        : `/image-variation/tech-packs/${techPackId}/bom/create`;

      const response = existingBOM
        ? await api.put(endpoint, bomData)
        : await api.post(endpoint, bomData);

      console.log("✅ BOM saved to server:", response.status);
      toast.success(response.data?.message || "BOM saved successfully");
      onClose(true); // Signal refresh needed
    } catch (error) {
      console.error("💥 BOM Save Error:", error);
      const errorMessage = error.response?.data?.message || "Failed to save BOM";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitialChoice = (structure) => {
    setBomStructure(structure);
    setIsInitialSetup(false);
  };

  if (isInitialSetup) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-[400px] md:min-w-[600px] lg:min-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">
              Choose BOM Structure
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-8 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Single Level */}
              <button
                onClick={() => handleInitialChoice('single')}
                className="group p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 rounded-xl hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
              >
                <FileText className="w-20 h-20 mx-auto mb-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-white mb-3">Single Level</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Simple flat list of items without nested categories
                </p>
              </button>

              {/* Multi Level */}
              <button
                onClick={() => handleInitialChoice('multi')}
                className="group p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 rounded-xl hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
              >
                <Table className="w-20 h-20 mx-auto mb-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-semibold text-white mb-3">Multi-Level</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Organized categories and subcategories (e.g., Fabric, Trims, Packaging)
                </p>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90vw] max-w-7xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {existingBOM ? "Edit Bill of Materials" : "Create Bill of Materials"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-700">
              <div className="flex items-center gap-3 flex-wrap">
                {/* View Type Toggle */}
                <Tabs value={viewType} onValueChange={setViewType}>
                  <TabsList className="bg-zinc-800 border border-zinc-700">
                    <TabsTrigger
                      value="table"
                      className="flex cursor-pointer items-center gap-2 text-white data-[state=active]:bg-blue-600"
                    >
                      <Table className="w-4 h-4" />
                      Table
                    </TabsTrigger>

                    <TabsTrigger
                      value="notes"
                      className="flex cursor-pointer items-center gap-2 text-white data-[state=active]:bg-blue-600"
                    >
                      <FileText className="w-4 h-4" />
                      Notes
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Structure Type Display */}
                <div className="text-sm bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700">
                  <span className="text-gray-400">Structure:</span>{' '}
                  <span className="text-white font-semibold capitalize">{bomStructure}</span>
                </div>

                {/* Pre-fill and Copy buttons for Single Level */}
                {bomStructure === 'single' && (
                  <>
                    {/* Only show pre-fill in edit mode (when techPackId exists) */}
                    {techPackId && (
                      <Button
                        onClick={() => handlePrefillFromTechPack()}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Pre-fill from Tech Pack
                      </Button>
                    )}

                    <Button
                      onClick={() => handleOpenCopyModal()}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Copy from Another Tech Pack
                    </Button>
                  </>
                )}
              </div>

              {/* Save Button */}
              <Button
              variant="dg_btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save BOM
                  </>
                )}
              </Button>
            </div>

            {/* Grand Total Display */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/40 rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-200 font-semibold text-lg">Grand Total Cost:</span>
                <span className="text-3xl font-bold text-green-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Global Settings */}
            <div className=" rounded-lg p-5 space-y-4 border border-zinc-700">
              <h3 className="text-sm font-semibold text-white mb-2">Global Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Default Wastage Allowance (%)
                  </label>
                  <input
                    type="number"
                    value={inheritedWastageAllowance}
                    onChange={(e) => setInheritedWastageAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inheritedIncludeCost}
                      onChange={(e) => setInheritedIncludeCost(e.target.checked)}
                      className="w-5 h-5 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-300 font-medium">Include Cost by Default</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div>
              {bomStructure === 'single' ? (
                viewType === 'table' ? (
                  <BOMTableView
                    items={flatItems}
                    setItems={setFlatItems}
                    inheritedWastageAllowance={inheritedWastageAllowance}
                    inheritedIncludeCost={inheritedIncludeCost}
                    colorAnalysisData={colorAnalysisData}
                  />
                ) : (
                  <BOMNotesView
                    items={flatItems}
                    setItems={setFlatItems}
                    inheritedWastageAllowance={inheritedWastageAllowance}
                    inheritedIncludeCost={inheritedIncludeCost}
                    colorAnalysisData={colorAnalysisData}
                  />
                )
              ) : (
                <BOMMultiLevelNavigator
                  sections={sections}
                  setSections={setSections}
                  viewType={viewType}
                  currentPath={currentPath}
                  setCurrentPath={setCurrentPath}
                  inheritedWastageAllowance={inheritedWastageAllowance}
                  inheritedIncludeCost={inheritedIncludeCost}
                  onPrefillFromTechPack={handlePrefillFromTechPack}
                  onCopyFromTechPack={handleOpenCopyModal}
                  colorAnalysisData={colorAnalysisData}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Copy Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent className=" max-h-[85vh] overflow-y-auto ">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              Copy from Tech Pack
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            {loadingTechPacks ? (
              <div className="text-center py-12 text-gray-400">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                Loading tech packs...
              </div>
            ) : availableTechPacks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-zinc-800/30 rounded-lg border border-zinc-700">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-lg">No other tech packs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTechPacks.map((tp) => {
                  const productOverview = tp.tech_pack?.product_overview || {};
                  const fabricsTrims = tp.tech_pack?.suggested_fabrics_and_trims || {};
                  const hasBOM = tp.bom?.flatItems?.length > 0;
                  
                  const fabricCount = (fabricsTrims.main_fabric ? 1 : 0) + 
                                     (fabricsTrims.secondary_fabrics?.length || 0);
                  const trimCount = fabricsTrims.trims?.length || 0;
                  
                  return (
                    <div
                      key={tp._id}
                      className=" rounded-lg p-5 border border-zinc-700 hover:border-zinc-600 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                          <div>
                            <h4 className="text-white font-bold text-lg mb-1">
                              {productOverview.style_number || productOverview.product_name || 'Untitled Tech Pack'}
                            </h4>
                            {productOverview.product_name && productOverview.style_number && (
                              <p className="text-sm text-gray-400">{productOverview.product_name}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {/* BOM Status */}
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-400">BOM:</span>
                              <span className={hasBOM ? "text-green-400 font-semibold" : "text-gray-500"}>
                                {hasBOM ? `${tp.bom.flatItems.length} items` : 'No BOM'}
                              </span>
                            </div>

                            {/* Creation Date */}
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span className="text-gray-400">Created:</span>
                              <span className="text-white">
                                {new Date(tp.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Fabric Count */}
                            {fabricCount > 0 && (
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-orange-400" />
                                <span className="text-gray-400">Fabrics:</span>
                                <span className="text-white">{fabricCount}</span>
                              </div>
                            )}

                            {/* Trim Count */}
                            {trimCount > 0 && (
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-pink-400" />
                                <span className="text-gray-400">Trims:</span>
                                <span className="text-white">{trimCount}</span>
                              </div>
                            )}
                          </div>

                          {/* Additional Info */}
                          {(productOverview.category || productOverview.season) && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {productOverview.category && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                  {productOverview.category}
                                </span>
                              )}
                              {productOverview.season && (
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                                  {productOverview.season}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Side - Action Button */}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleCopyFromTechPack(tp._id, copyTargetSetter)}
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Copy {hasBOM ? 'BOM' : 'Data'}
                          </Button>
                          
                          {hasBOM && (
                            <span className="text-xs text-green-400 text-center">
                              ✓ Has BOM
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}