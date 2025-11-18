// components/LinkGeneratedToProjectModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import api from "../api/axios"
import ProjectTreeSelector from "./ProjectTreeSelector"

export default function LinkGeneratedToProjectModal({ open, onClose, image, onLinkSuccess }) {
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLink = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      await api.post(`/gallery/link-project/generated-image/${image.originalId}`, {
        imageUrlEncrypted: image.url,
        project_id: selectedProject.id, // Note: now using selectedProject.id since it's an object
      });

      onLinkSuccess?.(selectedProject.id);
      onClose();
    } catch (e) {
      console.error("Failed to link project", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Image to Project</DialogTitle>
        </DialogHeader>
        
        <ProjectTreeSelector
          onSelect={setSelectedProject}
          selectedProject={selectedProject}
          linkedProjectId={null}
          showSearch={true}
          showDateFilter={false}
        />

        <Button 
          variant="dg_btn" 
          className="text-black w-fit" 
          disabled={!selectedProject || loading} 
          onClick={handleLink}
        >
          {loading ? "Linking..." : "Link Project"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
