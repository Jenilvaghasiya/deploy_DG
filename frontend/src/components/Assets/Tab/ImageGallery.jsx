// components/GallerySelector.jsx
import { useState, useEffect } from "react";
import { BsFolder, BsCardImage } from "react-icons/bs";
import { FaFolderOpen } from "react-icons/fa";
import SmartImage from "@/components/SmartImage";
import {Button} from "@/components/ui/button.jsx";
import api from "@/api/axios.js";

const BASE_API_URL = import.meta.env.VITE_API_URL;

const TABS = {
  SAVED: "saved",
  FINALIZED: "finalized",
  PROJECTS: "projects",
};

export default function TreeGallery({
  onSelect,
  selectedImages,
  setSelectedImages,
  imageId,
}) {
  const [galleryImages, setGalleryImages] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.SAVED);
  const [loading, setLoading] = useState(false);
  const [currentSort, setCurrentSort] = useState("created-date-asc");

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectImages, setProjectImages] = useState([]);
  const [openFolders, setOpenFolders] = useState({});

  // 🔹 Fetch gallery
  const fetchGalleryImages = async () => {
    if (activeTab === TABS.PROJECTS) return;
    setLoading(true);
    try {
      const res = await api.get("/gallery", {
        params: { status: activeTab, sorting: currentSort },
      });
      const data = res.data.data || [];
      const normalized = data.map((img) => ({
        id: img.id,
        url: `${BASE_API_URL}/genie-image/${img.url}.png`,
        name: img.name,
        status: img.status || "saved",
      }));
      setGalleryImages(normalized);
    } catch (err) {
      console.error("Failed to fetch gallery images", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      setProjects(res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch project images
  const fetchProjectImages = async (projectId) => {
    try {
      setLoading(true);
      const res = await api.get(`/gallery/project/images/${projectId}`);
      const images =
        res.data?.map((img) => ({
          id: img.id,
          url: img.url.startsWith("http")
            ? img.url
            : `${BASE_API_URL}/genie-image/${img.url}.png`,
          name: img.name,
          status: "project",
        })) || [];
      setProjectImages(images);
      setSelectedProject(projectId);
    } catch (err) {
      console.error("Failed to fetch project images", err);
      setProjectImages([]);
    } finally {
      setLoading(false);
    }
  };


  // 🔹 Load data on tab change
  useEffect(() => {
     if (activeTab === TABS.PROJECTS) {
      fetchProjects();
    } else {
      fetchGalleryImages();
    }
  }, [activeTab]);

  const selectImage = (img, idx) => {
    const uniqueKey = `${img.id}|${idx}`;
    setSelectedImages([{ ...img, _uniqueKey: uniqueKey }]);
  };

  const GridView = ({ images }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((img, idx) => {
        const isSelected = selectedImages[0]?._uniqueKey === `${img.id}|${idx}`;
        return (
          <div
            key={`${img.id}|${idx}`}
            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer ${
              isSelected ? "ring-2 ring-pink-500" : ""
            }`}
            onClick={() => selectImage(img, idx)}
          >
            <SmartImage
              src={img.url}
              alt={img.name}
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute inset-0 bg-pink-500/60 flex items-center justify-center text-white font-semibold">
                Selected
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

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

  const handleProjectClick = (projectId) => {
    fetchProjectImages(projectId);
    toggleFolder(projectId);
    setSelectedImages([]);
  };

  const renderProjectNode = (node, level = 0) => {
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
          onClick={() => handleProjectClick(node.id)}
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
            {node.children.map((child) => renderProjectNode(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  const renderProjectTree = () => {
    if (!projects || projects.length === 0) {
      return <div className="text-center py-8 text-zinc-400">No projects found</div>;
    }
    const tree = buildProjectTree(projects);
    return (
      <div className="h-full overflow-auto custom-scroll">
        <h3 className="font-semibold mb-3 text-white">Projects</h3>
        <ul className="space-y-1">{tree.map((n) => renderProjectNode(n))}</ul>
      </div>
    );
  };

  const renderProjectImages = () => {
    return (
      <>
        {loading ? (
          <div className="text-center py-8 text-zinc-400">Loading images...</div>
        ) : projectImages.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            {selectedProject ? "No images in this project" : "Select a project"}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {projectImages.map((img, idx) => {
              const isSelected =
                selectedImages[0]?._uniqueKey === `${img.id}|${idx}`;
              return (
                <div
                  key={`project-${img.id}-${idx}`}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer ${
                    isSelected ? "ring-2 ring-pink-500" : ""
                  }`}
                  onClick={() => selectImage(img, idx)}
                >
                  <SmartImage
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
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

  return (
    <div className="flex flex-col h-full p-6 pt-0">
      {/* Tabs */}
      <div className="flex border-b border-zinc-700 mb-4 shrink-0">
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium cursor-pointer ${
              activeTab === tab
                ? "border-b-2 border-pink-500 text-pink-400"
                : "text-white hover:text-pink-400"
            }`}
            onClick={() => {
              setActiveTab(tab);
              setSelectedProject(null);
              setProjectImages([]);
              setOpenFolders({});
              setSelectedImages([]);
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content area - flex-1 to take available space */}
      <div className="flex-1 overflow-auto min-h-0 custom-scroll pr-2">
        {activeTab !== TABS.PROJECTS && (
          <GridView images={galleryImages} />
        )}

        {activeTab === TABS.PROJECTS && (
          <div className="h-full grid grid-cols-5 gap-6">
            <div className="col-span-2 border-r border-zinc-700 pr-4 overflow-auto">
              {renderProjectTree()}
            </div>
            <div className="col-span-3 pl-4 overflow-auto pr-2 custom-scroll">
              {renderProjectImages()}
            </div>
          </div>
        )}
      </div>

      {/* Footer - shrink-0 to prevent compression */}
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-700 shrink-0">
        <div className="text-sm text-zinc-400">
          {selectedImages.length} image
          {selectedImages.length !== 1 ? "s" : ""} selected
        </div>
        <div className="flex gap-3">
          <Button variant="dg_btn" onClick={() => setSelectedImages([])}>
            Clear
          </Button>
          <Button
            variant="dg_btn"
            className="text-white"
            onClick={() => onSelect?.(selectedImages)}
            disabled={selectedImages.length === 0}
          >
            Add Selected ({selectedImages.length})
          </Button>
        </div>
      </div>
    </div>
  );
}
