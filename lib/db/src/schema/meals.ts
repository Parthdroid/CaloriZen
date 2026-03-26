import { pgTable, serial, text, timestamp, real, integer, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mealItemSchema = z.object({
  name: z.string(),
  servingDescription: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  confidence: z.number().optional(),
});

export type MealItem = z.infer<typeof mealItemSchema>;

export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  mealType: text("meal_type").notNull().default("snack"),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  imageUrl: text("image_url"),
  notes: text("notes"),
  items: jsonb("items").notNull().default([]),
  totalCalories: real("total_calories").notNull().default(0),
  totalProtein: real("total_protein").notNull().default(0),
  totalCarbs: real("total_carbs").notNull().default(0),
  totalFat: real("total_fat").notNull().default(0),
});

export const insertMealSchema = createInsertSchema(mealsTable).omit({ id: true });
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof mealsTable.$inferSelect;
