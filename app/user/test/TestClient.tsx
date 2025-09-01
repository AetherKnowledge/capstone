"use client";

import ChatSidebar, { Chat } from "@/app/components/Chats/Chatbox/ChatSidebar";
import { getChats } from "@/app/components/Chats/ChatsActions";
import { UserStatus } from "@/app/generated/prisma";
import { imageGenerator } from "@/lib/utils";
import { useEffect, useState } from "react";

const TestClient = () => {
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      console.log("test");
      const chats = await getChats();
      const parsedData = await Promise.all(
        chats.map(
          async (chat) =>
            ({
              id: chat.id,
              name: chat.name || chat.email || "Unknown",
              type: chat.type,
              src: imageGenerator(chat.name, 10, chat.src),
              status: chat.status || UserStatus.Offline,
              latestMessage: chat.latestMessage,
            }) as Chat
        )
      );
      setChats(parsedData);
    };

    fetchChats();
  }, []);

  console.log(chats);
  console.log("bruh");
  return <ChatSidebar />;
};

export default TestClient;
