// components/ProjectDownloadTreeSelector.jsx
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import api from "@/api/axios";
import { cn } from "@/lib/utils";
import { FaFolderOpen } from "react-icons/fa";

function TreeItem({
  node,
  level,
  selectedIds,
  onToggleSelect,
  setProjects,
  allProjects,
  mainProjectId,
  onOpenDialog, // ✅ accept prop
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedIds.includes(node.id);
  const isMainProject = node.id === mainProjectId;

  const handleExpand = async () => {
    if (!isExpanded) {
      if (!node.children || node.children.length === 0) {
        try {
          const res = await api.get(`/projects/${node.id}/sub-projects`);
          node.children = res.data.data.map((sub) => ({
            id: sub.id,
            name: sub.name,
            type: "file",
            children: [],
            created_at: sub.created_at,
          }));

          setProjects([...allProjects]);
        } catch (e) {
          console.error("Failed to load sub-projects", e);
        }
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <li className="flex flex-wrap gap-2 tree-item after:relative after:-top-1 after:left-2.5 after:w-px after:h-[inherit] after:border-l after:border-solid after:border-gray-400">
      <div className="flex items-center gap-2 w-full">
        <div
          onClick={handleExpand}
          className={cn(
            "flex-1 justify-start bg-transparent text-white border border-solid relative border-white/35 after:rounded-full after:-left-px after:absolute after:shadow-[0_0_0_3px_rgba(0,0,0,25%)] after:bg-zinc-400 after:size-2.5 after:-translate-2/4 after:top-2/4 before:w-5 before:h-px before:bg-gray-400 before:-left-5 before:absolute before:top-2/4 px-3 py-2 rounded cursor-pointer transition-colors hover:bg-white/5",
            isSelected && !isMainProject
              ? "bg-pink-100 text-pink-500 border-pink-400 before:bg-pink-400 after:bg-pink-400 after:shadow-[0_0_0_3px_rgba(246,51,154,25%)] font-semibold"
              : isMainProject
              ? "bg-green-100 text-green-500 border-green-400 before:bg-green-400 after:bg-green-400 after:shadow-[0_0_0_3px_rgba(34,197,94,25%)] font-semibold"
              : ""
          )}
        >
          <span>{node.name}</span>
        </div>

        {isMainProject ? (
          <div className="px-3 py-1 bg-green-600 text-white text-sm rounded font-medium">
            Always Included
          </div>
        ) : (
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(node.id)}
            />
            <span className="text-sm text-white">Select</span>
          </label>
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul className="relative tree-children pl-5 order-3 w-2/4 grow">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              setProjects={setProjects}
              allProjects={allProjects}
              mainProjectId={mainProjectId}
              onOpenDialog={onOpenDialog} // ✅ pass down
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function FolderTree({
  data,
  selectedIds,
  onToggleSelect,
  setProjects,
  allProjects,
  mainProjectId,
  className,
  onOpenDialog, // ✅ accept
}) {
  return (
    <ul
      className={`relative tree-root [&>li>div>div:first-child:after]:hidden [&>li>div>div:first-child:before]:hidden ${
        className || ""
      }`}
    >
      {data.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          setProjects={setProjects}
          allProjects={allProjects}
          mainProjectId={mainProjectId}
          onOpenDialog={onOpenDialog} // ✅ pass down
        />
      ))}
    </ul>
  );
}

const getAllDescendantIds = (nodes, excludeMainProject = true) => {
  let ids = [];
  nodes.forEach((node, index) => {
    if (!(excludeMainProject && index === 0)) {
      ids.push(node.id);
    }
    if (node.children) {
      ids = ids.concat(getAllDescendantIds(node.children, false));
    }
  });
  return ids;
};

export default function ProjectDownloadTreeSelector({
  mainProject,
  selectedIds = [],
  onSelectionChange,
  className,
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ new state to track which project opens dialog
  const [dialogProject, setDialogProject] = useState(null);

  useEffect(() => {
    if (mainProject) {
      initializeTree();
    }
  }, [mainProject]);

  const initializeTree = async () => {
    setLoading(true);
    try {
      const treeData = [
        {
          id: mainProject.id,
          name: mainProject.name || mainProject.title,
          type: "folder",
          children: [],
          created_at: mainProject.created_at,
        },
      ];
      setProjects(treeData);
    } catch (e) {
      console.error("Failed to initialize tree", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (projectId) => {
    if (projectId === mainProject.id) return;
    const newSelectedIds = selectedIds.includes(projectId)
      ? selectedIds.filter((id) => id !== projectId)
      : [...selectedIds, projectId];
    onSelectionChange(newSelectedIds);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = getAllDescendantIds(projects, true);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleOpenDialog = async (node) => {
  try {
    const res = await api.get(`/projects/${node.id}`); // ✅ endpoint should return assets + children
    setDialogProject(res.data.data); // store full project object
  } catch (e) {
    console.error("Failed to load project details", e);
    setDialogProject(node); // fallback (just node)
  }
};


  const allSelectableIds = getAllDescendantIds(projects, true);
  const isAllSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = selectedIds.length > 0;

  if (loading) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="text-zinc-400">Loading project tree...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-white mb-1 block">Projects</Label>
          {allSelectableIds.length > 0 && (
            <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
              <Checkbox
                checked={isAllSelected}
                ref={(ref) => {
                  if (ref) {
                    ref.indeterminate = isSomeSelected && !isAllSelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
              Select All
            </label>
          )}
        </div>

        <div className="border border-solid border-white/35 rounded-lg p-3 max-h-80 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              No projects available
            </div>
          ) : (
            <FolderTree
              data={projects}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              setProjects={setProjects}
              allProjects={projects}
              mainProjectId={mainProject.id}
              onOpenDialog={handleOpenDialog}
            />
          )}
        </div>
      </div>
    </div>
  );
}
