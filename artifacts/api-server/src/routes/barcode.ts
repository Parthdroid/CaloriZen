import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

async function fetchOpenFoodFacts(barcode: string): Promise<null | {
  productName: string;
  brand: string | null;
  servingSize: string;
  servingsPerContainer: number | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  imageUrl: string | null;
}> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,serving_size,nutriments,image_url,nutriment_energy_kcal_serving`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    
    const data = await resp.json() as {
      status: number;
      product?: {
        product_name?: string;
        brands?: string;
        serving_size?: string;
        image_url?: string;
        nutriments?: {
          "energy-kcal_serving"?: number;
          "energy-kcal_100g"?: number;
          proteins_serving?: number;
          proteins_100g?: number;
          carbohydrates_serving?: number;
          carbohydrates_100g?: number;
          fat_serving?: number;
          fat_100g?: number;
        };
      };
    };
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};
    
    const calories = n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? 0;
    const protein = n.proteins_serving ?? n.proteins_100g ?? 0;
    const carbs = n.carbohydrates_serving ?? n.carbohydrates_100g ?? 0;
    const fat = n.fat_serving ?? n.fat_100g ?? 0;

    if (!p.product_name || calories === 0) return null;

    return {
      productName: p.product_name,
      brand: p.brands ?? null,
      servingSize: p.serving_size ?? "100g",
      servingsPerContainer: null,
      caloriesPerServing: Math.round(calories),
      proteinPerServing: Math.round(protein * 10) / 10,
      carbsPerServing: Math.round(carbs * 10) / 10,
      fatPerServing: Math.round(fat * 10) / 10,
      imageUrl: p.image_url ?? null,
    };
  } catch {
    return null;
  }
}

router.get("/barcode/:barcode", async (req: Request, res: Response) => {
  const { barcode } = req.params;

  const offResult = await fetchOpenFoodFacts(barcode);
  if (offResult) {
    res.json({ barcode, ...offResult });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are a food nutrition database. Given a barcode number, provide the product's nutritional information if you know it. If you don't recognize the barcode, return null. Return ONLY valid JSON: {"productName": string, "brand": string|null, "servingSize": string, "servingsPerContainer": number|null, "caloriesPerServing": number, "proteinPerServing": number, "carbsPerServing": number, "fatPerServing": number, "imageUrl": null} or just null if you don't know the product.`,
        },
        {
          role: "user",
          content: `Barcode: ${barcode}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "null";
    const jsonMatch = content.match(/\{[\s\S]*\}|null/);
    if (!jsonMatch || jsonMatch[0] === "null") {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const product = JSON.parse(jsonMatch[0]);
    res.json({ barcode, ...product });
  } catch (err) {
    req.log.error({ err }, "Error looking up barcode");
    res.status(404).json({ error: "Product not found" });
  }
});

export default router;
