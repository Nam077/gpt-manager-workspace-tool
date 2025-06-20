import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chalk from 'chalk';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    SUCCESS = 'success',
    DEBUG = 'debug',
}

@Injectable()
export class LoggerService {
    private logger: winston.Logger;

    constructor(private configService?: ConfigService) {
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json(),
            ),
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: 'logs/application-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                }),
                new winston.transports.DailyRotateFile({
                    level: 'error',
                    filename: 'logs/error-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d',
                }),
            ],
        });
    }

    private formatMessage(level: LogLevel, message: string, context?: string): string {
        const timestamp = new Date().toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        const contextEmoji = this.getContextEmoji(context);
        const prefix = context ? `${contextEmoji} [${context}]` : '';

        switch (level) {
            case LogLevel.ERROR:
                return chalk.red.bold(`💥 [${timestamp}] ${prefix} ${message}`);
            case LogLevel.WARN:
                return chalk.yellow.bold(`⚠️  [${timestamp}] ${prefix} ${message}`);
            case LogLevel.INFO:
                return chalk.blue(`📋 [${timestamp}] ${prefix} ${message}`);
            case LogLevel.SUCCESS:
                return chalk.green.bold(`🎉 [${timestamp}] ${prefix} ${message}`);
            case LogLevel.DEBUG:
                return chalk.gray(`🔍 [${timestamp}] ${prefix} ${message}`);
            default:
                return `📝 [${timestamp}] ${prefix} ${message}`;
        }
    }

    private getContextEmoji(context?: string): string {
        const emojiMap: { [key: string]: string } = {
            SCAN: '🔄',
            INVITE: '📧',
            PROCESS: '⚙️',
            CHUNK: '📦',
            TOKEN: '🔑',
            SESSION: '🔐',
            'DELETE PENDING': '🗑️',
            'DELETE MAIN': '❌',
            COOKIE: '🍪',
            API: '🌐',
            GPT: '🤖',
            WORKSPACE: '🏢',
            MEMBER: '👥',
            EMAIL: '✉️',
            ERROR: '💥',
            SUCCESS: '✨',
            WARNING: '⚠️',
            FAILED: '💀',
            COMPLETE: '🏁',
        };

        return context ? emojiMap[context.toUpperCase()] || '📌' : '';
    }

    private logToWinston(level: LogLevel, message: string, context?: string) {
        this.logger.log(level, message, { context });
    }

    error(message: string, context?: string, error?: any) {
        const formattedMessage = this.formatMessage(LogLevel.ERROR, message, context);
        console.log(formattedMessage);
        this.logToWinston(LogLevel.ERROR, message, context);
        if (error) {
            console.log(chalk.red(error.stack || error));
            this.logger.error('Stack trace', { error: error.stack || error, context });
        }
    }

    warn(message: string, context?: string) {
        const formattedMessage = this.formatMessage(LogLevel.WARN, message, context);
        console.log(formattedMessage);
        this.logToWinston(LogLevel.WARN, message, context);
    }

    info(message: string, context?: string) {
        const formattedMessage = this.formatMessage(LogLevel.INFO, message, context);
        console.log(formattedMessage);
        this.logToWinston(LogLevel.INFO, message, context);
    }

    success(message: string, context?: string) {
        const formattedMessage = this.formatMessage(LogLevel.SUCCESS, message, context);
        console.log(formattedMessage);
        this.logToWinston(LogLevel.INFO, message, context); // Winston doesn't have 'success' level
    }

    debug(message: string, context?: string) {
        const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, context);
        console.log(formattedMessage);
        this.logToWinston(LogLevel.DEBUG, message, context);
    }

    // Special methods for specific use cases
    scanStart(workspaces: number, cookies: number) {
        this.info(
            `Checking all workspaces for member synchronization | Workspaces: ${workspaces} | Active Cookies: ${cookies}`,
            'SCAN',
        );
    }

    scanComplete(type: 'SUCCESS' | 'ERROR' | 'NO_COOKIES' = 'SUCCESS') {
        switch (type) {
            case 'SUCCESS':
                this.success('All workspace synchronization tasks finished', 'SCAN');
                break;
            case 'ERROR':
                this.error('Finished with errors', 'SCAN');
                break;
            case 'NO_COOKIES':
                this.warn('No processing needed - no active cookies', 'SCAN');
                break;
        }
    }

    inviteStart(workspaces: number, cookies: number) {
        this.info(`Processing member invitations | Workspaces: ${workspaces} | Active Cookies: ${cookies}`, 'INVITE');
    }

    inviteComplete(count: number, emails?: string[]) {
        if (count > 0) {
            this.success(`Total invitations sent: ${count}`, 'INVITE');
            if (emails && emails.length > 0) {
                this.info(`Invited members: [${emails.join(', ')}]`, 'INVITE');
            }
        } else {
            this.info('No invitations needed - all members are up to date', 'INVITE');
        }
    }

    processStart(admin: string, type: 'MAIN_SCAN' | 'INVITE_SCAN') {
        this.info(`Admin: ${admin} | Type: ${type}`, 'PROCESS');
    }

    processComplete(admin: string, removedMain: number, removedPending: number) {
        this.success(`Admin: ${admin} | Removed Main: ${removedMain} | Removed Pending: ${removedPending}`, 'PROCESS');
    }

    processFailed(admin: string, error: any) {
        this.error(`Admin: ${admin} | Error: ${error?.message || error}`, 'PROCESS');
    }

    chunkProgress(current: number, total: number, size: number, type: 'tasks' | 'invite tasks' = 'tasks') {
        this.info(`Processing chunk ${current}/${total} with ${size} ${type}`, 'CHUNK');
    }

    chunkComplete(current: number, total: number) {
        this.success(`Chunk ${current}/${total} completed successfully`, 'CHUNK');
    }

    chunkError(current: number, total: number, error: any) {
        this.error(`Chunk ${current}/${total} failed: ${error?.message || error}`, 'CHUNK');
    }

    // GPT-specific methods
    tokenExtraction(email: string, method: 'SUCCESS' | 'FALLBACK' | 'FAILED', status: 'SUCCESS' | 'FAILED') {
        if (status === 'SUCCESS') {
            this.success(`Email: ${email} | Method: ${method}`, 'TOKEN');
        } else {
            this.error(`Email: ${email} | Method: ${method}`, 'TOKEN');
        }
    }

    sessionExpired(email: string) {
        this.error(`Email: ${email} | Session expired - marked as error`, 'SESSION');
    }

    workspaceAction(
        action: 'DELETE_PENDING' | 'DELETE_MAIN' | 'INVITE',
        admin: string,
        target: string,
        status: 'SUCCESS' | 'FAILED',
        extra?: any,
    ) {
        const message = `Admin: ${admin} | Target: ${target}${extra ? ` | ${extra}` : ''}`;
        if (status === 'SUCCESS') {
            this.success(message, action.replace('_', ' '));
        } else {
            this.error(message, action.replace('_', ' '));
        }
    }

    cookieWarning(email: string, reason: string) {
        this.warn(`Email: ${email} | Reason: ${reason}`, 'COOKIE');
    }

    apiRequest(method: string, url: string, status: number) {
        if (status >= 200 && status < 300) {
            this.debug(`${method} ${url} - ${status}`, 'API');
        } else {
            this.warn(`${method} ${url} - ${status}`, 'API');
        }
    }

    // Special formatting methods
    header(title: string) {
        const border = '═'.repeat(60);
        const paddedTitle = ` ${title} `;
        const titleLength = paddedTitle.length;
        const padding = Math.max(0, (60 - titleLength) / 2);
        const leftPad = '═'.repeat(Math.floor(padding));
        const rightPad = '═'.repeat(Math.ceil(padding));

        console.log(chalk.cyan.bold(`╔${border}╗`));
        console.log(chalk.cyan.bold(`║${leftPad}${chalk.white.bold(paddedTitle)}${rightPad}║`));
        console.log(chalk.cyan.bold(`╚${border}╝`));
    }

    separator() {
        console.log(chalk.gray('─'.repeat(80)));
    }

    table(headers: string[], rows: string[][]) {
        const columnWidths = headers.map(
            (header, index) => Math.max(header.length, ...rows.map((row) => row[index]?.length || 0)) + 2,
        );

        // Header
        const headerRow = headers.map((header, index) => header.padEnd(columnWidths[index])).join('│');

        console.log(chalk.blue.bold(`┌${'─'.repeat(headerRow.length)}┐`));
        console.log(chalk.blue.bold(`│${headerRow}│`));
        console.log(chalk.blue.bold(`├${'─'.repeat(headerRow.length)}┤`));

        // Rows
        rows.forEach((row) => {
            const formattedRow = row.map((cell, index) => (cell || '').padEnd(columnWidths[index])).join('│');
            console.log(`│${formattedRow}│`);
        });

        console.log(chalk.blue.bold(`└${'─'.repeat(headerRow.length)}┘`));
    }

    progressBar(current: number, total: number, label: string = '') {
        const percentage = Math.round((current / total) * 100);
        const completed = Math.round((current / total) * 30);
        const remaining = 30 - completed;

        const progressEmoji = current === total ? '🎯' : '🚀';
        const bar = '█'.repeat(completed) + '░'.repeat(remaining);

        console.log(chalk.green(`${progressEmoji} ${label} [${bar}] ${percentage}% (${current}/${total})`));
    }

    stats(title: string, data: { [key: string]: number | string }) {
        this.info(`📊 ${title}`, 'STATS');
        Object.entries(data).forEach(([key, value]) => {
            const emoji = typeof value === 'number' && value > 0 ? '📈' : '📉';
            console.log(chalk.cyan(`   ${emoji} ${key}: ${chalk.white.bold(value)}`));
        });
    }

    banner(text: string) {
        const lines = text.split('\n');
        const maxLength = Math.max(...lines.map((line) => line.length));
        const border = '━'.repeat(maxLength + 4);

        console.log(chalk.magenta.bold(`┏${border}┓`));
        lines.forEach((line) => {
            const padding = ' '.repeat(maxLength - line.length);
            console.log(chalk.magenta.bold(`┃  ${chalk.white.bold(line)}${padding}  ┃`));
        });
        console.log(chalk.magenta.bold(`┗${border}┛`));
    }

    serverStart(port: number, host: string) {
        this.banner(`🚀 SERVER STARTED\n🌐 http://${host}:${port}\n⚡ Ready for connections!`);
    }

    taskSummary(taskType: string, success: number, failed: number, total: number) {
        const successRate = Math.round((success / total) * 100);
        const emoji = successRate === 100 ? '🏆' : successRate >= 80 ? '🥈' : '🥉';

        this.header(`${emoji} ${taskType.toUpperCase()} SUMMARY`);
        this.stats('Task Results', {
            'Total Tasks': total,
            Successful: success,
            Failed: failed,
            'Success Rate': `${successRate}%`,
        });
        this.separator();
    }
}
