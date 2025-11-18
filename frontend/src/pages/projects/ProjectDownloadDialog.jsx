// src/pages/projects/ProjectDownloadDialog.jsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { CgListTree } from "react-icons/cg";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/api/axios";
import SmartImage from "@/components/SmartImage";
import ProjectDownloadTreeSelector from "@/components/ProjectDownloadTreeSelector";
import { AiOutlineFolder, AiOutlineFileText, AiOutlineBarChart, AiFillPicture, AiFillProduct } from "react-icons/ai";
import { SizeChartViewer } from "@/components/Assets/Tab/SizeChartViewer";
import SizeChartDialog from "@/components/Assets/Dialogue/TableDialogue";
import { Button } from "@/components/ui/button";
import { FaFolderOpen } from "react-icons/fa";
import ProjectAssetsDialog from "@/components/ProjectAssetsDialog";

const BASE_API_URL = import.meta.env.VITE_API_URL;

export default function ProjectDownloadDialog({ 
  project, 
  onClose, 
  setError,
  statusCount = {} 
}) {
  // Main project is always included, but sub-projects are selectable
  const [selectedSubProjectIds, setSelectedSubProjectIds] = useState([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Include options matching your API
  const [includeImages, setIncludeImages] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeMoodboards, setIncludeMoodboards] = useState(true);
  const [includeSizeCharts, setIncludeSizeCharts] = useState(true);
  const [selectedSizeChartIds, setSelectedSizeChartIds] = useState([]);
const [dialogProject, setDialogProject] = useState(null);

  const [loading, setLoading] = useState(false);

  const getImageSource = (image) => {
    return image.status === "saved"
      ? `${BASE_API_URL}/genie-image/${image.url}`
      : image.url;
  };
const handleOpenDialog = async (node) => {
  setLoading(true)
  try {
    const res = await api.get(`/projects/${node.id}`); // fetch project details + assets
    setDialogProject(res.data.data);
  } catch (e) {
    console.error("Failed to load project details", e);
    setDialogProject(node); // fallback
  }finally {
    setLoading(false); // stop loader here
  }
};
  const handleConfirmDownload = async () => {
    try {
      setLoading(true);
      
      // Include main project ID + selected sub-project IDs
      const includeProjects = [project.id, ...selectedSubProjectIds];
      let sizeChartsToInclude = [];
    if (includeSizeCharts) {
      if (selectedSizeChartIds.length > 0) {
        sizeChartsToInclude = selectedSizeChartIds; // only selected from viewer
      } else if (project.size_charts?.length > 0) {
        // If "Select all Size Charts" is checked but no viewer selection, include all
        sizeChartsToInclude = project.size_charts.map(sc => sc.id);
      }
    }
      const response = await api.post(`/projects/${project.id}/download-zip`, {
        includeProjects,
        includeImages,
        includeDescription,
        includeMoodboards,
        includeSizeCharts: sizeChartsToInclude, // 🔹 only selected
      }, { 
        responseType: "blob" 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `project-${project.name.replace(/[^a-zA-Z0-9]/g, "-")}.zip`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download failed:", err);
      setError?.(err.response?.data?.message || "Download failed");
    } finally {
      setLoading(false);
      onClose();
    }
  };
console.log(selectedSizeChartIds, '//////////////////');

  const labelMap = {
    finalized: "Finalized",
    uploaded: "Uploaded", 
    generated: "Generated",
    saved: "Save for Later",
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Download Project: {project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Project Preview */}
          <div className="bg-zinc-900 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <AiOutlineFolder className="text-blue-400" />
              Main Project: {project.name}
              <span className="text-xs bg-green-600 px-2 py-1 rounded">Always Included</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-zinc-400">Images</div>
                <div className="font-medium text-white">{project.images?.length || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-400">Moodboards</div>
                <div className="font-medium text-white">{project.moodboards?.length || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-zinc-400">Size Charts</div>
                <div className="font-medium text-white">{project.size_charts?.length || 0}</div>
              </div>
            </div>

            {/* Preview main project images */}
            {project.images && project.images.length > 0 && (
              <div className="mt-3">
                <div className="flex gap-1 overflow-x-auto">
                  {project.images.slice(0, 6).map((image, index) => (
                    <div key={index} className="flex-shrink-0">
                      <SmartImage
                        src={getImageSource(image)}
                        alt=""
                        className="w-12 h-12 object-cover rounded"
                      />
                    </div>
                  ))}
                  {project.images.length > 6 && (
                    <div className="flex-shrink-0 w-12 h-12 bg-zinc-700 rounded flex items-center justify-center text-xs text-zinc-400">
                      +{project.images.length - 6}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Include Content Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white">What to Include</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <Checkbox 
                  checked={includeImages} 
                  onCheckedChange={setIncludeImages} 
                />
                <AiFillPicture className="text-blue-400" />
                Include Images
              </label>
              
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <Checkbox 
                  checked={includeDescription} 
                  onCheckedChange={setIncludeDescription} 
                />
                <AiOutlineFileText className="text-green-400" />
                Include Description
              </label>
              
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <Checkbox 
                  checked={includeMoodboards} 
                  onCheckedChange={setIncludeMoodboards} 
                />
                <AiFillProduct className="text-purple-400" />
                Include Moodboards
              </label>

              {/* New Checkbox */}
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <Checkbox 
                  checked={includeSizeCharts} 
                  onCheckedChange={setIncludeSizeCharts} 
                  disabled={selectedSizeChartIds.length > 0}
                />
                <AiOutlineBarChart className="text-yellow-400" />
                Select all Size Charts
              </label>

              {/* Size Charts Button */}
              {/* <Button
                onClick={() => setIsViewerOpen(true)}
                className="flex items-center gap-2 text-white"
                variant="dg_btn"
                disabled={includeSizeCharts} // ⬅️ disable when "Select all Size Charts" is checked
              >
                <AiOutlineBarChart className="text-yellow-400" />
                Select Size Charts
              </Button> */}
            </div>
          </div>
            {/* <SizeChartDialog
                  isOpen={isViewerOpen}
                  onClose={() => setIsViewerOpen(false)}
                  onSelectSizeChart={(ids) => {
            setSelectedSizeChartIds(ids); // 🔹 directly assign the array
          }}
          sizeChartData={project.size_charts}
          /> */}
          {/* Status Count Display */}
          {/* {Object.keys(statusCount).length > 0 && (
            <div className="bg-zinc-900 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-2">Main Project Images by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(labelMap).map(([key, label]) => (
                  <div key={key} className="text-center">
                    <div className="text-zinc-400">{label}</div>
                    <div className="font-medium text-white">{statusCount[key] ?? 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )} */}


          {/* Project Tree Selector */}
          <div className="space-y-3">
            <ProjectDownloadTreeSelector
              mainProject={project}
              selectedIds={selectedSubProjectIds}
              onSelectionChange={setSelectedSubProjectIds}
              onOpenDialog={handleOpenDialog} // ✅ pass down the same handler
            />
          </div>
          <div className="flex items-center my-4">
        <div className="flex-grow border-t border-gray-700"></div>
        <span className="px-4 text-gray-400 text-sm">or</span>
        <div className="flex-grow border-t border-gray-700"></div>
      </div>
      <div className="flex justify-center">
          <Button
  variant="dg_btn"
  type="button"
  onClick={() => handleOpenDialog(project)}
  className="ml-2 p-1 hover:bg-white/20 flex items-center gap-1 justify-center"
  disabled={loading} // optional: disable while loading
>
  {loading ? (
    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
  ) : (
    <CgListTree className="w-4 h-4 me-1" />
  )}
  {loading ? "Loading..." : "Download Selected Assets"}
</Button>
          </div>
          <ProjectAssetsDialog
            projectId={dialogProject?.id}
            open={!!dialogProject?.id}
            onClose={() => setDialogProject(null)}
          />
        </div>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="dg_btn" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleConfirmDownload} 
            className="cursor-pointer"
            variant={"dg_btn"}
            disabled={loading}
          >
            {loading ? "Downloading..." : "Download ZIP"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}