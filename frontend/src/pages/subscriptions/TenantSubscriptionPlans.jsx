import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/api/axios';
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/dg-logo.png";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const TenantSubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch plans and current subscription in parallel
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscription/plans'),
        api.get('/subscription/current')
      ]);
      
      setPlans(plansRes.data.data);
      setCurrentSubscription(subRes.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load subscription data.');
      toast.error('Failed to load subscription data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanAction = async (planId) => {
    try {
      setActionLoading(planId);
      
      const response = await api.post('/subscription/change-plan', { planId });
      
      if (response.data?.data?.url) {
        // Redirect to checkout for new subscription
        toast.success('Redirecting to checkout...');
        window.location.href = response.data.data.url;
      } else {
        // Plan changed successfully (upgrade/downgrade)
        toast.success(response.data.message || 'Plan updated successfully!');
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Error processing request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white text-lg">Loading plans...</p>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-red-500 text-lg">{error}</p>
    </div>
  );

  const currentPlanId = currentSubscription?.plan?._id || currentSubscription?.plan?.id;
  const hasActiveSubscription = currentSubscription?.subscription?.status === 'active';

  return (
    <div className="min-h-screen flex flex-col text-white bg-black relative before:size-48 before:sm:size-72 before:md:size-80 before:lg:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-48 before:sm:-top-72 before:-right-1/4 before:sm:-right-1/5 dg-hero-section overflow-hidden after:size-40 after:sm:size-56 after:lg:size-80 after:xl:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-48 after:sm:-bottom-72 after:-left-1/4 after:sm:-left-1/5 dg-footer">
      
      {/* Logo Header */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <img src={logo} alt="Design Genie Logo" className="w-24 sm:w-32 lg:w-40 h-auto" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 px-4 sm:px-6 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-bold text-white mb-3 sm:mb-4">
              Subscription Plans
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-200 max-w-2xl mx-auto px-4">
              {hasActiveSubscription 
                ? "Manage your subscription or switch to a different plan"
                : "Choose a plan to unlock premium features"
              }
            </p>
          </div>

          {/* Plans Grid */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto mb-8 sm:mb-10 lg:mb-12">
            {plans.length === 0 ? (
              <p className="text-gray-400 text-lg text-center w-full">
                No subscription plans yet.
              </p>
            ) : (
              plans.map((plan) => {
                const isCurrentPlan = currentPlanId === (plan._id || plan.id);
                const isDowngrade = hasActiveSubscription && 
                  currentSubscription?.plan?.price > plan.price;
                const isUpgrade = !hasActiveSubscription || 
                  (hasActiveSubscription && currentSubscription?.plan?.price < plan.price);

                return (
                  <div
                    key={plan._id || plan.id}
                    className={`w-full sm:w-[calc(50%_-_12px)] lg:w-[calc(33.333%_-_22px)] relative rdg-testimonial-card p-5 sm:p-6 lg:p-8 border-2 border-solid rounded-xl sm:rounded-2xl border-shadow-blur transform transition-all duration-200 
                      ${isCurrentPlan ? 'border-purple-500 scale-[1.02] sm:scale-105' : 'border-white hover:scale-[1.02] sm:hover:scale-105'}
                      ${isCurrentPlan ? 'opacity-75' : ''}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-purple-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1">
                          <Check size={14} className="sm:w-4 sm:h-4" /> Current Plan
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center text-white mb-6 sm:mb-8">
                      <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center mb-2">
                        <span className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          ₹{plan.price}
                        </span>
                        <span className="text-gray-400 ml-1 sm:ml-2 text-sm sm:text-base">/month</span>
                      </div>
                      <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base px-2">{plan.description}</p>
                      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-gray-700">
                        <span className="text-xl sm:text-2xl font-bold text-green-400">{plan.credits}</span>
                        <span className="text-gray-300 ml-1 sm:ml-2 text-sm sm:text-base">credits/month</span>
                      </div>
                    </div>

                    <Button
                      className={`w-full border-2 border-solid text-white text-center text-sm sm:text-base lg:text-lg font-medium py-2.5 sm:py-3 transition-all duration-200 ease-linear min-h-10 sm:min-h-12 rounded-2xl sm:rounded-3xl
                        ${isCurrentPlan 
                          ? 'border-gray-600 !bg-gray-800 cursor-not-allowed' 
                          : 'border-gray-400 !bg-transparent hover:!bg-[linear-gradient(180deg,#9C25E6_0%,#BE2696_100%)] dg-submit'
                        }`}
                      disabled={isCurrentPlan || actionLoading === (plan._id || plan.id)}
                      onClick={() => !isCurrentPlan && handlePlanAction(plan._id || plan.id)}
                    >
                      {actionLoading === (plan._id || plan.id) 
                        ? 'Processing...' 
                        : isCurrentPlan 
                          ? 'Current Plan'
                          : isDowngrade
                            ? 'Downgrade'
                            : isUpgrade
                              ? 'Upgrade'
                              : 'Select Plan'
                      }
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Info Section */}
          <div className="max-w-3xl mx-auto text-center space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
              <p className="text-xs sm:text-sm text-gray-300">
                {hasActiveSubscription ? (
                  <>
                    <strong>Note:</strong> When you change plans, the new plan will take effect immediately. 
                    You'll be charged or credited the prorated difference.
                  </>
                ) : (
                  <>
                    <strong>Ready to upgrade?</strong> Choose a plan above to unlock more credits and features.
                  </>
                )}
              </p>
            </div>

            {/* Help text */}
            <p className="text-gray-200 text-xs sm:text-sm">
              Need help choosing?{' '}
              <a href="mailto:support@design-genie.ai" className="text-purple-500 hover:text-purple-300 hover:underline transition-colors">
                support@design-genie.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSubscriptionPlans;