// src/api/openai.js

import OpenAI from "openai";
import { systemPrompt as defaultPrompt } from "../prompts/systemPrompt";

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true, // prototyping only!
});

/**
 * Sends a chat completion to OpenAI.
 *
 * @param {Array<{role: string, content: string}>} history
 *    The conversation history (excluding the system prompt).
 * @param {string} [overrideSystemPrompt]
 *    If provided, this string is used as the system message
 *    instead of the default Food Agent prompt.
 * @returns {Promise<{role: string, content: string}>}
 *    The assistant’s next message.
 */
export async function chatWithAgent(history, overrideSystemPrompt) {
    const systemContent = overrideSystemPrompt ?? defaultPrompt;

    const messages = [
        { role: "system", content: systemContent },
        ...history,
    ];

    const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 500,
    });

    return resp.choices[0].message;
}
