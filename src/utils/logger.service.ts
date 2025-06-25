import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as chalk from 'chalk';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
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
    private static instance: winston.Logger;

    constructor(private configService?: ConfigService) {
        // Use singleton pattern to ensure only one winston logger instance
        if (!LoggerService.instance) {
            // Ensure logs directory exists
            const logsDir = path.join(process.cwd(), 'logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }
            LoggerService.instance = winston.createLogger({
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
                        // Add these options to prevent file descriptor leaks
                        options: { flags: 'a' },
                        handleExceptions: false,
                        handleRejections: false,
                    }),
                    new winston.transports.DailyRotateFile({
                        level: 'error',
                        filename: 'logs/error-%DATE%.log',
                        datePattern: 'YYYY-MM-DD',
                        maxSize: '20m',
                        maxFiles: '30d',
                        // Add these options to prevent file descriptor leaks
                        options: { flags: 'a' },
                        handleExceptions: false,
                        handleRejections: false,
                    }),
                ],
            });
        }
    }

    private get logger(): winston.Logger {
        return LoggerService.instance;
    }

    // Add method to get singleton instance directly
    static getInstance(): winston.Logger {
        if (!LoggerService.instance) {
            new LoggerService();
        }
        return LoggerService.instance;
    }

    // Add cleanup method
    static cleanup(): void {
        if (LoggerService.instance) {
            LoggerService.instance.end();
            LoggerService.instance = null;
        }
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

        const prefix = context ? `[${context}]` : '';

        switch (level) {
            case LogLevel.ERROR:
                return chalk.red.bold(`[ERROR] [${timestamp}] ${prefix} ${message}`);
            case LogLevel.WARN:
                return chalk.yellow.bold(`[WARN] [${timestamp}] ${prefix} ${message}`);
            case LogLevel.INFO:
                return chalk.blue(`[INFO] [${timestamp}] ${prefix} ${message}`);
            case LogLevel.SUCCESS:
                return chalk.green.bold(`[SUCCESS] [${timestamp}] ${prefix} ${message}`);
            case LogLevel.DEBUG:
                return chalk.gray(`[DEBUG] [${timestamp}] ${prefix} ${message}`);
            default:
                return `[LOG] [${timestamp}] ${prefix} ${message}`;
        }
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
        console.log(chalk.cyan.bold(`=== ${title.toUpperCase()} ===`));
    }

    separator() {
        console.log(chalk.gray('---'));
    }

    table(headers: string[], rows: string[][]) {
        // Simple table without special characters
        console.log(chalk.blue.bold(headers.join(' | ')));
        console.log(chalk.gray('-'.repeat(headers.join(' | ').length)));

        rows.forEach((row) => {
            console.log(row.join(' | '));
        });
    }

    progressBar(current: number, total: number, label: string = '') {
        const percentage = Math.round((current / total) * 100);
        const completed = Math.round((current / total) * 20);
        const remaining = 20 - completed;

        const statusIndicator = current === total ? 'DONE' : 'PROGRESS';
        const bar = '#'.repeat(completed) + '-'.repeat(remaining);

        console.log(chalk.green(`[${statusIndicator}] ${label} [${bar}] ${percentage}% (${current}/${total})`));
    }

    stats(title: string, data: { [key: string]: number | string }) {
        this.info(title, 'STATS');
        Object.entries(data).forEach(([key, value]) => {
            const indicator = typeof value === 'number' && value > 0 ? '+' : '-';
            console.log(chalk.cyan(`   ${indicator} ${key}: ${chalk.white.bold(value)}`));
        });
    }

    banner(text: string) {
        const lines = text.split('\n');
        console.log(chalk.magenta.bold('='.repeat(50)));
        lines.forEach((line) => {
            console.log(chalk.magenta.bold(`  ${chalk.white.bold(line)}`));
        });
        console.log(chalk.magenta.bold('='.repeat(50)));
    }

    serverStart(port: number, host: string) {
        this.banner(`SERVER STARTED\nURL: http://${host}:${port}\nStatus: Ready for connections!`);
    }

    taskSummary(taskType: string, success: number, failed: number, total: number) {
        const successRate = Math.round((success / total) * 100);
        const grade = successRate === 100 ? 'A+' : successRate >= 80 ? 'B+' : 'C';

        this.header(`${grade} ${taskType.toUpperCase()} SUMMARY`);
        this.stats('Task Results', {
            'Total Tasks': total,
            Successful: success,
            Failed: failed,
            'Success Rate': `${successRate}%`,
        });
        this.separator();
    }
}
