import { CallStatus } from "@/app/generated/prisma";
import {
  answerCallSchema,
  initiateCallSchema,
  leaveCallSchema,
  sdpSchema,
} from "@/lib/schemas";
import ClientSocketServer from "@/lib/socket/ClientSocketServer";
import { prisma } from "@/prisma/client";
import {
  CallAnswerType,
  SocketAnswerCall,
  SocketCallEnded,
  SocketEvent,
  SocketEventType,
  SocketInitiateCall,
  SocketLeaveCall,
  SocketSdp,
} from "../SocketEvents";
import { isMemberOfChat } from "./chat";
import { sendErrorResponseToSelf, sendMessageToClient } from "./messaging";

export async function receiveInitiateCall(
  client: ClientSocketServer,
  payload: SocketInitiateCall
) {
  const validation = initiateCallSchema.safeParse(payload);
  if (!validation.success || !validation.data) {
    sendErrorResponseToSelf(client, `Invalid initiate call payload`, 400);
    return;
  }
  const { chatId, callerId } = validation.data;

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      call: {
        select: { id: true, callMember: { select: { socketId: true } } },
      },
      members: {
        select: {
          userId: true,
          user: { select: { name: true, image: true } },
        },
      },
    },
  });

  if (!client.clientSocket.socketId)
    client.clientSocket.socketId = crypto.randomUUID();

  if (!chat) {
    sendErrorResponseToSelf(client, `Chat not found for ID ${chatId}`, 404);
    return;
  }

  if (!(await isMemberOfChat(client, chatId))) {
    sendErrorResponseToSelf(
      client,
      `User is not a member of the chat: ${chatId}`,
      403
    );
    return;
  }

  // Improved: Only one call per chat, delete old call if orphaned
  if (chat.call) {
    const activeSockets = Array.from(client.server.clients).filter(
      (ws) =>
        ws.readyState === WebSocket.OPEN &&
        ws.chatId === chatId &&
        ws.callId === chat.call!.id
    );
    if (activeSockets.length > 1) {
      sendErrorResponseToSelf(
        client,
        `Call already exists for client chat: ${chatId}`,
        409
      );
      return;
    } else {
      console.log("Deleting orphaned call for chat:", chatId);
      await deleteCall(client, chat.call.id);
    }
  }

  const member = chat.members.find((m) => m.userId === callerId);
  const initiateCallData: SocketInitiateCall = {
    ...validation.data,
    callerName: member?.user.name || client.clientToken.name || "Unknown",
    callerImage: member?.user.image || client.clientToken.picture || undefined,
  };

  await prisma.call.create({
    data: {
      id: initiateCallData.callId,
      chatId,
      status: CallStatus.Pending,
      callerId,
    },
  });

  await createCallMember(client, initiateCallData.callId, callerId);

  // Notify all chat members except caller
  for (const ws of client.server.clients) {
    if (
      ws.readyState === WebSocket.OPEN &&
      chat.members.some((m) => m.userId === ws.userId) &&
      ws.userId !== callerId
    ) {
      ws.send(
        JSON.stringify({
          type: SocketEventType.INITIATECALL,
          payload: initiateCallData,
        } as SocketEvent<SocketInitiateCall>)
      );
    }
  }

  client.setupCallTimeout(initiateCallData.callId, chatId);
  client.clientSocket.callId = initiateCallData.callId;
  console.log(
    "Initiate call setup complete for callId:",
    initiateCallData.callId
  );
}

export async function receiveAnswerCall(
  client: ClientSocketServer,
  payload: SocketAnswerCall
) {
  const validation = answerCallSchema.safeParse(payload);
  if (!validation.success || !validation.data) {
    sendErrorResponseToSelf(client, "Invalid answer call payload", 400);
    return;
  }
  const { callId, chatId, answer } = validation.data;

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      callMember: true,
      chat: {
        include: {
          members: {
            select: {
              userId: true,
              user: { select: { name: true, image: true } },
            },
          },
        },
      },
    },
  });

  if (!call) {
    console.error("Call not found for ID:", callId);
    sendErrorResponseToSelf(client, `Call not found for ID ${callId}`, 404);
    return;
  }
  if (!(await isMemberOfChat(client, chatId))) {
    sendErrorResponseToSelf(
      client,
      `User ${client.clientToken.name} is not a member of the chat: ${chatId}`,
      403
    );
    return;
  }
  if (call.chatId !== chatId) {
    sendErrorResponseToSelf(
      client,
      `Call does not belong to client chat: ${chatId}`,
      403
    );
    return;
  }
  if (call.callerId === client.clientToken.sub) {
    sendErrorResponseToSelf(client, `User cannot answer their own call`, 403);
    return;
  }
  if (call.status !== CallStatus.Pending) {
    sendErrorResponseToSelf(
      client,
      `Call is not in pending status: ${call.status}`,
      400
    );
    return;
  }

  client.clearCallTimeout();
  if (
    answer === CallAnswerType.REJECT ||
    answer === CallAnswerType.DID_NOT_ANSWER
  ) {
    console.log("Call rejected by user:", client.clientToken.name);
    sendMessageToClient(
      client,
      SocketEventType.ANSWERCALL,
      { callId, chatId, answer: CallAnswerType.REJECT } as SocketAnswerCall,
      call.callerId
    );
    if (call.callMember.length < 2) {
      console.log(
        "Deleting call due to rejection and no members left:",
        call.id
      );
      await deleteCall(client, call.id);
    }
    return;
  }

  console.log("Call accepted by user:", client.clientToken.name);
  await prisma.call.update({
    where: { id: callId },
    data: { status: CallStatus.Accepted },
  });

  sendMessageToClient(
    client,
    SocketEventType.ANSWERCALL,
    {
      userId: client.clientToken.sub,
      userName: client.clientToken.name,
      callId,
      chatId,
      answer: CallAnswerType.ACCEPT,
    } as SocketAnswerCall,
    call.callerId
  );

  await createCallMember(client, callId, client.clientToken.sub!);
  client.clientSocket.callId = callId;
  console.log("Answer call setup complete for callId:", callId);
}

export async function receiveLeaveCall(
  client: ClientSocketServer,
  payload: SocketLeaveCall
) {
  const validation = leaveCallSchema.safeParse(payload);
  if (!validation.success || !validation.data) {
    sendErrorResponseToSelf(client, "Invalid leave call payload", 400);
    return;
  }
  const { callId, chatId } = validation.data;
  await leaveCall(client, callId, chatId);
}

export async function receiveSdpData(
  client: ClientSocketServer,
  payload: SocketSdp
) {
  const validation = sdpSchema.safeParse(payload);
  if (!validation.success || !validation.data) {
    sendErrorResponseToSelf(client, "Invalid SDP offer payload", 400);
    return;
  }
  const { to, callId, chatId, sdpData } = validation.data;

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      callMember: { select: { userId: true } },
      chat: {
        include: {
          members: {
            select: {
              userId: true,
              user: { select: { name: true, image: true } },
            },
          },
        },
      },
    },
  });

  if (!call) {
    sendErrorResponseToSelf(client, `Call ${callId} not found`, 404);
    return;
  }
  if (!(await isMemberOfChat(client, chatId))) {
    sendErrorResponseToSelf(client, "You are not a member of client chat", 403);
    return;
  }
  if (!(await isMemberOfChat(client, chatId, to))) {
    sendErrorResponseToSelf(
      client,
      `User ${to} is not a member of client chat`,
      403
    );
    return;
  }
  if (call.chatId !== chatId) {
    sendErrorResponseToSelf(
      client,
      `Call ${call.id} does not belong to chat ${chatId}`,
      403
    );
    return;
  }

  console.log(
    `Received SDP data from client: ${client.clientToken.name}, sending to peer: ${to}`
  );
  for (const ws of client.server.clients) {
    if (
      ws.readyState === WebSocket.OPEN &&
      ws.userId === to &&
      ws.callId === callId
    ) {
      ws.send(
        JSON.stringify({
          type: SocketEventType.SDP,
          payload: {
            from: client.clientToken.sub,
            to,
            callId,
            chatId,
            sdpData,
          } as SocketSdp,
        } as SocketEvent<SocketSdp>)
      );
    }
  }
}

export async function leaveCall(
  client: ClientSocketServer,
  callId: string,
  chatId: string
) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      callMember: true,
      chat: {
        include: {
          members: {
            select: {
              userId: true,
              user: { select: { name: true, image: true } },
            },
          },
        },
      },
    },
  });

  console.log("Leaving call with ID:", callId, "in chat:", chatId);

  if (!call) {
    sendErrorResponseToSelf(
      client,
      `Call ${callId} not found for ID: ${callId}`,
      404
    );
    return;
  }
  if (call.chatId !== chatId) {
    sendErrorResponseToSelf(
      client,
      `Call ${call.id} does not belong to chat ${chatId}`,
      403
    );
    return;
  }
  if (callId !== client.clientSocket.callId) {
    sendErrorResponseToSelf(client, "You are not a member of client call", 403);
    return;
  }

  try {
    await prisma.callMember.delete({
      where: {
        callId_userId: { callId, userId: client.clientToken.sub! },
      },
    });
  } catch (error) {
    console.error("Error leaving call:", error);
  }

  // If no members are left, delete the call
  if (call.callMember.length - 1 < 2) {
    console.log("Deleting call as no members left:", call.id);
    await deleteCall(client, call.id);
  }

  // Notify other members
  for (const ws of client.server.clients) {
    if (
      ws.readyState === WebSocket.OPEN &&
      ws.chatId === chatId &&
      ws.userId !== client.clientToken.sub
    ) {
      ws.send(
        JSON.stringify({
          type: SocketEventType.LEAVECALL,
          payload: {
            userId: client.clientToken.sub,
            userName: client.clientToken.name || undefined,
            callId,
            chatId,
          },
        } as SocketEvent<SocketLeaveCall>)
      );
    }
  }

  console.log("User left call, callId cleared:", callId);
  client.clientSocket.callId = undefined;
}

export async function createCallMember(
  client: ClientSocketServer,
  callId: string,
  userId: string
) {
  if (!client.clientSocket.socketId)
    client.clientSocket.socketId = crypto.randomUUID();
  console.log("Creating call member:", {
    callId,
    userId,
    socketId: client.clientSocket.socketId,
  });
  return await prisma.callMember.create({
    data: { socketId: client.clientSocket.socketId, callId, userId },
  });
}

export async function deleteCall(client: ClientSocketServer, callId: string) {
  try {
    await prisma.call.delete({ where: { id: callId } });
    console.log(`Call with ID ${callId} deleted`);
  } catch (error) {
    console.error(`Error deleting call with ID ${callId}:`, error);
  }

  for (const ws of client.server.clients) {
    if (
      ws.readyState === WebSocket.OPEN &&
      ws.callId === callId &&
      ws.userId !== client.clientToken.sub
    ) {
      console.log(`Notifying client ${ws.userId} about call end`);
      sendMessageToClient(
        client,
        SocketEventType.CALLENDED,
        { callId, chatId: ws.chatId } as SocketCallEnded,
        ws.userId!
      );
    }
  }
  client.clientSocket.callId = undefined;
}
