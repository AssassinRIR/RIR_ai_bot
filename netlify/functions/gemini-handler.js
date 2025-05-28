// netlify/functions/gemini-handler.js

export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { GEMINI_API_KEY } = process.env;

    if (!GEMINI_API_KEY) {
        console.error("Gemini API key not found.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'GEMINI API key is not configured.' }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        const userPrompt = body.prompt;

        if (!userPrompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Prompt is required.' }),
            };
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: userPrompt }
                            ]
                        }
                    ]
                }),
            }
        );

        const data = await response.json();

        const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No response from Gemini API.";

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: aiReply }),
        };

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Gemini API Error: " + (error.message || "Unknown error") }),
        };
    }
}
