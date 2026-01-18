import { GoogleGenAI, Type } from "@google/genai";
import { TableData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateTableData = async (prompt: string): Promise<TableData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a table based on this request: "${prompt}". 
      Return ONLY the data as a 2D JSON array of strings. 
      The first row should be headers. 
      Keep it concise (max 6 columns, max 8 rows).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            }
          }
        }
      }
    });

    if (response.text) {
      const rawData = JSON.parse(response.text) as string[][];
      // Convert to TableCell structure
      return rawData.map((row) => 
        row.map((cellValue) => ({
          id: generateId(),
          value: cellValue,
          rowSpan: 1,
          colSpan: 1,
        }))
      );
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};