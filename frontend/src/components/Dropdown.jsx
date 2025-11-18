export default function Dropdown({
	label,
	value,
	onChange,
	options = [],
	placeholder = "-- Select --",
	disabled = false,
}) {
	return (
		<div className="space-y-1 w-full">
			{label && <label className="text-sm font-medium text-white">{label}</label>}
			<select
				value={value}
				onChange={onChange}
				disabled={disabled}
				className="w-full bg-[#4E4E4E] bg-opacity-50 rounded-full py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
			>
				<option value="">{placeholder}</option>
				{options.map((opt) => (
					<option key={opt.value} value={opt.value} className="text-sm bg-[#1e1e1e] text-white">
						{opt.label}
					</option>
				))}
			</select>
		</div>
	);
}
