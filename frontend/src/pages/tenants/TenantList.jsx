// src/pages/tenants/TenantList.jsx
import { useEffect, useState } from "react";
import {
	fetchTenants,
	deleteTenant,
} from "../../features/tenants/tenantService";
import Table from "../../components/Table";
import { MdDelete, MdEdit } from "react-icons/md";

export default function TenantList() {
	const [tenants, setTenants] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		loadTenants();
	}, []);

	const loadTenants = async () => {
		try {
			const data = await fetchTenants();
			setTenants(data);
		} catch (err) {
			setError("Failed to fetch tenants");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this tenant?")) return;
		try {
			await deleteTenant(id);
			setTenants((prev) => prev.filter((t) => t.id !== id));
		} catch {
			alert("Failed to delete tenant");
		}
	};

	const columns = [
		{ header: "Name", render: (tenant) => tenant.name },
		{ header: "Industry", render: (tenant) => tenant.industry_type || "-" },
		{
			header: "Subscription Type",
			render: (tenant) => tenant.subscription_frequency || "-",
		},
		{
			header: "Status",
			render: (tenant) => (
				<span
					className={`px-2 py-1 rounded-full text-xs ${
						tenant.is_active ? "bg-green-500" : "bg-red-500"
					}`}
				>
					{tenant.is_active ? "Active" : "Inactive"}
				</span>
			),
		},
		{
			header: "Subscriber Since",
			render: (tenant) => {
				const date = new Date(tenant.created_at);
				return date.toLocaleDateString("en-US", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				});
			},
		},
		{
			header: "Paid Till",

			render: (tenant) => {
				const date = new Date(tenant.created_at);
				const frequency = tenant.subscription_frequency || "monthly";
				date.setMonth(date.getMonth() + 1); // Assuming monthly subscription
				return date.toLocaleDateString("en-US", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				});
			},
		},
		{
			header: "Actions",
			render: (tenant) => (
				<div className="flex items-center gap-2">
					<button className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white text-xs">
						<MdEdit className="text-sm" />
						Edit
					</button>
					<button
						onClick={() => handleDelete(tenant.id)}
						className="bg-transparent border border-pink-400 text-pink-400 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-pink-500 hover:text-white text-xs"
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
			{/* <h1 className="text-2xl font-bold">Tenant Management</h1> */}

			{error && <p className="text-red-400">{error}</p>}
			{loading && <p>Loading...</p>}

			{!loading && tenants.length > 0 && (
				<Table columns={columns} data={tenants} />
			)}

			{!loading && tenants.length === 0 && (
				<p className="text-center text-sm text-gray-500">
					No tenants found.
				</p>
			)}
		</div>
	);
}
