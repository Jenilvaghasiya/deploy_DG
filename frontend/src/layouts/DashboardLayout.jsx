import { useAuthStore } from "../store/authStore";
import LogoutButton from "../components/LogoutButton";
import Sidebar from "../components/Sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import {
	FaBrush,
	FaFlask,
	FaPalette,
	FaRegEnvelope,
	FaSearch,
	FaTable,
	FaUserCircle,
} from "react-icons/fa";
import { IoIosCreate, IoMdSettings } from "react-icons/io";
import {
	MdDashboard,
	MdGroup,
	MdGroups3,
	MdMessage,
	MdOutlineInbox,
	MdSubscriptions,
	MdWork,
} from "react-icons/md";
import { GoOrganization } from "react-icons/go";
import { RiImageAiFill, RiShareForwardLine } from "react-icons/ri";
import {
	FaBroadcastTower,
	FaHeart,
	FaImage,
} from "react-icons/fa";
import api from "../api/axios";
import NotificationBell from "../components/Common/HeaderFields/Notification";
// import { FeedbackFormModal } from "@/components/Common/FeedbackFormModal";
import { SimpleFeedbackFormModal } from "@/pages/image_generator/SimpleFeedbackFormModal";
// import useSocket from "@/hooks/useSocket";
import CreditsDisplay from "@/components/Common/CreditsDisplay";
import { Search, User } from "lucide-react";
import Button from "@/components/Button";
import { cn } from "@/lib/utils";
import useOutsideClick from "@/hooks/useOutsideClick";
import { BsFilePost, BsFillPostageHeartFill } from "react-icons/bs";
import { IoCutOutline } from "react-icons/io5";

const allLinks = [
	{
		to: "/usage-stats",
		label: "Usage Stats (Classic)",
		icon: <MdDashboard />,
		roles: ["user", "admin", "superadmin", "admin+user"],
		category: "main",
		permission: "dashboard:view",
	},
			{
		to: "/usage-stats-new",
		label: "Usage Stats (Beta)",
		icon: <FaFlask />,
		roles: ["user", "admin", "superadmin", "admin+user"],
		category: "admin",
		permission: "dashboard:view", // Required permission
	},
	{
		to: "/users",
		label: "User Management",
		icon: <MdGroup />,
		roles: ["admin", "superadmin", "admin+user"],
		category: "admin",
		permission: "administration:user-management:read",
	},
	{
		to: "/community-roles",
		label: "Roles",
		icon: <MdGroups3 />,
		roles: ["admin", "superadmin", "admin+user"],
		category: "admin",
		permission: "administration:role:read",
	},
	{
		to: "/tenants",
		label: "Tenants",
		icon: <GoOrganization />,
		roles: ["superadmin"],
		category: "admin",
		permission: "administration:tenant:read",
	},
	{
		to: "/messages/direct",
		label: "Direct Messages",
		icon: <MdMessage />,
		roles: ["user", "admin", "admin+user"],
		category: "workspace",
		permission: "workspace:direct-messages:view",
	},
	{
		to: "/messages/broadcast",
		label: "Broadcast Messages",
		icon: <FaBroadcastTower />,
		roles: ["user", "admin", "admin+user"],
		category: "workspace",
		permission: "",
	},
	{
		to: "/moodboards",
		label: "Moodboards",
		icon: <FaHeart />,
		roles: ["user", "admin", "admin+user"],
		category: "workspace",
		permission: "workspace:moodboards:read",
	},
	{
		to: "/gallery",
		label: "My Gallery",
		icon: <FaImage />,
		roles: ["user", "admin", "admin+user"],
		category: "workspace",
		permission: "workspace:my-gallery:read",
	},
	{
		to: "/user-projects",
		label: "My Projects",
		icon: <MdWork />,
		roles: ["user", "admin", "admin+user"],
		category: "workspace",
		permission: "workspace:my-projects:read",
	},
		{
		to: "/color_analysis",
		label: "Color detection",
		icon: <FaPalette />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:color-detections:view",
	},
	{
		to: "/shared-with-me",
		label: "Shared with Me",
		icon: <MdOutlineInbox />,
		roles: ["user", "admin", "admin+user"],
		category: "workspace",
		permission: "workspace:my-projects:read",
	},
	{
		to: "/shared-with-others",
		label: "Shared with Others",
		icon: <RiShareForwardLine />,
		roles: ["user", "admin", "admin+user"],
		category: "workspace",
		permission: "workspace:my-projects:read",
	},
	{
		to: "/text-to-sketch",
		label: "Text to Sketch",
		icon: <MdWork />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:text-to-image:create",
	},
	{
		to: "/sketch-to-image",
		label: "Sketch To Photo",//TODO:HIDE-SKETCH-TO-IMAGE
		icon: <FaImage />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:sketch-to-image:create",
	},
	{
		to: "/combine-image",
		label: "Combine Images",
		icon: <FaImage />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:combine-images:create",
	},
	{
		to: "/size-chart-image",
		label: "Size Chart",
		icon: <FaImage />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:ai-size-chart:create",
	},
	{
		to: "/color-variations",
		label: "Color Variations",
		icon: <FaBrush />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:color-variations:create",
	},
	{
		to: "/pattern-cutout",
		label: "Pattern Cutouts",
		icon: <IoCutOutline />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:pattern-cutouts:view",
	},
	{
		to: "/user-setting",
		label: "Setting",
		icon: <IoMdSettings />,
		roles: ["user", "admin", "admin+user"],
		category: "main",
	},
	{
		to: "/subscriptions",
		label: "Setting",
		icon: <MdSubscriptions />,
		roles: ["user", "admin", "admin+user"],
		category: "main",
	},
	{
		to: "/PostForm",
		label: "Post Form",
		icon: <IoIosCreate />,
		roles: ["user", "admin", "admin+user"],
		category: "social",
		permission: "social:post:create",
	},
	{
		to: "/PostList",
		label: "Post List",
		icon: <BsFilePost />,
		roles: ["user", "admin", "admin+user"],
		category: "social",
		permission: "social:post:view",
	},
	{
		to: "/MySubmissions",
		label: "My Submissions",
		icon: <BsFillPostageHeartFill />,
		roles: ["user", "admin", "admin+user"],
		category: "social",
		permission: "social:post:view",
	},
	{
		to: "/image-editor",
		label: "Image Editor Basic",
		icon: <FaImage />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:image-editor:create",
	},
	{
		to: "/image-editor-new",
		label: "Image Editor",
		icon: <FaImage />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:image-editor:create",
	},
	{
		to: "/variation-generation",
		label: "Variations",
		icon: <RiImageAiFill />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:image-variations:create",
	},
	{
		to: "/tech-packs",
		label: "Tech Packs",
		icon: <FaTable />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:tech-packs:view",
	},
	// {
	// 	to: "/announcement",
	// 	label: "Announcement",
	// 	icon: <RiImageAiFill />,
	// 	roles: ["admin"],
	// 	category: "ai-lab",
	// 	permission: "administration:announcement:read",
	// },
];

export default function DashboardLayout() {
	const { user } = useAuthStore();
	const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
	const [aiSectionDisable,setAISectionDisable] = useState(false);

	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchMb, setsearchMb] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const searchTimeout = useRef(null);
	const searchDropRef = useRef(null);

  	useOutsideClick(searchDropRef, () => setsearchMb(false));

	const dropdownRef = useRef(null);
	const location = useLocation();
	const navigate = useNavigate();

	const role = user?.role?.name;

	// Get user permissions - memoized to prevent infinite rerenders
	const {/*  permissions, permissionKeys, */ allowedPaths } = useMemo(() => {
		const userPermissions = user?.role?.permissions || [];
		const keys = userPermissions.map(p => p.key);
		
		// Helper function to check if user has a specific permission
		const hasPermission = (permissionKey) => {
			return keys.includes(permissionKey);
		};

		// Helper function to check if user has section view permission
		const hasSectionViewPermission = (category) => {
			const sectionPermissions = {
				'workspace': 'workspace:view',
				'ai-lab': 'ai-design-lab:view',
				'admin': 'administration:view',
				'social': 'social:view',
				'main': 'dashboard:view'
			};
			
			const requiredPermission = sectionPermissions[category];
			return requiredPermission ? hasPermission(requiredPermission) : true;
		};

		// Filter links based on permissions (same logic as Sidebar)
		// Filter links based on permissions (same logic as Sidebar)
		const filteredLinks = allLinks.filter((link) => {
			// If permission is explicitly set to empty string, no permission is required
			if (link.permission === "") {
				// Still check section view permission
				const category = link.category || "main";
				if (!hasSectionViewPermission(category)) {
					return false;
				}
				return true;
			}
			
			// Check if user has the required permission (only if permission is defined and not empty)
			if (link.permission && !hasPermission(link.permission)) {
				return false;
			}
			if(aiSectionDisable){
				return link.category !== 'ai-lab'
			}
			
			// Check if user has section view permission
			const category = link.category || "main";
			if (!hasSectionViewPermission(category)) {
				return false;
			}
			
			return true;
		});

		const paths = filteredLinks.map((link) => link.to);

		return {
			permissions: userPermissions,
			permissionKeys: keys,
			allowedPaths: paths
		};
	}, [user?.role?.permissions,aiSectionDisable]);

	// console.log("Allowed Paths:", allowedPaths);

	// console.log(credits,'<<<<<<<<<<credits')

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target)
			) {
				setProfileDropdownOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Navigation protection with stable dependencies
	useEffect(() => {
		// Always allow these paths
		// if (location.pathname === "/moodboards" || location.pathname === "/billing-subscription") {
		// 	return;
		// }

		// Check if current path is allowed
		if (!allowedPaths.includes(location.pathname)) {
			// Find a default path to redirect to
			const defaultPath = allowedPaths.includes("/user-projects") 
				? "/user-projects" 
				: allowedPaths.includes("/moodboard")
				? "/moodboard"
				: allowedPaths[0] || "/gallery";
				
			navigate(defaultPath, { replace: true });
		}
	}, [location.pathname, allowedPaths, navigate]);

	useEffect(() => {
		if (searchTerm.trim() === "") {
			setSearchResults([]);
			setSelectedIndex(-1);
			return;
		}

		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current);
		}

		searchTimeout.current = setTimeout(() => {
			runGlobalSearch(searchTerm.trim());
		}, 300);
	}, [searchTerm]);

	const runGlobalSearch = async (term) => {
		try {
			setSearchLoading(true);

			const [projectsRes, moodboardsRes] = await Promise.all([
				api.get("/projects", { params: { search: term } }),
				api.get("/moodboards", { params: { search: term } }),
			]);

			const results = [
				...projectsRes.data.data.map((p) => ({
					type: "Project",
					id: p.id,
					label: p.name,
					path: `/user-projects?project=${p.id}`,
				})),
				...moodboardsRes.data.data.map((m) => ({
					type: "Moodboard",
					id: m.id,
					label: m.name,
					path: `/moodboards?edit=${m.id}`,
				})),
			];

			setSearchResults(results);
		} catch (err) {
			console.error("Search failed", err);
		} finally {
			setSearchLoading(false);
		}
	};

	return (
		<div className="flex flex-row h-[100dvh] bg-black">
			{/* Sidebar Component */}
			<Sidebar userRole={role} setAISectionDisable={setAISectionDisable} aiSectionDisable={aiSectionDisable}/>

			{/* Main Content Area */}
			<div className="w-5/12 grow flex flex-col transition-all duration-200 ease-linear">
				{/* Header */}
				<header className="py-3 bg-black border-b border-gray-800 flex items-center justify-end px-4 md:px-6">
					<div className="w-full md:w-auto flex items-center justify-end space-x-2 xl:space-x-4">
						<SimpleFeedbackFormModal/>
						{/* Search Input */}
						<Button variant="ghost" className="p-1 text-white w-fit sm:hidden focus:outline-none shadow-none focus:ring-0" onClick={() => setsearchMb(!searchMb)}>
							<Search className="size-5" />
						</Button>
						<div ref={searchDropRef} className={cn("absolute top-16 right-1.5 sm:right-0 sm:top-0 z-20 sm:relative",searchMb ? "block" : "hidden sm:block")}>
							<FaSearch className="absolute left-3.5 top-2/4 -translate-y-2/4 text-gray-300 text-sm" />
							<input
								type="text" placeholder="Search"
								className="bg-zinc-900 border border-solid border-zinc-700 rounded-lg lg:rounded-xl py-2 px-4 pl-10 text-sm w-56 lg:w-64 outline-none text-white focus:border-purple-500"
								value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={(e) => {
									if (searchResults.length === 0) return;

									if (e.key === "ArrowDown") {
										e.preventDefault();
										setSelectedIndex(
											(prev) => (prev + 1) % searchResults.length
										);
									}
									if (e.key === "ArrowUp") {
										e.preventDefault();
										setSelectedIndex(
											(prev) =>
												(prev - 1 + searchResults.length) %
												searchResults.length
										);
									}
									if (e.key === "Enter") {
										if (
											selectedIndex >= 0 &&
											searchResults[selectedIndex]
										) {
											navigate(searchResults[selectedIndex].path);
											setSearchTerm("");
											setSearchResults([]);
											setSelectedIndex(-1);
										}
									}
								}}
							/>
							{searchTerm && (
								<div className="absolute top-full mt-2 w-full bg-[#1e1e1e] border border-[#333] rounded-lg shadow z-50 max-h-64 overflow-y-auto">
									{searchLoading && (
										<div className="px-4 py-2 text-sm text-zinc-400">Searching...</div>
									)}

									{!searchLoading && searchResults.length === 0 && (
										<div className="px-4 py-2 text-sm text-zinc-500">No results found.</div>
									)}

									{["Project", "Moodboard"].map((groupType) => {
										const items = searchResults.filter(
											(r) => r.type === groupType
										);
										if (items.length === 0) return null;

										return (
											<div key={groupType}>
												<div className="px-4 py-1 text-xs text-zinc-500 uppercase border-b border-[#333]">{groupType}s</div>
												{items.map((item) => {
													const absoluteIndex =
														searchResults.findIndex(
															(r) => r.id === item.id && r.type === item.type
														);

													const isSelected =
														absoluteIndex === selectedIndex;

													return (
														<div
															key={`${item.type}-${item.id}`}
															onClick={() => {
																navigate(item.path);
																setSearchTerm("");
																setSearchResults([]);
																setSelectedIndex(-1);
															}}
															className={`px-4 py-2 text-sm cursor-pointer ${
																isSelected
																	? "bg-purple-600 text-white"
																	: "text-gray-300 hover:bg-[#333]"
															}`}
														>
															{item.label}
														</div>
													);
												})}
											</div>
										);
									})}
								</div>
							)}
						</div>

						{/* <button className="p-2 text-gray-400 hover:text-white">
							<FaRegCalendar size={18} />
						</button> */}
						<button 
							className="p-1 md:p-2 text-zinc-200 hover:text-white"
							onClick={() => {
								navigate("/messages/direct");
								setSearchTerm("");
							}}
						>
							<FaRegEnvelope size={18} />
						</button>
						{/* <button className="p-2 text-gray-400 hover:text-white">
							<FaRegBell size={18} />
						</button> */}
						<NotificationBell />
						<CreditsDisplay />
						<div className="relative" ref={dropdownRef}>
						<LogoutButton
							trigger={
							<div className="flex items-center space-x-2 cursor-pointer text-white">
								<span className="hidden md:block text-xs lg:text-sm whitespace-nowrap w-20 overflow-hidden text-ellipsis">
								{user?.full_name || "User"}
								</span>
								<FaUserCircle size={24} className="text-zinc-200" />
							</div>
							}
						/>
						</div>
						{/* <div className="relative" ref={dropdownRef}>
							<div className="flex items-center space-x-2 cursor-pointer text-white" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
								<span className="hidden md:block text-xs lg:text-sm whitespace-nowrap w-20 overflow-hidden text-ellipsis">{user?.full_name || "User"}</span>
								<FaUserCircle size={24} className="text-zinc-200" />
							</div>
							{profileDropdownOpen && (
								<div className="absolute right-0 mt-2 w-48 bg-[#222] rounded-md shadow-lg z-50">
									<Link
										to="/billing-subscription"
										className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#333] hover:text-white"
										onClick={() => setProfileDropdownOpen(false)}
									>
										Billing & Subscription
									</Link>
									<div className="border-t border-[#333] my-1"></div>
									<span className="md:hidden flex items-center gap-3 text-xs text-white lg:text-sm p-3">
										<User className="size-4" />
										{user?.full_name || "User"}
									</span>
									<div className="block px-4 py-2 cursor-pointer md:border-t-0 border-t border-solid border-zinc-700">
										<LogoutButton className="w-full text-left text-sm text-gray-300 hover:text-white cursor-pointer" />
									</div>
								</div>
							)}
						</div> */}
					</div>
				</header>

				{/* Main Content */}
				<main className="grow flex flex-col justify-start border-shadow-blur rounded-2xl m-4 2xl:m-5 relative overflow-clip dg-footer before:size-56 xl:before:size-64 2xl:before:size-80 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 xl:after:size-64 2xl:after:size-80 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-24 bg-purple-vectore">
					<div className="h-24 shrink-0 grow flex flex-col overflow-y-auto relative z-10 dg-custom-scroll">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}