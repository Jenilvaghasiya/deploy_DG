// TechPacksListing.jsx (Updated with Query Parameters)
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import TechPacksSummaryCard from "./TechPacksSummaryCard";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText, Filter, Plus, PlusCircle } from "lucide-react";
import TechPacksDisplay from "@/components/TechPack/TechPacksDisplay";
import { CreateTechPackCard } from "./CreateTechPackCard";
import CreateTechPack from "./CreateTechPack";
import toast from "react-hot-toast";
import TechPackPickerModal from "@/components/TechPack/TechPacksDisplay/TechPackDataPickerModal";

const TechPacksListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [techPacks, setTechPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTechPack, setSelectedTechPack] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdTechPackData, setCreatedTechPackData] = useState(null);
  const [loadingTechPack, setLoadingTechPack] = useState(false);

  // Get query parameters
  const techPackId = searchParams.get('id');
  const mode = searchParams.get('mode'); // 'view', 'edit', or 'create'

  // Pagination state (from URL or defaults)
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page')) || 1
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('limit')) || 12
  );
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Fetch individual tech pack by ID
  const fetchTechPackById = async (id) => {
    try {
      setLoadingTechPack(true);
      const response = await api.get(`/image-variation/tech-packs/${id}`);
      
      if (response.data?.data) {
        setSelectedTechPack(response.data.data);
      } else {
        throw new Error('Tech pack not found');
      }
    } catch (err) {
      console.error("Error fetching tech pack:", err);
      toast.error(err.response?.data?.message || "Failed to load tech pack");
      
      // Clear invalid ID from URL and go back to list
      setSearchParams({});
      setSelectedTechPack(null);
    } finally {
      setLoadingTechPack(false);
    }
  };

  const fetchTechPacks = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/image-variation/tech-packs/get", {
        params: { page, limit },
      });

      const responseData = response.data?.data || {};

      // ✅ Normalize key naming (backend sends "techpacks")
      const techpacks = responseData.techpacks || responseData.techPacks || [];
      const pagination = responseData.pagination || {
        currentPage: page,
        totalPages: Math.ceil((responseData.totalItems || 0) / limit),
        totalItems: responseData.totalItems || 0,
        hasNextPage: page < Math.ceil((responseData.totalItems || 0) / limit),
        hasPrevPage: page > 1,
      };

      setTechPacks(techpacks);
      setPagination(pagination);
    } catch (err) {
      console.error("Error fetching tech packs:", err);
      setError("Failed to load tech packs");
      setTechPacks([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL changes and fetch data accordingly
  useEffect(() => {
    const handleUrlState = async () => {
      // Check if we're in create mode
      if (mode === 'create') {
        setIsCreating(true);
        setSelectedTechPack(null);
        return;
      }

      // Check if we have a tech pack ID to load
      if (techPackId) {
        await fetchTechPackById(techPackId);
        return;
      }

      // Otherwise, we're in list view
      setSelectedTechPack(null);
      setIsCreating(false);
      fetchTechPacks(currentPage, itemsPerPage);
    };

    handleUrlState();
  }, [techPackId, mode, currentPage, itemsPerPage]);

  // Update URL when pagination changes
  useEffect(() => {
    if (!techPackId && !mode) {
      const params = {};
      if (currentPage > 1) params.page = currentPage;
      if (itemsPerPage !== 12) params.limit = itemsPerPage;
      
      setSearchParams(params);
    }
  }, [currentPage, itemsPerPage, techPackId, mode]);

  const handleGoBack = () => {
    // Clear URL parameters to go back to list
    setSearchParams({
      page: currentPage > 1 ? currentPage : undefined,
      limit: itemsPerPage !== 12 ? itemsPerPage : undefined,
    });
    setSelectedTechPack(null);
    setIsCreating(false);
    setCreatedTechPackData(null);
    
    // Refresh the list
    fetchTechPacks(currentPage, itemsPerPage);
  };

  const handleCreateNew = () => {
    setSearchParams({ mode: 'create' });
    setIsCreating(true);
  };

  const handleSelectTechPack = (techPack) => {
    setSearchParams({ 
      id: techPack._id || techPack.id,
      mode: 'edit' 
    });
    setSelectedTechPack(techPack);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (pagination.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(pagination.totalPages);
      } else if (currentPage >= pagination.totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = pagination.totalPages - 3; i <= pagination.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(pagination.totalPages);
      }
    }
    
    return pages;
  };

const handleSaveTechPack = async (techPackData, imageMetadata = {}) => {
  try {
    const isEditMode = techPackData._id ? true : false;
    
    console.log("🚀 handleSaveTechPack START - isEditMode:", isEditMode, "hasBom:", !!techPackData.bom);
    
    // Prepare dataToSend (unchanged from previous)
    const dataToSend = {
      task_id: techPackData.task_id,
      status: techPackData.status || "queued",
      generation_source: techPackData.generation_source || "manual",
      tech_pack: techPackData.tech_pack,
      analysis: techPackData.analysis || {
        construction_analysis: { closures: [], finishing: [], pockets: [], seams: [], special_construction: [], stitching: [] },
        description: "",
        fabric_analysis: { care_instructions: [], color: "", composition: "", construction: "", weight: "" },
        garment_type: techPackData.tech_pack.product_overview.garment_type || "",
        gender: techPackData.tech_pack.product_overview.gender || "",
        packaging_analysis: { special_requirements: [] }
      },
      notes: techPackData?.notes || []
    };

    if (techPackData.bom) {
      dataToSend.bom = techPackData.bom;
      console.log("✅ BOM included - structure:", techPackData.bom.structure, "flatItems:", techPackData.bom.flatItems?.length);
    }

    if (isEditMode) {
      dataToSend._id = techPackData._id;
      dataToSend.gallery_image_ids = techPackData.gallery_image_ids;
    }
    
    if (!isEditMode) {
      if (imageMetadata?.galleryImageId) dataToSend.galleryImageId = imageMetadata.galleryImageId;
      else if (imageMetadata?.generatedImageUrl) dataToSend.generatedImageUrl = imageMetadata.generatedImageUrl;
      if (imageMetadata?.uploadedFile) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(imageMetadata.uploadedFile);
        });
        dataToSend.imageBase64 = await base64Promise;
        dataToSend.imageName = imageMetadata.uploadedFile.name;
      }
    }

    const endpoint = isEditMode ? `/image-variation/tech-packs/${techPackData._id}/update` : '/image-variation/tech-packs/create-manual';
    const method = isEditMode ? 'put' : 'post';

    const response = await api[method](endpoint, dataToSend, { headers: { 'Content-Type': 'application/json' } });
    
    let savedTechPack = response.data?.data;
    
    if (response.status === 200) {
      toast.success(`Tech Pack ${isEditMode ? 'updated' : 'created'} successfully!`);
      
      // BOM attach for create
      if (!isEditMode && techPackData.bom && savedTechPack?._id) {
        try {
          console.log("🚀 BOM attach - ID:", savedTechPack._id);
          
          const bomToSend = {
            structure: techPackData.bom.structure || 'single',
            viewType: techPackData.bom.viewType || 'table',
            flatItems: techPackData.bom.flatItems || [],
            sections: techPackData.bom.sections || [],
            inheritedWastageAllowance: techPackData.bom.inheritedWastageAllowance || 0,
            inheritedIncludeCost: techPackData.bom.inheritedIncludeCost || true,
            grandTotal: techPackData.bom.grandTotal || 0,
          };
          console.log("📤 POST /bom/create:", { structure: bomToSend.structure, flatItemsCount: bomToSend.flatItems.length });
          
          const bomResponse = await api.post(`/image-variation/tech-packs/${savedTechPack._id}/bom/create`, bomToSend);
          console.log("✅ BOM response:", bomResponse.status, bomResponse.data);
          
          toast.success("BOM attached!");
          
          await new Promise(r => setTimeout(r, 1500));
          const refetched = await fetchTechPackById(savedTechPack._id);
          console.log("🔄 Refetch BOM?", !!refetched.bom);
          
          savedTechPack.bom = refetched.bom || techPackData.bom;
          console.log("🛠️ Patched BOM:", !!savedTechPack.bom);
        } catch (bomError) {
          console.error("❌ BOM error:", bomError.response?.status, bomError.response?.data);
          toast.error("BOM attach failed—local copy loaded for now.");
          savedTechPack.bom = techPackData.bom; // Local fallback
        }
      } else if (!isEditMode) {
        console.warn("⚠️ BOM skipped:", { hasBom: !!techPackData.bom, hasId: !!savedTechPack?._id });
      }
      
      // Navigation
      if (!isEditMode && savedTechPack?._id) {
        console.log("🔄 To edit mode with BOM:", !!savedTechPack.bom);
        setSearchParams({ id: savedTechPack._id, mode: 'edit' });
        setSelectedTechPack(savedTechPack);
      } else if (isEditMode) {
        await fetchTechPackById(techPackData._id);
        // Child handles setCurrentMode("view")
      }
      
      return savedTechPack;
    }
    
  } catch (error) {
    console.error("💥 Save error:", error.response?.data || error.message);
    toast.error(error?.response?.data?.message || "Save failed.");
    throw error;
  }
};
  // Loading state for individual tech pack
  if (loadingTechPack) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading tech pack...</p>
        </div>
      </div>
    );
  }

  if (loading && techPacks.length === 0 && !techPackId && !mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading tech packs...</p>
        </div>
      </div>
    );
  }

  if (error && techPacks.length === 0 && !techPackId && !mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={() => fetchTechPacks(currentPage, itemsPerPage)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Create view
  if (isCreating) {
    return (
      <CreateTechPack 
        mode="create" 
        onBack={handleGoBack} 
        isEditable={true}
      />
    );
  }

  // Detail view
  if (selectedTechPack) {
    return (
      <TechPacksDisplay 
        data={selectedTechPack} 
        onBack={handleGoBack} 
        mode="edit" 
        isEditable={true}
        onSave={(techPackData) => handleSaveTechPack(techPackData)}
      />
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Tech Packs
            </h1>
            <p className="text-gray-400">
              {pagination.totalItems > 0
                ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                    currentPage * itemsPerPage,
                    pagination.totalItems
                  )} of ${pagination.totalItems} tech packs`
                : "Create your first tech pack to get started"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateNew}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Tech Pack
            </Button>

            {/* Items per page selector */}
            {pagination.totalItems > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-[100px] bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 text-white border-slate-700">
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="32">32</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Tech Packs Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
          {/* Create New Card - Always first */}
          <CreateTechPackCard onClick={handleCreateNew} />
          
          {/* Existing Tech Packs */}
          {techPacks.map((techPack) => (
            <TechPacksSummaryCard
              key={techPack._id || techPack.id}
              techPack={techPack}
              onSelect={handleSelectTechPack}
              fetchTechPacks={() => fetchTechPacks(currentPage, itemsPerPage)}
            />
          ))}
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`${
                      !pagination.hasPrevPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-slate-800"
                    } bg-slate-700 border-slate-600`}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis className="text-gray-400" />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className={`cursor-pointer ${
                          currentPage === page
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-slate-700 hover:bg-slate-800 text-gray-300"
                        } border-slate-600`}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`${
                      !pagination.hasNextPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-slate-800"
                    } bg-slate-700 border-slate-600`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechPacksListing;