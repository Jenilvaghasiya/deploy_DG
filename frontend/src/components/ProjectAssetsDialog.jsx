// components/ProjectAssetsDialog.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BASE_URL } from "@/config/env";
import { 
  FaFolderOpen, 
  FaFolder, 
  FaChevronRight, 
  FaChevronDown,
  FaImage,
  FaRuler,
  FaPalette,
  FaFile
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import api from "@/api/axios";
import SmartImage from "./SmartImage";

function TreeNode({ 
  label, 
  children, 
  checked, 
  onToggle, 
  type = "folder", 
  level = 0, 
  isExpanded = true,
  onToggleExpand,
  hasChildren = false,
  icon,
  thumbnail
}) {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggleExpand?.(newExpanded);
  };

  const getTypeIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'project':
        return expanded ? <FaFolderOpen className="text-yellow-400" /> : <FaFolder className="text-yellow-500" />;
      case 'images':
        return <FaImage className="text-blue-400" />;
      case 'size_charts':
        return <FaRuler className="text-purple-400" />;
      case 'moodboards':
        return <FaPalette className="text-orange-400" />;
      case 'image':
        return <FaImage className="text-blue-300" />;
      case 'size_chart':
        return <FaRuler className="text-purple-300" />;
      case 'moodboard':
        return <FaPalette className="text-orange-300" />;
      default:
        return <FaFile className="text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Tree connector lines */}
      {level > 0 && (
        <>
          <div className="absolute left-0 top-0 w-5 h-6 border-l-2 border-b-2 border-gray-600/50 rounded-bl"></div>
          <div className="absolute left-0 top-6 bottom-0 w-px bg-gray-600/30"></div>
        </>
      )}
      
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors",
          level > 0 && "ml-5",
          checked && "bg-blue-500/10 border border-blue-500/30"
        )}
      >
        {/* Expand/Collapse Button */}
        <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
          {hasChildren ? (
            <button
              onClick={handleToggleExpand}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {expanded ? (
                <FaChevronDown className="w-3 h-3" />
              ) : (
                <FaChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
          )}
        </div>

        {/* Checkbox */}
        {onToggle && (
          <Checkbox
            checked={checked}
            onCheckedChange={onToggle}
            className="flex-shrink-0"
          />
        )}

        {/* Thumbnail for images */}
        {thumbnail && (
          <div className="flex-shrink-0">
            <SmartImage
              src={thumbnail}
              alt=""
              className="w-8 h-8 object-cover rounded border border-gray-600"
            />
          </div>
        )}

        {/* Icon */}
        <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
          {getTypeIcon()}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          {typeof label === 'string' ? (
            <span className="text-sm text-white truncate block">{label}</span>
          ) : (
            label
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && children && (
        <div className="mt-1">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProjectAssetsDialog({ projectId, open, onClose }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  useEffect(() => {
    if (!projectId) return;

    // Recursive fetch function
    const fetchProjectRecursively = async (id) => {
      try {
        const res = await api.get(`/projects/${id}`);
        const data = res.data.data;

        // Fetch sub-projects if they are just IDs
        if (data.sub_projects && data.sub_projects.length > 0 && typeof data.sub_projects[0] === 'string') {
          const subProjects = await Promise.all(
            data.sub_projects.map(subId => fetchProjectRecursively(subId))
          );
          data.sub_projects = subProjects.filter(Boolean); // remove nulls
        }

        return data;
      } catch (err) {
        console.error("Error fetching project:", err);
        return null;
      }
    };

    const fetchProject = async () => {
      setLoading(true);
      try {
        const data = await fetchProjectRecursively(projectId);
        setProject(data);
      } catch (err) {
        console.error("Error fetching project recursively:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

const toggleSelection = (id, type) => {
  const normalizedType = {
    Image: "image",
    SizeChart: "size_chart",
    MoodBoard: "moodboard",
    Project: "project",
  }[type] || type;

  setSelectedIds((prev) => {
    const exists = prev.find(item => item.id === id && item.type === normalizedType);
    if (exists) {
      return prev.filter(item => !(item.id === id && item.type === normalizedType));
    } else {
      return [...prev, { id, type: normalizedType }];
    }
  });
};

  const toggleSelectAll = () => {
    const allItems = getAllSelectableIds(project);
    if (selectedIds.length === allItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allItems);
    }
  };

const getAllSelectableIds = (proj) => {
  if (!proj) return [];
  let items = [];

  items.push({ id: proj.id, type: "project" });

  if (proj.images) items.push(...proj.images.map(img => ({ id: img.id, type: "image" })));
  if (proj.size_charts) items.push(...proj.size_charts.map(chart => ({ id: chart.id, type: "size_chart" })));
  if (proj.moodboards) items.push(...proj.moodboards.map(mb => ({ id: mb.id, type: "moodboard" })));

  if (proj.sub_projects) {
    proj.sub_projects.forEach(sub => {
      items.push(...getAllSelectableIds(sub));
    });
  }

  return items;
};

const buildPayload = (selected, rootProject) => {
  // group selected items under their parent project
  const payload = [];

  const traverse = (proj) => {
    const projectObj = {
      project: { id: proj.id, type: "projects" },
      images: [],
      size_charts: [],
      moodboards: [],
      sub_projects: []
    };

    // collect this project's selected items
    if (proj.images) {
      proj.images.forEach((img) => {
        if (selected.some((s) => s.id === img.id && s.type === "image")) {
          projectObj.images.push(img.id);
        }
      });
    }

    if (proj.size_charts) {
      proj.size_charts.forEach((chart) => {
        if (selected.some((s) => s.id === chart.id && s.type === "size_chart")) {
          projectObj.size_charts.push(chart.id);
        }
      });
    }

    if (proj.moodboards) {
      proj.moodboards.forEach((mb) => {
        if (selected.some((s) => s.id === mb.id && s.type === "moodboard")) {
          projectObj.moodboards.push(mb.id);
        }
      });
    }

    // recurse into sub projects
    if (proj.sub_projects) {
      proj.sub_projects.forEach((sub) => {
        const subPayload = traverse(sub);
        if (subPayload) {
          projectObj.sub_projects.push(subPayload);
        }
      });
    }

    // only include if project itself or something inside is selected
    const hasSelections =
      selected.some((s) => s.id === proj.id && s.type === "project") ||
      projectObj.images.length > 0 ||
      projectObj.size_charts.length > 0 ||
      projectObj.moodboards.length > 0 ||
      projectObj.sub_projects.length > 0;

    return hasSelections ? projectObj : null;
  };

  const rootPayload = traverse(rootProject);
  if (rootPayload) payload.push(rootPayload);

  return { items: payload };
};

const handleDownload = async (selectedIds) => {
  try {
    if (!selectedIds || selectedIds.length === 0) {
      console.warn("No items selected for download");
      return;
    }

    const payload = buildPayload(selectedIds, project);

    const response = await api.post(
      `/projects/download-zip`,
      payload,
      { responseType: "blob" }
    );

    const blob = new Blob([response.data], { type: "application/zip" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "project_assets.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
  }
};


  const renderProjectTree = (proj, level = 0) => {
    if (!proj) return null;

    const hasImages = proj.images && proj.images.length > 0;
    const hasSizeCharts = proj.size_charts && proj.size_charts.length > 0;
    const hasMoodboards = proj.moodboards && proj.moodboards.length > 0;
    const hasSubProjects = proj.sub_projects && proj.sub_projects.length > 0;
    const hasChildren = hasImages || hasSizeCharts || hasMoodboards || hasSubProjects;

    return (
      <TreeNode
        key={proj.id}
        label={proj.name}
        type="project"
        level={level}
        checked={selectedIds.some(item => item.id === proj.id && item.type === "project")}
        onToggle={() => toggleSelection(proj.id, "Project")}
        hasChildren={hasChildren}
        isExpanded={expandedNodes[proj.id] !== false}
        onToggleExpand={(expanded) =>
          setExpandedNodes((prev) => ({ ...prev, [proj.id]: expanded }))
        }
      >
        {/* Images */}
        {hasImages && (
          <TreeNode
            key={`${proj.id}-images`}
            label={`Images (${proj.images.length})`}
            type="images"
            level={level + 1}
            hasChildren={true}
            isExpanded={expandedNodes[`${proj.id}-images`] !== false}
            onToggleExpand={(expanded) =>
              setExpandedNodes((prev) => ({
                ...prev,
                [`${proj.id}-images`]: expanded,
              }))
            }
          >
            {proj.images.map((img) => (
              <TreeNode
                key={img.id}
                label={img.name}
                type="image"
                level={level + 2}
                checked={selectedIds.some(item => item.id === img.id && item.type === "image")}
                onToggle={() => toggleSelection(img.id, "Image")}
                thumbnail={img.url}
              />
            ))}
          </TreeNode>
        )}

        {/* Size Charts */}
        {hasSizeCharts && (
          <TreeNode
            key={`${proj.id}-size_charts`}
            label={`Size Charts (${proj.size_charts.length})`}
            type="size_charts"
            level={level + 1}
            hasChildren={true}
            isExpanded={expandedNodes[`${proj.id}-size_charts`] !== false}
            onToggleExpand={(expanded) =>
              setExpandedNodes((prev) => ({
                ...prev,
                [`${proj.id}-size_charts`]: expanded,
              }))
            }
          >
            {proj.size_charts.map((chart) => (
              <TreeNode
                key={chart.id}
                label={`Size Chart ${chart.id.slice(-4)}`}
                type="size_chart"
                level={level + 2}
                checked={selectedIds.some(item => item.id === chart.id && item.type === "size_chart")}
                onToggle={() => toggleSelection(chart.id, "SizeChart")}
              />
            ))}
          </TreeNode>
        )}

        {/* Moodboards */}
        {hasMoodboards && (
          <TreeNode
            key={`${proj.id}-moodboards`}
            label={`Moodboards (${proj.moodboards.length})`}
            type="moodboards"
            level={level + 1}
            hasChildren={true}
            isExpanded={expandedNodes[`${proj.id}-moodboards`] !== false}
            onToggleExpand={(expanded) =>
              setExpandedNodes((prev) => ({
                ...prev,
                [`${proj.id}-moodboards`]: expanded,
              }))
            }
          >
            {proj.moodboards.map((mb) => (
              <TreeNode
                key={mb.id}
                label={mb.name}
                type="moodboard"
                level={level + 2}
                checked={selectedIds.some(item => item.id === mb.id && item.type === "moodboard")}
                onToggle={() => toggleSelection(mb.id, "MoodBoard")}
              />
            ))}
          </TreeNode>
        )}

        {/* Sub Projects */}
        {hasSubProjects && (
          <TreeNode
            key={`${proj.id}-sub_projects`}
            label={`Sub Projects (${proj.sub_projects.length})`}
            type="project"
            level={level + 1}
            hasChildren={true}
            isExpanded={expandedNodes[`${proj.id}-sub_projects`] !== false}
            onToggleExpand={(expanded) =>
              setExpandedNodes((prev) => ({
                ...prev,
                [`${proj.id}-sub_projects`]: expanded,
              }))
            }
          >
            {proj.sub_projects.map((sub) => renderProjectTree(sub, level + 2))}
          </TreeNode>
        )}
      </TreeNode>
    );
  };

  const allSelectableIds = getAllSelectableIds(project);
  const isAllSelected = selectedIds.length === allSelectableIds.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{project?.name || "Project"} - Project Assets</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 me-6 text-sm cursor-pointer">
                <Checkbox
                  checked={isAllSelected}
                  ref={(ref) => {
                    if (ref) {
                      ref.indeterminate = isSomeSelected;
                    }
                  }}
                  onCheckedChange={toggleSelectAll}
                />
                Select All
              </label>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg p-4 border border-gray-700 custom-scroll">
          <div className="text-white space-y-1">
            {renderProjectTree(project)}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex-shrink-0 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3">
            <span className="font-medium text-white">{selectedIds.length}</span> items selected for download
          </div>
        )}

       <DialogFooter className="flex-shrink-0">
  <Button variant="outline" onClick={onClose}>
    Close
  </Button>
  <Button
    onClick={() => handleDownload(selectedIds)}
    disabled={selectedIds.length === 0}
  >
    Download Selected ({selectedIds.length})
  </Button>
</DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
