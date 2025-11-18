// components/LinkSizeChartToProjectModal.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "react-hot-toast"
import api from "../api/axios"
import ProjectTreeSelector from "./ProjectTreeSelector"

export default function LinkSizeChartToProjectModal({ open, onClose, sizeChartId, onLinkSuccess }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLink = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first!")
      return
    }

    setLoading(true)
    try {
      await api.post(`/gallery/link-project/size-chart/${sizeChartId}`, {
        target_image_id: selectedImage.id, // <-- linking to image, not project
      })

      onLinkSuccess?.(selectedImage.id)
      onClose()
    } catch (e) {
      console.error("Failed to link image", e)
      toast.error("Failed to link image")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium">Link Size Chart to Image</DialogTitle>
        </DialogHeader>

        {/* Tree Selector */}
        <ProjectTreeSelector
          onSelect={setSelectedImage}
          selectedImageId={selectedImage?.id}
          showSearch={true}
        />

        <Button
          variant="dg_btn"
          className="text-black w-fit mt-4"
          disabled={loading}
          onClick={handleLink}
        >
          {loading ? "Linking..." : "Link Image"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
