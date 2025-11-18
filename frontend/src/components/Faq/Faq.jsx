"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { fetchStrapiContent } from "@/utils/axiosUtils";

export default function Faq() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState([]);
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true); // loading state
   
  const filteredFAQs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (id) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const res = await fetchStrapiContent("faqs");
        setFaqData((res || []).slice(0, 5)); // limit to first 5 FAQs
      } catch (err) {
        console.error("Error loading FAQs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);


  return (
    <section
      id="faqs"
      className="pt-10 pb-10 lg:pb-16 xl:pb-24 bg-black overflow-hidden relative before:size-32 before:bg-no-repeat before:bg-cover before:absolute before:top-2/4 before:-translate-y-2/4 before:-left-32 sm:before:-left-10 2xl:before:!scale-150 dg-meetMarks-section flex flex-col bg-purple-vectore"
    >
      <div className="container px-4 mx-auto">
        <div className="flex flex-wrap items-center gap-8 lg:gap-12">
          {/* Left Side - Title and Search */}
          <div className="lg:w-5/12 grow lg:sticky lg:top-8">
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-8 leading-tight">
                Have questions?
                <br />
                <span className="block">Start here</span>
              </h2>

              {/* Search Bar */}
              <div className="relative max-w-md mx-auto lg:mx-0">
                <input
                  type="text"
                  placeholder="Search questions here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 rounded-full bg-[linear-gradient(to_right,_#8b7f88,_#7c2c9e)] backdrop-blur-sm border-0 text-white placeholder-white/70 !outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="w-5 h-5 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - FAQ Cards */}
          <div className="lg:w-5/12 grow space-y-4">
            {loading ? (
              <div className="relative z-10 flex flex-col items-start">
                <div className="mt-4 space-y-3 w-full">
                  <div className="h-8 bg-gray-500 rounded w-full max-w-xl animate-pulse"></div>
                  <div className="h-8 bg-gray-500 rounded w-4/5 animate-pulse"></div>
                  <div className="h-8 bg-gray-500 rounded w-full max-w-xl animate-pulse"></div>
                  <div className="h-8 bg-gray-500 rounded w-4/5 animate-pulse"></div>
                  <div className="h-8 bg-gray-500 rounded w-full max-w-xl animate-pulse"></div>
                  <div className="h-8 bg-gray-500 rounded w-4/5 animate-pulse"></div>
                  <div className="h-8 bg-gray-500 rounded w-full max-w-xl animate-pulse"></div>
                  <div className="h-8 bg-gray-500 rounded w-4/5 animate-pulse"></div>
                </div>
              </div>
            ) : (
              <>
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-zinc-400 backdrop-blur-sm rounded-2xl p-2.5 lg:p-6 border border-zinc-400 hover:bg-zinc-400 transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full text-left focus:outline-none rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-white rounded-full mt-3 flex-shrink-0"></div>
                          <h3 className="text-lg sm:text-xl font-medium text-white leading-relaxed pr-4">
                            {faq.question}
                          </h3>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                          {expandedItems.includes(faq.id) ? (
                            <ChevronUpIcon className="w-5 h-5 text-white/70" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-white/70" />
                          )}
                        </div>
                      </div>
                    </button>

                    {expandedItems.includes(faq.id) && (
                      <div className="mt-4 pl-5 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-white/80 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {filteredFAQs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-white/70 text-lg">
                      No FAQs found matching your search.
                    </p>
                  </div>
                )}

                {/* See all FAQs Button */}
                <div className="pt-6 text-center lg:text-left">
                  <a
                    href="/faqs"
                    className="bg-zinc-400 backdrop-blur-sm hover:bg-zinc-400 text-white px-8 py-3 rounded-full border border-white/30 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    See all FAQs
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
