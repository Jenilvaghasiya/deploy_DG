import { Router } from "express";
import * as dashboardController from "./controller.js";
import { checkPermission } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";

const router = Router();

router.get("/time-on-platform",checkPermission(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getTimeOnPlatform);
router.get("/usage-time",checkPermission(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getUsageTime);
router.get("/output-stats",checkPermission(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getOutputStats);
router.get("/credit-consumption",checkPermission(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getCreditConsumption);
router.get("/free-outputs",checkPermission(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getFreeOutputs);
router.get("/activity-log",checkPermission(PERMISSIONS.DASHBOARD_VIEW), dashboardController.getActivityLog);

export default router;
