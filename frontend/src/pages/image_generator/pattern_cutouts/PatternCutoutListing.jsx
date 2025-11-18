import React, { useEffect, useState } from "react";
import PatternCutoutDisplay from "@/components/PatternCutoutDisplay";
import api from "@/api/axios";
import PatternCutoutSummaryCard from "./PatternCutoutSummaryCard";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
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
import { Loader2, Trash2 } from "lucide-react";
import { hasPermission } from "@/lib/utils";
import useSocket from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

const PatternCutoutListing = () => {
  const { user } = useAuthStore();
  const socketRef = useSocket(user);
  const [cutouts, setCutouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCutout, setSelectedCutout] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // 🧩 track deleting cutout
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const hasDeletePatternCutoutPermission = hasPermission(
    permissionKeys,
    "ai-design-lab:pattern-cutouts:delete"
  );
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchCutouts = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get("/image-variation/pattern_cutout", {
        params: { page, limit },
      });

      const responseData = response.data?.data;
      setCutouts(responseData?.cutouts || []);
      setPagination(responseData?.pagination || {
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } catch (err) {
      console.error("Error fetching cutouts:", err);
      setError("Failed to load cutouts");
      setCutouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCutouts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  // ✅ Handle Delete Cutout
  const handleDeleteCutout = async (id) => {
    try {
      setDeletingId(id);
      await api.delete(`/image-variation/pattern_cutout/${id}`);
      fetchCutouts(currentPage, itemsPerPage);
    } catch (err) {
      console.error("Failed to delete cutout:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGoBack = () => setSelectedCutout(null);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // ✅ Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (pagination.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= pagination.totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(pagination.totalPages);
      } else if (currentPage >= pagination.totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = pagination.totalPages - 3; i <= pagination.totalPages; i++)
          pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++)
          pages.push(i);
        pages.push("ellipsis");
        pages.push(pagination.totalPages);
      }
    }
    return pages;
  };

  if (loading && cutouts.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading pattern cutouts...</p>
        </div>
      </div>
    );
  }

  if (error && cutouts.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={() => fetchCutouts(currentPage, itemsPerPage)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Detail View
  if (selectedCutout) {
    return <PatternCutoutDisplay data={selectedCutout} onBack={handleGoBack} />;
  }

  // ✅ List View
  return (
    <div className="min-h-screen p-6 text-white">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-gray-400">
            {pagination.totalItems > 0
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                  currentPage * itemsPerPage,
                  pagination.totalItems
                )} of ${pagination.totalItems} cutouts`
              : "No cutouts found"}
          </p>

          {pagination.totalItems > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Items per page:</span>
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

        {/* Grid */}
        {cutouts.length > 0 ? (
          <>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
              {cutouts.map((cutout) => (
                <div key={cutout._id} className="relative group">
                  <PatternCutoutSummaryCard
                    cutout={cutout}
                    onSelect={setSelectedCutout}
                  />

                  {/* 🗑️ Delete Button */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {hasDeletePatternCutoutPermission &&
                    <ConfirmDeleteDialog
                      title="Delete Cutout"
                      message="Are you sure you want to delete this pattern cutout?"
                      onDelete={() => handleDeleteCutout(cutout._id)}
                    >
                      <Button
                        className="p-2 text-gray-400 hover:text-red-400  rounded-sm transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deletingId === cutout._id ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </ConfirmDeleteDialog>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
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
                        {page === "ellipsis" ? (
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
          </>
        ) : (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">No pattern cutouts found.</p>
            <p className="text-gray-500 text-sm mt-2">
              Create your first cutout to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternCutoutListing;
