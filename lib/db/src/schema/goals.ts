import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  dailyCalories: integer("daily_calories").notNull().default(2000),
  dailyProtein: integer("daily_protein").notNull().default(150),
  dailyCarbs: integer("daily_carbs").notNull().default(200),
  dailyFat: integer("daily_fat").notNull().default(65),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
