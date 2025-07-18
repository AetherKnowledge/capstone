import { messageSchema } from "@/lib/schemas";
import ClientSocketServer from "@/lib/socket/ClientSocketServer";
import { Message } from "@/lib/socket/hooks/useMessaging";
import {
  SocketAnswerCall,
  SocketCallEnded,
  SocketError,
  SocketEvent,
  SocketEventType,
  SocketInitiateCall,
  SocketMessage,
} from "@/lib/socket/SocketEvents";
import { prisma } from "@/prisma/client";
import { WebSocket } from "ws";

export async function receiveMessage(
  client: ClientSocketServer,
  payload: SocketMessage,
  rateLimited: boolean = false
) {
  if (rateLimited) {
    console.warn(`Rate limit exceeded for user: ${client.clientToken.name}`);
    sendErrorResponseToSelf(
      client,
      "Rate limit exceeded. Please slow down.",
      429
    );
    return;
  }

  console.log("Handling message from client:", client.clientToken.name);
  const validation = messageSchema.safeParse(payload);
  if (!validation.success || !validation.data) {
    console.error("Invalid message format:", payload, validation.error);
    client.clientSocket.send(
      JSON.stringify({ error: "Invalid message format" })
    );
    return;
  }
  console.log("Message content validated");
  const chat = await prisma.chat.findUnique({
    where: { id: payload.chatId },
    include: {
      members: {
        select: { userId: true },
      },
    },
  });
  if (!chat) {
    console.error("Chat not found for ID:", payload.chatId);
    client.clientSocket.close(1008, "Chat not found");
    return;
  }
  if (!chat.members.some((m) => m.userId === client.clientToken.sub)) {
    console.log("User is not a member of the chat");
    client.clientSocket.close(1008, "You are not a member of this chat");
    return;
  }
  const newMessage = await prisma.chatMessage.create({
    data: {
      chatId: payload.chatId,
      userId: client.clientToken.sub!,
      content: validation.data.content,
    },
  });

  await prisma.chat.update({
    where: { id: payload.chatId },
    data: { lastMessageAt: new Date() },
  });

  for (const ws of client.server.clients) {
    if (
      ws.readyState === WebSocket.OPEN &&
      chat.members.some((m) => m.userId === ws.userId)
    ) {
      console.log("Sending message to client:", ws.userId, newMessage.content);
      ws.send(
        JSON.stringify({
          type: SocketEventType.MESSAGE,
          payload: {
            ...newMessage,
            name: client.clientToken.name,
            src: client.clientToken.picture,
          },
        } as SocketEvent<Message>)
      );
    }
  }
}

export async function sendMessageToSelf(
  client: ClientSocketServer,
  eventType: SocketEventType,
  payload:
    | SocketMessage
    | SocketInitiateCall
    | SocketAnswerCall
    | SocketCallEnded
    | SocketError
) {
  if (client.clientSocket.readyState !== WebSocket.OPEN) return;
  console.log(`Sending message to self: ${client.clientToken.name}`, {
    eventType,
    payload,
  });
  client.clientSocket.send(JSON.stringify({ type: eventType, payload }));
}

export async function sendMessageToClient(
  client: ClientSocketServer,
  eventType: SocketEventType,
  payload:
    | SocketMessage
    | SocketInitiateCall
    | SocketAnswerCall
    | SocketCallEnded
    | SocketError,
  id: string
) {
  if (id === client.clientToken.sub) {
    sendMessageToSelf(client, eventType, payload);
    return;
  }
  for (const ws of client.server.clients) {
    if (ws.readyState === WebSocket.OPEN && ws.userId === id) {
      console.log(`Sending message to client: ${ws.userId}`, {
        eventType,
        payload,
      });
      ws.send(JSON.stringify({ type: eventType, payload }));
    }
  }
}

export async function sendErrorResponseToSelf(
  client: ClientSocketServer,
  message: string,
  code?: number
) {
  console.error(
    `Sending error response to self: ${client.clientToken.name} Error: ${message} Code: ${code}`
  );
  sendMessageToSelf(client, SocketEventType.ERROR, {
    message,
    code,
  } as SocketError);
}
