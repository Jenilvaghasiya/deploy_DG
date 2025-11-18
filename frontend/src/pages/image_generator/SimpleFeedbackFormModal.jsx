import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { submitReview } from "@/features/auth/authService"
import Loader from "@/components/Common/Loader"
import FeedbackAcknowledgementDialog from "@/components/Common/FeedbackAcknowledgementDialog"


export function SimpleFeedbackFormModal() {
  const [showFeedbackAcknowledgement, setShowFeedbackAcknowledgement] = useState(false);
  const [pricingOption, setPricingOption] = useState("")
  const [otherOption, setOtherOption] = useState("")
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [betterFeedback, setBetterFeedback] = useState("")
  const [likeFeedback, setLikeFeedback] = useState("")

  const handlePricingChange = (value) => {
    setPricingOption(value)
    if (value !== "other") setOtherOption("")
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    const data = {
      improvement: betterFeedback,
      liked_about_app: likeFeedback,
      price_option: pricingOption === "other" ? otherOption : pricingOption,
    }
    
    try {
      const response = await submitReview(data)
      
      if (response.status === 'success') {        
        setShowFeedbackAcknowledgement(true)
        // Close modal after successful submission
        setIsModalOpen(false)
        
        // Reset form
        setBetterFeedback("")
        setLikeFeedback("")
        setPricingOption("")
        setOtherOption("")
      } else {
        alert("Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      alert("Something went wrong. Please try again.")
    }
    
    setLoading(false)
  }

  const isFormValid =
    pricingOption.trim() !== "" &&
    (pricingOption !== "other" || otherOption.trim() !== "") &&
    (betterFeedback.trim() !== "" || likeFeedback.trim() !== "")

  return (
    <>
      {/* Give Feedback Button */}
      <Button onClick={openModal} variant="outline" className={'border-0 text-base 2xl:text-lg font-semibold text-pink-500 sm:text-white hover:text-white bg-[#FFE9F5] sm:bg-gradient-to-r sm:from-purple-500 sm:to-pink-500 sm:hover:bg-gradient-to-l sm:focus:ring-4 sm:focus:outline-none sm:focus:ring-purple-200 rounded-lg !p-1.5 sm:!px-4 xl:!px-5 text-center'}>
        <span className="hidden sm:block">Got Feedback?</span>
        <svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6 sm:hidden block">
          <path d="M368 123.919C362.027 106.725 337.707 106.725 331.733 123.919L328.619 132.879L319.134 133.071C300.937 133.443 293.419 156.572 307.925 167.567L315.486 173.298L312.738 182.377C307.465 199.802 327.138 214.095 342.08 203.698L349.867 198.279L357.653 203.698C372.595 214.095 392.269 199.802 386.995 182.377L384.248 173.298L391.808 167.567C406.315 156.572 398.801 133.443 380.6 133.071L371.115 132.879L368 123.919ZM136.533 179.194C132.007 179.194 127.666 180.992 124.466 184.193C121.265 187.393 119.467 191.734 119.467 196.261C119.467 200.787 121.265 205.128 124.466 208.329C127.666 211.529 132.007 213.327 136.533 213.327H196.267C200.793 213.327 205.134 211.529 208.335 208.329C211.535 205.128 213.333 200.787 213.333 196.261C213.333 191.734 211.535 187.393 208.335 184.193C205.134 180.992 200.793 179.194 196.267 179.194H136.533ZM136.533 324.261C132.007 324.261 127.666 326.059 124.466 329.259C121.265 332.46 119.467 336.801 119.467 341.327C119.467 345.854 121.265 350.195 124.466 353.395C127.666 356.596 132.007 358.394 136.533 358.394H341.333C345.86 358.394 350.201 356.596 353.401 353.395C356.602 350.195 358.4 345.854 358.4 341.327C358.4 336.801 356.602 332.46 353.401 329.259C350.201 326.059 345.86 324.261 341.333 324.261H136.533ZM119.467 268.794C119.467 264.268 121.265 259.927 124.466 256.726C127.666 253.526 132.007 251.727 136.533 251.727H226.133C230.66 251.727 235.001 253.526 238.201 256.726C241.402 259.927 243.2 264.268 243.2 268.794C243.2 273.32 241.402 277.661 238.201 280.862C235.001 284.063 230.66 285.861 226.133 285.861H136.533C132.007 285.861 127.666 284.063 124.466 280.862C121.265 277.661 119.467 273.32 119.467 268.794Z" fill="currentColor"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M435.199 337.064V245.74C456.315 224.194 469.333 194.681 469.333 162.131C469.333 96.151 415.846 42.6641 349.866 42.6641C300.548 42.6641 258.209 72.5478 239.969 115.197H127.999C80.8698 115.197 42.666 153.401 42.666 200.531V337.064C42.666 384.194 80.8698 422.397 127.999 422.397H178.291C180.554 422.398 182.724 423.297 184.324 424.898L221.222 461.796C225.223 465.797 230.649 468.044 236.307 468.044C241.964 468.044 247.391 465.797 251.391 461.796L288.289 424.898C289.083 424.104 290.025 423.475 291.061 423.046C292.098 422.617 293.209 422.397 294.331 422.397H349.866C396.996 422.397 435.199 384.194 435.199 337.064ZM349.866 247.464C396.996 247.464 435.199 209.26 435.199 162.131C435.199 115.001 396.996 76.7974 349.866 76.7974C302.736 76.7974 264.533 115.001 264.533 162.131C264.533 209.26 302.736 247.464 349.866 247.464ZM349.866 281.597C368.187 281.597 385.548 277.472 401.066 270.099V337.064C401.066 365.339 378.141 388.264 349.866 388.264H294.327C283.011 388.264 272.159 392.76 264.157 400.761L236.309 428.61L208.46 400.761C200.459 392.76 189.606 388.264 178.291 388.264H127.999C99.7242 388.264 76.7994 365.339 76.7994 337.064V200.531C76.7994 172.256 99.7242 149.331 127.999 149.331H231.078C230.625 153.582 230.399 157.855 230.399 162.131C230.399 228.11 283.886 281.597 349.866 281.597Z" fill="currentColor"/>
        </svg>
      </Button>

      {/* Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="md:max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="text-left">
            <DialogTitle className="text-left">We're building DesignGenie with you in mind.</DialogTitle>
            <DialogDescription>Your feedback shapes what we launch in a few days.</DialogDescription>
          </DialogHeader>

          {/* What can we do better */}
          <div className="space-y-2 mt-4">
            <Label htmlFor="better" className="text-white text-sm xl:text-base">What can we do better?</Label>
            <Textarea 
              id="better" 
              value={betterFeedback} 
              onChange={(e) => setBetterFeedback(e.target.value)} 
              placeholder={`We'd love your help in improving DesignGenie.\nWhat didn't quite work for you? What would make the experience better or more useful?\n\nIf there's a feature you wished existed but didn't see, tell us about it.\nEven if you're not sure what to write—just start. Any honest feedback is welcome!`} 
              className="min-h-20 md:min-h-24 xl:min-h-32" 
            />
          </div>

          {/* What did you like */}
          <div className="space-y-2 mt-6">
            <Label htmlFor="like" className="text-white text-sm xl:text-base">What did you like?</Label>
            <Textarea 
              id="like" 
              value={likeFeedback} 
              onChange={(e) => setLikeFeedback(e.target.value)} 
              placeholder={`What made you smile? What felt surprisingly easy or helpful?\n\nTell us what worked for you—or what you'd love to see more of.\nAny small win or big wow—we'd love to know!`} 
              className="min-h-20 md:min-h-24 xl:min-h-32" 
            />
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
            {!loading && <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>}
            <Button 
              type="submit" 
              variant="dg_btn" 
              className="min-w-27" 
              onClick={handleSubmit} 
              disabled={!isFormValid || loading}
            >
              {loading ? <Loader className="size-6 [&>div]:size-full" /> : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <FeedbackAcknowledgementDialog open={showFeedbackAcknowledgement} setOpen={setShowFeedbackAcknowledgement}/>
    </>
  )
}