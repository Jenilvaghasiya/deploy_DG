import React, { useState } from 'react';
import logo from "../../../assets/images/dg-logo.png";
import { useAuthStore } from "../../../store/authStore";
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Header = ({ headerClass }) => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <header className={`w-full py-3 2xl:py-4 z-30 bg-white/20 backdrop-blur-lg ${headerClass || ""}`}>
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap items-center">
            <div className="max-w-36 2xl:max-w-40 w-full logo">
              <Link to="/" className="block max-w-full w-full outline-none">
                <img src={logo} className="max-w-full h-auto block" alt="Logo" />
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button onClick={() => setMobileMenu(!mobileMenu)} type="button" className="outline-none bg-transparent rounded-sm border border-solid border-white text-white md:hidden flex items-center justify-center size-9 ml-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Navigation */}
            <nav className={`md:w-2/4 md:grow w-full md:block hidden`}>
              <ul className="flex flex-col md:flex-row gap-2 xl:gap-4 justify-start p-3 py-4 md:p-0 md:pl-10">
                {/* <li>
                  <Link to="/#home-gallery" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Gallery</Link>
                </li> */}
                <li>
                  <Link to="/#faqs" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">FAQs</Link>
                </li>
                <li>
                  <Link to="/about" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">About Us</Link>
                </li>
                {/* <li>
                  <Link to="/#pricing" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Pricing</Link>
                </li> */}
                <li>
                  <Link to="/#contact" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Contact Us</Link>
                </li>
                <li>
                  <Link to="/blogs" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Blogs</Link>
                </li>
                <li>
                  <Link to="/gallery-posts" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Gallery</Link>
                </li>
                <li>
                  <Link to="/reviews" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Reviews</Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">How it works</Link>
                </li>
                {/* <li className='ml-auto'>
                  <a href="/login" className="bg-gradient-to-r from-purple-600 to-blue-500 text-white text-base p-2 px-4 rounded-full font-semibold transition-all duration-200 ease-linear">Login</a>
                </li> */}

                <li className="ml-auto">
                  <Link
                    to={isAuthenticated() ? "/user-projects" : "/login"}
                    className="bg-gradient-to-r from-purple-600 to-blue-500 text-white text-base p-2 px-4 rounded-full font-semibold transition-all"
                  >
                    {isAuthenticated() ? "Go to App" : "Login"}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <nav className={cn("z-50 fixed left-0 top-[73px] bg-white/20 backdrop-blur-lg w-full", mobileMenu ? "block md:hidden" : "hidden") }>
        <ul className="flex flex-col md:flex-row gap-2 xl:gap-4 justify-start p-3 py-4 md:p-0 md:pl-10">
          {/* <li>
            <Link to="/#home-gallery" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Gallery</Link>
          </li> */}
          <li>
            <Link to="/#faqs" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">FAQs</Link>
          </li>
          <li>
            <Link to="/about" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">About Us</Link>
          </li>
          {/* <li>
            <Link to="/#pricing" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Pricing</Link>
          </li> */}
          <li>
            <Link to="/#contact" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Contact Us</Link>
          </li>
          <li>
            <Link to="/blogs" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Blogs</Link>
          </li>
          <li>
                  <Link to="/gallery-posts" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Gallery</Link>
                </li>
                <li>
                  <Link to="/reviews" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">Reviews</Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-white text-base font-normal hover:text-[rgb(242,0,167)] p-1 xl:p-2 transition-all duration-200 ease-linear">How it works</Link>
                </li> 
          {/* <li className='ml-auto'>
            <a href="/login" className="bg-gradient-to-r from-purple-600 to-blue-500 text-white text-base p-2 px-4 rounded-full font-semibold transition-all duration-200 ease-linear">Login</a>
          </li> */}

          <li className="ml-auto">
            <Link
              to={isAuthenticated() ? "/user-projects" : "/login"}
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white text-base p-2 px-4 rounded-full font-semibold transition-all"
            >
              {isAuthenticated() ? "Go to App" : "Login"}
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};
