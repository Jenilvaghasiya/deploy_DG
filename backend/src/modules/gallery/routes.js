import { Router } from "express";
import * as galleryController from "./controller.js";
import galleryUpload from "./middleware.js";
import {verifyToken} from "../../middlewares/auth.js"
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";

const router = Router();

router.get("/generated",checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ), galleryController.getGenerated);
router.put("/generated-feedback",checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE), galleryController.updateGeneratedFeedback);
router.get("/generated-feedback",checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ), galleryController.getGeneratedFeedback);

router.get("/",checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ), galleryController.getGalleryImages);
// In your routes file
router.get("/single/:id", checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ), galleryController.getGalleryImageById);
router.get("/by-ids",checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ),galleryController.getGalleryImagesByIds);

router.get("/download",checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ), galleryController.downloadGallery);
router.post("/generated/download", checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ), galleryController.downloadSelectedGenerated)
router.get("/:imageId/download", verifyToken,checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ), galleryController.downloadGalleryImage);
router.get("/deduct-credit", galleryController.creditDeductOnEdit)
// router.get("/:imageId/download", verifyToken, galleryController.downloadGalleryImage);
router.post(
    "/",
    galleryUpload.array("images"),
    checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_CREATE),
    galleryController.createGalleryImage,
);
router.post(
    "/edited",
    galleryUpload.single("image"),
    checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_CREATE),
    galleryController.saveEditedImage,
);

router.patch(
    "/:imageId",
    verifyToken, // ⚠️ ADD THIS IF MISSING
    checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE),
    galleryController.updateGalleryImageMetadata
);
router.put(
    "/:imageId",
    galleryUpload.single("image"),
    checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE),
    galleryController.replaceGalleryImage,
);
router.patch("/:imageId/status",checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE),galleryController.updateGalleryImageStatus);
router.delete("/:imageId", checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_DELETE),galleryController.deleteGalleryImage);
router.post('/addCredits', verifyToken,galleryController.addCredits);
router.patch('/setGeneratedImage/:imageId', verifyToken, checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE),galleryController.setGeneratedImginGallery);
router.post('/generated/delete/:imageId', verifyToken,checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_DELETE), galleryController.deleteGeneratedImage);
router.post("/link-project/:imageId", checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE,PERMISSIONS.PROJECT_UPDATE),galleryController.linkToProject);
router.post("/link-project/generated-image/:imageId", checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE,PERMISSIONS.PROJECT_UPDATE),galleryController.linkGeneratedImageToProject);
router.post("/link-project/size-chart/:sizeChartId", checkPermission(PERMISSIONS.PROJECT_UPDATE),galleryController.linkSizeChartToProject);
router.post("/unlink-project/size-chart/:sizeChartId", checkPermission(PERMISSIONS.PROJECT_UPDATE),galleryController.unlinkSizeChartFromProject);
router.get("/link-project/size-chart/:sizeChartId", checkPermission(PERMISSIONS.PROJECT_VIEW),galleryController.getLinkedProjectToSizeChart);
router.put("/:imageId/rename", checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE), galleryController.renameImageName,)
// router.patch("/:imageId/status", galleryController.updateGalleryImageStatus);
router.get("/proxy-image", galleryController.proxyImage)


// Image routes
// router.post("/images", galleryController.uploadImage);
router.get("/images", galleryController.getImages);

// Sizechart routes
router.post("/sizecharts", galleryController.createSizeChart);
router.get("/sizecharts", galleryController.getSizeCharts);

// Tree routes
router.post("/tree/link", galleryController.linkAsset);
router.get("/tree/:id", galleryController.getTree);
router.get("/tree/view/:assetId", galleryController.getTreeView)
router.get("/project/images/:projectId", galleryController.getProjectImages);
router.get("/trees/:assetId", galleryController.getAllTrees);

router.post('/image/scale-to-hd', galleryController.scaleToHD);


router.post(
  "/:imageId/create-outline",
  verifyToken,
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_PATTERN_CUTOUTS_CREATE),
  galleryController.createOutline
);

router.get(
  "/:imageId/outline-status",
  verifyToken,
  checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ),
  galleryController.getOutlineStatus
);

router.post(
  "/outline/latest-unseen",
  verifyToken,
  checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_READ),
  galleryController.getLatestUnseenOutlineTasks
);

router.post(
  "/outline/mark-seen",
  verifyToken,
  checkPermission(PERMISSIONS.WORKSPACE_MY_GALLERY_UPDATE),
  galleryController.markOutlineTasksAsSeen
);

export default router;
