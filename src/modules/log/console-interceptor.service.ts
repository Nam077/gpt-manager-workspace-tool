import { Injectable, OnModuleInit } from '@nestjs/common';
import { LogGateway, LogMessage } from './log.gateway';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConsoleInterceptorService implements OnModuleInit {
    private originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
    };

    constructor(private logGateway: LogGateway) {}

    onModuleInit() {
        this.interceptConsole();
    }

    private interceptConsole() {
        // Intercept console.log
        console.log = (...args: any[]) => {
            this.originalConsole.log(...args);
            this.sendLogMessage('log', this.formatArgs(args), 'CONSOLE');
        };

        // Intercept console.info
        console.info = (...args: any[]) => {
            this.originalConsole.info(...args);
            this.sendLogMessage('info', this.formatArgs(args), 'CONSOLE');
        };

        // Intercept console.warn
        console.warn = (...args: any[]) => {
            this.originalConsole.warn(...args);
            this.sendLogMessage('warn', this.formatArgs(args), 'CONSOLE');
        };

        // Intercept console.error
        console.error = (...args: any[]) => {
            this.originalConsole.error(...args);
            this.sendLogMessage('error', this.formatArgs(args), 'CONSOLE');
        };

        // Intercept console.debug
        console.debug = (...args: any[]) => {
            this.originalConsole.debug(...args);
            this.sendLogMessage('debug', this.formatArgs(args), 'CONSOLE');
        };

        // Console interceptor activated
    }

    private formatArgs(args: any[]): string {
        const formattedString = args
            .map((arg) => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg, null, 2);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            })
            .join(' ');

        // Strip ANSI color codes using regex
        return this.stripAnsiCodes(formattedString);
    }

    private stripAnsiCodes(str: string): string {
        // Remove ANSI escape sequences
        // \u001b[ or \u009b followed by [0-9;]*[a-zA-Z]
        return str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
    }

    private sendLogMessage(level: LogMessage['level'], message: string, context?: string) {
        const logMessage: LogMessage = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            source: 'console',
        };

        // Broadcast through WebSocket
        this.logGateway.broadcastLog(logMessage);
    }

    // Manual log method for other services to use
    public log(level: LogMessage['level'], message: string, context?: string, additionalInfo?: any) {
        const logMessage: LogMessage = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            source: 'winston',
            additionalInfo,
        };

        this.logGateway.broadcastLog(logMessage);
    }

    // Restore original console methods (for cleanup if needed)
    restoreConsole() {
        console.log = this.originalConsole.log;
        console.info = this.originalConsole.info;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
        console.debug = this.originalConsole.debug;
    }
}
