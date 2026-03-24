import { Router, type IRouter, type Request, type Response } from "express";
import { db, mealsTable, mealItemSchema } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createMealBodySchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).default("snack"),
  items: z.array(mealItemSchema),
  imageUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  loggedAt: z.string().optional(),
});

const updateMealBodySchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  items: z.array(mealItemSchema).optional(),
  notes: z.string().optional().nullable(),
});

function computeTotals(items: z.infer<typeof mealItemSchema>[]) {
  return {
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProtein: items.reduce((s, i) => s + i.protein, 0),
    totalCarbs: items.reduce((s, i) => s + i.carbs, 0),
    totalFat: items.reduce((s, i) => s + i.fat, 0),
  };
}

function formatMeal(meal: typeof mealsTable.$inferSelect) {
  return {
    ...meal,
    items: meal.items as z.infer<typeof mealItemSchema>[],
    loggedAt: meal.loggedAt.toISOString(),
  };
}

router.get("/meals", async (req: Request, res: Response) => {
  const dateStr = req.query.date as string | undefined;
  let start: Date;
  let end: Date;

  if (dateStr) {
    start = new Date(dateStr + "T00:00:00.000Z");
    end = new Date(dateStr + "T23:59:59.999Z");
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  const meals = await db
    .select()
    .from(mealsTable)
    .where(
      sql`${mealsTable.loggedAt} >= ${start.toISOString()} AND ${mealsTable.loggedAt} < ${end.toISOString()}`
    )
    .orderBy(mealsTable.loggedAt);

  res.json(meals.map(formatMeal));
});

router.post("/meals", async (req: Request, res: Response) => {
  const parsed = createMealBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { mealType, items, imageUrl, notes, loggedAt } = parsed.data;
  const totals = computeTotals(items);

  const [meal] = await db
    .insert(mealsTable)
    .values({
      mealType,
      items,
      imageUrl: imageUrl ?? null,
      notes: notes ?? null,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
      ...totals,
    })
    .returning();

  res.status(201).json(formatMeal(meal));
});

router.get("/meals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [meal] = await db.select().from(mealsTable).where(eq(mealsTable.id, id));
  if (!meal) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  res.json(formatMeal(meal));
});

router.put("/meals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = updateMealBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const existing = await db.select().from(mealsTable).where(eq(mealsTable.id, id));
  if (!existing.length) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  const updates: Partial<typeof mealsTable.$inferInsert> = {};
  if (parsed.data.mealType !== undefined) updates.mealType = parsed.data.mealType;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.items !== undefined) {
    updates.items = parsed.data.items;
    const totals = computeTotals(parsed.data.items);
    updates.totalCalories = totals.totalCalories;
    updates.totalProtein = totals.totalProtein;
    updates.totalCarbs = totals.totalCarbs;
    updates.totalFat = totals.totalFat;
  }

  const [meal] = await db.update(mealsTable).set(updates).where(eq(mealsTable.id, id)).returning();
  res.json(formatMeal(meal));
});

router.delete("/meals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const existing = await db.select().from(mealsTable).where(eq(mealsTable.id, id));
  if (!existing.length) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }

  await db.delete(mealsTable).where(eq(mealsTable.id, id));
  res.status(204).send();
});

router.get("/daily-summary", async (req: Request, res: Response) => {
  const dateStr = req.query.date as string | undefined;
  let start: Date;
  let end: Date;
  let dateLabel: string;

  if (dateStr) {
    start = new Date(dateStr + "T00:00:00.000Z");
    end = new Date(dateStr + "T23:59:59.999Z");
    dateLabel = dateStr;
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    dateLabel = now.toISOString().split("T")[0];
  }

  const { goalsTable } = await import("@workspace/db");

  const meals = await db
    .select()
    .from(mealsTable)
    .where(
      sql`${mealsTable.loggedAt} >= ${start.toISOString()} AND ${mealsTable.loggedAt} < ${end.toISOString()}`
    )
    .orderBy(mealsTable.loggedAt);

  const allGoals = await db.select().from(goalsTable).limit(1);
  const goals = allGoals[0] ?? {
    dailyCalories: 2000,
    dailyProtein: 150,
    dailyCarbs: 200,
    dailyFat: 65,
  };

  const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
  const totalProtein = meals.reduce((s, m) => s + m.totalProtein, 0);
  const totalCarbs = meals.reduce((s, m) => s + m.totalCarbs, 0);
  const totalFat = meals.reduce((s, m) => s + m.totalFat, 0);

  res.json({
    date: dateLabel,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    goalCalories: goals.dailyCalories,
    goalProtein: goals.dailyProtein,
    goalCarbs: goals.dailyCarbs,
    goalFat: goals.dailyFat,
    meals: meals.map(formatMeal),
  });
});

export default router;
