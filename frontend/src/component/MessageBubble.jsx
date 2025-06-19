import React from "react";
import "../styles/MessageBubble.css";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div
      className={`message-bubble ${isUser ? "user" : "ai"}`}
      style={{ alignSelf: isUser ? "flex-end" : "flex-start" }}
    >
      {content}
    </div>
  );
}
