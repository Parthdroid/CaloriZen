import { Router, type IRouter, type Request, type Response } from "express";
import { db, goalsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const updateGoalsSchema = z.object({
  dailyCalories: z.number().int().min(500).max(10000),
  dailyProtein: z.number().int().min(10).max(500),
  dailyCarbs: z.number().int().min(10).max(1000),
  dailyFat: z.number().int().min(10).max(500),
});

router.get("/goals", async (_req: Request, res: Response) => {
  const goals = await db.select().from(goalsTable).limit(1);
  if (!goals.length) {
    const [newGoal] = await db
      .insert(goalsTable)
      .values({
        dailyCalories: 2000,
        dailyProtein: 150,
        dailyCarbs: 200,
        dailyFat: 65,
        updatedAt: new Date(),
      })
      .returning();
    res.json({ ...newGoal, updatedAt: newGoal.updatedAt.toISOString() });
    return;
  }
  const goal = goals[0];
  res.json({ ...goal, updatedAt: goal.updatedAt.toISOString() });
});

router.put("/goals", async (req: Request, res: Response) => {
  const parsed = updateGoalsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid goals data" });
    return;
  }

  const existing = await db.select().from(goalsTable).limit(1);
  if (!existing.length) {
    const [goal] = await db
      .insert(goalsTable)
      .values({ ...parsed.data, updatedAt: new Date() })
      .returning();
    res.json({ ...goal, updatedAt: goal.updatedAt.toISOString() });
    return;
  }

  const [goal] = await db
    .update(goalsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .returning();
  res.json({ ...goal, updatedAt: goal.updatedAt.toISOString() });
});

export default router;
