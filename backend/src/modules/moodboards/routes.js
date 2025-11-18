// generate routes from moodboard module
import { Router } from "express";
import * as moodboardController from "./controller.js";
import moodboardUpload from "./middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";

const router = Router();

router.get("/", checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_READ), moodboardController.getMoodboards);
router.get("/tags", checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_READ), moodboardController.getTenantTags);
router.get("/:id", checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_READ), moodboardController.getMoodboardById);
router.post("/:id/download", checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_READ), moodboardController.downloadMoodboardWithPDF);
router.post(
    "/",
    checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_CREATE),
    moodboardUpload.array("images"),
    moodboardController.createMoodboard,
);
router.put(
    "/:id",
    checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_UPDATE),
    moodboardUpload.array("images"),
    moodboardController.updateMoodboard,
);
router.delete("/:id", checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_DELETE), moodboardController.deleteMoodboard);
router.post(
    "/:id/images",
    checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_UPDATE),
    moodboardUpload.array("images"),
    moodboardController.addImage,
);
router.delete("/:id/images/:imageId", checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_UPDATE), moodboardController.removeImage);
router.post(
    "/:id/text",
    checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_UPDATE),
    moodboardController.addText,
);
router.delete("/:id/text/:textId",checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_UPDATE), moodboardController.removeText);
router.post("/fetch-image-from-url",checkPermission(PERMISSIONS.WORKSPACE_MOODBOARDS_READ), moodboardController.fetchImageFromUrl);
// router.get("/tags",moodboardController.getTenantTags)

export default router;
