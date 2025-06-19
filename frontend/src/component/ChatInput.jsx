import React from "react";
import "../App.css";

export default function ChatInput({ onSend, disabled }) {
  return (
    <form
      className="chat-input-container"
      onSubmit={(e) => {
        e.preventDefault();
        const text = e.target.elements.userInput.value.trim();
        if (text) onSend(text);
        e.target.reset();
      }}
    >
      <input
        name="userInput"
        placeholder="Type your message..."
        disabled={disabled}
      />
      <button type="submit" disabled={disabled}>
        Send
      </button>
    </form>
  );
}
