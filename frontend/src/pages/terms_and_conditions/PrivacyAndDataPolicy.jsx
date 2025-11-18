import React, { useState } from "react";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function PrivacyAndDataPolicy({ 
  personalizedAI,
  setPersonalizedAI,
  globalAI,
  setGlobalAI,
  isFooterLink = false, 
  onNavigateBack
}) {
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
          <h1 className="text-3xl font-bold mb-6 text-white">
            Privacy Policy
          </h1>

          <p className="mb-6 text-gray-400">Effective Date: 14/10/2025</p>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              1. Introduction
            </h2>
            <p className="text-gray-300">
              Welcome to DesignGenie, a platform dedicated to assisting fashion
              designers and brands in streamlining their workflows through
              AI-powered solutions. We are committed to protecting your personal
              data and ensuring transparency about how we collect, use, and
              share information.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              2. Information We Collect
            </h2>
            <p className="mb-2 text-gray-300">
              We collect the following types of information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                <strong>Platform Generated Content:</strong> Images, size
                specification charts, designs, text, and other files you may
                generate from our platform.
              </li>
              <li>
                <strong>User-Generated Content:</strong> Images, size
                specification charts, design files, and other materials you
                upload.
              </li>
              <li>
                <strong>Personal Information:</strong> Name, email address,
                contact details, and account credentials.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact
                with our platform, including discarded generated images,
                preferences, and feature usage.
              </li>
              <li>
                <strong>Technical Data:</strong> IP address, browser type,
                device information, and cookies.
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              3. How We Use Your Information
            </h2>
            <p className="mb-2 text-gray-300">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Provide and maintain our services.</li>
              <li>
                Develop personalized AI models tailored to your unique style
                (with your consent).
              </li>
              <li>
                Improve our global AI models to enhance the experience for all
                users (only with your explicit consent).
              </li>
              <li>
                Personalize your experience by understanding your design
                preferences and style.
              </li>
              <li>
                Communicate with you about updates, promotions, and other
                relevant information.
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              4. Data Usage Preferences
            </h2>
            <p className="mb-3 text-gray-300">
              Upon signing up, you are presented with the following options
              regarding your data:
            </p>
            <div className="space-y-3">
              <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-purple-600">
                <div className="flex items-start gap-3 mb-2">
                  {!isFooterLink &&
                    <input
                      type="checkbox"
                      id="personalized-ai-policy"
                      checked={personalizedAI}
                      onChange={(e) => setPersonalizedAI(e.target.checked)}
                      className="mt-1 text-purple-500 focus:ring-purple-500 rounded cursor-pointer disabled:opacity-50"
                    />
                  }
                  <label htmlFor="personalized-ai-policy" className="flex-1">
                    <strong className="text-white">
                      Personalized AI Model Data Collection:
                    </strong>
                  </label>
                </div>
                <p className="text-gray-300 ml-7">
                  Enabled by default. We store your uploaded content and
                  interaction data to create personalized AI models for you. You
                  can disable this at any time in your account settings.
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-purple-600">
                <div className="flex items-start gap-3 mb-2">
                  {!isFooterLink &&

                  <input
                    type="checkbox"
                    id="global-ai-policy"
                    checked={globalAI}
                    onChange={(e) => setGlobalAI(e.target.checked)}
                    disabled={isFooterLink}
                    className="mt-1 text-purple-500 focus:ring-purple-500 rounded cursor-pointer disabled:opacity-50"
                  />
}
                  <label htmlFor="global-ai-policy" className="flex-1">
                    <strong className="text-white">
                      Global AI Model Enhancement Data Collection:
                    </strong>
                  </label>
                </div>
                <p className="text-gray-300 ml-7">
                  Disabled by default. With your explicit consent, we use your
                  data to improve our global AI models, benefiting the entire
                  DesignGenie community. You can enable or disable this
                  preference in your account settings.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              5. Data Sharing and Disclosure
            </h2>
            <p className="mb-2 text-gray-300">
              We do not sell your personal data. We may share your information
              with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who
                assist in operating our platform, under strict confidentiality
                agreements.
              </li>
              <li>
                <strong>Legal Obligations:</strong> Authorities or legal
                entities when required by law or to protect our rights.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or asset sale, your data may be transferred, with
                prior notice.
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              6. Data Retention
            </h2>
            <p className="text-gray-300">
              We retain your personal data only as long as necessary to fulfill
              the purposes outlined in this policy unless a longer retention
              period is required by law.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              7. Your Rights
            </h2>
            <p className="mb-2 text-gray-300">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                Access, correct, or delete your personal data, provided such
                data is not essential for legal compliance or the proper
                functioning of the platform.
              </li>
              <li>Object to or restrict certain data processing activities.</li>
              <li>
                Withdraw consent at any time, without affecting the lawfulness
                of prior processing.
              </li>
              <li>Lodge a complaint with a data protection authority.</li>
            </ul>
            <p className="mt-3 text-gray-300">
              To exercise these rights, please contact us at{" "}
              <span className="text-white">support@example.com</span>
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              8. International Data Transfers
            </h2>
            <p className="text-gray-300">
              As a global platform, your data may be transferred to and
              processed in countries outside your own. We ensure appropriate
              safeguards are in place, such as Standard Contractual Clauses, to
              protect your data during such transfers.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              9. Cookies and Tracking Technologies
            </h2>
            <p className="text-gray-300">
              We use cookies and similar technologies to enhance your
              experience, analyze usage, and provide personalized content.
              Certain cookies (e.g., session cookies essential for tracking
              generated content during your session) are necessary for the
              operation of the platform. You must allow these necessary cookies
              to use or continue using the platform effectively. You can manage
              non-essential cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              10. Data Security
            </h2>
            <p className="text-gray-300">
              We implement technical and organizational measures to protect your
              data against unauthorized access, alteration, disclosure, or
              destruction.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-300">
              We may update this policy from time to time. We will notify you of
              any significant changes and update the "Effective Date"
              accordingly.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              12. Contact Us
            </h2>
            <p className="mb-3 text-gray-300">
              If you have any questions or concerns about this Privacy Policy,
              please contact us at:
            </p>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg text-gray-300 relative z-1 mb-6">
              <p className="font-semibold text-white">
                Design-Genie Solutions Private Limited
              </p>
              <p className="mt-2">
                <strong>Address:</strong>
              </p>
              <p>No 463 76/1, Tharabanhalli Village,</p>
              <p>Vidyanagara, Bg North,</p>
              <p>Bangalore- 562157,</p>
              <p>Karnataka, India</p>
              <p className="mt-2">
                <strong>E-Mail:</strong>{" "}
                <a
                  href="mailto:support@design-genie.ai"
                  className="text-white"
                >
                  support@design-genie.ai
                </a>
              </p>
              <p>
                <strong>Tel:</strong>{" "}
                <a href="tel:+918951048993" className="text-white   q">
                  +91 89510 48993
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
