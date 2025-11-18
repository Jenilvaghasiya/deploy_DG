// components/ProjectTreeSelector.jsx
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import api from "../api/axios"
import { cn } from "@/lib/utils"

function TreeItem({ node, level, onSelect, selectedProject, linkedProjectId, setProjects, allProjects }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

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

          // Update the whole tree
          setProjects([...allProjects]);
        } catch (e) {
          console.error("Failed to load sub-projects", e);
        }
      }
    }
    setIsExpanded(!isExpanded);
  };

  const isLinked = node.id === linkedProjectId?.id || node.id === linkedProjectId;
  const isCurrentlySelected = selectedProject?.id === node.id || selectedProject === node.id;

  return (
    <li className="flex flex-wrap gap-2 tree-item after:relative after:-top-1 after:left-2.5 after:w-px after:h-[inherit] after:border-l after:border-solid after:border-gray-400">
      <div className="flex items-center gap-2 w-full">
        <Button
          variant="outline"
          onClick={handleExpand}
          className={cn("flex-1 justify-start bg-transparent text-white border border-solid relative border-white/35 after:rounded-full after:-left-px after:absolute after:shadow-[0_0_0_3px_rgba(0,0,0,25%)] after:bg-zinc-400 after:size-2.5 after:-translate-2/4 after:top-2/4 before:w-5 before:h-px before:bg-gray-400 before:-left-5 before:absolute", isCurrentlySelected 
            ? "bg-pink-100 text-pink-500 border-pink-400 before:bg-pink-400 after:bg-pink-400 after:shadow-[0_0_0_3px_rgba(246,51,154,25%)] font-semibold" 
            : isLinked
              ? "bg-blue-100 text-blue-500 border-blue-400 before:bg-blue-400 after:bg-blue-400 after:shadow-[0_0_0_3px_rgba(59,130,246,25%)] font-semibold"
              : "")}
        >
          {node.name}
        </Button>
        <Button
          variant={isLinked ? "secondary" : "default"}
          size="sm"
          onClick={() => !isLinked && onSelect(node)}
          disabled={isLinked}
          className={cn(isCurrentlySelected ? "bg-pink-500" : "")}
        >
          {isLinked ? "Selected" : "Select"}
        </Button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="relative tree-children pl-5 order-3 w-2/4 grow">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedProject={selectedProject}
              linkedProjectId={linkedProjectId}
              setProjects={setProjects}
              allProjects={allProjects}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function FolderTree({ data, onSelect, selectedProject, linkedProjectId, setProjects, allProjects, className }) {
  return (
    <ul className={`relative tree-root [&>li>div>button:first-child:after]:hidden [&>li>div>button:first-child:before]:hidden ${className || ''}`}>
      {data.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          onSelect={onSelect}
          selectedProject={selectedProject}
          linkedProjectId={linkedProjectId}
          setProjects={setProjects}
          allProjects={allProjects}
        />
      ))}
    </ul>
  )
}

// Helper function to recursively filter tree
const filterTree = (nodes, query) => {
  if (!query) return nodes;

  return nodes
    .map((node) => {
      const children = node.children ? filterTree(node.children, query) : [];
      const matches = node.name.toLowerCase().includes(query.toLowerCase());

      if (matches || children.length > 0) {
        return { ...node, children };
      }

      return null;
    })
    .filter(Boolean);
};

const filterTreeByDate = (nodes, date) => {
  if (!date) return nodes;
  return nodes
    .map((node) => {
      const children = node.children ? filterTreeByDate(node.children, date) : [];
      const matches = node.created_at?.startsWith(date);
      if (matches || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(Boolean);
};

export default function ProjectTreeSelector({ 
  onSelect, 
  selectedProject, 
  linkedProjectId, 
  className,
  showSearch = true,
  showDateFilter = false
}) {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    api.get("/projects").then((res) => {
      const treeData = res.data.data
        .filter((proj) => proj.parent_id === null) // only top-level
        .map((proj) => ({
          id: proj.id,
          name: proj.name,
          type: "folder",
          children: [],
          created_at: proj.created_at,
        }))

      setProjects(treeData)
    })
  }, [])

  const handleSelectNode = async (node) => {
    try {
      const res = await api.get(`/projects/${node.id}/sub-projects`)
      const subProjects = res.data.data.map((sub) => ({
        id: sub.id,
        name: sub.name,
        type: "file",
        children: [],
        created_at: sub.created_at,
      }))

      node.children = subProjects
      setProjects([...projects])
    } catch (e) {
      console.error("Failed to load sub-projects", e)
    }

    onSelect(node)
  }

  const filteredProjects = filterTree(projects, search);

  return (
    <div className={className}>
      {showSearch && (
        <div className="mb-4">
          <Label className="text-white mb-1 block">Search Projects</Label>
          <Input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-3 border border-solid border-white/35 bg-white/25 text-white placeholder:text-white"
          />
        </div>
      )}

      {showDateFilter && (
        <div className="mb-4">
          <Label className="text-white mb-1 block">Filter by Date</Label>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full mb-3 border border-solid border-white/35 bg-white/25 text-white"
          />
        </div>
      )}

      <div>
        <Label className="text-white mb-1 block">Projects</Label>
        <div className="border border-solid border-white/35 rounded-lg p-3 max-h-80 overflow-y-auto">
          <FolderTree
            data={filteredProjects}
            onSelect={handleSelectNode}
            selectedProject={selectedProject}
            linkedProjectId={linkedProjectId}
            setProjects={setProjects}
            allProjects={projects}
          />
        </div>
      </div>
    </div>
  )
}