import OpenAI from "openai";
import { systemPrompt } from "../prompts/systemPrompt";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // prototyping only!
});

/**
 * Sends the system prompt + history to OpenAI, returns the assistant's next message.
 */
export async function chatWithAgent(history) {
    const messages = [
        { role: "system", content: systemPrompt },
        ...history
    ];
    const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 500,
    });
    return resp.choices[0].message;
}
