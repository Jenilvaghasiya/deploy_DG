import ResourceAccessService from "../modules/share/ResourceAccessService.js";


/**
 * Middleware to check resource access
 */
export const checkResourceAccess = (resourceType, permissions = ["read"]) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id || req.params.resourceId;
            const userId = req.user.id;
            const tenantId = req.user.tenant_id;
            const userRoles = req.user.roles || [];

            const access = await ResourceAccessService.hasAccess(
                resourceType,
                resourceId,
                userId,
                tenantId,
                userRoles,
                permissions
            );

            if (!access) {
                return res.status(403).json({ 
                    error: "Access denied",
                    message: `You don't have (${permissions.join(", ")}) permission for this resource`
                });
            }

            // Attach access info to request for use in controllers
            req.resourceAccess = access;
            req.resource = access.resource;
            
            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

/**
 * Middleware to filter resources based on access
 */
export const filterAccessibleResources = (resourceType) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const tenantId = req.user.tenant_id;
            const userRoles = req.user.roles || [];
            const permission = req.query.permission || "read";
            let permissions = [];
            if (req.query.permission) {
                if (Array.isArray(req.query.permission)) {
                    permissions = req.query.permission;
                } else if (typeof req.query.permission === "string") {
                    permissions = req.query.permission.split(",").map(p => p.trim());
                }
            } else {
                permissions = ["read"];
            }
            const resources = await ResourceAccessService.getAccessibleResources(
                resourceType,
                userId,
                tenantId,
                userRoles,
                {
                    page: req.query.page,
                    limit: req.query.limit,
                    permission : permissions,
                    includeOwned: req.query.includeOwned !== "false",
                    includeShared: req.query.includeShared !== "false"
                }
            );

            req.accessibleResources = resources;
            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};