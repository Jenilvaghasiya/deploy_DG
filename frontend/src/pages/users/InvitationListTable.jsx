import { useState } from "react";
import Table from "../../components/Table";
import { resendInvitation, deleteInvitation } from "../../features/invitations/inviteService";
import { useAuthStore } from "../../store/authStore";
import Loader from "../../components/Common/Loader";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import toast from "react-hot-toast";

export default function InvitationListTable({
	data = [],
	loading,
	error,
	onInvitationResent,
}) {
	const [resendingIds, setResendingIds] = useState([]);
	const [deletingIds, setDeletingIds] = useState([]);

	const token = useAuthStore((state) => state.token);

	const handleResendInvitation = async (invitationId) => {
		try {
			setResendingIds((prevIds) => [...prevIds, invitationId]);

			await resendInvitation(token, invitationId);

			if (onInvitationResent) {
				onInvitationResent();
			}
		} catch (error) {
			console.error("Failed to resend invitation:", error);
			alert(error.message || "Failed to resend invitation");
		} finally {
			setResendingIds((prevIds) =>
				prevIds.filter((id) => id !== invitationId)
			);
		}
	};

	const handleDeleteInvitation = async (invitationId) => {
	try {
		setDeletingIds((prev) => [...prev, invitationId]);
		await delete deleteInvitation(token, invitationId);
		toast.success("Invitation deleted successfully!");
		if (onInvitationResent) onInvitationResent(); // reuse refresh callback
	} catch (error) {
		console.error("Failed to delete invitation:", error);
		toast.error(error.message || "Failed to delete invitation");
	} finally {
		setDeletingIds((prev) => prev.filter((id) => id !== invitationId));
	}
	};

	const columns = [
		{
			header: "Email",
			render: (invite) => invite.email,
		},
		{
			header: "Role",
			render: (invite) => invite.role?.name || "-",
		},
		{
			header: "Department",
			render: (invite) => invite.department?.name || "-",
		},
		{
			header: "Status",
			render: (invite) => {
				const status = invite.is_accepted
					? "Accepted"
					: invite.is_declined
					? "Declined"
					: "Pending";

				return (
					<span
						className={`px-2 py-1 rounded-full text-xs ${
							status === "Accepted"
								? "bg-green-100 text-green-800"
								: status === "Declined"
								? "bg-red-100 text-red-800"
								: "bg-yellow-100 text-yellow-800"
						}`}
					>
						{status}
					</span>
				);
			},
		},
		{
			header: "Sent At",
			render: (invite) =>
				new Date(invite.created_at).toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
					year: "numeric",
				}),
		},
		{
			header: "Expired",
			render: (invite) => {
				const isExpired = invite.is_expired;
				const isPending = !invite.is_accepted && !invite.is_declined;

				return (
					<div className="flex items-center gap-2">
						{isExpired ? (
							<span className="text-red-500">Yes</span>
						) : (
							<span className="text-green-500">No</span>
						)}

						{isPending && (
							<button
								className="border border-pink-400 cursor-pointer text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
								onClick={() =>
									handleResendInvitation(invite.id)
								}
								disabled={resendingIds.includes(invite.id)}
							>
								{resendingIds.includes(invite.id)
									? "Resending..."
									: "Resend"}
							</button>
						)}
						<ConfirmDeleteDialog
							message={`Are you sure you want to delete invitation for ${invite.email}?`}
							onDelete={() => handleDeleteInvitation(invite.id)}
						>
							<button
								className="border border-pink-400 cursor-pointer text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white"
								disabled={deletingIds.includes(invite.id)}
							>
								{deletingIds.includes(invite.id) ? "Deleting..." : "Delete"}
							</button>
						</ConfirmDeleteDialog>
					</div>
				);
			},
		},
	];

	if (error) return <p className="text-red-500">{error}</p>;
	// if (loading) return <p>Loading...</p>;
	if (loading) return <Loader />;

	return <Table columns={columns} data={data} />;
}
