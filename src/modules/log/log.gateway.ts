import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

export interface LogMessage {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug' | 'log';
    message: string;
    context?: string;
    source: 'console' | 'winston';
    additionalInfo?: any;
}

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    namespace: '/logs',
})
export class LogGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedClients = new Set<Socket>();
    private logBuffer: LogMessage[] = [];
    private readonly MAX_BUFFER_SIZE = 1000;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    afterInit(server: Server) {
        // WebSocket Log Gateway initialized
    }

    handleConnection(client: Socket) {
        this.connectedClients.add(client);

        // Send recent logs to newly connected client
        if (this.logBuffer.length > 0) {
            client.emit('recent-logs', this.logBuffer.slice(-100)); // Last 100 logs
        }
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client);
    }

    // Broadcast log to all connected clients
    broadcastLog(logMessage: LogMessage) {
        // Add to buffer
        this.logBuffer.push(logMessage);

        // Keep buffer size manageable
        if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
            this.logBuffer = this.logBuffer.slice(-this.MAX_BUFFER_SIZE);
        }

        // Broadcast to all connected clients
        this.server.emit('new-log', logMessage);
    }

    // Get current connected clients count
    getConnectedClientsCount(): number {
        return this.connectedClients.size;
    }

    // Get recent logs
    getRecentLogs(limit = 100): LogMessage[] {
        return this.logBuffer.slice(-limit);
    }

    // Clear log buffer
    clearBuffer() {
        this.logBuffer = [];
        this.server.emit('logs-cleared');
    }
}
