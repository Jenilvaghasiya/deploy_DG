import React, { useState } from 'react';
import { Image, FileText, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { BsImages } from 'react-icons/bs';
import InputImagePreviewDialog from '@/components/InputImagePreviewDialog';

export default function TreeNode({ node, onAddChild, level = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [error, setError] = useState("");

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const nodeId = node.id ?? node._id ?? node.key;
  const nodeName = node.name ?? node.title ?? 'Untitled';
  const nodeType = node.type ?? (hasChildren ? 'folder' : 'file');

  const getIcon = () =>
    nodeType === 'image'
      ? <Image className="w-4 h-4 text-blue-500" />
      : <FileText className="w-4 h-4 text-green-500" />;

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-2 px-3 hover:bg-white group rounded-lg cursor-pointer ${level === 0 ? 'bg-pink-500' : ''}`}
        style={{ marginLeft: `${level * 4}px` }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center flex-1">
          {hasChildren ? (
            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
              {expanded ? (
                <ChevronDown className="w-4 h-4 text-white group-hover:text-black" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white group-hover:text-black" />
              )}
            </div>
          ) : null}

          {getIcon()}
          <span className="ml-2 font-medium text-white group-hover:text-black max-w-80 w-full grow text-ellipsis overflow-hidden whitespace-nowrap">
            {nodeName}
          </span>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
            nodeType === 'image' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {nodeType}
          </span>
        </div>

        {/* Preview */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (node.assetId) setSelectedImageIds([node.assetId]);
            setPreviewOpen(true);
          }}
          className="ml-2 p-1 text-white group-hover:text-black hover:text-blue-500 hover:bg-blue-50 rounded"
          title="Preview Images"
        >
          <BsImages className="w-4 h-4" />
        </button>

        {/* Add child */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true); // Make sure you see the new child
            if (typeof onAddChild === 'function') {
              onAddChild(nodeId);
            } else {
              console.warn('onAddChild was not provided or is not a function');
            }
          }}
          className="ml-2 p-1 text-white group-hover:text-black hover:text-blue-500 hover:bg-blue-50 rounded"
          title="Add child"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {expanded && hasChildren && (
        <div className="ml-4">
          {node.children.map((child, index) => (
            <TreeNode
              key={(child.id ?? child._id ?? child.key ?? index) + '-' + index}
              node={child}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </div>
      )}

      <InputImagePreviewDialog
        open={previewOpen}
        setOpen={setPreviewOpen}
        galleryImageIds={selectedImageIds}
        setError={setError}
      />
    </div>
  );
}
