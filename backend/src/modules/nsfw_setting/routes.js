import express from "express";
import * as nsfwSettingController from "./controller.js";

const router = express.Router();

router.get('/get', nsfwSettingController.getNSFWSettings);

export default router;