import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCBKzadbwVxn4p6_mU0zi47Ruj3cBKOS9w";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateRecipe = async (prompt: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return text;
    } catch (error) {
        console.error("Error generating recipe:", error);
        throw new Error("Failed to generate recipe from Gemini.");
    }
};

export const generateRecipeFromImage = async (base64Image: string, mimeType: string, prompt: string) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const imageParts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType
                }
            }
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const text = result.response.text();
        return text;
    } catch (error) {
        console.error("Error generating recipe from image:", error);
        throw new Error("Failed to generate recipe from image.");
    }
};

