import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { Notification } from './entities/notification.entity';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients = new Set<Socket>();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    afterInit(server: Server) {
        // WebSocket Notification Gateway initialized
    }

    handleConnection(client: Socket) {
        this.connectedClients.add(client);
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client);
    }

    // Broadcast new notification to all connected clients
    broadcastNewNotification(notification: Notification) {
        this.server.emit('new-notification', notification);
    }

    // Broadcast notification marked as read
    broadcastNotificationRead(notificationId: number) {
        this.server.emit('notification-read', { id: notificationId });
    }

    // Broadcast all notifications marked as read
    broadcastAllNotificationsRead() {
        this.server.emit('all-notifications-read');
    }

    // Broadcast notification deleted
    broadcastNotificationDeleted(notificationId: number) {
        this.server.emit('notification-deleted', { id: notificationId });
    }

    // Get current connected clients count
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }

    // Send notification status to all clients
    broadcastNotificationStatus(status: {
        connectedClients: number;
        totalNotifications: number;
        unreadNotifications: number;
    }) {
        this.server.emit('notification-status', status);
    }
}
