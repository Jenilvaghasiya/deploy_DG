import express from "express";
import * as controller from "./controller.js";

const router = express.Router();

router.post("/", controller.createPermissionGroup);
router.get("/", controller.getAllPermissionGroups);
router.get("/:id", controller.getPermissionGroupById);
router.put("/:id", controller.updatePermissionGroup);
router.delete("/:id", controller.deletePermissionGroup);

export default router;
