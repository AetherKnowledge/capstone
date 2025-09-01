import { Chat } from "@/app/components/Chats/Chatbox/ChatSidebar";
import { getChats } from "@/app/components/Chats/ChatsActions";
import { UserStatus } from "@/app/generated/prisma";
import { imageGenerator } from "@/lib/utils";
import TestClient from "./TestClient";

const Test = async () => {
  const chatsRaw = await getChats();
  const chats = await Promise.all(
    chatsRaw.map(
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

  return (
    <div className="flex-1 pt-25">
      <div className="bg-base-100 shadow-br rounded-xl">
        <TestClient />
      </div>
    </div>
  );
};

export default Test;
