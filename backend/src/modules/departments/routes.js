import { Router } from "express";
import * as departmentController from "./controller.js";

const router = Router();

router.get("/", departmentController.getAll);
router.post("/", departmentController.create);
router.delete("/:id", departmentController.remove);

export default router;
