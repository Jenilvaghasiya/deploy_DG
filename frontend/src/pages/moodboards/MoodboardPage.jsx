import { useEffect, useState } from "react";
import {
  AiOutlinePlus,
  AiOutlineArrowLeft,
  AiOutlineSortAscending,
} from "react-icons/ai";
import { BsGrid, BsList } from "react-icons/bs";
import { Button } from "../../components/ui/button";
import MoodboardGrid from "./MoodboardGrid";
import CreateMoodboardForm from "./CreateMoodboardForm";
import EditMoodboardForm from "./EditMoodboardForm";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { hasPermission } from "../../lib/utils";
import ApiTour from "../../components/Tour/ApiTour"
import { moodboardTourSteps } from "@/components/Tour/TourSteps";
import DeleteMoodboardModal from "@/components/DeleteMoodboardModal";

export default function MoodboardPage({
  customTitle = false,
  isSharedWithMe = false,
  isSharedWithOthers= false,
}) {
  const [mode, setMode] = useState("list");
  const [viewMode, setViewMode] = useState("grid");
  const [editMoodboardId, setEditMoodboardId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [moodboardToDelete, setMoodboardToDelete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortOption, setSortOption] = useState("NEWEST_FIRST");

  const { user } = useAuthStore();
  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p?.key).filter(Boolean);

  const hasCreateMoodboardPermission = hasPermission(
    permissionKeys,
    "workspace:moodboards:create"
  );
  const hasEditMoodboardPermission = hasPermission(
    permissionKeys,
    "workspace:moodboards:update"
  );
  const hasDeleteMoodboardPermission = hasPermission(
    permissionKeys,
    "workspace:moodboards:delete"
  );

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (editId) {
      setEditMoodboardId(editId);
      setMode("edit");
    }
  }, [editId]);

  const handleEdit = (moodboardId) => {
    setEditMoodboardId(moodboardId);
    setMode("edit");
  };

  const handleDelete = (id, name) => {
    console.log(id,name,'<<<<<<')
    setMoodboardToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    setMoodboardToDelete(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setMode("list");
    setEditMoodboardId(null);
    navigate("/moodboards", {
      replace: true,
    });
  };

  return (
    <div className="text-white p-4 2xl:p-6 h-24 grow">
      <ApiTour
        tourName="moodBoardTour" 
        steps={moodboardTourSteps}
      />
      <div className="container space-y-3 pb-5 2xl:pb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-lg 2xl:text-2xl font-bold">
          {!customTitle &&
            (mode === "list"
              ? "My Moodboards"
              : mode === "create"
              ? "Create New Moodboard"
              : "Edit Moodboard")}
          </h1>

          <div className="flex flex-wrap items-center gap-2 md:gap-4 md:ml-auto">
            {mode === "list" && (
              <>
                <div className="flex items-center">
                  <span className="mr-2 text-xs md:text-sm text-white">SORT</span>
                  <div className="relative sorting">
                    <select
                      className="bg-[#4E4E4E] rounded-md pl-3 pr-8 py-2 text-xs lg:text-sm border border-zinc-700 focus:border-pink-500 focus:outline-none appearance-none"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="NEWEST_FIRST">NEWEST FIRST</option>
                      <option value="OLDEST_FIRST">OLDEST FIRST</option>
                      <option value="A-Z">A-Z</option>
                      <option value="Z-A">Z-A</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center bg-[#4E4E4E] rounded-full p-1 list-grid-view">
                  <button
                    className={`text-xs cursor-pointer sm:text-base flex items-center px-2 py-1 rounded-full ${
                      viewMode === "list"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-200 hover:text-white"
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    <BsList size={16} className="mr-2" />
                    List
                  </button>
                  <button
                    className={`text-xs cursor-pointer sm:text-base flex items-center px-2 py-1 rounded-full ${
                      viewMode === "grid"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                    onClick={() => setViewMode("grid")}
                  >
                    <BsGrid size={16} className="mr-2" />
                    Grid
                  </button>
                </div>
              </>
            )}
          </div>

          {hasCreateMoodboardPermission && !isSharedWithMe && !isSharedWithOthers && (
            <Button
              className={"create-moodboard-btn"}
              variant="dg_btn"
              icon={
                mode === "list" ? (
                  <AiOutlinePlus size={18} />
                ) : (
                  <AiOutlineArrowLeft size={18} />
                )
              }
              onClick={() => {
                setMode(mode === "list" ? "create" : "list");
                if (editId) {
                  navigate("/moodboards", {
                    replace: true,
                  });
                }
              }}
              fullWidth={false}
            >
              {mode === "list" ? "Create Moodboard" : "Back to Moodboards"}
            </Button>
          )}
        </div>

        {mode === "list" && (
          <MoodboardGrid
            viewMode={viewMode}
            setMode={setMode}
            onEdit={handleEdit}
            onDelete={handleDelete}
            refreshKey={refreshKey}
            sortOption={sortOption}
            hasEditMoodboardPermission={hasEditMoodboardPermission}
            hasDeleteMoodboardPermission={hasDeleteMoodboardPermission}
            hasCreateMoodboardPermission={hasCreateMoodboardPermission}
            isSharedWithMe={isSharedWithMe}
            isSharedWithOthers={isSharedWithOthers}
          />
        )}

        {mode === "create" && <CreateMoodboardForm onCancel={handleCancel} />}

        {mode === "edit" && (
          <EditMoodboardForm
            moodboardId={editMoodboardId}
            onCancel={handleCancel}
            isSharedWithMe={isSharedWithMe}
            isSharedWithOthers={isSharedWithOthers}
          />
        )}
      </div>

      <DeleteMoodboardModal
        moodboardId={moodboardToDelete?.id}
        moodboardName={moodboardToDelete?.name}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}