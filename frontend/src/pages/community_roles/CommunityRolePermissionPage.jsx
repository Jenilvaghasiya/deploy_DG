import { useNavigate } from "react-router-dom";
import CommunityRolePermissionEditor from "./CommunityRolePermissionEditor";

export default function CommunityRolePermissionPage() {
	const navigate = useNavigate();

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">
					Community Role Permissions
				</h1>
				<button
					onClick={() => navigate("/community-roles")}
					className="text-sm text-gray-400 underline"
				>
					← Back to Community Roles
				</button>
			</div>

			<CommunityRolePermissionEditor
				role={{ id: "demo-role-id", name: "Editor" }}
				onClose={() => navigate("/community-roles")}
			/>
		</div>
	);
}
