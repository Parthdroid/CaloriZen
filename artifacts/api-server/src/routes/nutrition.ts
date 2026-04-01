import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { z } from "zod";

const router: IRouter = Router();

const analyzePhotoSchema = z.object({
  imageBase64: z.string(),
  mimeType: z.string().default("image/jpeg"),
});

const clarifySchema = z.object({
  originalAnalysis: z.object({
    items: z.array(z.any()),
    totalCalories: z.number(),
    totalProtein: z.number(),
    totalCarbs: z.number(),
    totalFat: z.number(),
    confidence: z.number(),
    needsClarification: z.boolean(),
    clarificationQuestions: z.array(z.any()),
    analysisNotes: z.string().nullable().optional(),
  }),
  imageBase64: z.string().nullable().optional(),
  answers: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
});

const ANALYSIS_SYSTEM_PROMPT = `You are an expert nutritionist AI. Your job is to identify food from photos and provide ACCURATE calorie and macronutrient estimates based on real nutritional data (USDA FoodData Central, IFCT).

## GOLDEN RULE: ACCURACY OVER EVERYTHING
- Your estimates should match what a registered dietitian would calculate
- NEVER inflate calories. If you are unsure, estimate the LOWER realistic value
- Cross-check your numbers mentally: do the macros add up? (protein×4 + carbs×4 + fat×9 ≈ total calories)
- A meal that LOOKS small IS small. Do not assume hidden calories

## BEVERAGE CALORIE REFERENCE (STRICT — do not exceed without visible evidence):
- Water, sparkling water, black tea, black coffee: 0-5 kcal
- Tea with milk (30ml whole milk) + 1 tsp sugar: 40-50 kcal
- Tea with milk (30ml whole milk) + 2 tsp sugar: 55-65 kcal
- Coffee with milk + sugar: 40-60 kcal
- Indian chai (milkier, sweeter): 80-100 kcal
- Cappuccino/Latte (medium): 120-150 kcal
- Lassi sweet (1 glass 250ml): 150-180 kcal
- Fresh fruit juice (1 glass 250ml): 90-130 kcal
- Soft drink (330ml can): 140 kcal
- Whole milk (1 cup 240ml): 150 kcal
- Nimbu pani / lemonade: 40-80 kcal
- Buttermilk / chaas: 40-60 kcal

## COMMON FOOD CALORIE REFERENCE (per standard serving):
Indian:
- Plain rice (1 katori/150g cooked): 130 kcal
- Roti/Chapati (1, ~35g): 100 kcal | Naan (1): 260 kcal | Paratha (1 plain): 180 kcal
- Dal (1 katori/150ml): 120-150 kcal | with tadka/ghee: 150-180 kcal
- Sabzi/dry vegetable (1 katori): 80-120 kcal
- Paneer curry (1 katori): 200-250 kcal
- Chicken curry (1 katori): 180-220 kcal
- Samosa (1 medium): 250 kcal | Pakora (3-4 pcs): 150-200 kcal
- Dosa plain (1): 120 kcal | Masala dosa: 250 kcal | Idli (1): 60 kcal
- Curd/Yogurt (1 katori): 60-80 kcal | Raita: 70-90 kcal
- Pickle/achaar (1 tbsp): 30-50 kcal
- Biryani (1 plate ~250g): 350-450 kcal

Western:
- Bread slice (white): 70 kcal | Whole wheat: 80 kcal
- Egg (1 boiled): 70 kcal | Fried: 90 kcal | Omelette (2 eggs): 180 kcal
- Chicken breast (100g grilled): 165 kcal
- Salad (no dressing, 1 bowl): 30-50 kcal | with dressing: 100-200 kcal
- Pasta (1 cup cooked, no sauce): 200 kcal | with sauce: 300-400 kcal
- Pizza slice (1 medium): 250-300 kcal
- Burger (standard): 350-500 kcal
- French fries (medium): 300-400 kcal
- Sandwich (basic): 250-350 kcal

Fruits & Snacks:
- Apple/Orange/Banana (1 medium): 80-105 kcal
- Biscuit/Cookie (1): 30-60 kcal
- Chips (small packet 30g): 150 kcal
- Chocolate bar (standard): 200-250 kcal
- Nuts (1 handful ~30g): 170-190 kcal

## FOOD IDENTIFICATION RULES:
- Look at the FULL CONTEXT — plate/bowl type, other foods present, the setting
- A yellow/orange liquid in a bowl with rice/roti = DAL, NOT turmeric milk
- When food is on a thali or alongside Indian staples, default to Indian cuisine identification
- Be specific: "Toor Dal" not "yellow soup", "Aloo Gobi" not "potato dish"
- Pay attention to texture: dal is watery/soupy; curries are thicker; beverages are in glasses/mugs

## PORTION SIZE ESTIMATION:
- Use visible containers (plate, bowl, cup, glass) to gauge size
- Standard dinner plate ≈ 10 inches; side plate ≈ 7 inches
- Standard cup ≈ 200-250ml; katori ≈ 150ml; glass ≈ 250ml
- Do NOT assume large portions unless clearly visible
- For packaged items, use standard package sizes
- If only a small amount of food is visible, estimate accordingly — don't round up

Return ONLY valid JSON with this exact structure:
{
  "items": [
    {
      "name": "specific food item name",
      "servingDescription": "e.g. '1 katori (150ml)', '2 rotis', '1 cup cooked rice'",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams),
      "confidence": number (0.0-1.0)
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "confidence": number (0.0-1.0, overall confidence),
  "needsClarification": boolean,
  "clarificationQuestions": [
    {
      "question": "short specific question",
      "options": ["option1", "option2", "option3"],
      "itemIndex": number (index of item in items array)
    }
  ],
  "analysisNotes": "brief note about the meal if needed, or null"
}

Rules:
- When unsure between two similar-looking foods, set needsClarification to true and ASK the user
- Only ask clarification questions if confidence < 0.7
- Maximum 3 clarification questions
- Questions must have specific button options (not free text)
- If confidence >= 0.7, set needsClarification to false and clarificationQuestions to []
- Use realistic portion sizes based on visual cues (plate size, bowl size, hand for scale)
- Always consider meal context — what other items are on the plate helps identify each item`;

const CLARIFY_SYSTEM_PROMPT = `You are an expert nutritionist AI. You previously analyzed a meal photo but had low confidence. 
The user has answered clarifying questions. Update your calorie/macro estimates based on their answers.

Return ONLY valid JSON with the same structure as before, but with updated values and confidence >= 0.85.
Set needsClarification to false and clarificationQuestions to [].`;

function normalizeItem(item: Record<string, unknown>) {
  const nutrition = (item.nutrition ?? {}) as Record<string, unknown>;
  const macros = (nutrition.macros ?? item.macros ?? {}) as Record<string, unknown>;
  const estimatedServing = (item.estimatedServing ?? item.estimatedPortion ?? item.estimated_serving ?? {}) as Record<string, unknown>;

  const servingDesc =
    item.servingDescription ??
    item.serving_description ??
    item.serving ??
    estimatedServing.description ??
    (estimatedServing.amount ? `${estimatedServing.amount}${estimatedServing.unit ? " " + estimatedServing.unit : ""}` : null) ??
    "1 serving";

  const cal =
    item.calories ?? item.kcal ?? item.cal ??
    nutrition.calories ?? nutrition.kcal ??
    macros.calories ?? macros.kcal ??
    0;

  const prot =
    item.protein ?? item.proteins ??
    nutrition.protein ?? nutrition.proteins ??
    macros.protein ?? macros.proteins ??
    macros.protein_g ??
    0;

  const carb =
    item.carbs ?? item.carbohydrates ?? item.carb ??
    nutrition.carbs ?? nutrition.carbohydrates ??
    macros.carbs ?? macros.carbohydrates ?? macros.carbs_g ??
    0;

  const fatVal =
    item.fat ?? item.fats ?? item.totalFat ??
    nutrition.fat ?? nutrition.fats ??
    macros.fat ?? macros.fats ?? macros.fat_g ??
    0;

  return {
    name: String(item.name ?? "Unknown food"),
    servingDescription: String(servingDesc),
    calories: Number(cal),
    protein: Number(prot),
    carbs: Number(carb),
    fat: Number(fatVal),
    confidence: Number(item.confidence ?? nutrition.confidence ?? 0.8),
  };
}

function computeTotals(items: Array<{ calories: number; protein: number; carbs: number; fat: number }>) {
  return {
    totalCalories: items.reduce((s, i) => s + (Number(i.calories) || 0), 0),
    totalProtein: items.reduce((s, i) => s + (Number(i.protein) || 0), 0),
    totalCarbs: items.reduce((s, i) => s + (Number(i.carbs) || 0), 0),
    totalFat: items.reduce((s, i) => s + (Number(i.fat) || 0), 0),
  };
}

router.post("/nutrition/analyze-photo", async (req: Request, res: Response) => {
  const parsed = analyzePhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { imageBase64, mimeType } = parsed.data;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Please analyze this meal photo and provide calorie/macro estimates.",
            },
          ],
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content ?? "";
    
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      req.log.error({ rawContent }, "Failed to extract JSON from AI response");
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const normalizedItems = (analysis.items ?? []).map(normalizeItem);
    const totals = computeTotals(normalizedItems);
    
    req.log.info({ rawItems: analysis.items, normalizedItems, totals }, "Photo analysis result");
    
    res.json({
      ...analysis,
      items: normalizedItems,
      ...totals,
      clarificationQuestions: analysis.clarificationQuestions ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Error analyzing photo");
    res.status(500).json({ error: "Failed to analyze photo" });
  }
});

router.post("/nutrition/clarify", async (req: Request, res: Response) => {
  const parsed = clarifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { originalAnalysis, answers, imageBase64 } = parsed.data;

  const answersText = answers
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");

  const itemsSummary = originalAnalysis.items
    .map((item: { name: string; calories: number; servingDescription: string }) => `- ${item.name}: ${item.calories} cal (${item.servingDescription})`)
    .join("\n");

  const messages: Parameters<typeof openai.chat.completions.create>[0]["messages"] = [
    {
      role: "system",
      content: CLARIFY_SYSTEM_PROMPT,
    },
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high",
          },
        },
        {
          type: "text",
          text: `Original analysis:\n${itemsSummary}\n\nUser answers to clarification questions:\n${answersText}\n\nPlease update the nutritional analysis based on these answers.`,
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content: `Original analysis:\n${itemsSummary}\n\nUser answers to clarification questions:\n${answersText}\n\nPlease update the nutritional analysis based on these answers.`,
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages,
    });

    const rawContent = response.choices[0]?.message?.content ?? "";
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Failed to parse AI response" });
      return;
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const normalizedItems = (analysis.items ?? []).map(normalizeItem);
    const totals = computeTotals(normalizedItems);
    
    req.log.info({ rawItems: analysis.items, normalizedItems, totals }, "Clarification result");
    
    res.json({
      ...analysis,
      items: normalizedItems,
      ...totals,
      needsClarification: false,
      clarificationQuestions: [],
    });
  } catch (err) {
    req.log.error({ err }, "Error clarifying meal");
    res.status(500).json({ error: "Failed to clarify meal analysis" });
  }
});

export default router;
