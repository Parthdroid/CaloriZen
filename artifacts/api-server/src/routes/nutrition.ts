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

const ANALYSIS_SYSTEM_PROMPT = `You are an expert nutritionist AI. Analyze food images and provide accurate calorie and macro estimates.

Return ONLY valid JSON with this exact structure:
{
  "items": [
    {
      "name": "food item name",
      "servingDescription": "e.g. '1 cup', '2 pieces', '100g'",
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
- Only ask clarification questions if confidence < 0.7
- Maximum 2 clarification questions
- Questions must have specific button options (not free text)
- If confidence >= 0.7, set needsClarification to false and clarificationQuestions to []
- Use realistic portion sizes based on visual cues
- For Indian meals, be specific about dishes (dal, paneer, roti, rice portions)`;

const CLARIFY_SYSTEM_PROMPT = `You are an expert nutritionist AI. You previously analyzed a meal photo but had low confidence. 
The user has answered clarifying questions. Update your calorie/macro estimates based on their answers.

Return ONLY valid JSON with the same structure as before, but with updated values and confidence >= 0.85.
Set needsClarification to false and clarificationQuestions to [].`;

function computeTotals(items: Array<{ calories: number; protein: number; carbs: number; fat: number }>) {
  return {
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProtein: items.reduce((s, i) => s + i.protein, 0),
    totalCarbs: items.reduce((s, i) => s + i.carbs, 0),
    totalFat: items.reduce((s, i) => s + i.fat, 0),
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
    const totals = computeTotals(analysis.items ?? []);
    
    res.json({
      ...analysis,
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
    const totals = computeTotals(analysis.items ?? []);
    
    res.json({
      ...analysis,
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
