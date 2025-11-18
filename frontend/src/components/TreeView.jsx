import React, { useEffect, useState } from "react";
import TreeNode from "../pages/users/TreeNode";
import api from "@/api/axios";
import ChooseAssetTab from "./Assets/ChooseAssetTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { DialogFooter } from "./ui/dialog-new";


const GalleryTreeManager = ({ imageId, isOpen, onClose }) => {
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [parentNodeId, setParentNodeId] = useState(null);
  const [rootId, setRootId] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);

  useEffect(() => {
    console.log("GalleryTreeManager useEffect:", { isOpen, imageId });

    if (isOpen && imageId) {
      loadTrees(imageId);
      loadAssets();
    }
  }, [isOpen, imageId]);

  const loadTrees = async (imageId) => {
    try {
      const response = await api.get(`gallery/trees/${imageId}`);
      if (response.status === 200) setTrees(response.data);
    } catch (error) {
      console.error("Error loading trees:", error);
    }
  };

  const loadAssets = async () => {
    try {
      const imagesRes = await api.get("/gallery/images");
      if (imagesRes.status === 200) setImages(imagesRes.data);
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  };

  const loadTree = async (treeId) => {
    setLoading(true);
    try {
      const response = await api.get(`gallery/tree/${treeId}`);
      if (response.status === 200) {
        setTreeData(response.data);
        setSelectedTree(treeId);
      }
    } catch (error) {
      console.error("Error loading tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const createRootFromImage = async (imageId) => {
    try {
      const image = images.find((img) => img.id === imageId);
      if (!image) return;

      const response = await api.post(`gallery/tree/link`, {
        assetId: image.id,
        assetType: "image",
        assetName: image.name,
        parentId: null,
        rootId: null,
      });

      await loadTrees(image.id);

      if (response.status === 200) {
        const newNode = response.data;
        await loadTree(newNode.id);
      }
    } catch (error) {
      console.error("Error creating root:", error);
    }
  };

  const handleSelectAsset = async (assets) => {
    console.log(assets, 'qqqqqqqqqqqqqqq');
    
    try {
      for (const asset of assets) {
      if (asset.type === 'sizeChart') {
        await api.post(`gallery/tree/link`, {
          assetId: asset.id,
          assetType: "sizechart",
          assetName: asset.name || `SizeChart-${asset.id}`,
          parentId: parentNodeId,
          rootId: rootId,
        });
      } else {
        await api.post(`gallery/tree/link`, {
          assetId: asset.id,
          assetType: "image",
          assetName: asset.name,
          parentId: parentNodeId,
          rootId: rootId,
        });
      }
    }

      await loadTrees(imageId);
      if (selectedTree) await loadTree(selectedTree);

      setShowGallery(false);
      setSelectedImages([]);
    } catch (error) {
      console.error("Error linking assets:", error);
    }
  };

  const handleAddChild = (parentId) => {
    setParentNodeId(parentId);
    setRootId(treeData?.rootId || treeData?.id || null);
    setShowGallery(true);
  };


const handleSelectNode = (id) => {
  setSelectedNodes((prev) =>
    prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
  );
};


  useEffect(() => {
    if (images.length > 0) {
      createRootFromImage(imageId);
    }
  }, [images]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-w-full h-[75vh] overflow-y-auto block" showClose>
        <DialogHeader>
          <DialogTitle className={'text-white'}>Gallery Tree Manager</DialogTitle>
        </DialogHeader>

        {/* Tree Visualization */}
        <div className="flex flex-col rounded-2xl gap-8">
          <div className="rounded-lg p-6">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : treeData ? (
              <div className="overflow-auto custom-scroll">
                <TreeNode node={treeData} onAddChild={handleAddChild} selected={selectedNodes}
  onSelect={handleSelectNode} />
              </div>
            ) : (
              <div className="text-center text-white py-8">
                Select a tree to view its structure
              </div>
            )}
          </div>
        </div>

        {/* Asset Selection Tab */}
        {showGallery && (
          <ChooseAssetTab
            open={showGallery}
            onClose={() => setShowGallery(false)}
            onSelect={handleSelectAsset}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            imageId={imageId}
          />
        )}

        {/* Close button */}
            <DialogFooter className="flex justify-end gap-2 mt-4">

          {/* <button
            onClick={onClose}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded"
          >
            Close
          </button> */}
            {/* <Button variant="dg_btn" className={'me-2'}>Download</Button> */}
          <DialogClose asChild>
            <Button variant="dg_btn">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryTreeManager;
