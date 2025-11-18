import { Router } from "express";
import * as stripeController from "./controller.js";
import { verifyToken } from "../../middlewares/auth.js";
import { checkPermission, requireTenantAdmin } from "../../middlewares/checkPermission.js";
import { PERMISSIONS } from "../../utils/permission.js";

const router = Router();

router.get("/plans", stripeController.getPlans);

router.post("/plan/:id", stripeController.getPlanById);

router.post(
    "/checkout", 
    verifyToken,
    requireTenantAdmin,
    stripeController.createCheckoutSession
);

router.post(
  "/change-plan",
  verifyToken,
  requireTenantAdmin,
  stripeController.changePlan
);

router.post(
  "/cancel",
  verifyToken,
  requireTenantAdmin,
  stripeController.cancelPlan
);

router.post("/check-session", stripeController.checkSession);

router.get(
    "/current",
    verifyToken,
    requireTenantAdmin,
    stripeController.getCurrentSubscription
);

router.get("/payment/history", verifyToken, stripeController.getPaymentHistory);
router.post("/auto-renew", verifyToken, stripeController.toggleAutoRenew);
router.post("/payment/retry", verifyToken, stripeController.retryPayment);
export default router;

