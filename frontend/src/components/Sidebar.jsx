import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
	FaBroadcastTower,
	FaHeart,
	FaImage,
	FaBrush,
	FaPalette,
	FaFlask
} from "react-icons/fa";
import {
	MdDashboard,
	MdGroup,
	MdGroups3,
	MdMessage,
	MdWork,
} from "react-icons/md";
import { GoOrganization } from "react-icons/go";
import { BsFilePost, BsPlusCircleFill } from "react-icons/bs";
import { IoIosCreate } from "react-icons/io";
import { BsFillPostageHeartFill } from "react-icons/bs";
import { RiImageAiFill, RiImageEditFill } from "react-icons/ri";
import { IoCutOutline } from "react-icons/io5";
import logo from "../assets/images/dg-logo.png";
import { useAuthStore } from "../store/authStore";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { FeedbackFormModal } from "./Common/FeedbackFormModal";
import useSocket from "@/hooks/useSocket";
import CombineImage from '../assets/images/combine_image.png';
import ImageVariation from '../assets/images/image_variations_white.png';
import moodboardNew from '../assets/images/moodboard-new.png';
import pencilWriting from '../assets/images/pencil_writing_paper.svg';
import maskIcon from '../assets/images/mask.svg';
import combinedRuler from '../assets/images/ruler_combined.svg';
import paint from '../assets/images/palette-and-paint-brush-svgrepo-com.svg';
import TextToSketch from '../assets/images/ai_image.png';
import { ArrowLeftFromLine, ArrowRightFromLine, Plus, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MdOutlineInbox } from "react-icons/md";
import { RiShareForwardLine } from "react-icons/ri";
import { FaTable } from "react-icons/fa";
import { TbRulerMeasure2 } from "react-icons/tb";
import { useUIStore } from "./store/uiStore";


const allLinks = [
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
		icon: <img src={moodboardNew} alt="moodboard" className="size-5"/>,
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
		icon: <img src={pencilWriting} alt="Text To Sketch" className="size-5"/>,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:text-to-image:create",
	},
	{
		to: "/variation-generation",
		label: "Variations",
		icon: <img src={maskIcon} alt="Image Variations" className="size-5"/>,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:image-variations:create",
	},
	{
		to: "/combine-image",
		label: "Combine Images",
		icon: <BsPlusCircleFill/>,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:combine-images:create",
	},
	{
		to: "/sketch-to-image",
		label: "Sketch To Photo",
		icon: <FaImage />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:sketch-to-image:create",
	},
	{
		to: "/size-chart-image",
		label: "Size Chart",
		icon: <img src={combinedRuler} alt="Image Variations" className="size-5"/>,
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
		to: "/color_analysis",
		label: "Color detection",
		icon: <FaPalette />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:color-detections:view",
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
		to: "/tech-packs",
		label: "Tech Packs",
		icon: <FaTable />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:tech-packs:view",
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
		icon: <img src={paint} alt="Image Editor" className="size-5"/>,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:image-editor:create",
	},
	{
		to: "/image-editor-new",
		label: "Image Editor",
		icon: <RiImageEditFill />,
		roles: ["user", "admin", "admin+user"],
		category: "ai-lab",
		permission: "ai-design-lab:image-editor:create",
	},
	{
		to: "/usage-stats",
		label: "Usage Stats (Classic)",
		icon: <MdDashboard />,
		roles: ["user", "admin", "superadmin", "admin+user"],
		category: "admin",
		permission: "dashboard:view",
	},
	{
		to: "/usage-stats-new",
		label: "Usage Stats (Beta)",
		icon: <FaFlask />,
		roles: ["user", "admin", "superadmin", "admin+user"],
		category: "admin",
		permission: "dashboard:view",
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
];

const Sidebar = ({ userRole, aiSectionDisable, setAISectionDisable }) => {
	const { user } = useAuthStore();
	const socketRef = useSocket(user);
	
	// ✅ Use Zustand store for collapsed state
	const { sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useUIStore();
	
	const permissions = user?.role?.permissions || [];
	const permissionKeys = permissions.map(p => p.key);
	const location = useLocation();

	const sidebarRef = useRef(null);
	const buttonRef = useRef(null);

	// ✅ Handle outside clicks for mobile
	useEffect(() => {
		const handleClickOutside = (event) => {
			// Don't close if clicking the toggle button
			if (buttonRef.current && buttonRef.current.contains(event.target)) {
				return;
			}

			// Only handle outside clicks on mobile when sidebar is open
			if (window.innerWidth < 1200 && !collapsed) {
				if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
					setCollapsed(true);
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [collapsed, setCollapsed]);

	// ✅ Handle window resize
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth <= 1199) {
				setCollapsed(true);
			} else {
				setCollapsed(false);
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [setCollapsed]);

	const hasPermission = (permissionKey) => {
		return permissionKeys.includes(permissionKey);
	};

	const hasSectionViewPermission = (category) => {
		const sectionPermissions = {
			'workspace': 'workspace:view',
			'ai-lab': 'ai-design-lab:view',
			'admin': 'administration:view',
			'social': 'social:view',
			'main': 'dashboard:view'
		};
		
		const requiredPermission = sectionPermissions[category];
		if (!requiredPermission) return true;
			return hasPermission(requiredPermission);
		};

	const filteredLinks = allLinks.filter((link) => {
		if (aiSectionDisable && link.category === "ai-lab") {
			return false;
		}
		
		if (link.permission && link.permission.trim() !== '' && !hasPermission(link.permission)) {
        	return false;
    	}
		
		return true;
	});

	const filteredLinksWithSectionPermission = filteredLinks.filter((link) => {
		const category = link.category || "main";
		return hasSectionViewPermission(category);
	});

	const groupedLinks = filteredLinks.reduce((acc, link) => {
		const category = link.category || "main";
		
		if (!hasSectionViewPermission(category)) {
			return acc;
		}
		
		if (!acc[category]) acc[category] = [];
		acc[category].push(link);
		return acc;
	}, {});

	const categoryLabels = {
		"ai-lab": "AI Design Lab",
		"social": "Social",
		"workspace": "Workspace",
		"admin": "Administration",
		"main": "Main"
	};

	const isActive = (path) => location.pathname === path;

	const renderCollapsedIcons = () => {
		return (
			<TooltipProvider>
				<ul className="flex flex-col items-center gap-4 2xl:gap-5">
					{filteredLinksWithSectionPermission.map((link) => (
						<Tooltip key={link.to}>
							<TooltipTrigger asChild>
								<Link to={link.to} className={cn("size-8 xl:size-10 flex items-center justify-center rounded-lg transition-all duration-200 ease-linear", isActive(link.to) ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10")}>
									<span className="text-base xl:text-xl">{link.icon}</span>
								</Link>
							</TooltipTrigger>
							<TooltipContent side="right">{link.label}</TooltipContent>
						</Tooltip>
					))}
				</ul>
			</TooltipProvider>
		);
	};

	if (Object.keys(groupedLinks).length === 0) {
		return null;
	}

	const feedbackFormPath = ['/image-editor','/size-chart-image','/sketch-to-image','/combine-image','/variation-generation','/text-to-sketch', "color-variations"];
	const showFeedbackForm = feedbackFormPath.includes(location.pathname);

	return (
		<aside 
			ref={sidebarRef}
			className={cn("fixed xl:relative top-0 left-0 h-svh xl:h-[initial] z-30 bg-black xl:bg-white/5 rounded-e-4xl flex flex-col shadow-[6px_0px_6px_0_rgba(255,255,255,0.1),inset_0px_0px_30px_8px_rgba(255,255,255,0.25)] xl:overflow-hidden transition-all duration-200 ease-linear", collapsed ? "w-16 xl:w-20 p-2 xl:translate-x-[initial] -translate-x-full" : "w-64 md:w-72 xl:w-80 2xl:w-80 p-5 2xl:p-7")}
		>
			<div className={cn("flex flex-col h-96 grow", collapsed ? "xl:p-2 pt-3 xl:pt-16" : "p-0")}>
				{/* Logo and Toggle */}
				<div className={cn("w-full flex items-center", collapsed ? "justify-center" : "gap-3 justify-between")}>
					<Link to="/">
						<img src={logo} className={cn("max-w-full h-auto w-3/4 grow transition-all duration-200 ease-linear", collapsed ? "hidden" : "block")} alt="Design Genie Logo" />
					</Link>
					<button 
						ref={buttonRef}
						onClick={(e) => {
							e.stopPropagation();
							setCollapsed(!collapsed);
						}}
						className={cn("relative size-6 flex items-center justify-center p-0 text-white hover:text-gray-300 outline-none cursor-pointer transition-all duration-200 ease-linear", collapsed ? "xl:mx-auto -right-12 xl:right-0" : "mx-0")}
					>
						{!collapsed ? <ArrowLeftFromLine /> : <ArrowRightFromLine />}
					</button>
				</div>

				{/* Navigation */}
				<nav className={`select-none whitespace-nowrap pt-6 2xl:pt-9 overflow-auto overflow-x-hidden h-96 grow pr-2 transition delay-700 duration-300 ease-in-out custom-scroll`}>
					{/* Expanded Navigation */}
					<ul className={collapsed ? "hidden" : "block"}>
						{Object.entries(groupedLinks).map(([category, links]) => (
							<li key={category} className="mb-3 2xl:mb-5">
								{category !== "main" && (
									<>
										<span className="block text-lg xl:text-xl font-medium text-white mb-2">{categoryLabels[category]}</span>
										<ul className="pl-2">
											{links.map((link) => (
												<li key={link.to} className="mb-1 xl:mb-2">
													<Link to={link.to} className={cn("text-white text-base 2xl:text-lg leading-none flex items-center gap-3 w-full p-2 2xl:p-2.5 2xl:px-4 rounded-lg transition-all duration-200 ease-linear", isActive(link.to) ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:bg-white/10" : "hover:bg-white/10")}>
														<span>{link.icon}</span>
														<span>{link.label}</span>
													</Link>
												</li>
											))}
										</ul>
									</>
								)}
								{category === "main" && links.map((link) => (
									<Link key={link.to} to={link.to} className={cn("text-2xl font-medium text-white mb-2 flex items-center gap-3 w-full p-1.5 px-4 rounded-xl transition-all duration-200 ease-linear", isActive(link.to) ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:bg-white/10" : "hover:bg-white/10")}>
										<span>{link.icon}</span>
										<span>{link.label}</span>
									</Link>
								))}
							</li>
						))}
					</ul>
					{!collapsed && <FeedbackFormModal setAISectionDisable={setAISectionDisable}/>}

					{/* Collapsed Navigation */}
					<div className={collapsed ? "block" : "hidden"}>{renderCollapsedIcons()}</div>
				</nav>
			</div>
		</aside>
	);
};

export default Sidebar;