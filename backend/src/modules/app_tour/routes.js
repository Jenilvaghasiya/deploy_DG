import { Router } from "express";
import * as tourController from "./controller.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

router.get('/status/get', verifyToken, tourController.howItWorksTourStatus);
router.put('/status/update', verifyToken, tourController.updateTourStatus)

export default router;
