// Make sure to install the openai package: npm install openai
// You can do this in your project's root directory.
// Netlify will bundle this function with its dependencies during deployment.

import OpenAI from "openai"; // Using ES module import

export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { OPENAI_API_KEY } = process.env;

    if (!OPENAI_API_KEY) {
        console.error("OpenAI API key not found.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'OpenAI API key is not configured.' }),
        };
    }

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
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

        // --- OpenAI API Call ---
        // You can customize this part heavily (model, system message, temperature, etc.)
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful, friendly AI assistant." }, // System prompt to define AI's persona
                { role: "user", content: userPrompt }
            ],
            model: "gpt-3.5-turbo", // Or "gpt-4" if you have access and want more power
            // max_tokens: 150, // Optional: limit response length
            // temperature: 0.7, // Optional: control randomness (0.2 more deterministic, 1.0 more creative)
        });

        const aiReply = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't generate a response.";

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: aiReply }),
        };

    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        let errorMessage = "An error occurred while processing your request.";
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error.message; // More specific error from OpenAI
        } else if (error.message) {
            errorMessage = error.message;
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `OpenAI API Error: ${errorMessage}` }),
        };
    }
}