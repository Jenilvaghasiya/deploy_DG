import express from "express";
import { assignPermissions, getPermissionsOfRole } from "./controller.js";

const router = express.Router();

router.post("/assign", assignPermissions);
router.get("/:roleId", getPermissionsOfRole);

export default router;
