import { useEffect, useState } from "react";
import { fetchStrapiContent, saveStrapiContent } from "../utils/axiosUtils";
import aboutImg from "../assets/images/what-is-dg-img.png";

export default function ContactUsPage() {
  const [contactUs, setContactUs] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });


  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await fetchStrapiContent("contact-us?populate*"); // Replace "gallery" with your actual endpoint
        // If response is a single object
        if (data) {
          setContactUs(data);
        }
      } catch (error) {
        console.error("Error loading gallery:", error);
      }
    };

    fetchImages();
  }, []);

  const handleChange = (e) => {
	const { name, value } = e.target;
	setFormData((prev) => ({ ...prev, [name]: value }));
};
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const result = await saveStrapiContent("contacts-details-list", {
      body: JSON.stringify({
        data: {
          name: formData.name,
          email: formData.email,
          message: formData.message,
        },
      }),
    });
    setFormData({ name: "", email: "", message: "" });
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to send message.");
  }
};
  return (
    <div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
      <div className="overflow-auto flex flex-col h-96 grow">
        <div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
          <div className="container px-4 mx-auto text-center">
            <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">
              Contact Us
            </h1>
            <p className="text-base text-white max-w-4xl w-full mx-auto">
              {contactUs.subDescription}
            </p>
          </div>
        </div>
        <div className="xl:px-0 px-4">
          <div className="container mx-auto py-12 p-6 border-shadow-blur border border-solid border-white/30 rounded-2xl z-10 relative overflow-hidden">
            <div className="absolute -translate-x-2/4 top-2/4 z-10">
              <svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                className="size-96 opacity-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.2 47.1H34.4L17.1 30.7L26.6 21.1L43 37.8V14H57.2V37.8L73.6 21.1L83.1 30.7L65.8 47H90V60.5H65.7L83 77.2L73.5 86.6L50 63.1L26.5 86.7L17 77.2L34.3 60.5H10V47.1H10.2Z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="px-44 flex flex-wrap gap-10 lg:flex-row-reverse">
              <div className="w-5/12 grow">
                <h2 className="text-2xl xl:text-3xl 3xl:text-4xl font-bold mb-2">
                  {contactUs.sectionTitle}
                </h2>
                <p className="mb-12">{contactUs.sectionDescription}</p>
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-wrap gap-4">
                    <div className="relative pb-3 w-full">
                      <label
                        htmlFor="name"
                        className="text-sm text-white mb-1 block"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-transparent border-b border-white/30 focus:border-purple-500 text-white outline-none py-2 px-3"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div className="relative pb-3 w-full">
                      <label
                        htmlFor="name"
                        className="text-sm text-white mb-1 block"
                      >
                        Email
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-transparent border-b border-white/30 focus:border-purple-500 text-white outline-none py-2 px-3"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="relative pb-3 w-full">
                      <label
                        htmlFor="name"
                        className="text-sm text-white mb-1 block"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full bg-transparent border-b border-white/30 focus:border-purple-500 text-white outline-none py-2 px-3"
                        placeholder="Write your message"
                      ></textarea>
                    </div>
                    <div className="relative pb-3 w-full">
                      <button className="bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center py-2 px-5 text-center rounded-full min-w-28 w-fit font-medium hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 transition-all duration-200 ease-linear">
                        Send
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="w-5/12 grow">
                <div className="w-full relative after:pt-[56%] 2xl:after:pt-[70%] after:block after:w-full rounded-xl overflow-hidden">
                  <img
                    src={aboutImg}
                    alt="About Us"
                    className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <div className="w-5/12 grow border-shadow-blur rounded-xl border border-solid border-white/30 py-2 p-3 !bg-white/5">
                    <h3 className="text-lg font-semibold mb-1">
                      Contact Information
                    </h3>
                    <p className="text-sm text-gray mb-1">
                      Email: <a href="#">{contactUs.email}</a>
                    </p>
                  </div>
                  <div className="w-5/12 grow border-shadow-blur rounded-xl border border-solid border-white/30 py-2 p-3 !bg-white/5">
                    <h3 className="text-lg font-semibold mb-1">
                      Contact Information
                    </h3>
                    <p className="text-sm text-gray mb-1">
                      Phone: <a href="#">{contactUs.phone}</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
