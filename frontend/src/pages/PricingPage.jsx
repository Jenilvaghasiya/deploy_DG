import { useEffect, useState } from "react";
import { fetchStrapiContent } from '../utils/axiosUtils';
import { login } from "../features/auth/authService";

export default function PricingPage() {
const [pricingData, setPricingData] = useState(null);

useEffect(() => {
	const fetchData = async () => {
		try {
			const res = await fetchStrapiContent("pricing?populate[Plan][populate]=feature");
            console.log(res);

			if (res) {
				setPricingData({
					description: res.description,
					plans: res.Plan?.map(plan => ({
						name: plan.title,
						price: plan.price,
						description: "", // optional, Strapi doesn't return it per plan
						features: plan.feature?.filter(f => f?.feature).map(f => f.feature) || [],
						cta: plan.title === "Free" ? "Start Free" : "Get Started",
					})) || [],
					currentSubscription: res.currentSubscription || null,
				});
			}
		} catch (err) {
			console.error("Error loading pricing data", err);
		}
	};
	fetchData();
}, []);
    if (!pricingData) {
        return <div className="text-white text-center pt-32">Loading...</div>;
    }
	const plans = [
		{
			name: "Free",
			price: "₹0",
			description: "Perfect for trying out Genie features.",
			features: ["3 moodboards", "Basic image variations", "Limited storage"],
			cta: "Get Started",
		},
		{
			name: "Pro",
			price: "₹499/mo",
			description: "For serious creators and small teams.",
			features: ["Unlimited moodboards", "HD image variations", "Priority support"],
			cta: "Upgrade Now",
		},
		{
			name: "Enterprise",
			price: "Custom",
			description: "Custom features for large businesses.",
			features: ["Team collaboration", "Custom AI models", "Dedicated manager"],
			cta: "Contact Us",
		},
	];

	return (
		<div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
			<div className='overflow-auto flex flex-col h-96 grow relative z-10'>
				 <div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
					<div className="container px-4 mx-auto text-center">
						<h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">Pricing Plans</h1>
						<p className="text-base text-white max-w-4xl w-full mx-auto">Welcome to Genie App — your one-stop platform for AI-powered creativity. We empower users to create, transform, and manage digital content effortlessly using the latest in artificial intelligence.</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{pricingData?.plans?.map((plan, index) => (
						<div key={index} className="border-shadow-blur p-6 rounded-2xl shadow-lg border border-white/30 hover:scale-105 transition-transform duration-300">
							<h3 className="text-2xl font-semibold mb-2 text-center">{plan.name}</h3>
							<p className="text-3xl font-bold text-center text-purple-400 mb-4">{plan.price}</p>
							<p className="text-center text-gray-300 mb-6">{plan.description}</p>
							<ul className="text-gray-400 mb-6 space-y-2 list-disc list-inside">
								{plan.features.map((feature, i) => (
									<li key={i}>{feature}</li>
								))}
							</ul>
							<button className="w-full bg-purple-600 text-white py-2 rounded-full hover:bg-purple-700 transition">{plan.cta}</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
