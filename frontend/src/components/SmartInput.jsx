import { useState, useEffect, useRef } from "react";

export default function SmartInput({
	label,
	value,
	onChange,
	options = [],
	placeholder,
	multiSelect = false,
}) {
	const [query, setQuery] = useState("");
	const [showDropdown, setShowDropdown] = useState(false);
	const dropdownRef = useRef(null);

	useEffect(() => {
		if (!multiSelect && typeof value === "object" && value?.label) {
			setQuery(value.label);
		} else if (!multiSelect && typeof value === "string") {
			setQuery(value);
		}
	}, [value, multiSelect]);

	const filteredOptions = options.filter((opt) => {
		const matchesQuery = opt.label
			.toLowerCase()
			.includes(query.toLowerCase());

		if (multiSelect && Array.isArray(value)) {
			return matchesQuery && !value.some((item) => item.id === opt.id);
		}

		return matchesQuery;
	});

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
			const updated = Array.isArray(value)
				? [...value, option]
				: [option];
			onChange(updated);
			setQuery("");
		} else {
			onChange(option);
			setQuery(option.label);
			setShowDropdown(false);
		}
	};

	const removeItem = (itemToRemove) => {
		if (Array.isArray(value)) {
			const updated = value.filter((item) => item.id !== itemToRemove.id);
			onChange(updated);
		}
	};

	return (
		<div className="space-y-1 relative w-full" ref={dropdownRef}>
			{label && (
				<label className="text-sm md:text-base font-medium text-white">
					{label}
				</label>
			)}

			{/* Display selected items for multiselect */}
			{multiSelect && Array.isArray(value) && value.length > 0 && (
				<div className="flex flex-wrap gap-2 mb-2">
					{value.map((item) => (
						<div
							key={item.id}
							className="bg-pink-500 bg-opacity-30 text-white rounded-full px-3 py-1 text-sm flex items-center gap-1"
						>
							{item.label}
							<button
								type="button"
								onClick={() => removeItem(item)}
								className="text-xs hover:text-white ml-1"
							>
								✕
							</button>
						</div>
					))}
				</div>
			)}

			<input
				type="text"
				value={query}
				onChange={(e) => {
					setQuery(e.target.value);
					if (!multiSelect) {
						onChange(e.target.value);
					}
					setShowDropdown(true);
				}}
				onFocus={() => setShowDropdown(true)}
				className="w-full bg-white/10 border border-solid border-white/35 rounded-full py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
				placeholder={placeholder || "Type or select..."}
			/>

			{showDropdown && filteredOptions.length > 0 && (
				<ul className="absolute z-10 mt-1 w-full bg-black/10 border border-white/35 rounded-lg max-h-52 overflow-y-auto shadow-lg text-sm">
					{filteredOptions.map((opt) => (
						<li
							key={opt.id}
							onClick={() => handleSelect(opt)}
							className="px-4 py-2 hover:bg-white hover:text-black cursor-pointer text-white transition-all duration-200 ease-linear"
						>
							{opt.label}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// import { useState, useEffect, useRef } from "react";

// export default function SmartInput({
// 	label,
// 	value,
// 	onChange,
// 	options = [],
// 	placeholder,
// 	multiSelect = false,
// }) {
// 	const [query, setQuery] = useState("");
// 	const [showDropdown, setShowDropdown] = useState(false);
// 	const [selectedItems, setSelectedItems] = useState([]);
// 	const dropdownRef = useRef(null);

// 	// 🔁 Sync incoming value (for single select)
// 	useEffect(() => {
// 		if (!multiSelect && typeof value === "object" && value?.label) {
// 			setQuery(value.label);
// 		} else if (!multiSelect && typeof value === "string") {
// 			setQuery(value);
// 		}
// 	}, [value]);

// 	// 🔁 Sync incoming value (for multi select)
// 	useEffect(() => {
// 		if (multiSelect && Array.isArray(value)) {
// 			setSelectedItems(value);
// 		}
// 	}, [value]);

// 	const filteredOptions = options.filter(
// 		(opt) =>
// 			opt.label.toLowerCase().includes(query.toLowerCase()) &&
// 			!(
// 				multiSelect &&
// 				selectedItems.some((item) => item.value === opt.value)
// 			)
// 	);

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
// 			const updated = [...selectedItems, option];
// 			setSelectedItems(updated);
// 			onChange(updated);
// 			setQuery("");
// 		} else {
// 			onChange(option); // ✅ send full object
// 			setQuery(option.label);
// 			setShowDropdown(false);
// 		}
// 	};

// 	const removeItem = (itemToRemove) => {
// 		const updated = selectedItems.filter(
// 			(item) => item.value !== itemToRemove.value
// 		);
// 		setSelectedItems(updated);
// 		onChange(updated);
// 	};

// 	return (
// 		<div className="space-y-1 relative w-full" ref={dropdownRef}>
// 			{label && (
// 				<label className="text-sm font-medium text-white">
// 					{label}
// 				</label>
// 			)}

// 			{multiSelect && selectedItems.length > 0 && (
// 				<div className="flex flex-wrap gap-2 mb-2">
// 					{selectedItems.map((item) => (
// 						<div
// 							key={item.value}
// 							className="bg-pink-500 bg-opacity-30 text-white rounded-full px-3 py-1 text-sm flex items-center gap-1"
// 						>
// 							{item.label}
// 							<button
// 								type="button"
// 								onClick={() => removeItem(item)}
// 								className="text-xs hover:text-white ml-1"
// 							>
// 								✕
// 							</button>
// 						</div>
// 					))}
// 				</div>
// 			)}

// 			<input
// 				type="text"
// 				value={query}
// 				onChange={(e) => {
// 					setQuery(e.target.value);
// 					if (!multiSelect) {
// 						onChange(e.target.value); // allow free typing fallback
// 					}
// 					setShowDropdown(true);
// 				}}
// 				onFocus={() => setShowDropdown(true)}
// 				className="w-full bg-[#4E4E4E] bg-opacity-50 rounded-full py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
// 				placeholder={placeholder || "Type or select..."}
// 			/>

// 			{showDropdown && filteredOptions.length > 0 && (
// 				<ul className="absolute z-10 mt-1 w-full bg-[#1e1e1e] border border-gray-700 rounded-lg max-h-52 overflow-y-auto shadow-lg text-sm">
// 					{filteredOptions.map((opt, idx) => (
// 						<li
// 							key={idx}
// 							onClick={() => handleSelect(opt)}
// 							className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
// 						>
// 							{opt.label}
// 						</li>
// 					))}
// 				</ul>
// 			)}
// 		</div>
// 	);
// }

// Modified SmartInput to support MultiSelect Tags
// export default function SmartInput({
// 	label,
// 	value,
// 	onChange,
// 	options = [],
// 	placeholder,
// 	multiSelect = false,
// }) {
// 	const [query, setQuery] = useState("");
// 	const [showDropdown, setShowDropdown] = useState(false);
// 	const [selectedItems, setSelectedItems] = useState(
// 		multiSelect ? (Array.isArray(value) ? value : []) : []
// 	);
// 	const dropdownRef = useRef(null);

// 	const filteredOptions = options.filter(
// 		(opt) =>
// 			opt.label.toLowerCase().includes(query.toLowerCase()) &&
// 			!(multiSelect && selectedItems.some((item) => item.id === opt.id))
// 	);

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
// 			const newItems = [...selectedItems, option];
// 			setSelectedItems(newItems);
// 			onChange(newItems);
// 			setQuery("");
// 		} else {
// 			onChange(option.label);
// 			setQuery(option.label);
// 			setShowDropdown(false);
// 		}
// 	};

// 	const removeItem = (itemToRemove) => {
// 		const newItems = selectedItems.filter(
// 			(item) => item.id !== itemToRemove.id
// 		);
// 		setSelectedItems(newItems);
// 		onChange(newItems);
// 	};

// 	return (
// 		<div className="space-y-1 relative w-full" ref={dropdownRef}>
// 			{label && <label className="text-sm font-medium">{label}</label>}

// 			{multiSelect && selectedItems.length > 0 && (
// 				<div className="flex flex-wrap gap-2 mb-2">
// 					{selectedItems.map((item) => (
// 						<div
// 							key={item.id}
// 							className="bg-pink-500 bg-opacity-30 text-white rounded-full px-3 py-1 text-sm flex items-center gap-1"
// 						>
// 							{item.label}
// 							<button
// 								type="button"
// 								onClick={() => removeItem(item)}
// 								className="text-xs hover:text-white ml-1"
// 							>
// 								✕
// 							</button>
// 						</div>
// 					))}
// 				</div>
// 			)}

// 			<input
// 				type="text"
// 				value={query}
// 				onChange={(e) => {
// 					setQuery(e.target.value);
// 					if (!multiSelect) {
// 						onChange(e.target.value);
// 					}
// 					setShowDropdown(true);
// 				}}
// 				onFocus={() => setShowDropdown(true)}
// 				className="w-full bg-[#4E4E4E] bg-opacity-50 rounded-full py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
// 				placeholder={placeholder || "Type or select..."}
// 			/>

// 			{showDropdown && filteredOptions.length > 0 && (
// 				<ul className="absolute z-10 mt-1 w-full bg-[#1e1e1e] border border-gray-700 rounded-lg max-h-52 overflow-y-auto shadow-lg text-sm">
// 					{filteredOptions.map((opt, idx) => (
// 						<li
// 							key={idx}
// 							onClick={() => handleSelect(opt)}
// 							className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
// 						>
// 							{opt.label}
// 						</li>
// 					))}
// 				</ul>
// 			)}
// 		</div>
// 	);
// }

// import { useState, useEffect, useRef } from "react";

// export default function SmartInput({
// 	label,
// 	value,
// 	onChange,
// 	options = [],
// 	placeholder,
// }) {
// 	const [query, setQuery] = useState(value || "");
// 	const [showDropdown, setShowDropdown] = useState(false);
// 	const dropdownRef = useRef(null);

// 	const filteredOptions = options.filter((opt) =>
// 		opt.label.toLowerCase().includes(query.toLowerCase())
// 	);

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
// 		onChange(option.label);
// 		setQuery(option.label);
// 		setShowDropdown(false);
// 	};

// 	return (
// 		<div className="space-y-1 relative w-full" ref={dropdownRef}>
// 			{label && <label className="text-sm font-medium">{label}</label>}
// 			<input
// 				type="text"
// 				value={query}
// 				onChange={(e) => {
// 					setQuery(e.target.value);
// 					onChange(e.target.value);
// 					setShowDropdown(true);
// 				}}
// 				onFocus={() => setShowDropdown(true)}
// 				className="w-full bg-[#4E4E4E] bg-opacity-50 rounded-full py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
// 				placeholder={placeholder || "Type or select..."}
// 			/>

// 			{showDropdown && filteredOptions.length > 0 && (
// 				<ul className="absolute z-10 mt-1 w-full bg-[#1e1e1e] border border-gray-700 rounded-lg max-h-52 overflow-y-auto shadow-lg text-sm">
// 					{filteredOptions.map((opt, idx) => (
// 						<li
// 							key={idx}
// 							onClick={() => handleSelect(opt)}
// 							className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
// 						>
// 							{opt.label}
// 						</li>
// 					))}
// 				</ul>
// 			)}
// 		</div>
// 	);
// }
