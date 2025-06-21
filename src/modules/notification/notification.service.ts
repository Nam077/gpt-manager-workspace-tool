import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway';

export interface PaginatedNotificationResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @Inject(forwardRef(() => NotificationGateway))
        private notificationGateway: NotificationGateway,
    ) {}

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepository.create(createNotificationDto);
        const savedNotification = await this.notificationRepository.save(notification);

        // Broadcast new notification via WebSocket
        this.notificationGateway.broadcastNewNotification(savedNotification);

        return savedNotification;
    }

    async createUserRemovedNotification(
        type: 'user_removed_pending' | 'user_removed_main',
        adminEmail: string,
        targetEmail: string,
        additionalInfo?: string,
    ): Promise<Notification> {
        const message =
            type === 'user_removed_pending'
                ? `User ${targetEmail} removed from pending workspace by ${adminEmail}`
                : `User ${targetEmail} removed from main workspace by ${adminEmail}`;

        return this.create({
            type,
            adminEmail,
            targetEmail,
            message,
            additionalInfo,
            isRead: false,
        });
    }

    async createCookieExpiredNotification(adminEmail: string, additionalInfo?: string): Promise<Notification> {
        const message = `Cookie expired for admin ${adminEmail}`;

        return this.create({
            type: 'cookie_expired',
            adminEmail,
            message,
            additionalInfo,
            isRead: false,
        });
    }

    async createUsersInvitedNotification(
        adminEmail: string,
        invitedEmails: string[],
        additionalInfo?: string,
    ): Promise<Notification> {
        const emailList =
            invitedEmails.length > 3
                ? `${invitedEmails.slice(0, 3).join(', ')} and ${invitedEmails.length - 3} more`
                : invitedEmails.join(', ');

        const message = `Admin ${adminEmail} invited ${invitedEmails.length} user(s): ${emailList}`;

        return this.create({
            type: 'users_invited',
            adminEmail,
            targetEmail: invitedEmails.join(','), // Store all emails
            message,
            additionalInfo,
            isRead: false,
        });
    }

    async findAll(page = 1, limit = 20): Promise<PaginatedNotificationResponse<Notification>> {
        const offset = (page - 1) * limit;

        const [notifications, total] = await this.notificationRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: notifications,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    async findOne(id: number): Promise<Notification> {
        return this.notificationRepository.findOne({ where: { id } });
    }

    async findByType(type: string, limit = 50): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { type },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async findUnread(limit = 50): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { isRead: false },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async markAsRead(id: number): Promise<Notification> {
        await this.notificationRepository.update(id, { isRead: true });
        const updatedNotification = await this.findOne(id);

        // Broadcast notification read via WebSocket
        this.notificationGateway.broadcastNotificationRead(id);

        return updatedNotification;
    }

    async markAllAsRead(): Promise<void> {
        await this.notificationRepository.update({ isRead: false }, { isRead: true });

        // Broadcast all notifications read via WebSocket
        this.notificationGateway.broadcastAllNotificationsRead();
    }

    async update(id: number, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
        await this.notificationRepository.update(id, updateNotificationDto);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.notificationRepository.delete(id);

        // Broadcast notification deleted via WebSocket
        this.notificationGateway.broadcastNotificationDeleted(id);
    }

    async deleteOldNotifications(days = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await this.notificationRepository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :cutoffDate', { cutoffDate })
            .execute();

        return result.affected || 0;
    }
}
