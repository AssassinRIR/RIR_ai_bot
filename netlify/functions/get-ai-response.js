// netlify/functions/ai-handler.js

import OpenAI from "openai"; // ES module import

export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { OPENROUTER_API_KEY, SITE_URL, SITE_NAME } = process.env;

    if (!OPENROUTER_API_KEY) {
        console.error("OpenRouter API key not found.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured.' }),
        };
    }

    const openai = new OpenAI({
        apiKey: OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
            "HTTP-Referer": SITE_URL || "https://your-site.netlify.app", // optional
            "X-Title": SITE_NAME || "My Netlify AI App", // optional
        },
    });

    try {
        const body = JSON.parse(event.body);
        const userPrompt = body.prompt;

        if (!userPrompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Prompt is required.' }),
            };
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful, friendly AI assistant." },
                { role: "user", content: userPrompt }
            ],
            model: "deepseek/deepseek-chat-v3-0324:free",
        });

        const aiReply = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: aiReply }),
        };

    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        const message = error?.message || "An error occurred during the API request.";
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `OpenRouter API Error: ${message}` }),
        };
    }
}
