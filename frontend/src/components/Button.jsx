import { cn } from "@/lib/utils";
import React from "react";

export default function Button({
	children,
	loading = false,
	loadingText = "Loading...",
	variant = "primary",
	fullWidth = true,
	size = "medium", // Add size prop with default value
	...props
}) {
	const baseClasses ="font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center";

	const variantClasses = {
		primary:"bg-gradient-to-b from-pink-400 to-blue-700 text-white hover:opacity-90 focus:ring-purple-500 shadow-lg",
		secondary:"bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500",
		outline:"bg-transparent border border-purple-500 text-purple-500 hover:bg-purple-500 hover:bg-opacity-10 focus:ring-purple-500",
		danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
	};

	// Define size classes
	const sizeClasses = {
		small: "py-1.5 px-4 text-sm",
		medium: "py-1.5 2xl:py-2 px-2.5 2xl:px-3.5 text-xs 2xl:text-base cursor-pointer",
		large: "py-4 px-8 text-lg",
	};

	const widthClass = fullWidth ? "w-full" : "";

	// Custom styles for the exact Figma gradient and shadow
	const customStyles =
		variant === "primary"
			? {
					background:
						"linear-gradient(180deg, #D385B8 0%, #445A92 100%)",
					boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
			  }
			: {};

	return (
		<button
			{...props}
			disabled={loading || props.disabled}
			className={cn(baseClasses,variantClasses[variant],sizeClasses[size],widthClass,props.className || "")}
			style={customStyles}
		>
			{loading ? (
				<>
					<span
						className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
						role="status"
					></span>
					{loadingText}
				</>
			) : (
				children
			)}
		</button>
	);
}

// import React from "react";

// export default function Button({
// 	children,
// 	loading,
// 	variant = "primary",
// 	fullWidth = true,
// 	...props
// }) {
// 	const baseClasses =
// 		"py-3 font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

// 	const variantClasses = {
// 		primary:
// 			"bg-gradient-to-b from-pink-400 to-blue-700 text-white hover:opacity-90 focus:ring-purple-500 shadow-lg",
// 		secondary:
// 			"bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500",
// 		outline:
// 			"bg-transparent border border-purple-500 text-purple-500 hover:bg-purple-500 hover:bg-opacity-10 focus:ring-purple-500",
// 	};

// 	const widthClass = fullWidth ? "w-full" : "";

// 	// Custom styles for the exact Figma gradient and shadow
// 	const customStyles =
// 		variant === "primary"
// 			? {
// 					background:
// 						"linear-gradient(180deg, #D385B8 0%, #445A92 100%)",
// 					boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
// 			  }
// 			: {};

// 	return (
// 		<button
// 			{...props}
// 			disabled={loading || props.disabled}
// 			className={`${baseClasses} ${
// 				variantClasses[variant]
// 			} ${widthClass} ${props.className || ""}`}
// 			style={customStyles}
// 		>
// 			{loading ? "Loading..." : children}
// 		</button>
// 	);
// }
