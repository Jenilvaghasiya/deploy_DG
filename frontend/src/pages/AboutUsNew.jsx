import React, { useEffect, useState } from "react";
import { Header } from "../components/Common/Header/Header";
import circle from "../assets/images/hero-banner-round.png";
import footLogo from "../assets/images/footer-logo.png";
import { fetchStrapiContent } from "../utils/axiosUtils";
import { AboutUsCard } from "@/components/About/AboutUsCard";
import { marked } from "marked";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const AboutUsNew = () => {
  const [homeDetails, setHomeDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aboutData, setAboutData] = useState(null);
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutError, setAboutError] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await fetchStrapiContent(
          "home-page?populate[testimonials][populate]=profile&populate[featureItem][populate]=*&populate[bodySections][populate]=image&populate[otherSections][populate]=image&populate[footers][populate]=*"
        );
        setHomeDetails(res);
      } catch (err) {
        setError("Failed to load home details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setAboutLoading(true);
      try {
        const res = await fetchStrapiContent(
          "about-us?populate[card][populate]=image&populate[bodySection][populate]=*&populate[foundersSections][populate]=*&populate[feedbackSections][populate]=*"
        ); // 'about' should be your Strapi collection type slug
        setAboutData(res);
      } catch (err) {
        console.error("Error loading About data", err);
        setAboutError("Failed to load About content.");
      } finally {
        setAboutLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-black relative">
      {/* <Header headerClass={"fixed top-0 left-0 z-50 bg-transparent"} /> */}

      {/* Hero Section */}
      <section className="overflow-hidden relative before:size-72 sm:before:size-80 before:bg-no-repeat before:bg-cover before:absolute before:-top-40 before:-right-40 dg-hero-section min-h-svh flex flex-col after:absolute after:bottom-0 after:left-0 after:w-full after:h-16 after:bg-gradient-to-b after:from-black/0 after:to-black purple-top-right">
        <div className="container px-4 mx-auto h-96 grow flex flex-col">
          <div className="dg-hero-round absolute -left-[32rem] md:-left-72 xl:-left-52 2xl:-left-32 bottom-0 translate-y-[40%] sm:translate-y-[52%] md:translate-y-2/4 2xl:translate-y-[45%] max-w-5xl 2xl:max-w-[66dvw] transition-all duration-200 ease-linear">
            <img
              src={circle}
              className="max-w-full h-auto block"
              alt="circle"
            />
          </div>
          <div className="w-3/4 sm:w-2/4 flex flex-col justify-end h-96 grow pb-20 lg:pb-24 dg-hero-inner bg-pink-vectore 2xl:before:size-[420px] before:size-60 sm:before:size-80 before:bg-no-repeat before:bg-cover before:absolute before:-bottom-20 sm:before:-bottom-64 md:before:-bottom-60 before:-left-20 sm:before:left-0 md:before:left-24 2xl:before:left-80">
            <h2 className="text-white mb-2 text-3xl lg:text-6xl 2xl:text-7xl relative z-10">
              About us
            </h2>
          </div>
        </div>
      </section>

      {/* About Us Card Section */}
      <section className="relative overflow-hidden h-full pb-4 bg-black">
        {aboutLoading ? (
          <div className="flex flex-col md:flex-row-reverse items-center gap-5 md:gap-10 md:px-36 px-10">
            <div className="md:w-5/12 md:grow w-full">
              <div className="rounded-2xl md:max-w-lg overflow-hidden w-full mx-auto">
                <div className="w-full h-80 bg-gray-500 rounded-xl animate-pulse"></div>
              </div>
            </div>
            <div className="md:w-2/4 md:grow w-full">
              <div className="border-shadow-blur border-2 border-solid border-white rounded-3xl p-6 md:p-9 xl:p-16 md:min-h-96 2xl:min-h-[420px] flex flex-col justify-center">
                <div className="mt-6 space-y-4">
                  <div className="h-8 bg-gray-500 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-500 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-500 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-gray-500 rounded w-4/5 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ) : aboutError ? (
          <div className="text-red-400 text-center p-10">
            Error: {aboutError}
          </div>
        ) : (
          <div className="flex flex-col items-center md:gap-20 gap-20">
            <AboutUsCard card={aboutData?.card} />
          </div>
        )}
      </section>

      {aboutLoading ? (
        <section className="py-10 md:py-16 relative">
          <div className="container px-4 mx-auto">
            <div className="flex items-center justify-center gap-2">
              <div className="relative z-10 max-w-fit">
                <div className="h-12 bg-gray-500 rounded w-64 mx-auto mb-8 animate-pulse"></div>
                <div className="h-12 bg-gray-500 rounded w-48 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
      ) : aboutError ? null : (
        <>
          {/* ====== Meet the Founders Section ====== */}
          <section className="py-10 md:py-16 relative">
            <div className="container px-4 mx-auto">
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/pattern-left.webp"
                  className="hidden md:block md:h-80 object-contain xl:scale-150 -mr-20 xl:-mr-40"
                  alt="pattern"
                />
                <div className="relative z-10 max-w-fit">
                  <h2 className="text-3xl md:text-4xl 2xl:text-5xl text-center text-white leading-snug [&>strong]:block [&>strong]:font-semibold mb-8">
                    <strong>{aboutData?.foundersSections?.title}</strong>
                  </h2>
                  <div className="max-w-4xl mx-auto px-4 py-10">
                    <div
                      className={cn(
                        "p-4 rounded-2xl 2xl:rounded-4xl",
                        showMore ? "border-shadow-blur" : ""
                      )}
                    >
                      <Accordion
                        type="single"
                        collapsible
                        onValueChange={(e) => setShowMore(e === "item-1")}
                      >
                        <AccordionItem value="item-1" collapsible>
                          <AccordionTrigger
                            className={
                              "group bg-[linear-gradient(77.59deg,_#621F56_35.1%,_#5D1E60_47.44%,_#541C75_73.46%)] text-2xl text-white font-medium px-8 py-2.5 border-2 border-solid border-white/50 rounded-lg hover:shadow-2xl outline-none inline-flex items-center justify-center space-x-2 max-w-fit mx-auto transition-all duration-300 [&>svg]:hidden hover:no-underline cursor-pointer"
                            }
                          >
                            Meet the founders
                          </AccordionTrigger>
                          <AccordionContent
                            className={
                              "text-white rounded-xl pt-4 [&>div+div]:border-t [&>div+div]:border-solid [&>div+div]:border-white/50 [&>div+div]:mt-4 [&>div+div]:pt-4"
                            }
                          >
                            {aboutData?.foundersSections?.content?.map(
                              (data, i) => (
                                <div
                                  key={i}
                                  className="text-xl px-4"
                                  dangerouslySetInnerHTML={{
                                    __html: marked.parse(data?.content || ""),
                                  }}
                                ></div>
                              )
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                </div>
                <img
                  src="/pattern-right.webp"
                  className="hidden md:block md:h-80 object-contain xl:scale-150 -ml-20 xl:-ml-40"
                  alt="pattern"
                />
              </div>
            </div>
          </section>
        </>
      )}

      {/* Body Section - Added loading/error handling */}
      {aboutLoading ? (
        <section className="py-20 xl:py-24 bg-black relative">
          <div className="container px-4 mx-auto">
            <div className="h-12 bg-gray-500 rounded w-1/2 mx-auto mb-10 animate-pulse"></div>
            <ul className="flex flex-col gap-4 max-w-full sm:max-w-3xl sm:mx-auto">
              {[1, 2, 3, 4].map((item) => (
                <li
                  key={item}
                  className="h-8 bg-gray-500 rounded w-full animate-pulse"
                ></li>
              ))}
            </ul>
            <div className="h-12 bg-gray-500 rounded w-1/2 mx-auto mt-10 animate-pulse"></div>
          </div>
        </section>
      ) : aboutError ? (
        <div className="text-red-400 text-center p-10">Error: {aboutError}</div>
      ) : (
        <section className="py-20 xl:py-24 bg-black bg-bottom bg-no-repeat bg-contain bg-[url('/still-listening.png')] overflow-hidden relative after:absolute after:-bottom-10 after:left-2/4 after:size-40 after:-translate-x-2/4 md:after:scale-125 lg:after:scale-200 after:rounded-full after:blur-2xl after:bg-[radial-gradient(circle,_rgba(190,_38,_150,_1)_0%,_rgba(190,_38,_150,_1)_100%)] before:absolute before:w-full before:h-14 before:left-0 before:bottom-0 before:z-[2] before:bg-[linear-gradient(180deg,_rgba(0,0,0,0)_0%,_#000000_98%)]">
          <div className="container px-4 mx-auto">
            <h3 className="text-center text-3xl md:text-4xl 2xl:text-5xl text-white font-semibold mb-10 relative z-10 after:size-32 after:absolute after:top-2/4 after:-z-[2] after:left-2/4 after:rounded-full after:-translate-2/4 after:bg-[#9C25E6] after:blur-2xl before:scale-125 before:size-28 before:absolute before:top-2/4 before:-z-[2] before:left-2/4 before:rounded-full before:ml-20 before:-mt-4 before:-translate-2/4 before:bg-[radial-gradient(circle,_rgba(190,_38,_150,_1)_0%,_rgba(190,_38,_150,_1)_100%)] before:blur-lg">
              {aboutData?.bodySection?.title}
            </h3>
            <ul className="text-base font-normal flex flex-col gap-4 max-w-full sm:max-w-3xl sm:mx-auto text-white [&>li:nth-child(even)]:ml-auto mb-10">
              {aboutData?.bodySection?.content?.map((item, index) => (
                <li
                  key={item.id}
                  className="text-xl xl:text-2xl w-full md:w-2/3"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(item?.content),
                  }}
                />
              ))}
            </ul>
            <h4 className="text-center text-3xl md:text-4xl 2xl:text-5xl text-white font-semibold mb-10 relative z-[2]">
              {aboutData?.bodySection?.title2}
            </h4>
          </div>
        </section>
      )}



      {aboutLoading ? (
        <section className="py-10 md:py-16 relative">
          <div className="container px-4 mx-auto">
            <div className="flex items-center justify-center gap-2">
              <div className="relative z-10 max-w-fit">
                <div className="h-12 bg-gray-500 rounded w-64 mx-auto mb-8 animate-pulse"></div>
                <div className="h-12 bg-gray-500 rounded w-48 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
      ) : aboutError ? null : (
        <>

          {/* ====== Feedback Section ====== */}
          <section className="py-10 sm:py-16 lg:py-24 relative after:size-60 lg:after:size-64 2xl:after:size-80 after:rounded-full after:blur-2xl after:absolute after:top-2/4 after:-translate-y-2/4 after:opacity-70 after:-left-40 after:bg-[radial-gradient(circle,_rgba(190,_38,_150,_1)_0%,_rgba(190,_38,_150,_1)_100%)]">
            <div className="container px-4 mx-auto">
              <h2 className="text-3xl md:text-4xl 2xl:text-5xl text-center text-white leading-snug [&>strong]:block [&>strong]:font-semibold">
                <strong>{aboutData?.feedbackSections?.title}</strong>
              </h2>
              <p className="text-3xl md:text-4xl 2xl:text-5xl text-center text-white leading-snug [&>strong]:block [&>strong]:font-semibold mb-6">
                {aboutData?.feedbackSections?.content}
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                className="group bg-[linear-gradient(315deg,_rgba(0,0,0,0.25)_10%,_rgba(255,255,255,0.35)_90%)] text-2xl text-white font-medium px-8 py-2.5 border-2 border-solid border-white/50 rounded-lg hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50 flex items-center space-x-2 w-fit mx-auto transition-all duration-300"
              >
                Get in touch
              </a>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="py-10 lg:py-16 xl:py-24 w-full bg-black overflow-hidden relative dg-footer before:size-56 lg:before:size-60 before:bg-no-repeat before:bg-cover before:absolute before:top-40 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
        <div className="container mx-auto px-4 relative z-10">
          {loading ? (
            <div className="space-y-8">
              <div className="h-10 w-48 bg-gray-500 rounded animate-pulse hidden sm:block"></div>
              <div className="flex flex-wrap items-end sm:justify-between">
                <div className="w-full sm:w-2/4 mb-6 sm:mb-0">
                  <div className="h-16 w-40 xl:w-56 bg-gray-500 rounded animate-pulse"></div>
                </div>
                <div className="w-full sm:w-5/12 xl:w-1/3 space-y-6">
                  <div className="h-10 w-48 bg-gray-500 rounded animate-pulse sm:hidden block"></div>
                  <div className="space-y-6">
                    <div>
                      <div className="h-6 w-32 bg-gray-500 rounded animate-pulse mb-2"></div>
                      <div className="h-5 w-40 bg-gray-500 rounded animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-6 w-32 bg-gray-500 rounded animate-pulse mb-2"></div>
                      <div className="h-5 w-60 bg-gray-500 rounded animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-6 w-32 bg-gray-500 rounded animate-pulse mb-2"></div>
                      <div className="flex gap-3">
                        <div className="h-10 w-10 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="h-10 w-10 bg-gray-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-400">
              <p>Error loading footer: {error}</p>
            </div>
          ) : (
            <>
              <h3 className="text-white text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-normal mb-8 md:mb-20 hidden sm:block">
                Contact
              </h3>
              <div className="flex flex-wrap items-end sm:justify-between">
                <div className="w-full sm:w-2/4 mb-6 sm:mb-0">
                  <img
                    src={footLogo}
                    className="max-w-40 xl:max-w-56 h-auto block"
                    alt="footer logo"
                  />
                </div>

                <div className="w-full sm:w-5/12 xl:w-1/3">
                  <h3 className="text-white text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-normal mb-4 w-full sm:hidden block">
                    Contact
                  </h3>
                  <ul className="flex flex-col gap-4 md:gap-10">
                    <li>
                      <span className="text-white block text-xl md:text-2xl xl:text-3xl mb-1 md:mb-3">
                        Phone
                      </span>
                      <a
                        href="tel:1234567890"
                        className="text-white block text-base md:text-xl"
                      >
                        {homeDetails?.footers?.phone}
                      </a>
                    </li>
                    <li>
                      <span className="text-white block text-xl md:text-2xl xl:text-3xl mb-1 md:mb-3">
                        Email
                      </span>
                      <a
                        href="mailto:hello@designgenie.com"
                        className="text-white block text-base md:text-xl"
                      >
                        {homeDetails?.footers?.email}
                      </a>
                    </li>
                    <li>
                      <span className="text-white block text-xl md:text-2xl xl:text-3xl mb-1 md:mb-3">
                        Social
                      </span>
                      <ul className="flex items-center gap-3">
                        <li>
                          <a
                            href="https://www.facebook.com/"
                            className="block text-white"
                          >
                            <svg
                              width="48"
                              height="48"
                              viewBox="0 0 48 48"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="size-6 md:size-8 xl:size-10"
                            >
                              <path
                                d="M29.4118 9.96881H34.0316V3H28.1263V3.02568C20.3683 3.30669 18.7761 7.66071 18.635 12.2478H18.6205V17.0862H14V24.0593H18.6205V45.2671H26.9143V24.0593H32.8581L34.0317 17.0862H26.9143V12.7587C26.9143 11.2194 27.941 9.96881 29.4118 9.96881Z"
                                fill="currentColor"
                              />
                            </svg>
                          </a>
                        </li>
                        <li>
                          <a href="#" className="block text-white">
                            <svg
                              width="48"
                              height="48"
                              viewBox="0 0 48 48"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="size-6 md:size-8 xl:size-10"
                            >
                              <path
                                d="M23.9956 7.60289C29.3342 7.60289 29.9654 7.62043 32.078 7.71685C34.0241 7.80451 35.0848 8.12886 35.7949 8.40938C36.7241 8.76879 37.3903 9.2071 38.0916 9.90839C38.7929 10.6097 39.2224 11.2759 39.5906 12.2051C39.8624 12.9064 40.1867 13.9671 40.2832 15.922C40.3796 18.0346 40.3971 18.6658 40.3971 24.0044C40.3971 29.343 40.3796 29.9741 40.2832 32.0868C40.1955 34.0329 39.8711 35.0936 39.5906 35.8036C39.2312 36.7329 38.7929 37.3991 38.0916 38.1004C37.3903 38.8017 36.7241 39.2312 35.7949 39.5994C35.0936 39.8711 34.0329 40.1955 32.078 40.2919C29.9654 40.3883 29.3342 40.4059 23.9956 40.4059C18.657 40.4059 18.0259 40.3883 15.9132 40.2919C13.9671 40.2043 12.9064 39.8799 12.1964 39.5994C11.2671 39.24 10.6009 38.8017 9.89963 38.1004C9.19834 37.3991 8.76879 36.7329 8.40061 35.8036C8.12886 35.1023 7.80452 34.0416 7.70809 32.0868C7.61166 29.9741 7.59413 29.343 7.59413 24.0044C7.59413 18.6658 7.61166 18.0346 7.70809 15.922C7.79575 13.9759 8.1201 12.9152 8.40061 12.2051C8.76003 11.2759 9.19834 10.6097 9.89963 9.90839C10.6009 9.2071 11.2671 8.77756 12.1964 8.40938C12.8977 8.13763 13.9584 7.81328 15.9132 7.71685C18.0259 7.62043 18.657 7.60289 23.9956 7.60289ZM23.9956 4C18.5606 4 17.8856 4.0263 15.7467 4.12273C13.6165 4.21915 12.1613 4.56103 10.8902 5.05194C9.57528 5.56038 8.46198 6.24414 7.34867 7.35744C6.24414 8.47074 5.56038 9.58405 5.05194 10.899C4.56103 12.1701 4.21915 13.6252 4.12273 15.7554C4.0263 17.8856 4 18.5694 4 23.9956C4 29.4306 4.0263 30.1056 4.12273 32.2446C4.21915 34.3748 4.56103 35.8299 5.05194 37.101C5.56038 38.416 6.24414 39.5293 7.35744 40.6426C8.47074 41.7559 9.58405 42.4396 10.899 42.9481C12.1701 43.439 13.6252 43.7808 15.7554 43.8773C17.8856 43.9737 18.5694 44 24.0044 44C29.4394 44 30.1144 43.9737 32.2533 43.8773C34.3835 43.7808 35.8387 43.439 37.1098 42.9481C38.4247 42.4396 39.538 41.7559 40.6513 40.6426C41.7646 39.5293 42.4484 38.416 42.9568 37.101C43.4477 35.8299 43.7896 34.3748 43.886 32.2446C43.9825 30.1144 44.0088 29.4306 44.0088 23.9956C44.0088 18.5606 43.9825 17.8856 43.886 15.7467C43.7896 13.6165 43.4477 12.1613 42.9568 10.8902C42.4484 9.57528 41.7646 8.46198 40.6513 7.34867C39.538 6.23537 38.4247 5.55161 37.1098 5.04317C35.8387 4.55227 34.3835 4.21039 32.2533 4.11396C30.1144 4.0263 29.4306 4 23.9956 4Z"
                                fill="currentColor"
                              />
                              <path
                                d="M23.9937 13.7285C18.322 13.7285 13.7285 18.322 13.7285 23.9937C13.7285 29.6654 18.3308 34.2676 24.0025 34.2676C29.6742 34.2676 34.2764 29.6742 34.2764 23.9937C34.2676 18.322 29.6654 13.7285 23.9937 13.7285ZM23.9937 30.6647C20.3119 30.6647 17.3314 27.6842 17.3314 24.0025C17.3314 20.3207 20.3119 17.3402 23.9937 17.3402C27.6755 17.3402 30.656 20.3207 30.656 24.0025C30.6647 27.6755 27.6755 30.6647 23.9937 30.6647Z"
                                fill="currentColor"
                              />
                              <path
                                d="M37.0753 13.3258C37.0753 14.6494 35.9971 15.7277 34.6734 15.7277C33.3497 15.7277 32.2715 14.6494 32.2715 13.3258C32.2715 12.0021 33.3497 10.9238 34.6734 10.9238C35.9971 10.9238 37.0753 11.9933 37.0753 13.3258Z"
                                fill="currentColor"
                              />
                            </svg>
                          </a>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};

export default AboutUsNew;
