import React, { useEffect, useState } from "react";
import api from "@/api/axios";
import { Loader2 } from "lucide-react";
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
import ColorAnalysisSummaryCard from "./ColorAnalysisSummaryCard";
import ColorAnalysisDisplay from "./ColorAnalysisDisplay"; // ✅ assume this exists

const ColorAnalysisListing = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ✅ For details view
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  // ✅ Fetch Color Analyses
  const fetchColorAnalyses = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/image-variation/color_analysis", {
        params: { page, limit },
      });

      const data = response.data?.data;
      setAnalyses(data?.analyses || []);
      setPagination(
        data?.pagination || {
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      console.error("Error fetching color analyses:", err);
      setError("Failed to load color analyses");
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColorAnalyses(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

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
      for (let i = 1; i <= pagination.totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis", pagination.totalPages);
      } else if (currentPage >= pagination.totalPages - 2) {
        pages.push(1, "ellipsis");
        for (let i = pagination.totalPages - 3; i <= pagination.totalPages; i++)
          pages.push(i);
      } else {
        pages.push(1, "ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("ellipsis", pagination.totalPages);
      }
    }
    return pages;
  };


  const handleDelete = async (id) => {
    try {
      await api.delete(`/image-variation/color_analysis/${id}`);
      fetchColorAnalyses(currentPage, itemsPerPage);
    } catch (err) {
      console.error("Error deleting analysis:", err);
      alert("Failed to delete analysis");
    }
  };

  // ✅ If user clicked on a card → show detailed view
  if (selectedAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => setSelectedAnalysis(null)}
            className="mb-4 "
            variant={'dg_btn'}
          >
            ← Back to Listing
          </Button>

          {/* ✅ Detailed View Component */}
          <ColorAnalysisDisplay data={selectedAnalysis} />
        </div>
      </div>
    );
  }

  // ✅ Loading State
  if (loading && analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading color analyses...</p>
        </div>
      </div>
    );
  }

  // ✅ Error State
  if (error && analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={() => fetchColorAnalyses(currentPage, itemsPerPage)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ✅ Main Listing
  return (
    <div className="min-h-screen bg-gradient-to-br p-6 text-white">
      <div>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-gray-400">
              {pagination.totalItems > 0
                ? `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
                    currentPage * itemsPerPage,
                    pagination.totalItems
                  )} of ${pagination.totalItems} analyses`
                : "No analyses found"}
            </p>
          </div>

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
                <SelectContent className="bg-slate-800 border-slate-700">
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

        {/* ✅ Cards Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
          {analyses.map((analysis) => (
            <ColorAnalysisSummaryCard
              key={analysis._id}
              data={analysis}
              onViewDetails={() => setSelectedAnalysis(analysis)}
              onDelete={(id)=>handleDelete(id)}
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        )}

        {/* ✅ Pagination Controls */}
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

                {getPageNumbers().map((page, i) => (
                  <PaginationItem key={i}>
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
      </div>
    </div>
  );
};

export default ColorAnalysisListing;
