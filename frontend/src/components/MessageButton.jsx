export default function MessageButton({
	children,
	onClick,
	disabled,
	loading,
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			className={`px-4 py-2 rounded-xl text-sm transition font-medium
				${
					disabled || loading
						? "bg-gray-700 text-gray-400 cursor-not-allowed"
						: "bg-pink-600 text-white hover:bg-pink-700"
				}
			`}
		>
			{loading ? "Sending..." : children}
		</button>
	);
}
