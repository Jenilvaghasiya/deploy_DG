import { useEffect, useRef, useState } from "react";

export default function MessageInput({ onSend, loading }) {
	const [value, setValue] = useState("");
	const textareaRef = useRef(null);

	useEffect(() => {
		// Auto-resize textarea
		if (textareaRef.current) {
			textareaRef.current.style.height = "0px";
			const scrollHeight = textareaRef.current.scrollHeight;
			textareaRef.current.style.height =
				Math.min(scrollHeight, 100) + "px";
		}
	}, [value]);

	const handleSend = () => {
		if (!value.trim() || loading) return;
		onSend(value.trim());
		setValue("");
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
		<div className="p-3 border-t border-gray-800 bg-white flex-shrink-0">
			<div className="flex items-end gap-2 w-full">
				<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					rows={1}
					placeholder="Write a message..."
					className="flex-1 h-9 max-h-[100px] resize-none rounded-md py-1.5 px-3 text-sm text-black placeholder-gray-500 outline-none focus:outline-none focus:ring-1 focus:ring-pink-500 transition"
				/>

				<button
					onClick={handleSend}
					disabled={!value.trim() || loading}
					className={`px-3 py-1.5 rounded-md text-sm transition font-medium flex-shrink-0 ${
						!value.trim() || loading
							? "bg-gray-300 text-gray-800 cursor-not-allowed"
							: "bg-pink-600 text-white hover:bg-pink-600 cursor-pointer"
					}`}
				>
					{loading ? "..." : "Send"}
				</button>
			</div>
		</div>
	);
}
