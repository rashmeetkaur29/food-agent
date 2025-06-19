import React from "react";
import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import "../App.css";

export default function ChatContainer() {
    const { messages, sendMessage, loading } = useChat();

    return (
        <div className="chat-container">
            {/* Header */}
            <div className="header">
                <div className="logo-title">
                    <span className="emoji-logo">🍱</span>
                    <h1 className="title">Food Assistant</h1>
                </div>
                <span className="powered-by">powered by AI</span>
            </div>

            {/* Messages */}
            <div className="message-list">
                <MessageList messages={messages} />
            </div>

            {/* Input */}
            <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
    );
}
