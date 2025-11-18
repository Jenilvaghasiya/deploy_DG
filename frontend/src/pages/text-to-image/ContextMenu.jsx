import React from 'react'

const ContextMenu = ({ contextMenu, setContextMenu }) => {
    if (!contextMenu.visible) return null;

    const handleClose = () => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    };

    return (
      <div
        className="fixed bg-gray-700 text-white rounded-lg shadow-lg z-50"
        style={{ top: contextMenu.y, left: contextMenu.x }}
        onClick={handleClose}
      >
        <div className="py-2 px-4">
          <div className="font-bold border-b border-gray-600 pb-1 mb-1">EDIT</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Delete</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Move to: Save to later</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Move to: Finalised</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Create Size Chart</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Create Tech Pack</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Image Variation</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Combine Two Images</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Sketch to Photo</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Download</div>
          <div className="py-1 hover:bg-gray-600 cursor-pointer">Cutouts</div>
        </div>
      </div>
    );
  };

export default ContextMenu