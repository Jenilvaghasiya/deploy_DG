import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import logo from "../../assets/images/dg-logo.png";

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const tempId = searchParams.get("temp_id");
    
    if (tempId) {
      setIsOnboarding(true);
    }
    
    if (!sessionId) {
      setLoading(false);
      setSessionValid(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await api.post("/subscription/check-session", { session_id: sessionId });
        const data = res.data?.data;
        if (!data?.valid || !data?.isPaid) {
          // If not onboarding, redirect to user projects
          if (!tempId) {
            navigate("/user-projects");
            return;
          }
        }
        setSessionValid(true);
        setSessionDetails(data);
      } catch (err) {
        console.error("Error checking session:", err);
        if (!tempId) {
          navigate("/user-projects");
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [searchParams, navigate]);

  const handlePrimaryAction = () => {
    if (isOnboarding) {
      // Go to login for onboarding users
      navigate("/login");
    } else {
      // Go to dashboard for existing users
      navigate("/user-projects");
    }
  };

  const handleGoHome = () => navigate("/");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-72 before:-right-1/5 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-1/5 dg-footer">
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white bg-black relative before:size-72 sm:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-72 before:-right-1/5 dg-hero-section overflow-hidden after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-1/5 dg-footer">
      {/* Logo Header */}
      <div className="relative z-10 p-4 lg:p-8">
        <img src={logo} alt="Design Genie Logo" className="w-32 lg:w-40 h-auto" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8">
        <div className="max-w-md w-full rdg-testimonial-card p-8 border-2 border-solid border-white rounded-2xl border-shadow-blur flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-900/20 to-green-800/20 border-2 border-green-500 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-white">Payment Successful 🎉</h1>
          
          <p className="text-gray-400">
            {isOnboarding 
              ? "Thank you for your purchase! Your account setup is complete. Please login to access your dashboard."
              : "Thank you for your purchase. Your subscription is now active!"
            }
          </p>

          <div className="w-full flex flex-col gap-4">
            <Button 
              onClick={handlePrimaryAction} 
              className="w-full border-2 border-solid border-gray-400 !bg-transparent text-white text-center text-base lg:text-lg font-medium py-3 transition-all duration-200 ease-linear min-h-12 hover:!bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit rounded-3xl"
            >
              {isOnboarding ? 'Go to Login' : 'Go to Dashboard'}
            </Button>
            <Button 
              onClick={handleGoHome} 
              className="w-full border-2 border-solid border-gray-400 bg-transparent text-white hover:text-white hover:bg-gray-800 rounded-3xl"
            >
              Back to Home
            </Button>
          </div>

          <p className="text-gray-500 text-sm mt-4">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@design-genie.ai" className="text-purple-400 hover:text-purple-300 hover:underline">
              support@design-genie.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;