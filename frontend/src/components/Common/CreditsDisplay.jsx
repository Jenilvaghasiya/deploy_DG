import { useEffect, useRef, useState } from "react";

// import { toast } from "react-hot-toast";
import { FaCoins } from "react-icons/fa"; // FontAwesome coin icon
import clsx from "clsx";
import { useAuthStore } from "@/store/authStore";

export default function CreditsDisplay() {
	const { credits } = useAuthStore();
	const [animate, setAnimate] = useState(false);
	const prevCredits = useRef(credits?.credits ?? 0);

	useEffect(() => {
		const currentCredits = credits?.credits ?? 0;

		if (currentCredits < prevCredits.current) {
			const deducted = prevCredits.current - currentCredits;

			// Animation trigger
			setAnimate(true);
			setTimeout(() => setAnimate(false), 600);

			// Toast message
			// toast.success(`${deducted} credit${deducted > 1 ? "s" : ""} deducted`);
		}

		prevCredits.current = currentCredits;
	}, [credits]);

	return (
		<div
			className={clsx(
				"flex items-center gap-2 p-1 md:p-2 rounded-md text-yellow-500 text-sm lg:text-base font-medium transition-transform duration-300",
				animate ? "scale-110 bg-yellow-100 shadow-md" : ""
			)}
		>
			<FaCoins className="text-lg lg:text-xl" />
			<span>{credits?.credits ?? 0}</span>
		</div>
	);
}
