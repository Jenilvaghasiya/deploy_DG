import { useState, useEffect } from "react";
import {
	fetchProjects,
	createProject,
	deleteProject,
} from "../../features/projects/projectService";
import InputField from "../../components/InputField";
import Button from "../../components/Button";
import Table from "../../components/Table";
import UserAssignment from "./UserAssignment";
import { MdDelete, MdPeople } from "react-icons/md";

export default function ProjectList() {
	const [loading, setLoading] = useState(false);
	const [projects, setProjects] = useState([]);
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [assignProject, setAssignProject] = useState(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [projectToDelete, setProjectToDelete] = useState(null);

	const [form, setForm] = useState({
		name: "",
		description: "",
		start_date: "",
		end_date: "",
	});

	useEffect(() => {
		loadProjects();
	}, []);

	const loadProjects = async () => {
		try {
			setLoading(true);
			const data = await fetchProjects();
			setProjects(data);
		} catch (err) {
			setError(err.message || "Error loading projects");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e) => {
		setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		try {
			const newProject = await createProject(form);
			setProjects((prev) => [...prev, newProject]);
			setForm({
				name: "",
				description: "",
				start_date: "",
				end_date: "",
			});
			await loadProjects();
			setShowForm(false);
		} catch (err) {
			setError(err.message || "Failed to create project");
		}
	};

	const handleDeleteRequest = (project) => {
		setProjectToDelete(project);
		setShowDeleteConfirm(true);
	};

	const handleDeleteConfirm = async () => {
		if (!projectToDelete) return;

		try {
			await deleteProject(projectToDelete.id);
			// setProjects((prev) =>
			// 	prev.filter((p) => p.id !== projectToDelete.id)
			// );
			await loadProjects();
			setShowDeleteConfirm(false);
			setProjectToDelete(null);
		} catch {
			alert("Failed to delete project");
		}
	};

	const refreshSingleProject = async (projectId) => {
		const updatedList = await fetchProjects();
		const updated = updatedList.find((p) => p.id === projectId);
		setAssignProject(updated);
		setProjects(updatedList);
	};

	const columns = [
		{ header: "Name", render: (p) => p.name },
		{ header: "Description", render: (p) => p.description || "-" },
		{
			header: "Start",
			render: (p) =>
				p.start_date
					? new Date(p.start_date).toLocaleDateString()
					: "-",
		},
		{
			header: "End",
			render: (p) =>
				p.end_date ? new Date(p.end_date).toLocaleDateString() : "-",
		},
		{
			header: "Actions",
			render: (p) => (
				<div className="flex gap-2 text-xs">
					<button
						onClick={() => setAssignProject(p)}
						className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
					>
						<MdPeople className="text-sm" />
						Assign Users
					</button>
					<button
						onClick={() => handleDeleteRequest(p)}
						className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
					>
						<MdDelete className="text-sm" />
						Delete
					</button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex justify-end items-center">
				<Button
					onClick={() => setShowForm(!showForm)}
					size="small"
					fullWidth={false}
				>
					{showForm ? "- View List" : "+ Add Project"}
				</Button>
			</div>

			{showForm && (
				<div className="bg-[#1e1e1e] border border-gray-800 p-6 rounded-2xl shadow w-full space-y-5">
					<div className="max-w-lg">
						<h2 className="text-lg font-semibold text-white">
							Create Project
						</h2>
						<form onSubmit={handleSubmit} className="space-y-4">
							<InputField
								label="Project Name"
								name="name"
								value={form.name}
								onChange={handleChange}
							/>
							<InputField
								label="Description"
								name="description"
								value={form.description}
								onChange={handleChange}
							/>
							<InputField
								type="date"
								label="Start Date"
								name="start_date"
								value={form.start_date}
								onChange={handleChange}
							/>
							<InputField
								type="date"
								label="End Date"
								name="end_date"
								value={form.end_date}
								onChange={handleChange}
							/>
							{error && (
								<p className="text-red-400 text-sm">{error}</p>
							)}
							<div className="flex justify-center gap-3">
								<Button type="submit" fullWidth={true}>
									Save
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{projects.length === 0 && !loading && (
				<p className="text-gray-300 text-sm">No projects yet.</p>
			)}

			{!showForm && projects.length > 0 && (
				<Table columns={columns} data={projects} />
			)}

			{assignProject && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
					<div className="bg-[#1e1e1e] border border-gray-700 p-6 rounded-2xl w-full max-w-lg relative shadow-xl">
						<button
							className="absolute top-2 right-4 text-white text-xl"
							onClick={() => setAssignProject(null)}
						>
							×
						</button>
						<h2 className="text-lg font-semibold mb-4 text-white">
							Assign Users to {assignProject.name}
						</h2>
						<UserAssignment
							project={assignProject}
							onRefresh={() =>
								refreshSingleProject(assignProject.id)
							}
						/>
					</div>
				</div>
			)}

			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
					<div className="bg-zinc-900 p-6 rounded-lg max-w-md w-full">
						<h3 className="text-xl font-semibold mb-4">
							Confirm Deletion
						</h3>
						<p className="mb-6">
							Are you sure you want to delete "
							{projectToDelete?.name}"? This action cannot be
							undone.
						</p>
						<div className="flex justify-end gap-3">
							<Button
								variant="secondary"
								onClick={() => setShowDeleteConfirm(false)}
							>
								Cancel
							</Button>
							<Button
								variant="danger"
								onClick={handleDeleteConfirm}
							>
								Delete
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
