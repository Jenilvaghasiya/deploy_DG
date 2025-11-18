import { useParams, useNavigate } from "react-router-dom";
import PermissionEditor from "./PermissionEditor";

export default function RolePermissionsPage() {
	const { id } = useParams();
	const navigate = useNavigate();

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Role Permissions</h1>
				<button
					onClick={() => navigate("/roles")}
					className="text-sm text-gray-400 underline"
				>
					← Back to Roles
				</button>
			</div>

			<PermissionEditor
				role={{ id }}
				onClose={() => navigate("/roles")}
			/>
		</div>
	);
}
