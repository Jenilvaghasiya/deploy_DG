import express from "express";
import { getSharedUsers, getSharedWithMe, getSharesForResource, revokeShare, shareResource, updateSharePermissions } from "./controller.js";
import { checkResourceAccess } from "../../middlewares/resourceAccess.js";


const router = express.Router();

// Share a resource
router.post("/", shareResource);
// GET /shares/:resourceType/:resourceId/users
router.get(
  "/:resourceType/:resourceId/users",
  getSharedUsers
);


// // Get shares for a resource
router.get(
  "/resources/:resourceType/:resourceId/shares",
  checkResourceAccess(req => req.params.resourceType, "read"),
  getSharesForResource
);

// Update share permissions
router.patch("/:shareId", updateSharePermissions);

// Revoke share
router.delete("/:shareId", revokeShare);

// Get all resources shared with me
router.get("/shared-with-me", getSharedWithMe);

export default router;
