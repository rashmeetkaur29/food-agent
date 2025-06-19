import React from "react";

export default function ChatInput({ onSend, disabled }) {
    return (
        <form
            className="flex items-center bg-gray-700 p-3 sm:p-4 border-t border-gray-600"
            onSubmit={(e) => {
                e.preventDefault();
                const text = e.target.elements.userInput.value.trim();
                if (text) onSend(text);
                e.target.reset();
            }}
        >
            <input
                name="userInput"
                disabled={disabled}
                className="flex-1 bg-gray-600 text-white placeholder-gray-400 border border-gray-600 rounded-l-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Type your message…"
            />
            <button
                type="submit"
                disabled={disabled}
                className="ml-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-r-full disabled:opacity-50 transition"
            >
                Send
            </button>
        </form>
    );
}
