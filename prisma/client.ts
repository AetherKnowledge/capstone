// lib/prisma.ts
import { PrismaClient } from "@/app/generated/prisma";
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// const globalForPrisma = global as unknown as {
//   prisma: PrismaClient;
// };

// // Create the base client
// const basePrisma = globalForPrisma.prisma || new PrismaClient();

// // Extend it safely
// export const prisma = basePrisma.$extends({
//   result: {
//     chatMessage: {
//       create: {
//         needs: { chatId: true },
//         async compute(chatMessage) {
//           // Note: `this` inside compute refers to the extension context,
//           // not the global prisma, so call basePrisma instead
//           await basePrisma.chat.update({
//             where: { id: chatMessage.chatId },
//             data: { lastMessageAt: new Date() },
//           });
//           return chatMessage;
//         },
//       },
//     },
//   },
// });

// // Cache in dev (hot reload safe)
// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.prisma = basePrisma;
// }
