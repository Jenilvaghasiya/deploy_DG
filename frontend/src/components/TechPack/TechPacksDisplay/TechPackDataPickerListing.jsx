import React, { useEffect, useState } from "react";

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
import { Loader2, FileText } from "lucide-react";
import TechPacksDisplay from "@/components/TechPack/TechPacksDisplay";
import toast from "react-hot-toast";
import TechPacksSummaryCard from "@/pages/image_generator/take_packs/TechPacksSummaryCard";
import TechPackDataPicker from "./TechPackDataPicker";

const TechPackDataPickerListing = ({onPick}) => {
  const [techPacks, setTechPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTechPack, setSelectedTechPack] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchTechPacks = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/image-variation/tech-packs/get", {
        params: { page, limit },
      });

      const responseData = response.data?.data || {};

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

  useEffect(() => {
    fetchTechPacks(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  const handleGoBack = () => {
    setSelectedTechPack(null);
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
        pages.push("ellipsis");
        pages.push(pagination.totalPages);
      } else if (currentPage >= pagination.totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = pagination.totalPages - 3; i <= pagination.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(pagination.totalPages);
      }
    }

    return pages;
  };

  if (loading && techPacks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading tech packs...</p>
        </div>
      </div>
    );
  }

  if (error && techPacks.length === 0) {
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

  // Detail view
  if (selectedTechPack) {
    return (
      <TechPackDataPicker
        data={selectedTechPack}
        onClose={onPick}
      />
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-gradient-to-br p-6 text-white custom-scroll">
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
                : "No tech packs found"}
            </p>
          </div>

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

        {/* Tech Packs Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-8">
          {techPacks.map((techPack) => (
            <TechPacksSummaryCard
              key={techPack._id || techPack.id}
              techPack={techPack}
              onSelect={setSelectedTechPack}
              fetchTechPacks={fetchTechPacks}
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

export default TechPackDataPickerListing;
