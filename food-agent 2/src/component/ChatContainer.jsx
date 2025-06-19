import React from "react";
import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

export default function ChatContainer() {
    const { messages, sendMessage, loading } = useChat();

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-50">
            {/* Chat messages */}
            <div className="flex-1 overflow-auto bg-white sm:p-6 p-4">
                <MessageList messages={messages} />
            </div>

            {/* Input bar */}
            <ChatInput onSend={sendMessage} disabled={loading} />
        </div>
    );
}
