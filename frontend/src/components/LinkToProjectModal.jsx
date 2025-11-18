// components/LinkToProjectModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "react-hot-toast"
import api from "../api/axios"
import ProjectTreeSelector from "./ProjectTreeSelector"

export default function LinkToProjectModal({
  open,
  imageId,
  currentProjectId,
  onClose,
  onLinkSuccess,
  fetchGalleryImages
}) {
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLink = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first!")
      return
    }
    if (currentProjectId && selectedProject.id === currentProjectId) {
      toast.error("Image is already linked to this project!")
      return
    }

    setLoading(true)
    try {
      const response =  await api.post(`/gallery/link-project/${imageId}`, { project_id: selectedProject.id })      
      onLinkSuccess?.(selectedProject.id)
      toast.success(response.data?.message || "Project linked successfully!");
      fetchGalleryImages?.()
      onClose()
    } catch (e) {
      const errorMessage =
        e.response?.data?.message || "Failed to link project. Please try again.";
        toast.error(errorMessage);
      console.error("Failed to link project", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={'text-2xl font-medium'}>Link Image to Project</DialogTitle>
        </DialogHeader>

        <ProjectTreeSelector
          onSelect={setSelectedProject}
          selectedProject={selectedProject}
          linkedProjectId={currentProjectId}
          showSearch={true}
          showDateFilter={false}
        />

        <Button
          variant="dg_btn"
          className="text-black w-fit"
          disabled={loading}
          onClick={handleLink}
        >
          {loading ? "Linking..." : "Link Project"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}