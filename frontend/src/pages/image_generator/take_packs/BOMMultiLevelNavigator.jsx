// components/BOM/BOMMultiLevelNavigator.jsx - FIXED VERSION

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FolderTree, FileText, Trash2 } from "lucide-react";
import BOMTableView from "./BOMTableView";
import BOMNotesView from "./BOMNotesView";

export default function BOMMultiLevelNavigator({ 
  sections, 
  setSections, 
  viewType, 
  currentPath, 
  setCurrentPath,
  inheritedWastageAllowance,
  inheritedIncludeCost,
  onPrefillFromTechPack,
  onCopyFromTechPack
}) {
  const [editingSection, setEditingSection] = useState(null);

  // Get current section based on path
  const getCurrentSection = () => {
    if (currentPath.length === 0) return null;
    
    let current = sections;
    for (let i = 0; i < currentPath.length; i++) {
      const section = current.find(s => s.id === currentPath[i]);
      if (!section) return null;
      if (i === currentPath.length - 1) return section;
      current = section.subsections || [];
    }
    return null;
  };

  const getCurrentSections = () => {
    if (currentPath.length === 0) return sections;
    
    const parent = getCurrentSection();
    return parent?.subsections || [];
  };

  const addSection = (name, type) => {
    const newSection = {
      id: Date.now(),
      name,
      type,
      items: [],
      subsections: type === 'multi' ? [] : undefined,
      order: getCurrentSections().length,
    };

    if (currentPath.length === 0) {
      // Add to root
      setSections([...sections, newSection]);
    } else {
      // Add to current section
      setSections(prevSections => {
        const updateNested = (sectionsList, path, index = 0) => {
          return sectionsList.map(section => {
            if (section.id === path[index]) {
              if (index === path.length - 1) {
                // Found target section
                return {
                  ...section,
                  subsections: [...(section.subsections || []), newSection],
                };
              } else {
                // Keep traversing
                return {
                  ...section,
                  subsections: updateNested(section.subsections || [], path, index + 1),
                };
              }
            }
            return section;
          });
        };

        return updateNested(prevSections, currentPath);
      });
    }

    if (type === 'single') {
      // Navigate into the new single-level section
      setEditingSection({ ...newSection, path: [...currentPath, newSection.id] });
    } else {
      // Navigate into the multi-level section to add more subsections
      setCurrentPath([...currentPath, newSection.id]);
    }
  };

  const deleteSection = (sectionId) => {
    if (!confirm("Are you sure you want to delete this section and all its subsections?")) {
      return;
    }

    if (currentPath.length === 0) {
      setSections(sections.filter(s => s.id !== sectionId));
    } else {
      setSections(prevSections => {
        const updateNested = (sectionsList, path, index = 0) => {
          return sectionsList.map(section => {
            if (section.id === path[index]) {
              if (index === path.length - 1) {
                return {
                  ...section,
                  subsections: section.subsections?.filter(s => s.id !== sectionId),
                };
              } else {
                return {
                  ...section,
                  subsections: updateNested(section.subsections || [], path, index + 1),
                };
              }
            }
            return section;
          });
        };

        return updateNested(prevSections, currentPath);
      });
    }
  };

  // ✅ FIX: Update items without navigating away
  const updateEditingSectionItems = (updatedItems) => {
    if (!editingSection) return;

    setSections(prevSections => {
      const updateNested = (sectionsList, path, index = 0) => {
        return sectionsList.map(section => {
          if (section.id === path[index]) {
            if (index === path.length - 1) {
              return {
                ...section,
                items: updatedItems,
              };
            } else {
              return {
                ...section,
                subsections: updateNested(section.subsections || [], path, index + 1),
              };
            }
          }
          return section;
        });
      };

      return updateNested(prevSections, editingSection.path);
    });

    // ✅ Update editing section state to keep it open
    setEditingSection(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionType, setNewSectionType] = useState("single");

  // Breadcrumb
  const getBreadcrumb = () => {
    const crumbs = [{ name: "Root", path: [] }];
    
    let current = sections;
    for (let i = 0; i < currentPath.length; i++) {
      const section = current.find(s => s.id === currentPath[i]);
      if (section) {
        crumbs.push({ name: section.name, path: currentPath.slice(0, i + 1) });
        current = section.subsections || [];
      }
    }
    
    return crumbs;
  };

  // If editing a single-level section
  if (editingSection) {
    return (
      <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400  p-3 rounded-lg border border-zinc-700 flex-wrap">
          {getBreadcrumb().map((crumb, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-600">/</span>}
              <button
                onClick={() => {
                  setEditingSection(null);
                  setCurrentPath(crumb.path);
                }}
                className="hover:text-white transition-colors"
              >
                {crumb.name}
              </button>
            </span>
          ))}
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-white font-semibold">{editingSection.name}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setEditingSection(null)}
          variant="outline"
          size="sm"
          className="text-black border-zinc-600 hover:bg-zinc-700 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sections
        </Button>

          {/* ✅ ADD: Pre-fill button for editing section */}
          <Button
            onClick={() => onPrefillFromTechPack(updateEditingSectionItems)}
            variant="outline"
            size="sm"
            className="text-blue-400 border-blue-500/50 hover:bg-blue-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Pre-fill from Tech Pack
          </Button>

          {/* ✅ ADD: Copy button for editing section */}
          <Button
            onClick={() => onCopyFromTechPack(updateEditingSectionItems)}
            variant="outline"
            size="sm"
            className="text-purple-400 border-purple-500/50 hover:bg-purple-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Copy from Another Tech Pack
          </Button>
        </div>

        {/* Items Editor */}
        <div className=" rounded-lg p-4 border border-zinc-700">
          {viewType === 'table' ? (
            <BOMTableView
              items={editingSection.items}
              setItems={updateEditingSectionItems}
              inheritedWastageAllowance={inheritedWastageAllowance}
              inheritedIncludeCost={inheritedIncludeCost}
            />
          ) : (
            <BOMNotesView
              items={editingSection.items}
              setItems={updateEditingSectionItems}
              inheritedWastageAllowance={inheritedWastageAllowance}
              inheritedIncludeCost={inheritedIncludeCost}
            />
          )}
        </div>
      </div>
    );
  }

  // Navigation view
  return (
    <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 p-3 rounded-lg border border-zinc-700 flex-wrap">
        {getBreadcrumb().map((crumb, index) => (
          <span key={index} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-600">/</span>}
            <button
              onClick={() => setCurrentPath(crumb.path)}
              className={`hover:text-white transition-colors ${
                index === getBreadcrumb().length - 1 ? 'text-white font-semibold' : ''
              }`}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {/* Back Button */}
      {currentPath.length > 0 && (
        <Button
          onClick={() => setCurrentPath(currentPath.slice(0, -1))}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      )}

      {/* Sections List */}
      <div className="space-y-3">
        {getCurrentSections().length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-zinc-800/30 rounded-lg border-2 border-dashed border-zinc-700">
            <FolderTree className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="mb-4">No sections created yet.</p>
          </div>
        ) : (
          getCurrentSections().map((section) => (
            <div
              key={section.id}
              className="rounded-lg p-4 border border-zinc-700 hover:border-zinc-600 transition-all shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {section.type === 'multi' ? (
                    <FolderTree className="w-5 h-5 text-purple-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                  <div>
                    <h4 className="text-white font-semibold">{section.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {section.type === 'multi' 
                        ? `${section.subsections?.length || 0} subsections` 
                        : `${section.items?.length || 0} items`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {section.type === 'multi' ? (
                    <Button
                      onClick={() => setCurrentPath([...currentPath, section.id])}
                      variant="outline"
                      size="sm"
                      className="bg-purple-400/10 text-purple-400 border-purple-400/50 hover:bg-purple-400/20 hover:text-purple-300"
                    >
                      Open
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setEditingSection({ ...section, path: [...currentPath, section.id] })}
                      variant="outline"
                      size="sm"
                      className="bg-blue-400/10 text-blue-400 border-blue-400/50 hover:bg-blue-400/20 hover:text-blue-300"
                    >
                      Edit Items
                    </Button>
                  )}

                  <Button
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Section Button */}
      <Button
        onClick={() => setShowAddModal(true)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Section
      </Button>

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md space-y-4 mx-4">
            <h3 className="text-xl font-bold text-white">Add New Section</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Section Name
              </label>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Fabric, Trims, Main Body"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Section Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNewSectionType('single')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    newSectionType === 'single'
                      ? 'border-blue-500 bg-blue-500/20 text-white'
                      : 'border-zinc-700 bg-zinc-800/50 text-gray-400 hover:border-zinc-600'
                  }`}
                >
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Single Level</div>
                  <div className="text-xs mt-1">Add items directly</div>
                </button>

                <button
                  onClick={() => setNewSectionType('multi')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    newSectionType === 'multi'
                      ? 'border-purple-500 bg-purple-500/20 text-white'
                      : 'border-zinc-700 bg-zinc-800/50 text-gray-400 hover:border-zinc-600'
                  }`}
                >
                  <FolderTree className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Multi-Level</div>
                  <div className="text-xs mt-1">Add subsections</div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setNewSectionName("");
                  setNewSectionType("single");
                }}
                variant="outline"
                className="flex-1 bg-zinc-800 text-gray-300 border-zinc-600 hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newSectionName.trim()) {
                    addSection(newSectionName.trim(), newSectionType);
                    setShowAddModal(false);
                    setNewSectionName("");
                    setNewSectionType("single");
                  }
                }}
                disabled={!newSectionName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                Create Section
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}