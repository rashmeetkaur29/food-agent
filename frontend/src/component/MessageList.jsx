import React from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages }) {
  return (
    <div className="message-list">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} role={msg.role} content={msg.content} />
      ))}
    </div>
  );
}
