import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Header } from "../components/Common/Header/Header";
import circle from "../assets/images/hero-banner-round.png";
import whatIsDGImge from "../assets/images/what-is-dg-img.png";
import whiteDGIcon from "../assets/images/white-icon.png";
import DGIcon from "../assets/images/dg-icon.png";
import userFriendlyIcon from "../assets/images/user-friendly.png";
import detailedDesignsIcon from "../assets/images/detailed-designs.png";
import secureSafeIcon from "../assets/images/secure-safe.png";
import testimonialImg from "../assets/images/isla.jpg";
import footLogo from "../assets/images/footer-logo.png";
import meetMarks from "../assets/images/meet-marks.png";
import { fetchStrapiContent } from "../utils/axiosUtils";
import Faq from "../components/Faq/Faq";
import { ArrowRightIcon, Files, Pen, RefreshCw, Table } from "lucide-react";
import { BlogCard } from "../components/Blog/BlogCard";
import { WhyChooseCard } from "../components/ChooseGenie/WhyChooseCard";
import { marked } from "marked";
import { useLocation } from "react-router-dom";
import Button from "@/components/Button";
import { FaFacebookF } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa6";

const featureIcons = [
  <Pen className="w-9 h-9 text-white" />,
  <Files className="w-9 h-9 text-white" />,
  <RefreshCw className="w-9 h-9 text-white" />,
  <Table className="w-9 h-9 text-white" />,
];

export const LandingPagelayout = () => {
  const [homeDetails, setHomeDetails] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState("");
  const [plansError, setPlansError] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash && !loading) {
      const scrollToElement = () => {
        const id = location.hash.replace("#", "");
        const element = document.getElementById(id);

        // if (element) {
        //   element.scrollIntoView({ behavior: 'smooth' });
        // }

        if (element) {
          // Calculate offset for fixed header
          const headerOffset = 80; // Adjust based on your header height
          const elementPosition = element.offsetTop;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(scrollToElement, 100);
      });
    }
  }, [location.hash, loading]);

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
    const fetchPlans = async () => {
      setPlansLoading(true);
      try {
        const res = await fetchStrapiContent(
          "pricing?populate[Plan][populate]=feature"
        );
        setPlans(res || []);
      } catch (err) {
        setPlansError("Failed to load plans.");
        console.error("Error loading plans:", err);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      setBlogLoading(true);
      try {
        const res = await fetchStrapiContent("blogs?populate=coverImage");
        console.log("Blogs fetched:", res);
        setBlogs(res || []);
      } catch (err) {
        console.error("Error loading blogs:", err);
      } finally {
        setBlogLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const formatBannerContent = (content) => {
    if (!content) return "";
    // Split the content into parts around the bold/italic section
    return content.replace(
      /\*\*_([^_]+)_\*\* (.*)/,
      '<b><i>$1</i></b> <span class="text-2xl lg:text-3xl [@media(min-width:1441px)]:text-4xl 2xl:text-5xl">$2</span>'
    );
  };
  return (
    <div className="bg-black relative">
      <Header headerClass={"fixed top-0 left-0 z-50 bg-transparent"} />

      <section className="relative overflow-x-clip">
        {/* Hero Section */}
        <div className="relative purple-top-right min-h-screen flex flex-col">
          <div className="container px-4 mx-auto h-96 grow flex flex-col">
            <div className="dg-hero-round absolute -left-[440px] sm:-left-56 md:-left-72 xl:-left-52 2xl:-left-32 bottom-0 translate-y-1/5 sm:translate-y-1/3 md:translate-y-1/3 2xl:translate-y-[40%] w-3xl sm:max-w-4xl xl:max-w-5xl 2xl:max-w-[60dvw] sm:w-full transition-all duration-200 ease-linear after:absolute after:top-2/4 after:-translate-2/4 after:left-2/4 after:bg-cover after:size-full after:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTAwIiBoZWlnaHQ9IjkwMCIgdmlld0JveD0iMCAwIDkwMCA5MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnIGZpbHRlcj0idXJsKCNmaWx0ZXIwX2ZfM18zKSI+CjxjaXJjbGUgY3g9IjQ1MCIgY3k9IjQ1MCIgcj0iNDAwIiBmaWxsPSJ1cmwoI3BhaW50MF9yYWRpYWxfM18zKSIvPgo8L2c+CjxkZWZzPgo8ZmlsdGVyIGlkPSJmaWx0ZXIwX2ZfM18zIiB4PSIwIiB5PSIwIiB3aWR0aD0iOTAwIiBoZWlnaHQ9IjkwMCIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiPgo8ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPgo8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPgo8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyNSIgcmVzdWx0PSJlZmZlY3QxX2ZvcmVncm91bmRCbHVyXzNfMyIvPgo8L2ZpbHRlcj4KPHJhZGlhbEdyYWRpZW50IGlkPSJwYWludDBfcmFkaWFsXzNfMyIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSg0NTAgNDUwKSByb3RhdGUoOTApIHNjYWxlKDQwMCkiPgo8c3RvcCBvZmZzZXQ9IjAuMTEyMzA4IiBzdG9wLWNvbG9yPSIjRjIwMEE3Ii8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0YyMDBBNyIgc3RvcC1vcGFjaXR5PSIwIi8+CjwvcmFkaWFsR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==')]">
              <img
                src={circle}
                className="max-w-full h-auto block"
                alt="circle"
              />
            </div>
            <div className="w-3/4 sm:w-2/4 flex flex-col justify-end h-96 grow pb-12 lg:pb-24">
              {loading ? (
                <div className="relative z-10 flex flex-col items-start">
                  <div className="mt-4 space-y-3">
                    <div className="h-8 bg-gray-500 rounded w-96 animate-pulse"></div>
                    <div className="h-8 bg-gray-500 rounded w-80 animate-pulse"></div>
                    <div className="h-8 bg-gray-500 rounded w-96 animate-pulse"></div>
                    <div className="h-8 bg-gray-500 rounded w-80 animate-pulse"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-red-400 relative z-10">
                  <p>Error loading content: {error}</p>
                </div>
              ) : (
                <>
                  <h2 className="text-white mb-2 text-3xl lg:text-4xl font-semibold [@media(min-width:1441px)]:text-5xl 2xl:text-6xl relative z-10">
                    {homeDetails?.title}
                  </h2>
                  <h2
                    className="text-white font-normal text-3xl lg:text-4xl [@media(min-width:1441px)]:text-5xl 2xl:text-6xl relative z-10"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(homeDetails?.bannerContent || ""),
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* What is DG Section */}
        <div className="pt-10 pb-10 lg:pb-16 xl:pb-24 relative max-w-full md:max-w-[1500px] mx-auto">
          <div className="container px-4 mx-auto relative z-10">
            {/* <img
              src={whiteDGIcon}
              className="max-w-10 sm:max-w-12 md:max-w-16 xl:max-w-20 w-full block mb-6 lg:mb-10"
              alt="icon"
            /> */}
            {loading ? (
              <div className="flex flex-col md:flex-row-reverse items-center gap-5 md:gap-10">
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
            ) : (
              homeDetails?.bodySections?.map((section) => (
                <div
                  key={section.id}
                  className="flex flex-col md:flex-row-reverse items-center gap-5 lg:gap-10"
                >
                  <div className="md:w-5/12 md:grow w-full">
                    <div className="rounded-2xl md:max-w-lg overflow-hidden w-full mx-auto">
                      {section.image && (
                        <img
                          src={
                            section.image?.url
                              ? import.meta.env.VITE_STRAPI_URL + section.image.url
                              : ""
                          }
                          className="max-w-full w-full h-auto md:h-96 object-cover block rounded-xl"
                          alt={section.image.alternativeText || section.title}
                        />
                      )}
                    </div>
                  </div>
                  <div className="md:w-2/4 md:grow w-full flex justify-end">
                    <div className="lg:w-3/4 backdrop-blur-xl w-full dg-testimonial-card border-2 border-solid border-white rounded-3xl p-6 lg:p-9 xl:p-16 md:min-h-96 2xl:min-h-[420px] content-center">
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-medium text-white mb-5">
                        {section.title}
                      </h3>
                      <p className="text-lg md:text-xl 2xl:text-2xl text-white font-normal">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      <section id="pricing" className="relative">
        <div>
          <div className="absolute w-full left-0">
            <img src="/ai-bg.jpg" alt="ai-bg" className="w-full opacity-40" />
          </div>
          <div className="relative pt-40 h-full flex flex-col justify-center items-center text-center px-4">

            <p className="text-lg md:text-3xl md:max-w-4xl max-w-xl mt-10 text-white">
              Try Design Genie-Powered Fashion Design — On Us!
            </p>

            <p className="text-md md:text-xl md:max-w-4xl max-w-xl mt-4 text-white">
              Get <strong>50 FREE CREDITS</strong> to create stunning fashion
              images and production-ready size charts.
            </p>

            <p className="text-md md:text-xl md:max-w-4xl max-w-xl mt-2 text-white">
              No credit card required. No strings attached.
            </p>

            <div className="w-[25rem] absolute -left-20 top-56 md:block hidden">
              <img
                src="/ai-genie.png"
                className="max-w-full h-auto block"
                alt="Ai Genie"
              />
            </div>

            <div className="text-center w-full mt-30 flex flex-col justify-center items-center">
              <p className="text-2xl md:max-w-4xl max-w-xl text-white">
                Your Design Genie awaits.
              </p>
              <p className="text-xl md:max-w-4xl max-w-xl mt-2 text-white">
                Make your fashion wish come true.
              </p>
                        <div className="flex justify-center mt-5">
              <div className="group bg-[linear-gradient(to_right,_#d10895,_#7100CA)] text-white font-medium px-8 py-2.5 border border-solid border-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50 flex items-center space-x-2">
                <a href="/onboarding" className="text-base lg:text-lg">
                  Start Designing for Free
                </a>
              </div>
            </div>
              <img src="/ai-text-banner.png" alt="" className="w-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-10 overflow-hidden bg-black z-10 relative before:size-56 md:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-bottom-32 md:before:-bottom-56 2xl:before:-bottom-96 before:left-0 md:before:left-20 2xl:before:left-40 2xl:before:scale-150 dg-features-section flex flex-col bg-purple-vectore">
        <div className="relative z-10 flex flex-wrap align-stretch gap-6 md:gap-10">
          <div className="text-white sm:w-1/4 xl:w-5/12 grow pl-4 md:pl-[calc((100%_-_736px)/2)] lg:pl-[calc((100%_-_992px)/2)] xl:pl-[calc((100%_-_1248px)/2)] 2xl:pl-[calc((100%_-_1504px)/2)] flex flex-col justify-start relative">
            {/* <img
              src={DGIcon}
              className="max-w-10 sm:max-w-12 md:max-w-16 xl:max-w-20 w-full block mb-4 sm:mb-auto"
              alt="icon"
            /> */}
            <h1 className="text-3xl lg:text-5xl text-white pt-20">
              What can your AI Genie do?
            </h1>
            <p className="pt-3 md:pt-5 text-lg lg:text-xl text-white">
              Bring your ideas to life through simple, powerful tools built for
              designers, manufacturers, and creative teams.
            </p>
          </div>
          <div className="sm:w-2/4 grow ml-4">
            <div className="dg-testimonial-card border-2 lg:border-4 border-solid border-white border-r-0 lg:border-r-0 rounded-s-[42px] p-6 sm:p-9 lg:pr-16 xl:p-16">
              {loading ? (
                <div className="space-y-8">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="py-2.5">
                      <div className="size-9 md:size-12 xl:size-14 mb-4 bg-gray-500 rounded animate-pulse"></div>
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-500 rounded w-2/3 animate-pulse"></div>
                        <div className="h-4 bg-gray-500 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-500 rounded w-4/5 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                homeDetails?.featureItem?.map((item, index) => (
                  <div className="pb-10" key={item.id}>
                    <div className="size-9 mb-4">{featureIcons[index]}</div>
                    <div className="text-white">
                      <h4 className="text-white font-medium text-xl lg:text-2xl xl:text-3xl mb-2">
                        {item.title}
                      </h4>
                      <p className="text-white font-normal text-sm md:text-lg leading-normal">
                        {item.feature}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="absolute -bottom-10 left-5 md:left-10 -z-10">
            <img src="/genie-pot.png" alt="" className="w-1/3 md:w-1/2" />
          </div>
        </div>
      </section>

      <section className="relative h-full py-16 overflow-hidden bg-black">
        <img src="/seperater.png" alt="" className="absolute top-0" />
        <img
          src="/seperater.png"
          alt=""
          className="absolute bottom-0 rotate-180"
        />
       <h1 className="text-center text-xl md:text-3xl text-white px-10 z-10 relative">
        More <span className="font-semibold">magic</span> coming soon:
        color matching, moodboards and more
      </h1>
        <img
          src="/magic-banner-1.png"
          alt=""
          className="absolute w-[150px] top-0 hidden md:block"
        />
        <img
          src="/magic-banner-2.png"
          alt=""
          className="absolute w-[150px] top-10 left-20 rotate-[50deg] hidden md:block"
        />
        <img
          src="/magic-banner-1.png"
          alt=""
          className="absolute w-[150px] top-0 right-0 rotate-[50deg] hidden md:block"
        />
      </section>
      {/* Choose DesignGenie Section */}
      <section className="relative overflow-hidden h-full pb-36 bg-black">
        <div className="text-center py-5 md:py-14">
          <h1 className="text-4xl md:text-5xl text-white md:mb-0 mb-10">
            Why Designers Choose DesignGenie?
          </h1>
        </div>

        {loading ? (
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
        ) : (
          <div className="flex flex-col items-center md:gap-20 gap-20 max-w-[1500px] mx-auto md:px-20">
            {homeDetails?.otherSections?.map((card, index) => (
              <WhyChooseCard key={card.id} card={card} index={index} />
            ))}
          </div>
        )}
      </section>

      <section id="home-gallery" className="bg-black py-22 relative">
        <img alt="" className="absolute top-0 z-0" src="/seperater.png" />
        <img alt="" className="absolute bottom-0 rotate-180 z-0" src="/seperater.png" />
        <div className="py-32 px-4 relative w-full z-[10] bg-black">
          <div className="absolute left-0 top-0 max-w-[40rem] w-full">
            <img
              src="/trial-bottom.png"
              className="max-w-full w-full h-auto block"
              alt=""
            />
          </div>
          <div className="absolute right-0 bottom-0 max-w-[40rem] w-full">
            <img
              src="/trial-top.png"
              className="max-w-full w-full h-auto block"
              alt=""
            />
          </div>
          <div className="relative z-[2]">
            <h3 className="text-2xl lg:text-3xl font-light text-white mb-8 leading-relaxed max-w-4xl mx-auto flex items-center gap-2 justify-center">
              <span>Summon Your Genie & Start Creating, It's Free</span>
              <img
                src="/stars.png"
                className="block -mt-5 size-8"
                alt="Summon Your Genie & Start Creating"
              />
            </h3>

            <div className="max-w-xl w-full mx-auto text-white text-center flex flex-col space-y-1">
              <p className="text-gray-300">
                Unleash your fashion creativity with Design Genie.
              </p>
              <p className="text-gray-300">
                Sign up now and get 50 free credits to sketch, style, and size —
                no credit card needed.
              </p>
            </div>
                        <div className="flex justify-center mt-5">
              <a
                href="/onboarding"
                className="group bg-[linear-gradient(to_right,_#d10895,_#7100CA)] text-white font-medium px-8 py-2.5 border border-solid border-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50 flex items-center space-x-2 text-base lg:text-lg"
              >
                Start Designing Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="relative w-full py-24 lg:py-32 overflow-hidden bg-black">
        <div className="relative flex flex-col gap-5 px-6 md:flex-row md:px-10 lg:px-10 max-w-[1500px] mx-auto">
          {/* Blog Title */}
          <div className="md:pt-4 lg:pt-10 px-5 md:px-0 before:size-72 xl:before:size-56 before:bg-no-repeat before:bg-cover before:absolute before:top-32 sm:before:top-56 before:-right-40 sm:before:-right-20 dg-meetMarks-section flex flex-col bg-pink-vectore">
            <h2 className="font-[450] leading-none text-[48px] sm:text-[64px] lg:text-[86px] text-white">
              Blogs
            </h2>
          </div>

          {/* Blog Cards Grid */}
          <div className="grid grid-cols-1 gap-12">
            {blogLoading
              ? Array(1)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={index}
                      className="border-shadow-blur border-2 lg:border-4 border-solid border-whitey h-[20rem] w-[550px] max-w-md text-white mx-auto rounded-3xl flex flex-col p-6"
                    >
                      <div className="space-y-4">
                        <div className="h-8 bg-gray-500 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-gray-500 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-500 rounded w-5/6 animate-pulse"></div>
                        <div className="h-10 bg-gray-500 rounded w-1/3 animate-pulse mt-4"></div>
                      </div>
                    </div>
                  ))
              : (blogs || [])
                  .slice(0, 3)
                  .reverse()
                  .map((blog, index) => (
                    <BlogCard key={index} blog={blog} index={index} />
                  ))}
                <div className="flex justify-center"><a href="/blogs" className="mt-1 self-start rounded-full text-white bg-gray-500 px-6 py-2 text-sm font-medium backdrop-blur">Read more</a></div>

          </div>
        </div>
      </section>

      <Faq />
      <section className="relative py-20 overflow-hidden">
        <img src="/seperater.png" alt="" className="absolute top-0" />
        <img
          src="/seperater.png"
          alt=""
          className="absolute bottom-0 rotate-180"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h2 className="text-2xl lg:text-3xl font-light text-white mb-8 leading-relaxed max-w-4xl mx-auto">
              Your Genie is ready. Start creating with{" "}
              <span className="font-medium">50 free Credits.</span>
            </h2>
            <div className="flex justify-center">
              <button className="group bg-[linear-gradient(to_right,_#d10895,_#7100CA)] text-white font-medium px-8 py-2.5 border border-solid border-white rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50 flex items-center space-x-2">
                <a href="/onboarding" className="text-base lg:text-lg">
                  Get started Free
                </a>
                <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400 opacity-10 rounded-full blur-3xl"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white opacity-30 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-300 opacity-40 rounded-full animate-ping"></div>
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-white opacity-20 rounded-full animate-pulse delay-1000"></div>
        </div>
        <div className="credit-purple-glow-circle-left"></div>
        <div className="credit-purple-glow-circle-right"></div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="py-10 lg:py-16 xl:py-24 w-full bg-black overflow-hidden relative dg-footer before:size-56 lg:before:size-60 before:bg-no-repeat before:bg-cover before:absolute before:top-40 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore"
      >
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
                            target="_blank"
                            href="https://www.facebook.com/share/17LW595Bm8/?mibextid=wwXIfr"
                            className="block text-white"
                          >
                           <FaFacebookF className="size-6 md:size-8 xl:size-10" />
                          </a>
                        </li>
                        <li>
                          <a href="https://www.instagram.com/designgenieai?igsh=NzU4MHV1eHZjODh4&utm_source=qr" target="_blank" className="block text-white">
                            <FaInstagram className="size-6 md:size-8 xl:size-10" />
                          </a>
                        </li>
                        <li>
                          <a href="https://www.linkedin.com/company/designgenieai/" target="_blank" className="block text-white">
                            <FaLinkedinIn className="size-6 md:size-8 xl:size-10" />
                          </a>
                        </li>
                        <li>
                          <a href="https://x.com/design_genieAI" target="_blank" className="block text-white">
                            <FaTwitter className="size-6 md:size-8 xl:size-10" />
                          </a>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-gray-800">
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm text-gray-400">
                  <span 
                    onClick={() => navigate("/terms-and-conditions")}
                    className="text-purple-400 hover:underline cursor-pointer transition-colors hover:text-purple-300"
                  >
                    Terms and Conditions
                  </span>
                  <span className="hidden md:inline text-gray-600">•</span>
                  <span 
                    onClick={() => navigate("/privacy-and-data-policy")}
                    className="text-purple-400 hover:underline cursor-pointer transition-colors hover:text-purple-300"
                  >
                    Privacy and Data Collection
                  </span>
                </div>
                <div className="mt-4 text-center text-xs text-gray-500">
                  © {new Date().getFullYear()} Design Genie. All rights reserved.
                </div>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};
