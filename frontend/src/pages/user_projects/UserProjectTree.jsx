import { useState, useEffect } from "react";
import {
	FiChevronRight,
	FiChevronDown,
	FiFolder,
	FiFolderPlus,
} from "react-icons/fi";
import api from "../../api/axios";
import {Button} from "../../components/ui/button";
import SmartImage from "@/components/SmartImage";
const BASE_API_URL = import.meta.env.VITE_API_URL;

function UserProjectTree({ onSelectProject, selectedProjectId, hasCreateProjectPermission, refreshKey, isSharedWithMe = false, isSharedWithOthers=false,searchTerm,dateRange}) {
	const [projects, setProjects] = useState([]);
	const [expandedNodes, setExpandedNodes] = useState({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchAllProjects = async () => {
			try {
				setLoading(true);
				 let response;

				// Check if shared filter is applied
				if (isSharedWithMe) {
					response = await api.get("/projects/shared/get", {
					params: {
						type: "shareWithMe",
						populate: true,
					},
					});
				} else if (isSharedWithOthers) {
					response = await api.get("/projects/shared/get", {
					params: {
						type: "shareWithOthers",
						populate: true,
					},
					});
				} else {
				// Default: fetch all projects
				response = await api.get("/projects", {
					params: {
					populate: true,
					search: searchTerm,
					startDate: dateRange?.startDate || null,
					endDate: dateRange?.endDate || null,
					},
				});
				}
				const projectMap = {};
				const rootProjects = [];

				response.data.data.forEach((project) => {
					projectMap[project.id] = {
						...project,
						children: [],
					};
				});

				response.data.data.forEach((project) => {
					let parentId = null;

					if (project.parent_id) {
						parentId =
							typeof project.parent_id === "object"
								? project.parent_id.id
								: project.parent_id;
					} else if (project.parent) {
						parentId =
							typeof project.parent === "object"
								? project.parent.id
								: project.parent;
					}

					if (parentId && projectMap[parentId]) {
						projectMap[parentId].children.push(
							projectMap[project.id]
						);
					} else {
						rootProjects.push(projectMap[project.id]);
					}
				});

				setProjects(rootProjects);
				setLoading(false);

				if (selectedProjectId) {
					expandPathToProject(selectedProjectId, projectMap);
				}
			} catch (err) {
				setError(
					err.response?.data?.message || "Failed to fetch projects"
				);
				setLoading(false);
			}
		};

		fetchAllProjects();
	}, [selectedProjectId,refreshKey,searchTerm,dateRange]);

	const expandPathToProject = (projectId, projectMap) => {
		const findPathToProject = (id, currentPath = []) => {
			const project = projectMap[id];
			if (!project) return null;

			const newPath = [...currentPath, id];

			if (!project.parent_id) return newPath;

			const parentId =
				typeof project.parent_id === "object"
					? project.parent_id.id
					: project.parent_id;
			return findPathToProject(parentId, newPath);
		};

		const path = findPathToProject(projectId);
		if (path) {
			const newExpandedNodes = { ...expandedNodes };
			path.forEach((id) => {
				newExpandedNodes[id] = true;
			});
			setExpandedNodes(newExpandedNodes);
		}
	};

	const toggleExpand = (e, projectId) => {
		e.stopPropagation(); // Prevent clicking the expand button from also selecting the project
		setExpandedNodes((prev) => ({
			...prev,
			[projectId]: !prev[projectId],
		}));
	};

	const renderProjectNode = (project, level = 0) => {
		const isExpanded = expandedNodes[project.id];
		const hasChildren = project.children && project.children.length > 0;

		return (
			<div key={project.id} className="project-tree-node px-1">
				<div
					className={`flex items-center py-1.5 px-2 text-sm rounded-md cursor-pointer ${
						selectedProjectId === project.id
							? "bg-zinc-800"
							: "hover:bg-zinc-900"
					}`}
					style={{ paddingLeft: `${level * 12 + 4}px` }}
					onClick={() => onSelectProject(project)}
				>
					{hasChildren ? (
						<button
							onClick={(e) => toggleExpand(e, project.id)}
							className="mr-1 text-zinc-400 hover:text-zinc-200"
						>
							{isExpanded ? (
								<FiChevronDown size={14} />
							) : (
								<FiChevronRight size={14} />
							)}
						</button>
					) : (
						<span className="mr-1 w-3.5" />
					)}

					{/* <FiFolder className="mr-1 text-blue-400" size={14} />
					<span className="truncate">
						{project.name || project.title}
					</span> */}
					{project.images?.[0]?.url ? (
						<SmartImage
							// src={`${
							// 	project.images[0].url
							// }`}
							src={
								project.images[0].status === "saved"
									? `${BASE_API_URL}/genie-image/${project.images[0].url}`
									: project.images[0].url
							}
							alt="Thumbnail"
							className="w-8 h-8 mr-2 rounded object-cover border border-zinc-700"
						/>
					) : (
						<FiFolder className="mr-2 text-blue-400" size={16} />
					)}
					<span
						className="truncate"
						title={project.name || project.title}
					>
						{project.name || project.title}
					</span>
				</div>

				{isExpanded && hasChildren && (
					<div>
						{project.children.map((child) =>
							renderProjectNode(child, level + 1)
						)}
					</div>
				)}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="p-3 text-zinc-400 text-sm">Loading projects...</div>
		);
	}

	if (error) {
		return <div className="p-3 text-red-500 text-sm">{error}</div>;
	}

	return (
		<div className="border border-solid shadow-sm !bg-white/10 border-white/35 rounded-xl border-shadow-blurs overflow-hidden">
			<div className="p-3 border-b border-solid border-white/35 flex justify-between items-center">
				<h3 className="font-semibold text-lg leading-none">Projects</h3>
				{hasCreateProjectPermission && !isSharedWithMe && !isSharedWithOthers && <Button
					className="cursor-pointer"
					variant={'dg_btn'}
					fullWidth={false}
					onClick={() =>
						onSelectProject({ id: null, name: "New Project" })
					}
				>
					New
				</Button>}
			</div>
			<div className="py-4 max-h-[600px] overflow-y-auto custom-scroll">
				{projects.length > 0 ? (
					projects.map((project) => renderProjectNode(project))
				) : (
					<div className="text-center content-center p-3 text-zinc-500 text-sm min-h-52">No projects found</div>
				)}
			</div>
		</div>
	);
}

export default UserProjectTree;
