import { useState, useEffect } from "react";
import Table from "../../components/Table";
import { MdEdit, MdMoreVert, MdRemoveRedEye } from "react-icons/md";
import SmartInput from "../../components/SmartInput";
import Button from "../../components/Button";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { cn, hasPermission } from "../../lib/utils";

export default function CommunityRoleList() {
  const [roles, setRoles] = useState([]);
  const [apiPermissions, setApiPermissions] = useState([]); // Store API permissions
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    role: null,
  });
  const [form, setForm] = useState({
    name: "",
    permissions: [],
    description: "",
  });
  const [formError, setFormError] = useState("");
  const { user } = useAuthStore();

  const permissions = user?.role?.permissions || [];
  const permissionKeys = permissions.map((p) => p.key);
  const hasCreateRolePermission = hasPermission(
    permissionKeys,
    "administration:role:create"
  );
  const hasEditRolePermission = hasPermission(
    permissionKeys,
    "administration:role:update"
  );
  const hasDeleteRolePermission = hasPermission(
    permissionKeys,
    "administration:role:delete"
  );

  // Create permission structure based on API data
  const createPermissionStructure = (apiPermissions) => {
    const structure = [
      {
        name: "Admin Permissions",
        permissions: ["tenant:admin:admin"],
      },
      // {
      //   name: "Usage Stats",
      //   permissions: ["dashboard:view"],
      // },
      {
        name: "Administration",
        permissions: ["administration:view"],
        child: [
          {
            name: "Usage Stats",
            permissions: ["dashboard:view"],
          },
          {
            name: "User Management",
            permissions: [
              "administration:user-management:read",
              "administration:user-management:create",
              "administration:user-management:update",
              "administration:user-management:delete",
            ],
          },
          {
            name: "Roles",
            permissions: [
              "administration:role:read",
              "administration:role:create",
              "administration:role:update",
              "administration:role:delete",
            ],
          },
        ],
      },
      {
        name: "Workspace",
        permissions: ["workspace:view"],
        child: [
          {
            name: "Direct Messages",
            permissions: [
              "workspace:direct-messages:view",
              "workspace:direct-messages:create",
            ],
          },
          {
            name: "Broadcast Messages",
            permissions: [
              "workspace:broadcast-messages:create",
            ],
          },
          {
            name: "Moodboards",
            permissions: [
              "workspace:moodboards:read",
              "workspace:moodboards:create",
              "workspace:moodboards:update",
              "workspace:moodboards:delete",
            ],
          },
          {
            name: "My Gallery",
            permissions: [
              "workspace:my-gallery:read",
              "workspace:my-gallery:create",
              "workspace:my-gallery:update",
              "workspace:my-gallery:delete",
              "workspace:my-gallery:finalise",
            ],
          },
          {
            name: "My Projects",
            permissions: [
              "workspace:my-projects:read",
              "workspace:my-projects:create",
              "workspace:my-projects:update",
              "workspace:my-projects:delete",
            ],
          },
        ],
      },
      {
        name: "AI Design Lab",
        permissions: ["ai-design-lab:view"],
        child: [
          {
            name: "Text to Image",
            permissions: [
              "ai-design-lab:text-to-image:create",
              "ai-design-lab:text-to-image:finalise",
            ],
          },
          {
            name: "Sketch To Photo",
            permissions: [ // //TODO:HIDE-SKETCH-TO-IMAGE
              "ai-design-lab:sketch-to-image:create",
              "ai-design-lab:sketch-to-image:finalise",
            ],
          },
          {
            name: "Combine Images",
            permissions: [
              "ai-design-lab:combine-images:create",
              "ai-design-lab:combine-images:finalise",
            ],
          },
          {
            name: "Size Chart",
            permissions: [
              "ai-design-lab:ai-size-chart:create",
              "ai-design-lab:ai-size-chart:finalise",
            ],
          },
          {
            name: "Image Editor Basic",
            permissions: [
              "ai-design-lab:image-editor:create",
              "ai-design-lab:image-editor:finalise",
            ],
          },
          {
            name: "Variations",
            permissions: [
              "ai-design-lab:image-variations:create",
              "ai-design-lab:image-variations:finalise",
            ],
          },
           {
            name: "Color Variations",
            permissions: [
              "ai-design-lab:color-variations:create",
              "ai-design-lab:color-variations:finalise",
            ],
          },
          {
            name: "Pattern Cutouts",
            permissions: [
              "ai-design-lab:pattern-cutouts:create",
              "ai-design-lab:pattern-cutouts:view",
              "ai-design-lab:pattern-cutouts:update",
              "ai-design-lab:pattern-cutouts:delete"
            ],
          },
          {
            name: "Color Detections",
            permissions: [
              "ai-design-lab:color-detections:create",
              "ai-design-lab:color-detections:view",
              "ai-design-lab:color-detections:update",
              "ai-design-lab:color-detections:delete"
            ],
          },
          {
            name: "Tech Packs",
            permissions: [
              "ai-design-lab:tech-packs:create",
              "ai-design-lab:tech-packs:view",
              "ai-design-lab:tech-packs:update",
              "ai-design-lab:tech-packs:delete"
            ],
          },
        ],
      },
      {
        name: "Social Design Genie",
        permissions: ["social:view"],
        child: [
          {
            name: "Social Posts",
            permissions: [
              "social:post:create",
              "social:post:view",
            ],
          },
          {
            name: "Social Post Comments",
            permissions: [
              "social:post:comment:create",
              "social:post:comment:view",
            ],
          },
          {
            name: "Social Post Feedback",
            permissions: [
              "social:post:feedback:create",
              "social:post:feedback:view",
            ],
          },
          {
            name: "Social Post Review",
            permissions: [
              "social:post:review:create",
              "social:post:review:view",
            ],
          },
          {
            name: "Social Post Report",
            permissions: [
              "social:post:report:create",
              "social:post:report:view",
            ],
          },
        ],
      },
    ];

    return structure;
  };

  // Get permission ID by key
  const getPermissionId = (key) => {
    const permission = apiPermissions.find((p) => p.key === key);
    return permission ? permission.id : null;
  };

  // Get permission label from key
  const getPermissionLabel = (key) => {
    const parts = key.split(":");
    return (
      parts[parts.length - 1].charAt(0).toUpperCase() +
      parts[parts.length - 1].slice(1)
    );
  };

  // Initialize selected permissions
  const initializeSelectedPermissions = () => {
    const initialPermissions = {};
    apiPermissions.forEach((permission) => {
      initialPermissions[permission.key] = false;
    });
    setSelectedPermissions(initialPermissions);
  };

  // Fetch permissions and roles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [permissionsRes, rolesRes, userProjectRolesRes] =
          await Promise.all([
            api.get("/permissions"),
            api.get("/roles"),
            api.get("/user-project-roles", {
              params: {
                userId: useAuthStore.getState().user.id,
              },
            }),
          ]);

        console.log("Permissions Response:", permissionsRes.data);
        console.log("Roles Response:", rolesRes.data);
        console.log("User Project Roles Response:", userProjectRolesRes.data);

        // Store API permissions
        const permissionsData = permissionsRes.data.data || [];
        console.log("Permissions Data:", permissionsData);
        // const permissionsData = permissionArray;
        setApiPermissions(permissionsData);

        // Fix the roles mapping
        const rolesData = rolesRes.data.data || [];
        const userProjectRolesData = userProjectRolesRes.data.data || [];

        const rolesWithUsers = rolesData.map((role) => {
          const assignedUsers = userProjectRolesData
            .filter(
              (upr) => upr.role_id?.id === role.id || upr.role_id === role.id
            )
            .map((upr) => ({
              id: upr.user_id?.id || upr.user_id,
              name:
                upr.user_id?.full_name || upr.user_id?.email || "Unknown User",
              avatar: upr.user_id?.avatar || "",
            }));

          return {
            ...role,
            users: assignedUsers.length > 0 ? assignedUsers : "all",
          };
        });

        console.log("Processed roles with users:", rolesWithUsers);
        setRoles(rolesWithUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFormError(error.response?.data?.message || "Failed to load data");
      }
    };
    fetchData();
  }, []);

  // Initialize selected permissions when API permissions are loaded
  useEffect(() => {
    if (apiPermissions.length > 0) {
      initializeSelectedPermissions();
    }
  }, [apiPermissions]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ show: false, x: 0, y: 0, role: null });
    };
    if (contextMenu.show) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [contextMenu.show]);

  const resetForm = () => {
    setForm({ name: "", permissions: [], description: "" });
    setEditingRole(null);
    setFormError("");
    setIsViewMode(false);
    initializeSelectedPermissions();
  };

  const handleAddRole = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleEditRole = (role) => {
    setIsViewMode(false);
    setEditingRole(role);

    // Reset permissions first
    initializeSelectedPermissions();

    // Set selected permissions based on role's permissions
    const updatedPermissions = { ...selectedPermissions };
    role.permissions?.forEach((perm) => {
      const permissionKey = perm.key;
      if (updatedPermissions.hasOwnProperty(permissionKey)) {
        updatedPermissions[permissionKey] = true;
      }
    });
    setSelectedPermissions(updatedPermissions);

    setForm({
      name: role.name,
      permissions: role.permissions || [],
      description: role.description || "",
    });
    setFormOpen(true);
    setContextMenu({ show: false, x: 0, y: 0, role: null });
  };

  const handleContextMenu = (e, role) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX - 393,
      y: e.clientY - 73,
      role,
    });
  };

  const handleCopyRole = async (role) => {
    try {
      const roleData = {
        name: `${role.name} (Copy)`,
        permissions: role.permissions.map((p) => p.id),
        description: role.description,
        tenant_id: localStorage.getItem("tenant_id"),
      };
      const roleRes = await api.post("/roles", roleData);

      setRoles((prev) => [...prev, { ...roleRes.data.data, users: "all" }]);
      setContextMenu({ show: false, x: 0, y: 0, role: null });
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to copy role");
    }
  };

  const handleDeleteRole = async (role) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the role "${role.name}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/roles/${role.id}`);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      setContextMenu({ show: false, x: 0, y: 0, role: null });
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to delete role");
    }
  };

  const handlePermissionChange = (permissionKey, checked) => {
    setSelectedPermissions((prev) => {
      const updated = { ...prev, [permissionKey]: checked };
      
      // Create permission structure on the fly for this operation
      const permissionStructure = createPermissionStructure(apiPermissions);
      
      // Rule 1: Parent view unchecked → reset its children
      permissionStructure.forEach((section) => {
        // Check if this section has a view permission
        const parentViewKey = section.permissions.find(p => p.endsWith(':view'));
        if (parentViewKey && permissionKey === parentViewKey && !checked) {
          // Uncheck all children + their permissions
          if (section.child) {
            section.child.forEach((child) => {
              child.permissions.forEach((cp) => {
                updated[cp] = false;
              });
            });
          }
        }
      });

      // Rule 2: Child view unchecked → reset its other permissions
      permissionStructure.forEach((section) => {
        if (section.child) {
          section.child.forEach((child) => {
            const childViewKey = child.permissions.find(p => p.endsWith(':view') || child.permissions.find(p => p.endsWith(':read')));
            if (childViewKey && permissionKey === childViewKey && !checked) {
              // Uncheck all other permissions of that child
              child.permissions.forEach((cp) => {
                if (cp !== childViewKey) updated[cp] = false;
              });
            }
          });
        }
      });

      return updated;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Role name is required");
      return;
    }

    // Get selected permission IDs
    const selectedPermissionIds = Object.keys(selectedPermissions)
      .filter((key) => selectedPermissions[key])
      .map((key) => getPermissionId(key))
      .filter((id) => id !== null);

    if (selectedPermissionIds.length === 0) {
      setFormError("At least one permission is required");
      return;
    }

    // Console log the selected permission IDs
    console.log("Selected Permission IDs:", selectedPermissionIds);

    try {
      const roleData = {
        name: form.name,
        permissions: selectedPermissionIds,
        description: form.description,
        tenant_id: localStorage.getItem("tenant_id"),
      };

      setLoading(true);
      if (editingRole) {
        console.log(editingRole, 'editingRole');
        
        // Update existing role
        const roleRes = await api.put(`/roles/${editingRole.id}`, roleData);
        setRoles((prev) =>
          prev.map((role) =>
            role.id === editingRole.id
              ? { ...roleRes.data.data, users: role.users }
              : role
          )
        );
      } else {
        // Create new role
        const roleRes = await api.post("/roles", roleData);
        setRoles((prev) => [...prev, { ...roleRes.data.data, users: "all" }]);
      }

      resetForm();
      setFormOpen(false);
    } catch (error) {
      setFormError(error.response?.data?.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const renderUsers = (role) => {
    if (!role.users) {
      return <span className="text-gray-300">None</span>;
    }
    if (role.users === "all") {
      return <span className="text-gray-300">All</span>;
    }
    if (!Array.isArray(role.users)) {
      return <span className="text-gray-300">Invalid users data</span>;
    }
    return (
      <div className="flex -space-x-2">
        {role.users.map((user, index) => (
          <div
            key={user.id}
            className="relative"
            style={{ zIndex: role.users.length - index }}
          >
            <div
              className="w-8 h-8 rounded-full bg-pink-500 border-2 border-gray-800 flex items-center justify-center text-xs font-semibold text-white overflow-hidden"
              title={user.name}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentNode.textContent = user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("");
                  }}
                />
              ) : (
                user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              )}
            </div>
          </div>
        ))}
        {role.users.length > 5 && (
          <div
            className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs font-semibold text-white"
            style={{ zIndex: 0 }}
          >
            +{role.users.length - 5}
          </div>
        )}
      </div>
    );
  };

  const handleViewRole = (role) => {
  setIsViewMode(true);
  setEditingRole(role);

  // Reset permissions first
  initializeSelectedPermissions();

  // Set selected permissions based on role's permissions
  const updatedPermissions = { ...selectedPermissions };
  role.permissions?.forEach((perm) => {
    const permissionKey = perm.key;
    if (updatedPermissions.hasOwnProperty(permissionKey)) {
      updatedPermissions[permissionKey] = true;
    }
  });
  setSelectedPermissions(updatedPermissions);

  setForm({
    name: role.name,
    permissions: role.permissions || [],
    description: role.description || "",
  });
  setFormOpen(true);
};

  const columns = [
    {
      header: "Role",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-7 md:size-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-semibold text-sm leading-none">
            {r.name === "Editor" ? "E" : r.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span>{r.name}</span>
            {r.is_predefined && (
              <span className="text-xs text-zinc-900 px-2 py-px bg-muted rounded-md w-fit mt-1">
                Predefined
              </span>
            )}
          </div>
        </div>
      ),
    },
    { header: "Users", render: renderUsers },
    {
      header: "Actions",
      render: (role) => {
        const userRoleIds = user?.role ? [user.role.id] : [];

        const isDisabled = role.is_predefined || userRoleIds.includes(role.id);

        return (
          <div className="flex gap-2 text-xs justify-start">
            <button
          onClick={() => handleViewRole(role)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-700"
          title="View role details"
        >
          <span className="text-lg">
            <MdRemoveRedEye />
          </span>
        </button>
            {hasEditRolePermission && (
              <button
                onClick={() => !isDisabled && handleEditRole(role)}
                disabled={isDisabled}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full",
                  isDisabled
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-pink-400 hover:bg-gray-700"
                )}
              >
                <span className="text-lg">
                  <MdEdit />
                </span>
              </button>
            )}
            {hasDeleteRolePermission && (
              <button
                onClick={(e) => !isDisabled && handleContextMenu(e, role)}
                disabled={isDisabled}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full",
                  isDisabled
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-gray-400 hover:bg-gray-700"
                )}
              >
                <span className="text-lg">
                  <MdMoreVert />
                </span>
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const permissionStructure = createPermissionStructure(apiPermissions);

  return (
    <div className="space-y-4 lg:space-y-6 text-white p-4 lg:p-6">
      {hasCreateRolePermission && (
        <div className="flex justify-end">
          <Button
            onClick={() => setFormOpen(!formOpen)}
            size="small"
            fullWidth={false}
          >
            {formOpen ? "- View List" : "+ Add role"}
          </Button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-2 min-w-[120px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleCopyRole(contextMenu.role)}
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
          >
            Copy Role
          </button>
          <button
            onClick={() => handleDeleteRole(contextMenu.role)}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
          >
            Delete Role
          </button>
        </div>
      )}

      {formOpen && (
        <div className="shadow w-full space-y-4">
          <div className="max-w-xl">
            <h2 className="text-lg 2xl:text-xl font-semibold text-white mb-3">
              {isViewMode ? "Permissions" : (editingRole ? "Edit Role" : "Create Role")}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white">
                  Role Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#4E4E4E] bg-opacity-50 rounded-full py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter role name..."
                  disabled={isViewMode} // Add this
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#4E4E4E] bg-opacity-50 rounded-full py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter role description..."
                  disabled={isViewMode} // Add this
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white">
                  Permissions
                </label>
                {permissionStructure.map((section, index) => (
                  <div
                    key={index}
                    className="bg-gray-700/30 p-5 rounded-lg border border-gray-600/50"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <span className="font-medium text-gray-200">
                        {section.name}
                      </span>
                      <div className="ml-auto flex items-center gap-4">
                        {section.permissions.map((permissionKey) => {
                          const permissionId = getPermissionId(permissionKey);
                          if (!permissionId) return null;

                          return (
                            <label
                              key={permissionKey}
                              className="flex items-center gap-2 hover:bg-gray-600/30 p-2 rounded-lg transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedPermissions[permissionKey] || false
                                }
                                onChange={(e) =>
                                  handlePermissionChange(
                                    permissionKey,
                                    e.target.checked
                                  )
                                }
                                className="form-checkbox rounded text-pink-500 focus:ring-pink-500/50"
                                disabled={isViewMode} // Add this
                              />
                              <span className="text-sm text-gray-300">
                                {getPermissionLabel(permissionKey)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    {section.child && (
                      <div className="ml-6 space-y-3">
                        {section.child.map((childSection, childIndex) => (
                          <div
                            key={childIndex}
                            className="flex flex-wrap items-center gap-1.5 bg-gray-800/30 p-3 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-300 w-32">
                              {childSection.name}
                            </span>
                            <div className="flex flex-wrap gap-3">
                              {childSection.permissions.map((permissionKey) => {
                                const permissionId =
                                  getPermissionId(permissionKey);
                                if (!permissionId) return null;

                                return (
                                  <label
                                    key={permissionKey}
                                    className="flex items-center gap-1.5 hover:bg-gray-600/30 p-1 rounded-lg transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        selectedPermissions[permissionKey] ||
                                        false
                                      }
                                      onChange={(e) =>
                                        handlePermissionChange(
                                          permissionKey,
                                          e.target.checked
                                        )
                                      }
                                      className="form-checkbox rounded text-pink-500 focus:ring-pink-500/50"
                                      disabled={isViewMode} // Add this
                                    />
                                    <span className="text-sm text-gray-300">
                                      {getPermissionLabel(permissionKey)}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {formError && (
                <div className="text-red-400 text-sm">{formError}</div>
              )}
              <div className="flex justify-center gap-3">
                {isViewMode ? (
                  <Button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setFormOpen(false);
                    }}
                    size="small"
                  >
                    Close
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setFormOpen(false);
                      }}
                      size="small"
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="small"
                      loading={loading}
                      loadingText={editingRole ? "Updating" : "Saving"}
                    >
                      {editingRole ? "Update" : "Save"}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {!formOpen && roles.length > 0 && (
        <div className="bg-[#1e1e1e] rounded-lg overflow-hidden">
          <Table columns={columns} data={roles} />
        </div>
      )}
      {!formOpen && roles.length === 0 && (
        <p className="text-center text-sm text-gray-500">No roles yet.</p>
      )}
    </div>
  );
}
