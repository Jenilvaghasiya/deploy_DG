
import React, { useState } from "react";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { GoOrganization } from "react-icons/go";
import { FaIndustry, FaMinus } from "react-icons/fa";
import { MdPerson, MdCheck } from "react-icons/md";

export default function PrivacyPolicyNotification({ 
  check1,
  setCheck1,
  check2,
  setCheck2,
  isFooterLink = false, 
  onNavigateBack
}) {
  const [localPersonalizedAI, setLocalPersonalizedAI] = useState(true);
  const [localGlobalAI, setLocalGlobalAI] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="p-4 max-w-4xl mx-auto grow flex flex-col justify-start border-2 border-purple-500/30 rounded-2xl relative overflow-clip">
        <button
          onClick={onNavigateBack}
          className="mt-4 text-white hover:text-purple-300 flex items-center gap-2 cursor-pointer"
        >
          <IoArrowBackCircleOutline size={28} />
        </button>

        <div className="rounded-2xl p-4 md:p-8 relative z-10">
          <h1 className="text-3xl font-bold mb-6 text-white">
            Privacy Policy Notification
          </h1>

          <p className="mb-4 text-gray-300">
            Welcome to DesignGenie! Your privacy is important to us, and we
            handle your data responsibly.
          </p>

          <p className="mb-4 text-gray-300">
            By default, we store images, size spec charts, and other content you
            upload, along with information about discarded generated images.
            This allows us to learn your preferences and style, ensuring a
            personalized experience when we introduce tailored AI models.
          </p>
          
          <div className="relative z-1 mb-6">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg text-gray-300 border-l-4 border-purple-600">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="personalized-ai-notification"
                  checked={check1}
                  onChange={(e) => setCheck1(e.target.checked)}
                  disabled={isFooterLink}
                  className="mt-1 text-purple-500 focus:ring-purple-500 rounded cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="personalized-ai-notification" className="flex-1">
                  <strong className="text-white">
                    Personalized AI Model Data Collection:
                  </strong>{" "}
                  Enabled by default. Uncheck to disable.
                </label>
              </div>
            </div>
          </div>

          <p className="mb-4 text-gray-300">
            Additionally, if you permit, your content can help improve our
            global AI models, enhancing features and accuracy for the entire
            DesignGenie community.
          </p>
          
          <div className="relative z-1 mb-6">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg text-gray-300 border-l-4 border-purple-600">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="global-ai-notification"
                  checked={check2}
                  onChange={(e) => setCheck2(e.target.checked)}
                  disabled={isFooterLink}
                  className="mt-1 text-purple-500 focus:ring-purple-500 rounded cursor-pointer disabled:opacity-50"
                />
                <label htmlFor="global-ai-notification" className="flex-1">
                  <strong className="text-white">
                    Global AI Model Enhancement Data Collection:
                  </strong>{" "}
                  Disabled by default. Check to enable and help enhance
                  community-wide features.
                </label>
              </div>
            </div>
          </div>
          
          <p className="mb-4 text-gray-300 relative">
            You may update these preferences anytime via Account Profile → Data
            & Privacy Settings.
          </p>
        </div>
      </div>
    </div>
  );
}