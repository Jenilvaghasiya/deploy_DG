import { useState, useEffect } from "react";
import {
  AiOutlinePlus,
  AiOutlineArrowLeft,
  AiOutlineDelete,
  AiOutlineDownload,
} from "react-icons/ai";
import UserProjectGrid from "./UserProjectGrid";
import UserProjectCreateForm from "./UserProjectCreateForm";
import UserProjectEditForm from "./UserProjectEditForm";
import UserProjectTree from "./UserProjectTree";
import UserProjectCard from "./UserProjectCard";
import api from "../../api/axios";
import { deleteProject } from "../../features/projects/projectService";
import { useSearchParams } from "react-router-dom";
import GalleryPageNew from "../../components/GalleryPageNew";
import { hasPermission } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import { MeasurementTable } from "../image_generator/MeasurementTable";
import { MeasurementsDialogViewer } from "../image_generator/MeasurementsDialogViewer";
import SmartImage from "@/components/SmartImage";
const BASE_API_URL = import.meta.env.VITE_API_URL;
import ProjectDownloadDialog from "../projects/ProjectDownloadDialog";
import ImageZoomDialog from "@/components/ImageZoomDialog";
import ImagePreviewDialog from "../moodboards/ImagePreviewDialog";
import { BsImages } from "react-icons/bs";
import InputImagePreviewDialog from "@/components/InputImagePreviewDialog";
import GalleryTreeManager from "@/components/TreeView";
import { Button } from "@/components/ui/button";
import ApiTour from "../../components/Tour/ApiTour"
import { projectPageTourSteps } from "@/components/Tour/TourSteps";
import ShareModal from "@/components/Common/ShareModal";
import DateRangePickerModal from "@/components/DateRangePicker";
import { Calendar } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { FaTable } from "react-icons/fa";
import { useNavigateWithGalleryImage } from "@/hooks/useNavigateWithGalleryImage";

export default function UserProjectPage({ 
  customTitle = false, 
  isSharedWithMe= false, 
  isSharedWithOthers= false,
  heading = "You Can Manage Your Projects Here",
  subHeading = "Select a project from the tree view or create a new one to get started." 
}) {
  const navigateWithImage = useNavigateWithGalleryImage();
  const [mode, setMode] = useState("list");
  const [dateRange,setDateRange] = useState({startDate:null,endDate:null})
  const [searchTerm, setSearchTerm] = useState("");
  const [editProjectId, setEditProjectId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const { user } = useAuthStore();
  const [sizeChartIndex, setSizeChartIndex] = useState(0);
  const [showChooseAsset, setShowChooseAsset] = useState({ open: false, imageId: null });
  const [previewInputState, setPreviewInputState] = useState({
      open: false,
      galleryImageIds: [],
  });
  const [statusCount, setStatusCount] = useState({
    finalized: 0,
    uploaded: 0,
    generated: 0,
    saved: 0,
  });
  const [showProjectDownloadDialog, setShowProjectDownloadDialog] = useState(false);
  const [error, setError] = useState(null);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  console.log(statusCount, "..............");
  const labelMap = {
    finalized: "Finalized",
    uploaded: "Uploaded",
    generated: "Generated",
    saved: "Save for Later",
  };
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map(p => p.key);
  const hasCreateProjectPermission = hasPermission(permissionKeys, "workspace:my-projects:create");
  const hasEditProjectPermission = hasPermission(permissionKeys, "workspace:my-projects:update")
  const hasDeleteProjectPermission = hasPermission(permissionKeys, "workspace:my-projects:delete");
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get("project");

  useEffect(() => {
    if (initialProjectId && !selectedProject?.id) {
      setSelectedProject({ id: initialProjectId, name: "Loading..." });
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (selectedProject?.id) {
      fetchProjectDetails(selectedProject.id);
    } else {
      setCurrentProject(null);
    }
  }, [selectedProject]);

  const fetchProjectDetails = async (projectId) => {
    if (!projectId) return;

    try {
      setLoading(true);
				 let response;

      if (isSharedWithMe) {
        response = await api.get(`/projects/shared/get/${projectId}`, {
          params: {
            type: "shareWithMe",
            populate: true,
          },
        });
      }else{
        response = await api.get(`/projects/${projectId}`);

      }
        
      setCurrentProject(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch project details:", err);
      setLoading(false);
    }
  };

  const handleEdit = (projectId) => {
    setEditProjectId(projectId);
    setMode("edit");
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    if (selectedProject?.id) {
      fetchProjectDetails(selectedProject.id);
    }
  };
  const handlePrev = () => {
    setSizeChartIndex((idx) => Math.max(idx - 1, 0));
  };
  
  const handleNext = () => {
  setSizeChartIndex((idx) => Math.min(idx + 1, currentProject.size_charts.length - 1));
  };
  const handleSelectProject = (project) => {    
    setSelectedProject(project);
    if (!project.id) {
      setMode("create");
    } else {
      setMode("list");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      if (selectedProject?.id === projectToDelete.id) {
        setSelectedProject(null);
      }
      handleRefresh();
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const handleDelete = (projectId, projectName) => {
    setProjectToDelete({ id: projectId, name: projectName });
    setShowDeleteConfirm(true);
  };


  const handleDownloadZIP = () => {
    // First fetch the status count, then show dialog
    fetchStatusCount(currentProject.id);
    setShowProjectDownloadDialog(true);
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfDownloading(true); // start loader
      const response = await api.get(
        `/projects/${currentProject.id}/download-pdf`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `project-${currentProject.name.replace(
          /[^a-zA-Z0-9]/g,
          "-"
        )}-images.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setPdfDownloading(false); // stop loader
    }
  };

  const fetchStatusCount = async (projectId) => {
    try {
      const res = await api.get(`/projects/${projectId}/status-count`);
      // Normalize counts to ensure all 4 keys exist
      const data = res.data?.data || {};

      const normalized = {
        finalized: data.finalized || 0,
        uploaded: data.uploaded || 0,
        generated: data.generated || 0,
        saved: data.saved || 0,
      };

      setStatusCount(normalized);
    } catch (err) {
      console.error("Failed to fetch status count:", err);
      setStatusCount({});
    }
  };
  const renderMainContent = () => {
    if (mode === "create") {
      return (
        <UserProjectCreateForm
          onCancel={() => setMode("list")}
          onSuccess={() => {
            handleRefresh();
            setMode("list");
          }}
          parentId={selectedProject?.id}
          parentName={selectedProject?.name}
        />
      );
    }

    if (mode === "edit") {
      return (
        <UserProjectEditForm
          projectId={editProjectId}
          onCancel={() => setMode("list")}
          onSuccess={() => {
            handleRefresh();
            setMode("list");
          }}
          isSharedWithMe={isSharedWithMe}
        />
      );
    }

    if (selectedProject?.id && currentProject) {
      return (
        <div className="space-y-6">
          <div className="border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur p-4 2xl:p-6">
            <div className="flex flex-wrap justify-between sm:items-center gap-4 mb-6 project-header-section">
              <h2 className="text-xl font-semibold">
                {currentProject.name || currentProject.title}
              </h2>
              <div className="project-actions-container flex flex-wrap sm:justify-end items-center gap-3 w-fit">
                {
                  ((!isSharedWithMe && !isSharedWithOthers && currentProject?.permissions?.edit) || ((!isSharedWithMe || !isSharedWithOthers))) && 
                  hasEditProjectPermission && 
                      <Button fullWidth={false} onClick={() => handleEdit(currentProject.id)} variant={'dg_btn'} className="!p-4 !py-2 !w-fit">Edit Project</Button>
                }
                <Button
                  fullWidth={false}
                  onClick={handleDownloadPDF}
                  disabled={!currentProject.images?.length || pdfDownloading}
                  variant="dg_btn"
                  className="!p-4 !py-2 !w-fit flex items-center gap-2"
                >
                  {pdfDownloading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <AiOutlineDownload className="inline-block" />
                  )}
                  {pdfDownloading ? "Downloading..." : "Download PDF"}
                </Button>
                
                {!isSharedWithMe && (
                  <ShareModal  resourceType={'Project'} resourceId={currentProject.id}/>
                )}

                <Button
                  onClick={handleDownloadZIP}
                  disabled={loading}
                  variant={'dg_btn'}
                  className="!p-4 !py-2 !w-fit"
                >
                  <AiOutlineDownload className="inline-block mr-2" />
                  Download ZIP
                </Button>


                {showProjectDownloadDialog && currentProject && (
                  <ProjectDownloadDialog
                    project={currentProject}
                    statusCount={statusCount}
                    onClose={() => setShowProjectDownloadDialog(false)}
                    setError={setError}
                  />
                )}

                {hasDeleteProjectPermission && !isSharedWithMe && !isSharedWithOthers && <Button
                  variant={'dg_btn'}
                  fullWidth={false}
                  onClick={() =>
                    handleDelete(
                      currentProject.id,
                      currentProject.name || currentProject.title
                    )
                  }
                  className="!p-4 !py-2 !w-fit"
                >
                  Delete
                </Button>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <h3 className="text-sm text-zinc-200 mb-1">Start Date</h3>
                <p>
                  {new Date(currentProject.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="text-sm text-zinc-200 mb-1">End Date</h3>
                <p>{new Date(currentProject.end_date).toLocaleDateString()}</p>
              </div>
              {currentProject.parent_id && (
                <div>
                  <h3 className="text-sm text-zinc-200 mb-1">Parent Project</h3>
                  <p>
                    {typeof currentProject.parent_id === "object"
                      ? currentProject.parent_id.name ||
                      currentProject.parent_id.title
                      : "Unknown Parent"}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-sm text-zinc-200 mb-1">Description</h3>
              <p className="text-zinc-300">{currentProject.description}</p>
            </div>

            {currentProject.images?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm text-zinc-300 mb-3">Project Images</h3>
                <div className="project-images-grid grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                 {currentProject.images.map((image, index) => (
            <div
              key={image._id || index}
              className="aspect-square relative bg-zinc-900 cursor-pointer rounded-lg overflow-hidden"
            >
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="w-full h-full">
                    <ImagePreviewDialog
                      imageUrl={
                        image.status === "saved"
                          ? `${BASE_API_URL}/genie-image/${image.url}`
                          : image.url
                      }
                      customButton={
                        <Button
                          variant="dg_btn"
                          onClick={() => setShowChooseAsset({ open: true, imageId: image.id })}
                        >
                          Tree View
                        </Button>
                      }
                      isSharedWithMe={isSharedWithMe}
                    >
                      <div className="cursor-pointer">
                        <SmartImage
                          src={
                            image.status === "saved"
                              ? `${BASE_API_URL}/genie-image/${image.url}`
                              : image.url
                          }
                          alt={image.description || `Project image ${index + 1}`}
                          className="w-full h-full object-cover"
                          style={{ display: "block", width: "100%", height: "100%" }}
                        />
                      </div>
                    </ImagePreviewDialog>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem 
                    className={'cursor-pointer'}
                     onClick={() => navigateWithImage(`tech-packs?tab=generate`, image.id || image._id)}
                  >
                    <FaTable />
                    Use in Tech Pack
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          ))}
                </div>
              </div>
            )}

            {currentProject.moodboards?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm text-white mb-2">Moodboards</h3>
                <ul className="list-disc list-inside text-zinc-300">
                  {currentProject.moodboards.map((mb) => (
                    <li key={mb?.id || mb?._id}>
                      {mb?.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {currentProject.size_charts?.length > 0 && (
              <div>
                <h3 className="text-sm text-zinc-300 mb-3">Size Chart</h3>

                {/* ✅ Get current size chart by index */}
                {(() => {
                  const chart = currentProject.size_charts[sizeChartIndex] || {};
                  // const galleryIds = Array.isArray(chart.gallery_image_id)
                  //   ? chart.gallery_image_id
                  //   : chart.gallery_image_id
                  //   ? [chart.gallery_image_id]
                  //   : [];

                  const galleryIds = chart?.gallery_image_ids || [];

                  return (
                    <div className="mb-6">
                      <MeasurementTable
                        measurements={chart.measurements}
                        tolerance={chart?.tolerance || []}
                        grading_rules={chart?.grading_rules || []}
                        size_conversion={chart?.size_conversion || []}
                        sizeChartId={chart.id}
                        setMeasurement={() => {
                          if (selectedProject?.id) {
                            fetchProjectDetails(selectedProject.id);
                          }
                        }}
                        sizeChartImage={chart.results?.length > 0 ? chart.results[0] : undefined}
                        isEditable={false}
                        isAIGenerated={["ai_generated", "ai_generated_edited"].includes(chart.generation_source)}
                        showDuplicateButton={false}
                        showLinkProjectButton={false}
                        customButton={
                          <Button
                            onClick={() =>
                              setPreviewInputState({
                                open: true,
                                galleryImageIds: galleryIds,
                              })
                            }
                            disabled={galleryIds.length === 0}
                            variant="dg_btn"
                          >
                            <BsImages className="w-4 h-4 m-2" />
                            <span>
                              View Input {galleryIds.length > 1 ? "Images" : "Image"}
                            </span>
                          </Button>
                        }
                        isSharedWithOthers={isSharedWithOthers}
                        isSharedWithMe={isSharedWithMe}
                        otherData={chart}
                      />

                      {/* ✅ Pagination Controls */}
                    </div>
                  );
                })()}
                {currentProject.size_charts.length > 1 && (
                  <div className="flex justify-between mt-2">
                    <Button
                      onClick={handlePrev}
                      disabled={sizeChartIndex === 0}
                      variant={'dg_btn'}
                      className="w-fit bg-black/15 px-5"
                    >
                      Previous
                    </Button>
                    <span className="text-gray-400">
                      {sizeChartIndex + 1} of {currentProject?.size_charts?.length}
                    </span>
                    <Button
                      onClick={handleNext}
                      disabled={sizeChartIndex >= currentProject.size_charts.length - 1}
                      variant={'dg_btn'}
                      className="w-fit bg-black/15 px-5"
                    >
                      Next
                    </Button>
                  </div>
                )}

                <InputImagePreviewDialog
                  open={previewInputState.open}
                  galleryImageIds={previewInputState.galleryImageIds || []}
                  setOpen={(show) =>
                    setPreviewInputState((prev) => ({ ...prev, open: show }))
                  }
                />
              </div>
            )}
          </div>

          <div className="sub-projects-section space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Sub-Projects</h3>
              {hasCreateProjectPermission && !isSharedWithMe && !isSharedWithOthers && <Button
                variant={'dg_btn'}
                fullWidth={false}
                onClick={() => {
                  setMode("create");
                  setSelectedProject({
                    id: currentProject.id,
                    name: currentProject.name || currentProject.title,
                  });
                }}
              >
                Add Sub-Project
              </Button>}
            </div>

            <UserProjectGrid
              parentId={currentProject.id}
              onEdit={handleEdit}
              onNavigate={(id) => {
                setSelectedProject({ id, name: "Loading..." });
              }}
              onDelete={handleDelete}
              refreshKey={refreshKey}
              hasEditProjectPermission={hasEditProjectPermission}
              isShared={isSharedWithMe}
            />
          </div>
        </div>
      );
    }

    return (
      <>
        <GalleryPageNew />
         <div className="flex items-center justify-center md:h-64 p-4 lg:p-6 border border-solid shadow-sm !bg-black/15 border-white/35 rounded-xl border-shadow-blur">
          <div className="text-center">
            <h2 className="text-lg md:text-xl leading-none md:leading-none font-semibold mb-1">
            {heading}
            </h2>
            <p className="text-sm md:text-base mb-6 text-zinc-400">
              {subHeading}
            </p>
            {hasCreateProjectPermission && !isSharedWithMe && !isSharedWithOthers && (
              <Button
                variant="dg_btn"
                onClick={() => {
                  setSelectedProject({
                    id: null,
                    name: "New Project",
                  });
                  setMode("create");
                }}
                fullWidth={false}
                className="create-project-btn block mx-auto text-sm px-5 create-new-project-btn"
              >
                Create Project
              </Button>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="text-white p-4 lg:p-5 xl:p-6 h-24 grow flex flex-col">
      <ApiTour
        tourName="projectTour" 
        steps={projectPageTourSteps}
      />
      <div className="container h-24 grow flex flex-col">
        <h1 data-tour="project-create-button" className="project-management-title text-lg xl:text-2xl font-bold mb-3">{customTitle ? "Projects" : "Project Management"}</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-200">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-200"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 lg:gap-6 lg:h-96 lg:grow">
          <div className="projects-list lg:col-span-1 project-tree-container">
              {/* 🔍 Project Search Field */}
           {!isSharedWithOthers && !isSharedWithMe &&  <div className="flex flex-row bg-gray gap-2">
           <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg mb-2 bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <DateRangePickerModal onSelectRange={({ startDate, endDate })=>setDateRange({ startDate, endDate })}/> 
           </div>}
            <UserProjectTree
              onSelectProject={handleSelectProject}
              selectedProjectId={selectedProject?.id}
              refreshKey={refreshKey}
              hasCreateProjectPermission={hasCreateProjectPermission}
              isSharedWithMe={isSharedWithMe}
              isSharedWithOthers={isSharedWithOthers}
              searchTerm={searchTerm}
              dateRange={dateRange}
            />
          </div>

          <div className="lg:col-span-3 pb-10">
            {loading ? (
              <div className="flex items-center justify-center h-64 bg-zinc-950 rounded-lg">
                <p className="text-zinc-400">Loading project details...</p>
              </div>
            ) : (
              renderMainContent()
            )}
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
              <p className="mb-6">
                Are you sure you want to delete "{projectToDelete?.name}"? This
                action cannot be undone and will also delete all sub-projects.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDeleteConfirm}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
        {showChooseAsset.open && (
            <GalleryTreeManager
              isOpen={showChooseAsset.open}
              imageId={showChooseAsset.imageId}
              onClose={() => setShowChooseAsset({ open: false, imageId: null })}
            />
          )}
      </div>
    </div>
  );
}
