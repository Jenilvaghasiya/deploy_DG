import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircleOutline } from "react-icons/io5";

export default function TermsAndConditions({ onNavigateBack}) {
  const navigate = useNavigate();
  const handleBack = () => {
  if (onNavigateBack) {
    onNavigateBack();
  } else {
    navigate(-1); // fallback to browser history back
  }
};

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="p-4 max-w-4xl mx-auto grow flex flex-col justify-start border-shadow-blur rounded-2xl relative overflow-clip dg-footer before:size-56 xl:before:size-64 2xl:before:size-80 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 xl:after:size-64 2xl:after:size-80 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-24 bg-purple-vectore">
        <button 
          onClick={handleBack}
          className="mt-4 text-white hover:text-purple-300 flex items-center gap-2 cursor-pointer"
        >
          <IoArrowBackCircleOutline size={28} />
        </button>
        
        <div className="rounded-2xl p-4 md:p-8 relative">
          <h2 className="text-3xl font-bold mb-6 text-white">Terms and Conditions</h2>
          <p className="mb-6 text-gray-400">Effective Date: 14/10/2025</p>
          <p className="mb-6">Welcome to DesignGenie! These Terms and Conditions ("Terms") govern your use of our platform and services. By accessing or using DesignGenie, you agree to these Terms.</p>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">1. Platform Usage</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You must create an account to access our platform fully. You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You agree to provide accurate and current information during registration and update your account details as needed.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">2. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You are solely responsible for all content you upload or generate on the platform.</li>
              <li>You must not upload or generate content that infringes on intellectual property rights or violates laws.</li>
              <li>Unauthorized use, including attempts to disrupt or damage the platform, is strictly prohibited.</li>
              <li>Uploading or generating Not Safe For Work (NSFW) content, including explicit, vulgar, or criminally inciting materials, is strictly prohibited and will result in immediate suspension or termination of your account with no refund.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">3. Intellectual Property Rights</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>DesignGenie retains ownership of all intellectual property rights related to the platform, including technology, software, and platform-generated content.</li>
              <li>User-generated content remains your property, and you grant DesignGenie a limited license to use, display, and store such content according to your consent choices.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">4. Subscription and Payment Terms</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>DesignGenie may offer various subscription plans. Fees, billing cycles, and payment terms are outlined during the subscription process.</li>
              <li>Subscriptions automatically renew unless you cancel before the renewal date.</li>
              <li>All fees are non-refundable unless explicitly stated otherwise.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">5. Cancellation and Refunds</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Free Credits and Billing Activation -</strong> Until all free credits have been consumed or the billing activation period is reached, no charges will be made to your registered payment method.</li>
              <li><strong>Refund Processing Time -</strong> Once billing has been activated, any approved cancellation or refund request will be processed within <strong> up to ten (10) working days</strong> from the date of approval.</li>
              <li><strong>Monthly Subscriptions -</strong> - If a user cancels an active monthly subscription, refunds (where applicable) will be processed on a <strong> pro-rata basis </strong>, calculated according to the number of days of active use within the billing cycle.</li>
              <li><strong>Annual Subscriptions -</strong> In the case of annual subscriptions, any refund will first account for the <b>discount provided</b> for selecting an annual plan compared to equivalent monthly billing. This difference will be <b>deducted on a pro-rata basis</b> from the total refundable amount before issuing the final refund.</li>
              <li><strong>Refund Method -</strong> All approved refunds will be issued using the same payment method originally used for the purchase, unless otherwise required by applicable law or agreed upon in writing.</li>
              <li><strong>Non-Refundable Circumstances -</strong> Refunds will not be granted for:
                <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                  <li>Partial use of services after the billing period has elapsed.</li>
                  <li>Accounts terminated due to violation of these Terms or any misuse of the platform.</li>
                  <li>Promotional or free trial periods.</li>
                </ul>
              </li>
            </ul>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">6. Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>DesignGenie shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the platform.</li>
              <li>Our total liability is limited to the fees paid for the current subscription cycle, prorated for the period remaining at the time of the claim. For example, if you are on a monthly plan and request a refund, we will refund only the remaining days of the current month. Similarly, for annual plans, refunds will be prorated based on the remaining period.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">7. Termination</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>We reserve the right to terminate or suspend your account and access to the platform immediately, without prior notice, for any breach of these Terms.</li>
              <li>Upon termination, your right to use the platform will cease immediately.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">8. Dispute Resolution</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Any disputes arising out of or related to these Terms shall be resolved through good-faith negotiations.</li>
              <li>If a dispute cannot be resolved amicably, it shall be subject to arbitration under applicable laws and arbitration rules.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">9. Amendments</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>We reserve the right to amend these Terms at any time. We will notify you of significant changes via email or through notifications on the platform.</li>
              <li>Your continued use of the platform after changes indicates your acceptance of the new Terms.</li>
            </ul>
          </div>

          <div className="relative z-1 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">10. Governing Law</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>These Terms shall be governed by and construed according to the laws applicable in the jurisdiction where DesignGenie is registered.</li>
            </ul>
          </div>

          <div className="relative z-1 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">11. Contact Us</h2>
            <p className="mb-2 text-gray-300">For questions or concerns regarding these Terms, please contact us at:</p>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg text-gray-300">
              <p className="font-semibold">DESIGN-GENIE SOLUTIONS PRIVATE LIMITED</p>
              <p>No 463 76/1, Tharabanhalli Village,</p>
              <p>Vidyanagara, Bg North,</p>
              <p>Bengaluru, Karnataka,</p>
              <p>India 562157</p>
              <p className="mt-2">
                <strong>E-Mail:</strong>{" "}
                <a
                  href="mailto:support@design-genie.ai"
                  className="text-zinc-300"
                >
                  support@design-genie.ai
                </a>
              </p>
              <p>
                <strong>Tel:</strong>{" "}
                <a href="tel:+918951048993" className="text-zinc-300">
                  +91 89510 48993
                </a>
              </p>
            </div>
          </div>
          <div className="relative z-1 mt-8 p-4 bg-white/5 backdrop-blur-sm rounded-lg border-l-4 border-purple-500">
            <p className="text-gray-300">By continuing to use DesignGenie, you acknowledge that you have read, understood, and agree to be bound by these Terms.</p>
          </div>
        </div>
      </div>
    </div>
  );
}