import { useEffect, useState } from "react";
import { fetchStrapiContent } from '../utils/axiosUtils';

export default function FAQPage() {
	const [faqs, setFaqs] = useState([]);
	const [openIndex, setOpenIndex] = useState(null);

	const toggle = (index) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	useEffect(() => {
		const fetchFaqs = async () => {
			try {
				const data = await fetchStrapiContent("faqs"); // 🔁 Replace 'faqs' with your endpoint slug
				if (data) {
					// Optional: handle Strapi v4 structure
					const formatted = data.map((item) => ({
						question: item?.question || "",
						answer: item?.answer || "",
					}));
					setFaqs(formatted);
				}
			} catch (error) {
				console.error("Failed to load FAQs:", error);
			}
		};

		fetchFaqs();
	}, []);
	return (
		<div className="pt-32 pb-8 min-h-screen bg-black text-white px-4 flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
			<div className="container mx-auto p-6 border-shadow-blur h-96 grow rounded-2xl relative z-10 flex flex-col border border-solid border-white/30">
				<h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
				<div className="space-y-4 h-96 grow overflow-auto custom-scroll">
					<div className="max-w-3xl mx-auto space-y-4 w-full">
						{faqs.length === 0 ? (
							<p className="text-center text-gray-400">No FAQs available.</p>
						) : (
							faqs.map((faq, index) => (
								<div key={index} className="border border-white/30 bg-white/5 rounded-xl overflow-hidden">
									<button
										onClick={() => toggle(index)}
										className="w-full text-left px-6 py-4 flex justify-between items-center transition-all"
									>
										<span>{faq.question}</span>
										<span>{openIndex === index ? "−" : "+"}</span>
									</button>
									{openIndex === index && (
										<>
											<span className="w-full h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent block"></span>
											<div className="px-6 py-4 text-sm text-gray-200">
												{faq.answer}
											</div>
										</>
									)}
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
