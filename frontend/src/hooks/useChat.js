// src/hooks/useChat.js

import { useState, useEffect, useRef } from "react";
import OpenAI from "openai";
import { systemPrompt as basePrompt } from "../prompts/systemPrompt";
import { chatWithAgent } from "../api/openai.js";

// your backend base URL
const API_BASE = "http://localhost:3001/api";


// classification client (for cuisine/mood)
const classifierClient = new OpenAI({

  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/** stable per-browser userId */
function getUserId() {
  let id = localStorage.getItem("foodAgentUserId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("foodAgentUserId", id);
  }
  return id;
}

/** extract cuisine & mood via a small GPT call */
async function classifyPreferences(text) {
  const messages = [
    {
      role: "system",
      content: `
You are a JSON extractor. Given a user message, identify:
• "cuisine": any dish or cuisine expressed, or null if none.
• "mood": any emotional or descriptive term, or null if none.
Respond with EXACTLY a JSON object, e.g. {"cuisine":"Italian","mood":"comforting"}.
      `.trim(),
    },
    { role: "user", content: text },
  ];
  const resp = await classifierClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0,
    max_tokens: 60,
  });
  try {
    return JSON.parse(resp.choices[0].message.content.trim());
  } catch {
    return { cuisine: null, mood: null };
  }
}

/** small helper to detect method words in free text */
function extractMethod(text) {
  const lower = text.toLowerCase();
  if (/\bdelivery\b/.test(lower))    return "delivery";
  if (/\bpickup\b/.test(lower))      return "pickup";
  if (/\bdine[- ]?in\b/.test(lower)) return "dine-in";
  return null;
}

/** prepend memory into the system prompt */
function buildSystemPrompt(memory) {
  const prefix = memory.cuisine
      ? `Previous Preferences: Last time you ordered ${memory.cuisine}.\n\n`
      : "";
  return prefix + basePrompt.replace("{{PREVIOUS_PREFERENCES}}", memory.cuisine || "");
}

export function useChat() {
  const userId = getUserId();
  const [memory, setMemory]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const lastAiRef  = useRef("");  // store last assistant content
  const didInitRef = useRef(false);

  // 1) load memory
  useEffect(() => {
    (async () => {
      const res  = await fetch(`${API_BASE}/user/${userId}`);
      const data = res.ok ? await res.json() : {};
      setMemory(data);
    })();
  }, [userId]);

  // 2) initial greeting
  useEffect(() => {
    if (memory === null || didInitRef.current) return;
    didInitRef.current = true;
    (async () => {
      setLoading(true);
      const ai = await chatWithAgent([], buildSystemPrompt(memory));
      lastAiRef.current = ai.content;
      setMessages([ai]);
      setLoading(false);
    })();
  }, [memory]);

  // 3) main sendMessage handler
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    setMessages(ms => [...ms, userMsg]);

    // parse out
    const { cuisine: explicitCuisine } = await classifyPreferences(text);
    const method = extractMethod(text);

    // (a) NUMBERED-PICK AFTER A RESTAURANT LIST → CONFIRM ORDER
    const n = parseInt(text.trim());
    if (!isNaN(n) && lastAiRef.current.includes("1.") /* crude check for listing */) {
      // pull the nth line
      const lines = lastAiRef.current
          .split("\n")
          .filter(l => /^\s*\d+\./.test(l));
      if (lines[n-1]) {
        const restName = lines[n-1]
            .replace(/^\s*\d+\.\s*/, "")
            .split("(")[0]
            .trim();
        const confirmMsg = {
          role: "assistant",
          content: `Perfect—ordering with ${restName}. Shall I place the order now?`
        };
        lastAiRef.current = confirmMsg.content;
        setMessages(ms => [...ms, confirmMsg]);
        return;
      }
    }

    // (b) YES TO THE “SHALL I PLACE THE ORDER” → FINAL CONFIRM
    if (/^yes$/i.test(text.trim()) && lastAiRef.current.startsWith("Perfect—ordering with")) {
      const finalMsg = {
        role: "assistant",
        content: `All set! Your order is on its way. Enjoy! 🎉`
      };
      setMessages(ms => [...ms, finalMsg]);
      return;
    }

    // 3b) numbered‐pick for cuisine (before listing)…
    let pickedCuisine = null;
    if (!isNaN(n)) {
      const lines = lastAiRef.current
          .split("\n")
          .filter(l => /^\s*\d+\./.test(l));
      if (lines[n-1]) {
        const name = lines[n-1]
            .replace(/^\s*\d+\.\s*/, "")
            .split("(")[0]
            .trim();
        const { cuisine } = await classifyPreferences(name);
        pickedCuisine = cuisine;
      }
    }

    // 3c) “yes” to memory suggestion
    let affirmativeCuisine = null;
    if (/^yes|sure|sounds great/i.test(text) &&
        /welcome back/i.test(lastAiRef.current)) {
      affirmativeCuisine = memory?.cuisine;
    }

    // if user says only “delivery”/“pickup”/“dine-in”, pull cuisine from memory
    const cuisine = explicitCuisine
        || pickedCuisine
        || affirmativeCuisine
        || (method ? memory?.cuisine : null);

    // 4) as soon as we have BOTH cuisine & method → fetch once
    if (cuisine && method) {
      // save
      await fetch(`${API_BASE}/user/${userId}`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          cuisine,
          method,
          lastMessage: text,
          timestamp: new Date().toISOString(),
        }),
      });
      setMemory(m => ({ ...(m||{}), cuisine, method }));

      // ack
      const ack = {
        role: "assistant",
        content: `Got it—${method}. One sec while I find top-rated ${cuisine} spots near you…`
      };
      lastAiRef.current = ack.content;
      setMessages(ms => [...ms, ack]);

      // geolocate + fetch
      navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            const url  = `${API_BASE}/restaurants?lat=${coords.latitude}&lon=${coords.longitude}&cuisine=${encodeURIComponent(cuisine)}`;
            const res  = await fetch(url);
            const list = await res.json();
            const lines = list
                .map((r,i)=>`${i+1}. ${r.name} (${r.rating}★) — ${r.address}`)
                .join("\n\n");
            const menu = {
              role: "assistant",
              content: `Here are three great options:\n\n${lines}\n\nWhich one sounds good?`
            };
            lastAiRef.current = menu.content;
            setMessages(ms => [...ms, menu]);
          },
          () => {
            const fail = {
              role: "assistant",
              content: "I couldn’t get your location—could you share your city or ZIP code instead?"
            };
            lastAiRef.current = fail.content;
            setMessages(ms => [...ms, fail]);
          }
      );
      return;
    }

    // 5) if we have cuisine but *no* method yet → ask once
    if (cuisine && !method) {
      await fetch(`${API_BASE}/user/${userId}`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          cuisine,
          lastMessage: text,
          timestamp: new Date().toISOString()
        }),
      });
      setMemory(m => ({ ...(m||{}), cuisine }));
      const askMethod = {
        role: "assistant",
        content: "Would you like delivery, pickup, or dine-in?"
      };
      lastAiRef.current = askMethod.content;
      setMessages(ms => [...ms, askMethod]);
      return;
    }

    // 6) fallback to pure GPT flow
    setLoading(true);
    const ai = await chatWithAgent([...messages, userMsg], buildSystemPrompt(memory||{}));
    lastAiRef.current = ai.content;
    setMessages(ms => [...ms, ai]);
    setLoading(false);
  };

  return { messages, sendMessage, loading };
}
