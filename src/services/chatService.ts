import { PrismaClient, ChatType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// Create chat
export async function createChat(participants: string[], type: ChatType) {
  if (participants.length < 2) {
    throw new AppError('Chat must have at least 2 participants', 400);
  }

  const chat = await prisma.chat.create({
    data: {
      type,
      participants,
    },
  });

  return chat;
}

// Send message
export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  attachments?: string[]
) {
  const message = await prisma.chatMessage.create({
    data: {
      chatId,
      senderId,
      content,
      attachments: attachments || [],
      readBy: [senderId],
    },
    include: {
      sender: { select: { firstName: true, lastName: true, role: true } },
    },
  });

  await prisma.chat.update({
    where: { id: chatId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}

// Get chat history
export async function getChatHistory(chatId: string, page: number = 1, limit: number = 50) {
  const messages = await prisma.chatMessage.findMany({
    where: { chatId },
    include: {
      sender: { select: { firstName: true, lastName: true, role: true } },
    },
    orderBy: { sentAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return messages.reverse();
}

// Mark message as read
export async function markMessageAsRead(messageId: string, userId: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new AppError('Message not found', 404);

  if (!message.readBy.includes(userId)) {
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { readBy: [...message.readBy, userId] },
    });
  }
}

// Get user chats
export async function getUserChats(userId: string) {
  const chats = await prisma.chat.findMany({
    where: {
      participants: { has: userId },
    },
    include: {
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  return chats;
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  const chats = await prisma.chat.findMany({
    where: { participants: { has: userId } },
    select: { id: true },
  });

  const chatIds = chats.map((c) => c.id);

  const unreadCount = await prisma.chatMessage.count({
    where: {
      chatId: { in: chatIds },
      senderId: { not: userId },
      readBy: { not: { has: userId } },
    },
  });

  return unreadCount;
}
