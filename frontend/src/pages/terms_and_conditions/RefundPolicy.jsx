import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircleOutline } from "react-icons/io5";

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="p-4 max-w-4xl mx-auto grow flex flex-col justify-start border-shadow-blur rounded-2xl relative overflow-clip dg-footer before:size-56 xl:before:size-64 2xl:before:size-80 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 xl:after:size-64 2xl:after:size-80 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-24 bg-purple-vectore">
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 text-white hover:text-purple-300 flex items-center gap-2 cursor-pointer"
        >
          <IoArrowBackCircleOutline size={28} />
        </button>
        
        <div className="rounded-2xl p-4 md:p-8 relative">
          <h2 className="text-3xl font-bold mb-6 text-white">Cancellation & Refund Policy</h2>
          <p className="mb-6 text-gray-400">Effective Date: 14/10/2025</p>
          <p className="mb-6">At <strong>Design-Genie Solutions Private Limited</strong>, we believe in clear, fair, and transparent billing practices. Our platform operates on a credit-based subscription model, and customers are always in control of their payments.</p>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">• <strong>Free Credits & Billing Activation</strong>:</h2>
            <p className="text-gray-300 ml-4">Users can explore the platform using free credits. No charges are made until all free credits are used or the billing activation date is reached.</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">• <strong>Monthly & Annual Subscriptions</strong>:</h2>
            <p className="text-gray-300 ml-4 mb-3">Users may cancel active subscriptions at any time from their account dashboard.</p>
            <ul className="list-none space-y-2 text-gray-300 ml-8">
              <li><strong>o Monthly Plans:</strong> Refunds, where applicable, are processed on a <strong>pro-rata</strong> basis for unused days in the billing cycle.</li>
              <li><strong>o Annual Plans:</strong> Refunds account for the discounted rate applied to annual billing, and are calculated on a <strong>pro-rata</strong> basis before being issued.</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">• <strong>Refund Processing</strong>:</h2>
            <p className="text-gray-300 ml-4">Approved refunds are issued within <strong>10 working days</strong> of approval, using the same payment method originally used for purchase.</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">• <strong>Non-Refundable Circumstances</strong>:</h2>
            <p className="text-gray-300 ml-4 mb-2">Refunds are not applicable for:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-8">
              <li>Partial use of services after the billing period has elapsed.</li>
              <li>Accounts terminated due to misuse or violation of our Terms.</li>
              <li>Promotional or free-trial periods.</li>
            </ul>
          </div>

          <div className="relative z-1 mt-8 p-4 bg-white/5 backdrop-blur-sm rounded-lg border-l-4 border-purple-500">
            <p className="text-gray-300">If you have any questions about cancellations or refunds, please contact us at <a href="mailto:support@design-genie.ai" className="text-zinc-300 font-semibold">support@design-genie.ai</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}