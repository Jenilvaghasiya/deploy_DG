import React, { useState } from "react";
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
  { value: "i_just_dont_like_it", label: "I just don't like it" },
  { value: "bullying_or_unwanted_contact", label: "Bullying or unwanted contact" },
  { value: "suicide_self_injury_or_eating_disorders", label: "Self-harm or eating disorders" },
  { value: "violence_hate_or_harmful_organizations", label: "Violence, hate or harmful organizations" },
  { value: "nudity_or_sexual_content", label: "Nudity or sexual content" },
  { value: "hate_speech_or_symbols", label: "Hate speech or symbols" },
  { value: "sale_or_promotion_of_illegal_or_regulated_goods", label: "Illegal or regulated goods" },
  { value: "scams_or_fraud", label: "Scams or fraud" },
  { value: "intellectual_property_violation", label: "Intellectual property violation" },
  { value: "false_information", label: "False information" },
  { value: "other", label: "Other" },
];

const ReportDialog = ({ postId, userId, open, onOpenChange }) => {
  const [type, setType] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!type) {
      toast.error("Please select a report reason");
      return;
    }

    try {
      setLoading(true);
      await api.post("/social/post/report", {
        postId,
        user_id: userId,
        type,
        text,
      });
      toast.success("Report submitted successfully!");
      onOpenChange(false);
      setType("");
      setText("");
    } catch (err) {
      console.error("Error reporting post:", err);
      toast.error(err?.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Post</DialogTitle>
          <DialogDescription>
            Select a reason and provide more details if necessary.
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
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReport}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Reporting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
