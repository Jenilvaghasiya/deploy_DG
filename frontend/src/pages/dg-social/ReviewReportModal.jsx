import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import toast from "react-hot-toast";

const REPORT_TYPES = [
  { value: "false_information", label: "False Information" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

const ReviewReportDialog = ({ reviewId, userId, open, onOpenChange, existingReport }) => {
  const [type, setType] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill if existing report
  useEffect(() => {
    if (open) {
      setType(existingReport?.type || "");
      setText(existingReport?.text || "");
    }
  }, [existingReport, open]);

  const handleReport = async () => {
    if (!type) {
      toast.error("Please select a report reason");
      return;
    }

    try {
      setLoading(true);
      await api.post("/social/post/review/report", {
        reviewId,
        type,
        text,
        reportId: existingReport?._id, // backend can use this to update if exists
      });
      toast.success(existingReport ? "Report updated successfully!" : "Report submitted successfully!");
      onOpenChange(false);
    } catch (err) {
      console.error("Error reporting review:", err);
      toast.error(err?.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingReport ? "Update Report" : "Report Review"}</DialogTitle>
          <DialogDescription>
            {existingReport
              ? "You already reported this review. You can update your report below."
              : "Select a reason and provide more details if necessary."}
          </DialogDescription>
        </DialogHeader>

        {/* Report Type Dropdown */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Reason
          </label>
          <Select onValueChange={setType} value={type}>
            <SelectTrigger className="w-full bg-gray-800 border border-gray-600 text-white">
              <SelectValue placeholder="-- Select reason --" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectGroup>
                {REPORT_TYPES.map((rt) => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Optional Text */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Additional Info (optional)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600"
            placeholder="Write more details here..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReport}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Saving..." : existingReport ? "Update Report" : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewReportDialog;
