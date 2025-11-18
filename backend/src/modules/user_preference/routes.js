import { Router } from "express";
import * as user_preference from "./controller.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

router.post('/', verifyToken, user_preference.addOrUpdateUserPreference);
router.get('/', verifyToken, user_preference.getUserPreferences);

export default router;
