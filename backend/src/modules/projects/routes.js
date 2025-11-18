import { Router } from "express";
import * as projectController from "./controller.js";
import projectUpload from "./middleware.js";
import { verifyToken } from "../../middlewares/auth.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";

const router = Router();

router.get(
    "/",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_READ),
    projectController.getProjects
);

router.get(
    "/:id",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_READ),
    projectController.getProjectById
);

// router.get(
//     "/:id/download-pdf",
//     checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_READ),
//     projectController.downloadProjectImagesAsPDF
// );

router.get(
    "/:id/download-pdf",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_READ),
    projectController.downloadProjectAsPDF
);

router.post(
    "/",
    projectUpload.array("images"),
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_CREATE),
    projectController.createProject
);

router.put(
    "/:id",
    projectUpload.array("images"),
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_UPDATE),
    projectController.updateProject
);

router.delete(
    "/:id",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_DELETE),
    projectController.deleteProject
);

router.post(
    "/:id/users",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_UPDATE),
    projectController.addUser
);

router.delete(
    "/:id/users",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_UPDATE),
    projectController.removeUser
);

router.post(
    "/:projectId/download-zip",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_READ),
    projectController.downloadProjectZip
);

router.get(
    "/:projectId/status-count",
    checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_READ),
    projectController.getImageStatusCount
);


router.get("/:projectId/sub-projects",checkPermission(PERMISSIONS.WORKSPACE_MY_PROJECTS_READ), projectController.getSubProjects);
router.post("/download-zip", projectController.downloadZIP)

router.get("/shared/get", projectController.getSharedProjects)
router.get("/shared/get/:id", projectController.getSharedProjectById)
export default router;
