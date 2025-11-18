import { Router } from "express";
import * as userProjectRoleController from "./controller.js";

const router = Router();

router.get("/", userProjectRoleController.getUserProjectRoles);
router.post("/", userProjectRoleController.createUserProjectRole);
router.put("/", userProjectRoleController.updateUserProjectRole);
router.delete("/:id", userProjectRoleController.deleteUserProjectRole);

export default router;
