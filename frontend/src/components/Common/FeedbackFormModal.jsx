import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/api/axios"
import { useLocation } from "react-router-dom"
import { submitReview } from "@/features/auth/authService"
import Loader from "./Loader"
import { useAuthStore } from "@/store/authStore"
import FeedbackAcknowledgementDialog from "@/components/Common/FeedbackAcknowledgementDialog"

// Configurable threshold values
const SIZE_CHART_PROMPT_THRESHOLD = 2
const CREDIT_PROMPT_THRESHOLD = 2
const SIZE_CHART_MANDATORY_THRESHOLD = 3
const CREDIT_MANDATORY_THRESHOLD = 3

export function FeedbackFormModal({setAISectionDisable}) {
  const [showFeedbackAcknowledgement, setShowFeedbackAcknowledgement] = useState(false);
  const setCredits = useAuthStore((state) => state.setCredits);
  const [pricingOption, setPricingOption] = useState("")
  const [otherOption, setOtherOption] = useState("")
  const [loading,setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sizeChartGenerated, setSizeChartGenerated] = useState(0)
  const [creditCount, setCreditCount] = useState(0)
  const [showCancelButton, setShowCancelButton] = useState(true)
  const [betterFeedback, setBetterFeedback] = useState("")
  const [likeFeedback, setLikeFeedback] = useState("")
  const [showPromptDiv, setShowPromptDiv] = useState(false)
  const location = useLocation()

  // Constants
  const MODAL_INTERVAL = 15 * 60 * 1000 // 15 minutes in milliseconds
  const CREDIT_CHECK_INTERVAL = 30 * 1000 // Check credits every 30 seconds
  const STORAGE_KEY = "feedbackModalLastClosed" // Changed from "feedbackModalLastShown"

  const handlePricingChange = (value) => {
    setPricingOption(value)
    if (value !== "other") setOtherOption("")
  }

  // Check if modal should be shown based on time interval
  const shouldShowModal = (sizeChartCount, creditCount) => {
    // If sizeChartGenerated >= MANDATORY_THRESHOLD OR creditCount >= MANDATORY_THRESHOLD, always show modal regardless of timing
    if (sizeChartCount >= SIZE_CHART_MANDATORY_THRESHOLD || creditCount >= CREDIT_MANDATORY_THRESHOLD) {
      return true
    }
    
    // If sizeChartGenerated >= PROMPT_THRESHOLD OR creditCount >= PROMPT_THRESHOLD but both < MANDATORY_THRESHOLD, check the timing interval
    if (sizeChartCount >= SIZE_CHART_PROMPT_THRESHOLD || creditCount >= CREDIT_PROMPT_THRESHOLD) {
      const lastClosed = localStorage.getItem(STORAGE_KEY)
      if (!lastClosed) return true
      
      const timeSinceLastClosed = Date.now() - parseInt(lastClosed)
      return timeSinceLastClosed >= MODAL_INTERVAL
    }
    
    // If both sizeChartGenerated < PROMPT_THRESHOLD AND creditCount < PROMPT_THRESHOLD, don't show modal
    return false
  }

  // Update last closed timestamp when modal is closed/cancelled
  const updateLastClosedTime = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  }

  // Fetch credits data
  const fetchCredits = async () => {
    try {
      const res = await api.get("auth/credits")
      if (res.status === 200) {
        const creditsData = res?.data?.data?.credits
        const sizeChartCount = creditsData?.sizeChartsSinceLastReview || 0
        const creditCount = creditsData?.creditUsedSinceLastReview || 0;
        setCredits(creditsData)
        setSizeChartGenerated(sizeChartCount)
        setCreditCount(creditCount)
        return { sizeChartCount, creditCount }
      }
    } catch (error) {
      console.error("Error fetching credits:", error)
    }
    return { sizeChartCount: 0, creditCount: 0 }
  }

  // Handle showing prompt div based on sizeChartCount and creditCount
  const showFeedbackPrompt = (sizeChartCount, creditCount) => {
    // // Don't show anything if both sizeChartGenerated < PROMPT_THRESHOLD AND creditCount < PROMPT_THRESHOLD
    // if (sizeChartCount < SIZE_CHART_PROMPT_THRESHOLD && creditCount < CREDIT_PROMPT_THRESHOLD) {
    //   return
    // }
    
    // Don't show if modal is already open or prompt is already shown
    if (isModalOpen || showPromptDiv) {
      return
    }
    
    //  If mandatory threshold exceeded → force open modal directly
    if (sizeChartCount >= SIZE_CHART_MANDATORY_THRESHOLD || creditCount >= CREDIT_MANDATORY_THRESHOLD) {
      setShowCancelButton(false); // disable cancel
      setIsModalOpen(true);
      if (setAISectionDisable) setAISectionDisable(true);
      return;
    }

    // Otherwise show prompt only if prompt thresholds crossed
    if (sizeChartCount >= SIZE_CHART_PROMPT_THRESHOLD || creditCount >= CREDIT_PROMPT_THRESHOLD) {
      // Show prompt div for all cases >= PROMPT_THRESHOLD
      setShowPromptDiv(true)
      
      // Disable AI section when prompt is shown
      if (setAISectionDisable) {
        setAISectionDisable(true)
      }
    }
  }

  // Handle "Yes" click from prompt div
  const handlePromptYes = () => {
    setShowPromptDiv(false)
    setShowCancelButton((sizeChartGenerated < SIZE_CHART_MANDATORY_THRESHOLD && creditCount < CREDIT_MANDATORY_THRESHOLD)) // Hide cancel button if sizeChartGenerated >= MANDATORY_THRESHOLD OR creditCount >= MANDATORY_THRESHOLD
    setIsModalOpen(true)
    console.log("Feedback Yes clicked")
  }

  // Handle "Close" click from prompt div
  const handlePromptClose = () => {
    setShowPromptDiv(false)
    
    // Update last closed time when prompt is closed
    updateLastClosedTime()
    
    // Only re-enable AI section if both sizeChartGenerated < MANDATORY_THRESHOLD AND creditCount < MANDATORY_THRESHOLD
    if ((sizeChartGenerated < SIZE_CHART_MANDATORY_THRESHOLD && creditCount < CREDIT_MANDATORY_THRESHOLD) && setAISectionDisable) {
      setAISectionDisable(false)
    }
    
    console.log("Feedback prompt closed")
  }

  // Handle modal closing
  const closeModal = () => {
    // Only allow closing if cancel button is shown (both sizeChartGenerated < MANDATORY_THRESHOLD AND creditCount < MANDATORY_THRESHOLD)
    if (showCancelButton) {
      setIsModalOpen(false)
    }
  }

  // Handle cancel button click
  const handleCancel = () => {
    setIsModalOpen(false)
    
    // Update last closed time when modal is cancelled
    updateLastClosedTime()
    
    // Re-enable AI section when modal is canceled (only if both sizeChartGenerated < MANDATORY_THRESHOLD AND creditCount < MANDATORY_THRESHOLD)
    if ((sizeChartGenerated < SIZE_CHART_MANDATORY_THRESHOLD && creditCount < CREDIT_MANDATORY_THRESHOLD) && setAISectionDisable) {
      setAISectionDisable(false)
    }
    
    console.log("Feedback modal cancelled")
  }

  // Handle form submission
  const handleSubmit = async() => {
    setLoading(true)
    const formData = {
      betterFeedback,
      likeFeedback,
      pricingOption,
      otherOption: pricingOption === "other" ? otherOption : "",
      sizeChartGenerated,
      creditCount
    }
    
    console.log("Form submitted:", formData)
    const data = {
      improvement: betterFeedback,
      liked_about_app: likeFeedback,
      price_option: pricingOption === "other" ? otherOption : pricingOption,
    }
    const response = await submitReview(data)
    if(response.status === 'success'){
      setShowFeedbackAcknowledgement(true)
      
      // Close modal after successful submission
      setIsModalOpen(false)
      
      // Clear the last closed time on successful submission so user won't see modal again
      localStorage.removeItem(STORAGE_KEY)
      
      // Enable AI section after form submission
      if (setAISectionDisable) {
        setAISectionDisable(false)
      }
      
      // Reset form
      setBetterFeedback("")
      setLikeFeedback("")
      setPricingOption("")
      setOtherOption("")
    }else{
      alert("Something went wrong. Please try again.");
    }
    setLoading(false);
    console.log("Feedback form submitted successfully")
  }

  // Initial load - fetch credits when component mounts or location changes
  useEffect(() => {
    const initializeCredits = async () => {
      const { sizeChartCount, creditCount } = await fetchCredits()
      
      // Check if feedback prompt should be shown
      if (shouldShowModal(sizeChartCount, creditCount)) {
        showFeedbackPrompt(sizeChartCount, creditCount)
      }
    }
    
    initializeCredits()
  }, [location.pathname])

  // Periodic check for credit updates (every 30 seconds)
  // useEffect(() => {
  //   const creditCheckInterval = setInterval(async () => {
  //     // Only check if modal/prompt is not currently shown
  //     if (!isModalOpen && !showPromptDiv) {
  //       const { sizeChartCount, creditCount } = await fetchCredits()
        
  //       // Check if feedback prompt should be shown
  //       if (shouldShowModal(sizeChartCount, creditCount)) {
  //         showFeedbackPrompt(sizeChartCount, creditCount)
  //       }
  //     }
  //   }, CREDIT_CHECK_INTERVAL)

  //   return () => clearInterval(creditCheckInterval)
  // }, [isModalOpen, showPromptDiv])

  // Original periodic check for modal display (every 15 minutes)
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     if (!isModalOpen && !showPromptDiv) {
  //       const { sizeChartCount, creditCount } = await fetchCredits()
        
  //       // Check if feedback prompt should be shown
  //       if (shouldShowModal(sizeChartCount, creditCount)) {
  //         showFeedbackPrompt(sizeChartCount, creditCount)
  //       }
  //     }
  //   }, MODAL_INTERVAL)

  //   return () => clearInterval(interval)
  // }, [isModalOpen, showPromptDiv])

  const isFormValid =
      pricingOption.trim() !== "" &&
      (pricingOption !== "other" || otherOption.trim() !== "") &&
      (
        betterFeedback.trim() !== "" ||
        likeFeedback.trim() !== ""
      )


  return (
    <>
      {/* Prompt Div for sizeChartCount >= PROMPT_THRESHOLD OR creditCount >= PROMPT_THRESHOLD */}
      {showPromptDiv && (
        <div className="relative mb-2 whitespace-normal">
          <div className="absolute top-0 left-0 w-full max-w-[96%] bg-white/10 text-white rounded-lg shadow-lg p-4 z-50">
            <p className="text-xs font-normal mb-4 max-w-full">We're glad you're using Design Genie. Can you take a minute to give us your valuable feedback?</p>
            <div className="flex justify-end gap-2">
              <button
                className="text-sm font-medium leading-tight px-3 py-1.5 bg-[#f200a7] text-white rounded-sm hover:bg-purple-700 transition cursor-pointer"
                onClick={handlePromptYes}
              >
                Yes
              </button>
              {/* Only show Close button if both sizeChartGenerated < MANDATORY_THRESHOLD AND creditCount < MANDATORY_THRESHOLD */}
              {(sizeChartGenerated < SIZE_CHART_MANDATORY_THRESHOLD && creditCount < CREDIT_MANDATORY_THRESHOLD) && (
                <button
                  className="text-sm font-medium leading-tight px-3 py-1.5 bg-gray-300 text-black rounded-sm hover:bg-gray-400 transition cursor-pointer"
                  onClick={handlePromptClose}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="z-[11000] md:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden"
          onPointerDownOutside={(e) => {
            // Always prevent closing by clicking outside
            e.preventDefault()
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing with Escape key if cancel button is hidden
            if (!showCancelButton) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="text-left">We're building DesignGenie with you in mind.</DialogTitle>
            <DialogDescription>
              Your feedback shapes what we launch in a few days.
              {(sizeChartGenerated >= SIZE_CHART_MANDATORY_THRESHOLD || creditCount >= CREDIT_MANDATORY_THRESHOLD) && (
                <span className="block mt-2 text-sm text-orange-600">
                  Please complete this feedback form to continue.
                </span>
              )}
              {((sizeChartGenerated >= SIZE_CHART_PROMPT_THRESHOLD && sizeChartGenerated < SIZE_CHART_MANDATORY_THRESHOLD) || (creditCount >= CREDIT_PROMPT_THRESHOLD && creditCount < CREDIT_MANDATORY_THRESHOLD)) && (sizeChartGenerated < SIZE_CHART_MANDATORY_THRESHOLD && creditCount < CREDIT_MANDATORY_THRESHOLD) && (
                <span className="block mt-2 text-sm text-blue-600">
                  You can close this modal or provide feedback to help us improve.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* What can we do better */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="better" className="text-white text-sm xl:text-base">What can we do better?</Label>
            <Textarea id="better" value={betterFeedback} onChange={(e) => setBetterFeedback(e.target.value)} placeholder={`We'd love your help in improving DesignGenie.\nWhat didn't quite work for you? What would make the experience better or more useful?\n\nIf there's a feature you wished existed but didn't see, tell us about it.\nEven if you're not sure what to write—just start. Any honest feedback is welcome!`} className="min-h-20 md:min-h-24 xl:min-h-32" />
          </div>

          {/* What did you like */}
          <div className="space-y-2 mt-6">
            <Label htmlFor="like" className="text-white text-sm xl:text-base">What did you like?</Label>
            <Textarea id="like" value={likeFeedback} onChange={(e) => setLikeFeedback(e.target.value)} placeholder={`What made you smile? What felt surprisingly easy or helpful?\n\nTell us what worked for you—or what you'd love to see more of.\nAny small win or big wow—we'd love to know!`} className="min-h-20 md:min-h-24 xl:min-h-32" />
          </div>

          {/* Pricing Options */}
          <div className="space-y-2 mt-6 text-white">
            <Label className="text-white block mb-4 text-lg xl:text-xl font-medium">Which of these pricing options would you choose?</Label>
            <RadioGroup
              value={pricingOption}
              onValueChange={handlePricingChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic">Basic Plan $49.99 per month for 100 credits</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="designer" id="designer" />
                <Label htmlFor="designer">Designer Plan $79.99 per month for 200 credits</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="prolific" id="prolific" />
                <Label htmlFor="prolific">Prolific Plan $119.99 per month for 400 credits</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="corporate" id="corporate" />
                <Label htmlFor="corporate">Corporate Plan $249.99 per month for 1000 credits</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>

            {pricingOption === "other" && (
              <Input
                className="mt-2"
                placeholder="Please specify"
                value={otherOption}
                onChange={(e) => setOtherOption(e.target.value)}
              />
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-6">
            {/* Only show cancel button if both sizeChartGenerated < MANDATORY_THRESHOLD AND creditCount < MANDATORY_THRESHOLD */}
           {(sizeChartGenerated < SIZE_CHART_MANDATORY_THRESHOLD &&
            creditCount < CREDIT_MANDATORY_THRESHOLD &&
            !loading) && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
          )}

            <Button type="submit" variant="dg_btn" className={'min-w-27'} onClick={handleSubmit} disabled={!isFormValid || loading}>
              {loading ? <Loader className="size-6 [&>div]:size-full" /> : "Submit Feedback"}
              
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FeedbackAcknowledgementDialog open={showFeedbackAcknowledgement} setOpen={setShowFeedbackAcknowledgement}/>
    </>
  )
}