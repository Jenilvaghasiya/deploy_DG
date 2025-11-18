import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { FaCoins } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "@/api/axios";
import { useNavigate } from "react-router-dom";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import { TbFileInvoice } from "react-icons/tb";
import Loader from "@/components/Common/Loader";

export default function SubscriptionDetails({ user }) {
  const navigate = useNavigate();
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [editSubscription, setEditSubscription] = useState({});
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can adjust this number
  const [autoRenew, setAutoRenew] = useState(
    subscriptionData?.tenant?.subscription_auto_renew ?? true
  );
  const totalPages = Math.ceil(paymentHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = paymentHistory.slice(startIndex, endIndex);
  const triggerRef = useRef(null);
  const [pendingValue, setPendingValue] = useState(null); // temp value
  const [dialogOpen, setDialogOpen] = useState(false);
  // Update handleAutoRenewToggle
  const handleAutoRenewToggle = (checked) => {
    setPendingValue(checked);

    // revert the switch immediately (so UI doesn’t change yet)
    setAutoRenew((prev) => prev);

    // open confirm dialog programmatically
    if (triggerRef.current) {
      triggerRef.current.click();
    }
  };
  // Fetch subscription details on mount
  useEffect(() => {
    fetchSubscriptionDetails();
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    if (subscriptionData?.subscription) {
      setAutoRenew(subscriptionData.tenant.subscription_auto_renew ?? true);
    }
  }, [subscriptionData]);
  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      // You'll need to create this endpoint
      const res = await api.get("/subscription/current");
      setSubscriptionData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch subscription details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoadingPayments(true);
      const res = await api.get("/subscription/payment/history");
      setPaymentHistory(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch payment history:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleConfirm = async () => {
    if (pendingValue === null) return;

    try {
      setLoading(true);

      const res = await api.post("/subscription/auto-renew", {
        subscriptionId: subscriptionData.subscription.id,
        enable: pendingValue,
      });
      if (res.status === 200) {
        toast.success(res.data.message)
        setAutoRenew(pendingValue); // update local state after success
        setPendingValue(null);
      }      
    } catch (err) {
      console.error("Failed to update auto-renew:", err);
      // optional: show toast or alert here
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setEditSubscription((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpgradePlan = () => {
    navigate("/subscriptions");
  };

  const handleCancelPlan = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      const res = await api.post("/subscription/cancel");
      toast.success("Subscription cancellation in progress");
      fetchSubscriptionDetails(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel subscription");
    }
  };

  // Update handleCancelSubscription to remove the window.confirm:
    const handleCancelSubscription = async () => {
        try {
            const response = await api.post('/subscription/cancel');
            toast.success(response.data.message || 'Subscription cancelled successfully');
            fetchSubscriptionDetails(); // Refresh data
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Error cancelling subscription.');
        } finally {
        }
    };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
        <Loader className="" />
      </div>
    );
  }

  const isFreePlan = !subscriptionData?.subscription || subscriptionData?.subscription?.status === 'canceled';
  const subscriptionStatus = subscriptionData?.subscription?.status || "free";
  const isPastDue = subscriptionStatus === "past_due";
  const hasActiveSubscription = subscriptionStatus === "active";
  const isCanceled = subscriptionStatus === "canceled";

  return (
    <>
    <div className="bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-pink-400">Subscription Details</h3>
      </div>

      <div className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Current Plan:</span>
          <p className="text-zinc-300 font-semibold">
            {hasActiveSubscription
              ? subscriptionData?.plan?.name
              : isPastDue
                ? "Payment Failed / Plan Expired"
                : "Free Plan"}
          </p>
        </div>


        {/* Plan Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            hasActiveSubscription ? 'bg-green-900/50 text-green-400' : 'bg-gray-900/50 text-gray-400'
          }`}>
            {subscriptionStatus || 'Free'}
          </span>
        </div>

        {/* Billing Cycle */}
        {hasActiveSubscription && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Billing Cycle:</span>
              <p className="text-zinc-300">
                ${subscriptionData?.plan?.price}/month
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Period:</span>
              <p className="text-zinc-300">
                {subscriptionData?.subscription?.current_period_start 
                  ? new Date(subscriptionData.subscription.current_period_start).toLocaleDateString()
                  : "-"} 
                {" - "}
                {subscriptionData?.subscription?.current_period_end 
                  ? new Date(subscriptionData.subscription.current_period_end).toLocaleDateString()
                  : "-"}
              </p>
            </div>
          </>
        )}
        {hasActiveSubscription && (
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm font-medium text-zinc-300">Auto-Renew:</span>
            
<Switch
        id="auto-renew-switch"
        checked={autoRenew}
        onCheckedChange={handleAutoRenewToggle}
      />

            <ConfirmActionDialog
        onConfirm={handleConfirm}
        title="Change Auto-Renewal"
        message={`Are you sure you want to turn ${pendingValue ? "ON" : "OFF"} auto-renewal?`}
        confirmText={loading ? "Saving..." : "Yes, Proceed"}
        cancelText="Cancel"
        variant={pendingValue ? "default" : "danger"}
        showIcon={!pendingValue} // only show warning icon on disabling
      >
<button ref={triggerRef} style={{ display: "none" }} />

            </ConfirmActionDialog>
          </div>
        )}
        {/* Credits */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Credits Remaining:</span>
          <div className="flex items-center gap-1">
            <FaCoins className="text-yellow-500" />
            <p className="text-yellow-500 font-semibold">{subscriptionData?.credits ?? 0}</p>
          </div>
        </div>

        {/* Plan Features */}
        {subscriptionData?.plan && (
          <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg">
            <p className="text-sm font-medium mb-2">Plan Features:</p>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>• {subscriptionData.plan.credits} credits per month</li>
              {subscriptionData.plan.description && (
                <li>• {subscriptionData.plan.description}</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Subscription Actions */}
        <div className="pt-4 border-t border-zinc-700 space-y-3">
          {isFreePlan || isPastDue ? (
            <Button
              variant="dg_btn"
              onClick={handleUpgradePlan}
              className="w-full text-white font-semibold py-2 px-4"
            >
              Upgrade to Premium
            </Button>
          ) : (
            <>
              <div className="flex gap-3">
                {hasActiveSubscription && !isPastDue && (
                <Button
                  variant="dg_btn"
                  onClick={handleUpgradePlan}
                  className=" text-white font-semibold py-2 px-4"
                >
                  Change Plan
                </Button>
)}
                {hasActiveSubscription && (
                    <ConfirmActionDialog
                        title="Cancel Subscription"
                        message="Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period."
                        confirmText="Yes, Cancel Subscription"
                        cancelText="Keep Subscription"
                        variant="danger"
                        onConfirm={handleCancelSubscription}
                    >
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold  px-4 py-2 rounded-lg"
                        >
                        {'Cancel Subscription'}
                        </Button>
                    </ConfirmActionDialog>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center">
                Cancellation will take effect at the end of your current billing period
              </p>
            </>
          )}
        </div>
    </div>
    <div className="bg-zinc-950/30 border border-solid border-zinc-700 backdrop-blur-2xl p-6 rounded-lg shadow-white shadow-3xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-pink-400">Payment History</h3>
      </div>
      {loadingPayments ? (
        <div className="text-center py-4">
          <p className="text-zinc-400">Loading payment history...</p>
        </div>
      ) : paymentHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-zinc-400">No payment history available</p>
        </div>
      ) : (
        <>
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-zinc-300">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {currentPayments.map((payment, index) => (
                  <tr key={payment.id || index} className="border-b border-zinc-800 hover:bg-zinc-900/50">
                    <td className="py-3 px-4 text-white">
                      {new Date(payment.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      Monthly Subscription
                    </td>
                    <td className="py-3 px-4">
                      ₹{(payment.amount_paid)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.status === 'succeeded' || payment.status === 'paid'
                          ? 'bg-green-900/50 text-green-400'
                          : payment.status === 'pending'
                          ? 'bg-yellow-900/50 text-yellow-400'
                          : 'bg-red-900/50 text-red-400'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {payment.hosted_invoice_url ? (
                        <a
                          href={payment.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant={"dg_btn"}
                          >
                            View Invoice
                          </Button>
                        </a>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
          
          {/* Pagination controls */}
          {paymentHistory.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
              <div className="text-sm text-zinc-400">
                Showing {startIndex + 1} to {Math.min(endIndex, paymentHistory.length)} of {paymentHistory.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`px-3 py-1 text-sm rounded ${
                            currentPage === pageNumber
                              ? 'bg-pink-600 text-white'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return <span key={pageNumber} className="text-zinc-500">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}