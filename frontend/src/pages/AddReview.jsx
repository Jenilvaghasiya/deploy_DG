import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import api from "@/api/axios";
import toast from "react-hot-toast";

const ReviewModal = ({ onSuccess, onFail, buttonText = "Add Review", buttonClassName = "" }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      onFail?.("Please enter a title");
      return;
    }

    if (!description.trim()) {
      onFail?.("Please enter a description");
      return;
    }

    if (rating === 0) {
      onFail?.("Please select a rating");
      return;
    }

    try {
      setLoading(true);

      console.log("Submitting review:", {
        title: title.trim(),
        description: description.trim(),
        rating,
      });

      const response = await api.post("/social/app-review/create", {
        title: title.trim(),
        description: description.trim(),
        rating,
      });

      console.log("Received response:", response);

      if (response.status === 201) {
        console.log("Review submitted successfully:", response.data);

        // ✅ Call onSuccess with the review data
        onSuccess?.({
          title: title.trim(),
          description: description.trim(),
          rating,
        });

        toast.success("Review submitted successfully!");

        // ✅ Reset form and close modal
        setTitle("");
        setDescription("");
        setRating(0);
        setHoveredRating(0);
        setOpen(false);
      } else {
        console.error("Failed to submit review:", response);
        onFail?.(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:>>>>", error?.response?.data?.nextReviewDate);
      toast.error(error?.response?.data?.message || "Failed to submit review");
      if (error?.response?.data?.nextReviewDate) {
        const nextDate = new Date(error.response.data.nextReviewDate);
        onFail?.(`Next review available after: ${nextDate.toLocaleString()}`);
      } else {
        onFail?.(error?.response?.data?.message || "Failed to submit review");
      }
    } finally {
      setLoading(false);
    }
  };


  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setRating(0);
    setHoveredRating(0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={buttonClassName} variant={'dg_btn'}>
          {buttonText}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
          <DialogDescription>
            Share your experience by rating and writing a review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:border-gray-500 focus:outline-none"
              placeholder="Enter review title..."
              maxLength={100}
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:border-gray-500 focus:outline-none resize-none"
              placeholder="Write your review here..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right">
              {description.length}/500
            </p>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-400"
                    } transition-colors cursor-pointer`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-400">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="dg_btn"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title || !description || rating === 0}
            variant={'dg_btn'}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;