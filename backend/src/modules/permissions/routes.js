import express from "express";
import * as controller from "./controller.js";

const router = express.Router();

router.post("/", controller.createPermission);
router.get("/", controller.getAllPermissions);
router.get("/:id", controller.getPermissionById);
router.put("/:id", controller.updatePermission);
router.delete("/:id", controller.deletePermission);

export default router;
