import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import UserProjectCard from "./UserProjectCard";

function UserProjectGrid({
	parentId,
	onEdit,
	onNavigate,
	onDelete,
	refreshKey,
	hasEditProjectPermission,
	isShared = false
}) {
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const fetchProjects = useCallback(async () => {
		try {
			setLoading(true);

			    let response;

    if (isShared) {
      // ✅ Fetch shared projects
      response = await api.get("/projects/shared/get", {
        params: {
          type: "shareWithMe",
          parent_id: parentId ?? "null",
          populate: true,
        },
      });
    } else {
      // ✅ Fetch user’s own projects (normal)
      const endpoint = parentId
        ? `/projects?parent_id=${parentId}`
        : "/projects?parent_id=null";

      response = await api.get(endpoint, { params: { populate: true } });
    }
			setProjects(response.data.data);
			setLoading(false);
		} catch (err) {
			setError(err.response?.data?.message || "Failed to fetch projects");
			setLoading(false);
		}
	}, [parentId]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects, refreshKey]);

	if (loading) {
		return <div className="text-center text-zinc-400">Loading...</div>;
	}

	if (error) {
		return <div className="text-center text-red-500">{error}</div>;
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 2xl:gap-6">
			{projects.map((project) => (
				<UserProjectCard
					key={project.id}
					project={project}
					onEdit={onEdit}
					onNavigate={onNavigate}
					onDelete={onDelete}
					hasEditProjectPermission={hasEditProjectPermission}
				/>
			))}
		</div>
	);
}

export default UserProjectGrid;
