import { useState } from "react";
import {
	FaCheck,
	FaChevronLeft,
	FaCreditCard,
	FaLock,
	FaPaypal,
	FaCrown,
	FaRocket,
	FaStar,
} from "react-icons/fa";
import Button from "../../components/Button";

export default function BillingSubscription() {
	const [selectedPlan, setSelectedPlan] = useState(null);
	const [paymentMethod, setPaymentMethod] = useState("card");

    const plans = [
        {
            id: "free",
            name: "Free",
            price: "₹0",
            period: "/month",
            description: "Basic features for individuals starting out",
            features: [
                "Lorem ipsum dolor sit amet",
                "Consectetur adipiscing elit",
                "Sed do eiusmod tempor",
                "Incididunt ut labore",
                "Et dolore magna aliqua",
            ],
            icon: <FaStar className="text-yellow-500" />,
            color: "from-gray-700 to-gray-800",
        },
        {
            id: "premium",
            name: "Premium",
            price: "₹1,999",
            period: "/month",
            description: "Advanced features for professionals",
            features: [
                "Ut enim ad minim veniam",
                "Quis nostrud exercitation",
                "Ullamco laboris nisi",
                "Ut aliquip ex ea commodo",
                "Duis aute irure dolor",
                "Reprehenderit in voluptate",
            ],
            icon: <FaCrown className="text-purple-500" />,
            color: "from-[#D385B8] to-[#445A92]",
            popular: true,
        },
        {
            id: "business",
            name: "Business",
            price: "₹4,999",
            period: "/month",
            description: "Ultimate solution for teams and enterprises",
            features: [
                "Velit esse cillum dolore",
                "Eu fugiat nulla pariatur",
                "Excepteur sint occaecat",
                "Cupidatat non proident",
                "Sunt in culpa qui officia",
                "Deserunt mollit anim",
                "Id est laborum",
                "Lorem ipsum dolor sit amet",
            ],
            icon: <FaRocket className="text-blue-500" />,
            color: "from-blue-800 to-blue-900",
        },
    ];

	// Go back to plan selection
	const handleBack = () => {
		setSelectedPlan(null);
	};

	// Custom gradient style to match Button component
	const customGradient = {
		background: "linear-gradient(180deg, #D385B8 0%, #445A92 100%)",
		boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.25)",
	};

	return (
		<div className="bg-black min-h-screen text-white">
			<div className="bg-[#161616] p-6 rounded-xl">
				<h1 className="text-2xl font-bold mb-6 text-center">
					{selectedPlan
						? "Make Payment"
						: "Choose Your Subscription Plan"}
				</h1>

				{selectedPlan ? (
					// Payment Details Screen
					<div className="max-w-3xl mx-auto">
						<button
							onClick={handleBack}
							className="flex items-center text-gray-400 hover:text-white mb-4"
						>
							<FaChevronLeft className="mr-2" />
							Back to plans
						</button>

						<div className="bg-black p-6 rounded-xl mb-8">
							<h2 className="text-xl font-semibold mb-4">
								Payment Details
							</h2>
							<div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
								<div>
									<h3 className="font-medium">
										{
											plans.find(
												(p) => p.id === selectedPlan
											).name
										}{" "}
										Plan
									</h3>
									<p className="text-gray-300 text-sm mt-1">
										Billed monthly
									</p>
								</div>
								<div className="text-right">
									<p className="text-xl font-bold">
										{
											plans.find(
												(p) => p.id === selectedPlan
											).price
										}
									</p>
									<p className="text-gray-300 text-sm">
										per month
									</p>
								</div>
							</div>

							{/* Payment method selector */}
							<div className="mb-8">
								<h3 className="font-medium mb-4">
									Payment Method
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<button
										className={`flex items-center justify-center p-4 rounded-lg ${
											paymentMethod === "card"
												? "bg-gray-800 border border-purple-500"
												: "bg-gray-900 border border-gray-800"
										}`}
										onClick={() => setPaymentMethod("card")}
									>
										<FaCreditCard className="mr-2" />
										<span>Credit Card</span>
									</button>
									<button
										className={`flex items-center justify-center p-4 rounded-lg ${
											paymentMethod === "paypal"
												? "bg-gray-800 border border-purple-500"
												: "bg-gray-900 border border-gray-800"
										}`}
										onClick={() =>
											setPaymentMethod("paypal")
										}
									>
										<FaPaypal className="mr-2" />
										<span>PayPal</span>
									</button>
								</div>
							</div>

							{paymentMethod === "card" && (
								<div className="space-y-4">
									<div>
										<label className="block text-gray-300 text-sm mb-2">
											Card Number
										</label>
										<div className="relative">
											<input
												type="text"
												className="w-full bg-[#222] border border-gray-800 rounded-lg p-3 text-white"
												placeholder="1234 5678 9012 3456"
											/>
											<FaLock className="absolute right-3 top-3.5 text-gray-500" />
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-gray-300 text-sm mb-2">
												Expiry Date
											</label>
											<input
												type="text"
												className="w-full bg-[#222] border border-gray-800 rounded-lg p-3 text-white"
												placeholder="MM/YY"
											/>
										</div>
										<div>
											<label className="block text-gray-300 text-sm mb-2">
												CVC
											</label>
											<input
												type="text"
												className="w-full bg-[#222] border border-gray-800 rounded-lg p-3 text-white"
												placeholder="123"
											/>
										</div>
									</div>

									<div>
										<label className="block text-gray-300 text-sm mb-2">
											Name on Card
										</label>
										<input
											type="text"
											className="w-full bg-[#222] border border-gray-800 rounded-lg p-3 text-white"
											placeholder="John Doe"
										/>
									</div>
								</div>
							)}

							{paymentMethod === "paypal" && (
								<div className="text-center p-8">
									<FaPaypal className="text-5xl mx-auto mb-4 text-blue-500" />
									<p className="text-gray-400">
										You'll be redirected to PayPal to
										complete your payment.
									</p>
								</div>
							)}

							<div className="mt-8 text-center">
								{/* Using your custom Button component */}
								<Button variant="primary" size="medium" fullWidth={false}>
									Complete Payment
								</Button>
								<p className="text-gray-500 text-xs text-center mt-4">
									Your subscription will begin immediately
									after payment.
								</p>
							</div>
						</div>
					</div>
				) : (
					// Plan Selection Screen
					<div>
						{/* <p className="text-gray-400 mb-12 max-w-2xl">
							Choose the plan that best fits your needs. All plans
							include access to our core features, with additional
							capabilities as you upgrade.
						</p> */}

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{plans.map((plan) => (
								<div
									key={plan.id}
									className={`bg-gradient-to-b ${plan.color} rounded-xl p-1`}
								>
									<div className="bg-black rounded-lg p-6 h-full flex flex-col relative">
										{plan.popular && (
											<div className="absolute -top-3 -right-3">
												<span
													className="px-3 py-1 rounded-full text-xs text-white"
													style={customGradient}
												>
													Popular
												</span>
											</div>
										)}

										<div className="flex items-center mb-4">
											<div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#222] mr-3">
												{plan.icon}
											</div>
											<h3 className="text-xl font-bold">
												{plan.name}
											</h3>
										</div>

										<div className="mb-4">
											<span className="text-3xl font-bold">
												{plan.price}
											</span>
											<span className="text-gray-400">
												{plan.period}
											</span>
										</div>

										<p className="text-gray-300 text-sm mb-6">
											{plan.description}
										</p>

										<div className="flex-grow">
											<ul className="space-y-3 mb-6">
												{plan.features.map(
													(feature, index) => (
														<li
															key={index}
															className="flex items-start"
														>
															<FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
															<span className="text-gray-300 text-sm">
																{feature}
															</span>
														</li>
													)
												)}
											</ul>
										</div>

										{plan.id === "free" ? (
											<button
												onClick={() =>
													setSelectedPlan(plan.id)
												}
												className="w-full py-3 px-6 rounded-full bg-gray-800 hover:bg-gray-700 transition-all font-medium"
											>
												Continue with Free
											</button>
										) : (
											<button
												onClick={() =>
													setSelectedPlan(plan.id)
												}
												className="w-full py-3 px-6 rounded-full font-medium text-white"
												style={customGradient}
											>
												Select Plan
											</button>
										)}
									</div>
								</div>
							))}
						</div>

						<div className="mt-6 bg-black p-6 rounded-xl border border-gray-800">
							<h3 className="text-lg font-medium mb-4">
								Current Subscription
							</h3>
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">Free Plan</p>
									<p className="text-gray-300 text-sm">
										Renews on May 30, 2025
									</p>
								</div>
								<span className="px-3 py-1 bg-gray-800 text-xs rounded-full">
									Active
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
