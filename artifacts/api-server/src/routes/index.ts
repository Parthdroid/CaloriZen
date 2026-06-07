import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mealsRouter from "./meals";
import goalsRouter from "./goals";
import nutritionRouter from "./nutrition";
import barcodeRouter from "./barcode";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(mealsRouter);
router.use(goalsRouter);
router.use(nutritionRouter);
router.use(barcodeRouter);

export default router;
