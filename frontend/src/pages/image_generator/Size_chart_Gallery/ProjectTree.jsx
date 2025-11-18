import { useEffect, useState } from "react";
import { BsFolder } from "react-icons/bs";
import { FaFolderOpen } from "react-icons/fa";
import api from "@/api/axios"; // adjust path to your axios instance
import SmartImage from "@/components/SmartImage"; // adjust path

export default function ProjectTree({ 
  selectedProject, 
  onSelectProject, 
  linkedImages = [], 
  selectedImages, 
  setSelectedImages,
  onCancel,
  onConfirm,
  showActions = false // prop to control if action buttons are shown
}) {
  const [projects, setProjects] = useState([]);
  const [projectImages, setProjectImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState(null);
  const [openFolders, setOpenFolders] = useState({});

  // 🔹 Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects");
        setProjects(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // 🔹 Fetch images when project changes
  useEffect(() => {
    if (!selectedProject) return;

    const fetchProjectImages = async () => {
      try {
        setLoadingImages(true);
        const res = await api.get(`/gallery/project/images/${selectedProject}`);
        
        setProjectImages(res.data || []);
      } catch (err) {
        console.error("Failed to fetch project images:", err);
        setProjectImages([]);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchProjectImages();
  }, [selectedProject]);

  // 🔹 Build tree
  const buildProjectTree = (projects) => {
    const map = {};
    const roots = [];
    projects.forEach((proj) => {
      const id = proj.id;
      map[id] = { ...proj, children: [] };
    });
    projects.forEach((proj) => {
      const parentId = proj.parent?.id;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[proj.id]);
      } else {
        roots.push(map[proj.id]);
      }
    });
    return roots;
  };

  const toggleFolder = (projectId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const handleClick = (projectId) => {
    onSelectProject(projectId);
    toggleFolder(projectId);
  };

  const selectImage = (img, idx) => {
    if (img.isLinked) return; // 🚫 block linked image
    const uniqueKey = `${img.id}|${idx}`;
    if (selectedImages[0]?._uniqueKey === uniqueKey) {
      // If same image clicked again → unselect
      setSelectedImages([]);
    } else {
      // Otherwise select new image (single selection only)
      setSelectedImages([{ ...img, _uniqueKey: uniqueKey }]);
    }
  };

  // 🔹 Render project nodes
  const renderNode = (node, level = 0) => {
    const isOpen = openFolders[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedProject === node.id;

    return (
      <li key={node.id} className="select-none">
        <div
          className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
            isSelected
              ? "bg-pink-600/20 border border-pink-500/30"
              : "hover:bg-zinc-800/50"
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleClick(node.id)}
        >
          {isOpen ? (
            <FaFolderOpen className="w-4 h-4 text-yellow-400" />
          ) : (
            <BsFolder className="w-4 h-4 text-yellow-400" />
          )}
          <span className="text-sm text-white truncate flex-1">{node.name}</span>
        </div>
        {isOpen && hasChildren && (
          <ul className="space-y-1 mt-1">
            {node.children.map((child) => renderNode(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  const renderProjectTree = () => {
    if (loading) {
      return (
        <div className="text-center py-8 text-zinc-400">Loading projects...</div>
      );
    }

    if (error) {
      return <div className="text-center py-8 text-red-400">{error}</div>;
    }

    if (!projects || projects.length === 0) {
      return (
        <div className="text-center py-8 text-zinc-400">No projects found</div>
      );
    }

    const tree = buildProjectTree(projects);

    return (
      <ul className="space-y-1">{tree.map((n) => renderNode(n))}</ul>
    );
  };

  const renderProjectImages = () => {
    return (
      <>
        {loadingImages ? (
          <div className="text-center py-8 text-zinc-400">Loading images...</div>
        ) : projectImages.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            {selectedProject ? "No images in this project" : ""}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-2">
            {projectImages.map((img, idx) => {
              const uniqueKey = `${img.id}|${idx}`;
              const isSelected = selectedImages[0]?._uniqueKey === uniqueKey;
              const isLinked = linkedImages.includes(img.id);
              return (
                <div
                  key={`project-${img.id}-${idx}`}
                  className={`relative aspect-square rounded-lg overflow-hidden 
                    ${isLinked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
                    ${isSelected ? "ring-2 ring-pink-500" : ""}`}
                  onClick={() => {
                    if (!isLinked) selectImage(img, idx); // 🚫 ignore clicks if linked
                  }}
                >
                  <SmartImage
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  {isLinked && (
                    <div className="absolute inset-0 bg-green-600/60 flex items-center justify-center text-white font-semibold text-xs">
                      Already Linked
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-pink-500/60 flex items-center justify-center text-white font-semibold">
                      Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // 🔹 Split Layout with separate scrolling
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-6 h-[calc(78vh-200px)]"> 
        {/* Projects Tree - Left Side */}
        <div className="w-2/5 flex flex-col border-r border-zinc-700">
          <h3 className="font-semibold mb-3 text-white flex-shrink-0">Projects</h3>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-4 custom-scroll">
            {renderProjectTree()}
          </div>
        </div>

        {/* Project Images - Right Side */}
        <div className="w-3/5 flex flex-col">
          <h3 className="font-semibold mb-3 text-white flex-shrink-0">
            {selectedProject ? "Project Images" : "Select a Project"}
          </h3>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 custom-scroll">
            {renderProjectImages()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedImages)}
            disabled={selectedImages.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Select {selectedImages.length > 0 && `(${selectedImages.length})`}
          </button>
        </div>
      )}
    </div>
  );
}