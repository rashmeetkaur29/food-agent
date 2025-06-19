import { useState, useEffect } from "react";
import { chatWithAgent } from "../api/openai";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const aiGreeting = await chatWithAgent([]);
        setMessages([aiGreeting]);
      } catch {
        setMessages([{ role: "assistant", content: "Sorry, I can't start right now." }]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🧠 Extract simple preferences from user's message
  const extractPreferences = (text) => {
    const lower = text.toLowerCase();
    return {
      cuisine: lower.includes("sushi") ? "Japanese" :
               lower.includes("pasta") ? "Italian" :
               lower.includes("noodles") ? "Chinese" : "Unknown",
      spiceLevel: lower.includes("spicy") ? "Spicy" :
                  lower.includes("mild") ? "Mild" : "Normal",
      mood: lower.includes("comfort") ? "Comfort Food" :
            lower.includes("different") ? "Adventurous" :
            "Not specified",
      lastMessage: text,
      timestamp: new Date().toISOString()
    };
  };

  // Call this when the user sends a message
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setLoading(true);

    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);

    // ✅ Save user preferences to backend
    try {
      const preferences = extractPreferences(text);
      await fetch("http://localhost:5000/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "rashmeet123", // You can later get this from login/session
          preferences
        }),
      });
      console.log("✅ Preferences saved:", preferences);
    } catch (err) {
      console.error("❌ Failed to save preferences:", err);
    }

    // Continue to get AI response
    try {
      const aiMsg = await chatWithAgent(history);
      setMessages([...history, aiMsg]);
    } catch {
      setMessages([...history, { role: "assistant", content: "Oops, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
