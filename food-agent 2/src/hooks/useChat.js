import { useState, useEffect } from "react";
import { chatWithAgent } from "../api/openai";

export function useChat() {
    const [messages, setMessages] = useState([]);  // { role, content }[]
    const [loading, setLoading] = useState(false);

    // On mount: get the initial greeting from the AI
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

    // Call this when the user submits text
    const sendMessage = async (text) => {
        if (!text.trim() || loading) return;
        setLoading(true);

        // 1) Append the user's message
        const userMsg = { role: "user", content: text };
        const history = [...messages, userMsg];
        setMessages(history);

        // 2) Get the AI's next reply
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
