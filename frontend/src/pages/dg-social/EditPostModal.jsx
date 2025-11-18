import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageZoomDialog from "@/components/ImageZoomDialog";

const EditPostModal = ({ post, isOpen, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState({ title: "", description: "", image: null });
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || "",
        description: post.description || "",
        image: null, // fresh image not selected yet
      });
      setPreview(post.url || ""); // show current image if exists
    }
  }, [post]);

  // handle file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file)); // preview new image
    }
  };

  if (!post) return null;
console.log('saving:', formData);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex justify-between items-center mb-4">
          <DialogTitle className="text-xl font-bold text-white">Edit Post</DialogTitle>
        </DialogHeader>

        <DialogDescription className="space-y-4 overflow-y-auto p-2 custom-scroll">
          {/* Title */}
          <Input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-3  rounded-lg text-white border border-gray-700"
          />

          {/* Description */}
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full h-60 p-3 custom-scroll rounded-lg text-white border focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">Post Image</label>
            {preview && (
              <div className="relative w-full max-h-max">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-max object-cover rounded-lg border border-gray-700 mb-2"
              />
               <div className="absolute top-2 right-2">
                  <ImageZoomDialog
                    imageUrl={preview}
                    triggerLabel="Preview"
                    className="bg-zinc-700 hover:bg-zinc-600 text-white p-2 rounded"
                  />
                </div>
                </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-white p-2 rounded-lg border border-gray-700"
            />
          </div>
        </DialogDescription>

        {/* Footer buttons */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} className="px-4 py-2 rounded-lg">
            Cancel
          </Button>
          <Button
            variant="dg_btn"
            onClick={() => onSave(formData)}
            disabled={saving}
            className="px-4 py-2"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
