import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateNotificationDTO {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
}

// Create notification
export async function createNotification(data: CreateNotificationDTO) {
  const notification = await prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      priority: data.priority,
    },
  });

  return notification;
}

// Get user notifications
export async function getUserNotifications(
  userId: string,
  filters?: {
    isRead?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
  }
) {
  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(filters?.isRead !== undefined && { isRead: filters.isRead }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.priority && { priority: filters.priority }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return notifications;
}

// Mark as read
export async function markAsRead(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true, readAt: new Date() },
  });
}

// Mark all as read
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

// Get unread count
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  });
}

// Trigger grade drop notification
export async function notifyGradeDrop(studentId: string, subjectName: string, oldGrade: number, newGrade: number) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { parents: { include: { parent: { include: { user: true } } } } },
  });

  if (!student) return;

  const drop = ((oldGrade - newGrade) / oldGrade) * 100;

  if (drop >= 10) {
    // Notify parents
    for (const parentLink of student.parents) {
      await createNotification({
        recipientId: parentLink.parent.userId,
        type: NotificationType.GRADE_DROP,
        title: 'Grade Drop Alert',
        message: `Your child's grade in ${subjectName} dropped from ${oldGrade} to ${newGrade}`,
        priority: NotificationPriority.HIGH,
      });
    }
  }
}
