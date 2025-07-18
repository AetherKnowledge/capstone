"use client";
import { Message, useMessaging } from "@/lib/socket/hooks/useMessaging";
import { ReactNode, useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";
import ChatboxInput from "./ChatboxInput";

export function ChatBox({ chatId }: { chatId: string }) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messages, sendMessage, loading] = useMessaging(chatId);

  useEffect(() => {
    setTimeout(scrollToBottom, 50);
  }, [messages]);

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {/* Scrollable chat history */}
      <div className="flex-1 overflow-y-auto p-5" ref={chatContainerRef}>
        {renderChatHistory(loading, messages)}
      </div>

      {/* Fixed input bar */}
      <ChatboxInput
        onSend={(message) => {
          sendMessage({ content: message, chatId: chatId });
        }}
      />
    </>
  );
}

function renderChatHistory(loading: boolean, messages: Message[]): ReactNode {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <p className="text-base-content">Loading chat...</p>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <p className="text-center text-gray-500">No chat history available.</p>
    );
  }

  return messages.map((chat) => <ChatBubble key={chat.id} message={chat} />);
}

export default ChatBox;
