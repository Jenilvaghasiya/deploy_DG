"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast"
import api from "../api/axios"; // adjust your api import

export default function SaveAsTemplateDialog({ open, onOpenChange, sizeChartId, onSuccess }) {
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        sizeChartId,
        template_name: templateName.trim(),
      };

      const response = await api.post(`/image-variation/saveAsTemplate`, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success("Template saved successfully");
        setTemplateName("");
        onOpenChange(false);
        if (onSuccess) onSuccess(response.data?.data);
      } else {
        toast.error("Failed to save template");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save As Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Label htmlFor="templateName" className={"text-white"}>Template Name</Label>
          <Input
            id="templateName"
            placeholder="Enter template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className={"text-white"}
          />
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
