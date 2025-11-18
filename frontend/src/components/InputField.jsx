import { cn } from "@/lib/utils";
import { useState } from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";

export default function InputField({
	label,
	error,
	icon,
	type = "text",
	placeholder,
	inputstyle = null,
	...props	
}) {
	const [showPassword, setShowPassword] = useState(false);

	const isPassword = type === "password";
	const inputType = isPassword ? (showPassword ? "text" : "password") : type;

	return (
		<div className="flex flex-col space-y-1">
			{label && <label className="text-sm font-medium text-white pl-1">{label}</label>}
			<div className="relative">
				<input
					type={inputType}
					className={cn("w-full bg-white/10 border border-solid border-white/35 rounded-full py-1.5 2x:py-3 px-4 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500",icon ? "pl-10" : "pl-4",error ? "border border-red-500" : "", inputstyle ?? inputstyle)}
					placeholder={placeholder}
					{...props}
				/>

				{/* Optional icon on the left */}
				{icon && (
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						{icon}
					</div>
				)}

				{/* Password toggle on the right */}
				{isPassword && (
					<div
						onClick={() => setShowPassword((prev) => !prev)}
						className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-white"
					>
						{showPassword ? (
							<IoMdEye className="size-5" />
						) : (
							<IoMdEyeOff className="size-5" />
						)}
					</div>
				)}
			</div>

			{error && <p className="text-sm text-red-400">{error}</p>}
		</div>
	);
}
