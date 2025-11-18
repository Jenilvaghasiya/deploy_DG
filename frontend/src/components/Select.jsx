import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Select({
	label,
	value,
	onChange,
	options = [],
	placeholder = "Select an option...",
	multiSelect = false,
}) {
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (!dropdownRef.current?.contains(e.target)) {
				setShowDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (option) => {
		if (multiSelect) {
			const isSelected =
				Array.isArray(value) &&
				value.some((item) => item.id === option.id);

			if (isSelected) {
				// Remove if already selected
				const updated = value.filter((item) => item.id !== option.id);
				onChange(updated);
			} else {
				// Add if not selected
				const updated = Array.isArray(value)
					? [...value, option]
					: [option];
				onChange(updated);
			}
		} else {
			onChange(option);
			setShowDropdown(false);
		}
	};

	const removeItem = (itemToRemove, e) => {
		e.stopPropagation();
		if (Array.isArray(value)) {
			const updated = value.filter((item) => item.id !== itemToRemove.id);
			onChange(updated);
		}
	};

	const getDisplayValue = () => {
		if (multiSelect) {
			return "";
		}

		if (value?.label) {
			return value.label;
		}

		return placeholder;
	};

	// Simple keyboard handler for basic accessibility
	const handleKeyDown = (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setShowDropdown(!showDropdown);
		} else if (e.key === "Escape") {
			setShowDropdown(false);
		}
	};

	return (
		<div className="space-y-1 relative w-full" ref={dropdownRef}>
			{label && (
				<label className="text-sm md:text-base font-medium text-white pl-1">
					{label}
				</label>
			)}
			<div
				onClick={() => setShowDropdown(!showDropdown)}
				onKeyDown={handleKeyDown}
				tabIndex="0"
				className="w-full bg-white/10 border border-solid border-white/35 rounded-full py-3 px-4 text-white flex justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
			>
				<div
					className={`${
						!value ||
						(multiSelect &&
							(!Array.isArray(value) || value.length === 0))
							? "text-gray-200"
							: "text-white"
					}`}
				>
					{multiSelect
						? Array.isArray(value) && value.length > 0
							? `${value.length} selected`
							: placeholder
						: getDisplayValue()}
				</div>
				<svg
					className={`h-5 w-5 transition-transform ${
						showDropdown ? "transform rotate-180" : ""
					}`}
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			</div>
			
			{/* Display selected items for multiselect */}
			{multiSelect && Array.isArray(value) && value.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-2">
					{value.map((item) => (
						<div key={item.id} className="bg-pink-500 bg-opacity-30 text-white rounded-full px-3 py-0.5 text-sm flex items-center gap-1">
							{item.label}
							<button type="button" onClick={(e) => removeItem(item, e)} className="text-xs hover:text-white ml-1">
								<X className="size-3.5" />
							</button>
						</div>
					))}
				</div>
			)}

			{showDropdown && (
				<ul className="absolute z-10 mt-1 w-full bg-[#1e1e1e] border border-gray-700 rounded-lg max-h-52 overflow-y-auto shadow-lg text-sm">
					{options.map((opt) => {
						const isSelected =
							multiSelect &&
							Array.isArray(value) &&
							value.some((item) => item.id === opt.id);

						return (
							<li
								key={opt.id}
								onClick={() => handleSelect(opt)}
								className={`px-4 py-2 hover:bg-gray-700 cursor-pointer flex justify-between items-center ${
									isSelected ? "bg-gray-700" : ""
								}`}
							>
								<span>{opt.label}</span>
								{isSelected && (
									<svg
										className="h-4 w-4 text-purple-500"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

// import { useState, useEffect, useRef } from "react";

// export default function Select({
// 	label,
// 	value,
// 	onChange,
// 	options = [],
// 	placeholder = "Select an option...",
// 	multiSelect = false,
// }) {
// 	const [showDropdown, setShowDropdown] = useState(false);
// 	const dropdownRef = useRef(null);

// 	useEffect(() => {
// 		const handleClickOutside = (e) => {
// 			if (!dropdownRef.current?.contains(e.target)) {
// 				setShowDropdown(false);
// 			}
// 		};
// 		document.addEventListener("mousedown", handleClickOutside);
// 		return () =>
// 			document.removeEventListener("mousedown", handleClickOutside);
// 	}, []);

// 	const handleSelect = (option) => {
// 		if (multiSelect) {
// 			const isSelected =
// 				Array.isArray(value) &&
// 				value.some((item) => item.id === option.id);

// 			if (isSelected) {
// 				// Remove if already selected
// 				const updated = value.filter((item) => item.id !== option.id);
// 				onChange(updated);
// 			} else {
// 				// Add if not selected
// 				const updated = Array.isArray(value)
// 					? [...value, option]
// 					: [option];
// 				onChange(updated);
// 			}
// 		} else {
// 			onChange(option);
// 			setShowDropdown(false);
// 		}
// 	};

// 	const removeItem = (itemToRemove, e) => {
// 		e.stopPropagation();
// 		if (Array.isArray(value)) {
// 			const updated = value.filter((item) => item.id !== itemToRemove.id);
// 			onChange(updated);
// 		}
// 	};

// 	const getDisplayValue = () => {
// 		if (multiSelect) {
// 			return "";
// 		}

// 		if (value?.label) {
// 			return value.label;
// 		}

// 		return placeholder;
// 	};

// 	return (
// 		<div className="space-y-1 relative w-full" ref={dropdownRef}>
// 			{label && (
// 				<label className="text-sm font-medium text-white">
// 					{label}
// 				</label>
// 			)}

// 			{/* Display selected items for multiselect */}
// 			{multiSelect && Array.isArray(value) && value.length > 0 && (
// 				<div className="flex flex-wrap gap-2 mb-2">
// 					{value.map((item) => (
// 						<div
// 							key={item.id}
// 							className="bg-pink-500 bg-opacity-30 text-white rounded-full px-3 py-1 text-sm flex items-center gap-1"
// 						>
// 							{item.label}
// 							<button
// 								type="button"
// 								onClick={(e) => removeItem(item, e)}
// 								className="text-xs hover:text-white ml-1"
// 							>
// 								✕
// 							</button>
// 						</div>
// 					))}
// 				</div>
// 			)}

// 			<div
// 				onClick={() => setShowDropdown(!showDropdown)}
// 				className="w-full bg-[#4E4E4E] bg-opacity-50 rounded-full py-3 px-4 text-white flex justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
// 			>
// 				<div
// 					className={`${
// 						!value ||
// 						(multiSelect &&
// 							(!Array.isArray(value) || value.length === 0))
// 							? "text-gray-400"
// 							: "text-white"
// 					}`}
// 				>
// 					{multiSelect
// 						? Array.isArray(value) && value.length > 0
// 							? `${value.length} selected`
// 							: placeholder
// 						: getDisplayValue()}
// 				</div>
// 				<svg
// 					className={`h-5 w-5 transition-transform ${
// 						showDropdown ? "transform rotate-180" : ""
// 					}`}
// 					xmlns="http://www.w3.org/2000/svg"
// 					viewBox="0 0 20 20"
// 					fill="currentColor"
// 				>
// 					<path
// 						fillRule="evenodd"
// 						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
// 						clipRule="evenodd"
// 					/>
// 				</svg>
// 			</div>

// 			{showDropdown && (
// 				<ul className="absolute z-10 mt-1 w-full bg-[#1e1e1e] border border-gray-700 rounded-lg max-h-52 overflow-y-auto shadow-lg text-sm">
// 					{options.map((opt) => {
// 						const isSelected =
// 							multiSelect &&
// 							Array.isArray(value) &&
// 							value.some((item) => item.id === opt.id);

// 						return (
// 							<li
// 								key={opt.id}
// 								onClick={() => handleSelect(opt)}
// 								className={`px-4 py-2 hover:bg-gray-700 cursor-pointer flex justify-between items-center ${
// 									isSelected ? "bg-gray-700" : ""
// 								}`}
// 							>
// 								<span>{opt.label}</span>
// 								{isSelected && (
// 									<svg
// 										className="h-4 w-4 text-purple-500"
// 										xmlns="http://www.w3.org/2000/svg"
// 										viewBox="0 0 20 20"
// 										fill="currentColor"
// 									>
// 										<path
// 											fillRule="evenodd"
// 											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
// 											clipRule="evenodd"
// 										/>
// 									</svg>
// 								)}
// 							</li>
// 						);
// 					})}
// 				</ul>
// 			)}
// 		</div>
// 	);
// }
