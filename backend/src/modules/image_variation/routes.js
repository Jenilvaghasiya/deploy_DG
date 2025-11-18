import { Router } from "express";
import * as imageVariationController from "./controller.js";
import imageUpload from "./middleware.js";
import { preventDuplicateTask } from "./service.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";
import { handleTechPackUploadError, techPackSingleUpload } from "./techPackFileMiddleware.js";

const router = Router();

router.post(
  "/text-to-image/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TEXT_TO_IMAGE_CREATE),
  // preventDuplicateTask("text_to_image"),
  imageVariationController.textToImage
);

router.post(
  "/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_IMAGE_VARIATIONS_CREATE),
  // preventDuplicateTask("image_variation"),
  imageUpload.single("image"),
  imageVariationController.createVariation
);

router.post(
  "/sketch-to-image/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_SKETCH_TO_IMAGE_CREATE),
  // preventDuplicateTask("sketch_to_image"),
  imageUpload.single("image"),
  imageVariationController.createSketchToImage
);

router.post(
  "/tech-packs/create-ai",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  imageUpload.single("image"),
  imageVariationController.createTechPacks
);

router.post(
  "/combine-image/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_COMBINE_IMAGES_CREATE),
  // preventDuplicateTask("combine_image"),
  imageUpload.fields([
    { name: "base_image", maxCount: 1 },
    { name: "style_image", maxCount: 1 },
  ]),
  imageVariationController.createCombineImage
);

router.post(
  "/pattern_cutout/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_PATTERN_CUTOUTS_CREATE),
  // preventDuplicateTask("image_variation"),
  imageUpload.single("image"),
  imageVariationController.createPatternCutouts
);

router.get(
  "/pattern_cutout",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_PATTERN_CUTOUTS_VIEW),
  // preventDuplicateTask("image_variation"),
  imageUpload.single("image"),
  imageVariationController.getCutouts
);

router.delete(
  "/pattern_cutout/:id",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_PATTERN_CUTOUTS_DELETE),
  imageVariationController.deleteCutoutDoc
);

router.post(
  "/color_analysis/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_COLOR_DETECTIONS_CREATE),
  // preventDuplicateTask("image_variation"),
  imageUpload.single("image"),
  imageVariationController.analyzeColorsAsync
);

router.get(
  "/color_analysis",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_COLOR_DETECTIONS_VIEW),
  imageVariationController.getColorAnalyses
);

router.delete(
  "/color_analysis/:id",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_COLOR_DETECTIONS_DELETE),
  imageVariationController.deleteColorAnalysesDoc
);



router.get(
  "/tech-packs/get",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_VIEW),
  // preventDuplicateTask("image_variation"),
  imageUpload.single("image"),
  imageVariationController.getTechpacks
);

router.get(
  "/tech-packs/:id",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_VIEW),
  imageVariationController.getTechpackById
);

router.post(
  "/tech-packs/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
    imageUpload.single("image"),
  imageVariationController.createTechPacks
);

router.post(
  "/tech-packs/create-manual",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  techPackSingleUpload.fields([
    { name: 'image', maxCount: 1 },      // For the main image
    { name: 'files', maxCount: 10 }      // For additional files
  ]),
  handleTechPackUploadError,
  imageVariationController.createManualTechPack
);

router.post(
  "/tech-packs/duplicate/:id",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  imageVariationController.duplicateTechPack
);

router.put(
  "/tech-packs/:id/update",
  // checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_UPDATE),
  imageVariationController.updateManualTechPack
);

router.get(
  "/status/:id",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_VIEW),
  imageVariationController.completedTasks
);

router.post(
  "/get-garment-type-data",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_VIEW),
  imageVariationController.fetchMeasurementPoint
);

router.post(
  "/generate-size-chart",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE),
  // preventDuplicateTask("size_chart"),
  imageUpload.single("image"),
  imageVariationController.generateSizeChartAndImage
);

router.post(
  "/color-variations/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_COLOR_VARIATIONS_CREATE),
  // preventDuplicateTask("image_variation"),
  imageUpload.single("image"),
  imageVariationController.createColorVariation
);

 // TODO:solve last commit issue
router.post(
  "/fetchStatus",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_VIEW),
  imageVariationController.fetchTaskStatus
);

router.get(
  "/getSizeChart",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_VIEW),
  imageVariationController.getSizeChart
);

router.post(
  "/updateSizeChart",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_VIEW),
  imageUpload.single("image"),
  imageVariationController.updateSizeChart
);

router.post(
  "/latest-unseen",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_VIEW),
  imageVariationController.getLatestUnseenTask
);

router.post(
  "/mark-seen",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_VIEW),
  imageVariationController.markTasksAsSeen
);

router.post(
  "/submit-review",
  imageVariationController.submitReview
);

router.post("/copy-size-chart",checkPermission(PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE),imageVariationController.copySizeChartToGalleryImages);

// router.post("/fetchStatus",imageVariationController.fetchTaskStatus);
// router.get("/getSizeChart", imageVariationController.getSizeChart);
// router.post("/updateSizeChart",imageUpload.single("image"), imageVariationController.updateSizeChart);
// router.post("/latest-unseen", imageVariationController.getLatestUnseenTask);
// router.post("/mark-seen", imageVariationController.markTasksAsSeen);
// router.post("/submit-review", imageVariationController.submitReview);
// router.post("/copy-size-chart",imageVariationController.copySizeChartToGalleryImages);

// router.post("/fetchStatus",imageVariationController.fetchTaskStatus);
// router.get("/getSizeChart", imageVariationController.getSizeChart);
// router.post("/updateSizeChart",imageUpload.single("image"), imageVariationController.updateSizeChart);
// router.post("/latest-unseen", imageVariationController.getLatestUnseenTask);
// router.post("/mark-seen", imageVariationController.markTasksAsSeen);
// router.post("/submit-review", imageVariationController.submitReview);
// router.post("/copy-size-chart",imageVariationController.copySizeChartToGalleryImages);

router.delete("/abort/:taskId", checkPermission(
  PERMISSIONS.AI_DESIGN_LAB_TEXT_TO_IMAGE_CREATE,
  PERMISSIONS.AI_DESIGN_LAB_COMBINE_IMAGES_CREATE,
  PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE,
  PERMISSIONS.AI_DESIGN_LAB_IMAGE_VARIATIONS_CREATE
), imageVariationController.abortTask);


router.post(
  "/saveAsTemplate",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE),
  imageVariationController.saveAsTemplate
);
router.get(
  "/templates",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE),
  imageVariationController.getTemplates
);

router.post(
  "/createSizeChartManually",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE),
  imageUpload.single("image"),
  imageVariationController.createSizeChartManually
);

router.delete(
  "/templates/:id",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE),
  imageVariationController.deleteTemplate
);

router.delete("/tech-packs/delete/:id", checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_DELETE), imageVariationController.deleteTechPack)

router.post(
  "/link-images-to-sizechart",
  // checkPermission(PERMISSIONS.AI_DESIGN_LAB_AI_SIZE_CHART_CREATE),
  imageVariationController.linkImagesToSizeChart
);

router.post("/upload-image", imageUpload.single("image"), imageVariationController.uploadImageToStrapi);
router.get("/get-dg-posts", imageUpload.single("image"), imageVariationController.getAllDGPosts);
router.get("/get-my-posts", imageUpload.single("image"), imageVariationController.getMyPosts);
router.delete("/delete-dg-post/:id", imageVariationController.deleteDGPost)
// router.post("/create-dg-post", imageUpload.single("image"), imageVariationController.createDGPost);


// routes/imageVariation.routes.js - ADD THESE ROUTES

// BOM Routes
router.post(
  "/tech-packs/:techPackId/bom/create",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  imageVariationController.createBOM
);

router.put(
  "/tech-packs/:techPackId/bom/update",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  imageVariationController.updateBOM
);

router.get(
  "/tech-packs/:techPackId/bom",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_VIEW),
  imageVariationController.getBOM
);

router.delete(
  "/tech-packs/:techPackId/bom",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_DELETE),
  imageVariationController.deleteBOM
);

// BOM Auto-complete
router.get(
  "/bom/autocomplete",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_VIEW),
  imageVariationController.getBOMAutocomplete
);

// BOM Section Management (for Multi-level)
router.post(
  "/tech-packs/:techPackId/bom/sections",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  imageVariationController.createBOMSection
);

router.put(
  "/tech-packs/:techPackId/bom/sections/:sectionId",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  imageVariationController.updateBOMSection
);

router.delete(
  "/tech-packs/:techPackId/bom/sections/:sectionId",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_DELETE),
  imageVariationController.deleteBOMSection
);


// NEW: Default suggestions (for first-time users)
router.get(
  "/bom/suggestions/default",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_VIEW),
  imageVariationController.getBOMDefaultSuggestions
);

// NEW: Freetone colors for BOM
router.get(
  "/bom/freetone-colors",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_VIEW),
  imageVariationController.getUserFreetoneColors
);

// File upload route
router.post(
  "/tech-packs/:id/upload-file",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_CREATE),
  techPackSingleUpload.single("file"),
  handleTechPackUploadError,
  imageVariationController.uploadTechPackFile
);

// Get files route
router.get(
  "/tech-packs/:id/files",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_VIEW),
  imageVariationController.getTechPackFiles
);

// Delete file route
router.delete(
  "/tech-packs/:id/files/:fileId",
  checkPermission(PERMISSIONS.AI_DESIGN_LAB_TECH_PACK_DELETE),
  imageVariationController.deleteTechPackFile
);
export default router;
