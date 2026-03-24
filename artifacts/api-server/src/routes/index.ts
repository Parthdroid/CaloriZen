import { Router, type IRouter } from "express";
import healthRouter from "./health";
import mealsRouter from "./meals";
import goalsRouter from "./goals";
import nutritionRouter from "./nutrition";
import barcodeRouter from "./barcode";

const router: IRouter = Router();

router.use(healthRouter);
router.use(mealsRouter);
router.use(goalsRouter);
router.use(nutritionRouter);
router.use(barcodeRouter);

export default router;
