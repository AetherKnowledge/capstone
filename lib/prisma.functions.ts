// prisma.$use(async (params, next) => {
//   // Only hook into ChatMessage creations
//   if (params.model === "ChatMessage" && params.action === "create") {
//     // Run the insertion
//     const message = await next(params);

//     // Fire-and-forget: update the Chat.lastMessageAt
//     prisma.chat
//       .update({
//         where: { id: message.chatId },
//         data: { lastMessageAt: message.createdAt },
//       })
//       .catch(console.error);

//     return message;
//   }

//   // For everything else, just continue
//   return next(params);
// });
