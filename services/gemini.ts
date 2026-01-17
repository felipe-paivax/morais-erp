
import { GoogleGenAI, Type } from "@google/genai";

export async function classifyMaterial(description: string): Promise<{ category: string; unit: string }> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Classifique o seguinte material de construção civil e sugira uma unidade de medida comum (kg, m2, un, m3, etc): "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            unit: { type: Type.STRING },
          },
          required: ["category", "unit"]
        },
      },
    });
    
    const text = response.text;
    return text ? JSON.parse(text) : { category: "Outros", unit: "un" };
  } catch (error) {
    console.error("AI Error:", error);
    return { category: "Outros", unit: "un" };
  }
}

export async function getOrderInsights(orders: any[], projectBudget: number) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise estes pedidos de obra: ${JSON.stringify(orders)}. Orçamento total: R$ ${projectBudget}. Dê 3 dicas curtas de economia ou alertas de preço.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
      },
    });
    
    const text = response.text;
    return text ? JSON.parse(text) : ["Mantenha o controle rigoroso das cotações.", "Considere compras em volume.", "Verifique prazos de entrega."];
  } catch (error) {
    console.error("AI Error:", error);
    return ["Mantenha o controle rigoroso das cotações.", "Considere compras em volume.", "Verifique prazos de entrega."];
  }
}
