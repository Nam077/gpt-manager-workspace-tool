import { Injectable } from '@nestjs/common';
import { CookieService } from '../cookie/cookie.service';
import { ConfigService } from '@nestjs/config';
import { parseTimeToSeconds } from '../../util';
import { WorkspaceService } from '../workspace/workspace.service';
import { GPTWithCookie } from './gpt.fetch.service';
import { LogService } from '../log/log.service';
import { get, size, isEmpty, isArray, chunk } from 'lodash';
import { LoggerService } from '../../utils/logger.service';

@Injectable()
export class TaskService {
    private isScanning = false;
    private readonly logger = new LoggerService();

    constructor(
        private readonly cookieService: CookieService,
        private readonly configService: ConfigService,
        private readonly workspaceService: WorkspaceService,
        private readonly logService: LogService,
    ) {}

    async findAll(): Promise<string> {
        if (!this.isScanning) {
            this.logger.info('🚀 Starting task manager...', 'STARTUP');
            try {
                await this.scan(); // Thực hiện quét lần đầu
                this.isScanning = true; // Đặt biến điều khiển đang được quét
                const checkTimeInterval = parseTimeToSeconds(this.configService.get('CHECK_TIME') || '50s');
                this.logger.success(
                    `⏰ Scheduled scan every ${this.configService.get('CHECK_TIME') || '50s'}`,
                    'SCHEDULER',
                );

                setInterval(async () => {
                    try {
                        await this.scan();
                    } catch (error) {
                        this.logger.error('Scan interval failed', 'SCHEDULER', error);
                    }
                }, checkTimeInterval);
            } catch (error) {
                this.logger.error('Initial scan failed', 'STARTUP', error);
                return `Error: ${get(error, 'message') || error}`;
            }
        }

        return this.isScanning ? 'Scanning...' : 'Done';
    }

    async scan(): Promise<void> {
        this.logger.header('🔄 WORKSPACE SCAN');

        try {
            const record = await this.workspaceService.groupByEmail();
            const task = [];
            const cookies = await this.cookieService.finAllNoError();

            const recordKeys = record ? Object.keys(record) : [];
            const cookiesLength = isArray(cookies) ? size(cookies) : 0;

            this.logger.scanStart(size(recordKeys), cookiesLength);

            if (!isArray(cookies) || isEmpty(cookies)) {
                this.logger.warn('No active cookies available for processing', 'SCAN');
                this.logger.scanComplete('NO_COOKIES');
                return;
            }

            for (const cookie of cookies) {
                try {
                    // Validate cookie before creating GPT instance
                    const cookieValue = get(cookie, 'value');
                    const cookieEmail = get(cookie, 'email', 'unknown');

                    if (!cookie || !cookieValue || cookieValue === 'error') {
                        this.logger.cookieWarning(cookieEmail, 'Invalid/Error value - skipping');
                        continue;
                    }

                    const gptAPI = new GPTWithCookie(cookie, this.cookieService, this.configService, this.logService);
                    task.push(gptAPI.processMain(record));
                } catch (error) {
                    const cookieEmail = get(cookie, 'email', 'unknown');
                    this.logger.error(`Failed to create GPT instance for ${cookieEmail}`, 'SCAN', error);
                    // Mark cookie as error
                    if (cookieEmail !== 'unknown') {
                        await this.cookieService.updateValueToError(cookieEmail);
                    }
                }
            }

            if (isEmpty(task)) {
                this.logger.warn('No valid tasks to process', 'SCAN');
                return;
            }

            const taskChunks = chunk(task, 3);
            this.logger.info(`Running ${size(task)} tasks in ${size(taskChunks)} chunks of 3`, 'PROCESSING');

            for (let i = 0; i < size(taskChunks); i++) {
                const currentChunk = taskChunks[i];
                try {
                    this.logger.chunkProgress(i + 1, size(taskChunks), size(currentChunk));
                    await Promise.all(currentChunk);
                    this.logger.chunkComplete(i + 1, size(taskChunks));
                } catch (error) {
                    this.logger.chunkError(i + 1, size(taskChunks), error);
                }
            }
            this.logger.scanComplete('SUCCESS');
        } catch (error) {
            this.logger.error('Failed to complete scan', 'SCAN', error);
            this.logger.scanComplete('ERROR');
            throw error; // Re-throw để caller có thể handle
        }
    }

    async invite(): Promise<string[]> {
        this.logger.header('📧 MEMBER INVITATIONS');

        try {
            const record = await this.workspaceService.groupByEmail();
            const task = [];
            const cookies = await this.cookieService.finAllNoError();

            const recordKeys = record ? Object.keys(record) : [];
            const cookiesLength = isArray(cookies) ? size(cookies) : 0;

            this.logger.inviteStart(size(recordKeys), cookiesLength);

            if (!isArray(cookies) || isEmpty(cookies)) {
                this.logger.warn('No active cookies available for processing', 'INVITE');
                this.logger.inviteComplete(0);
                return [];
            }

            for (const cookie of cookies) {
                try {
                    // Validate cookie before creating GPT instance
                    const cookieValue = get(cookie, 'value');
                    const cookieEmail = get(cookie, 'email', 'unknown');

                    if (!cookie || !cookieValue || cookieValue === 'error') {
                        this.logger.cookieWarning(cookieEmail, 'Invalid/Error value - skipping');
                        continue;
                    }

                    const gptAPI = new GPTWithCookie(cookie, this.cookieService, this.configService, this.logService);
                    task.push(gptAPI.processInvite(record));
                } catch (error) {
                    const cookieEmail = get(cookie, 'email', 'unknown');
                    this.logger.error(`Failed to create GPT instance for ${cookieEmail}`, 'INVITE', error);
                    // Mark cookie as error
                    if (cookieEmail !== 'unknown') {
                        await this.cookieService.updateValueToError(cookieEmail);
                    }
                }
            }

            if (isEmpty(task)) {
                this.logger.warn('No valid tasks to process', 'INVITE');
                return [];
            }

            const result = [];
            const taskChunks = chunk(task, 3);
            this.logger.info(`Running ${size(task)} invite tasks in ${size(taskChunks)} chunks of 3`, 'PROCESSING');

            for (let i = 0; i < size(taskChunks); i++) {
                const currentChunk = taskChunks[i];
                try {
                    this.logger.chunkProgress(i + 1, size(taskChunks), size(currentChunk), 'invite tasks');
                    const chunkResults = await Promise.all(currentChunk);
                    result.push(...chunkResults);
                    this.logger.chunkComplete(i + 1, size(taskChunks));
                } catch (error) {
                    this.logger.chunkError(i + 1, size(taskChunks), error);
                }
            }

            const finalResult: string[] = [];
            for (const item of result) {
                if (item && isArray(item)) {
                    finalResult.push(...item);
                }
            }

            this.logger.inviteComplete(size(finalResult), finalResult);
            return finalResult;
        } catch (error) {
            this.logger.error('Failed to complete invite process', 'INVITE', error);
            this.logger.inviteComplete(0);
            return []; // Return empty array instead of throwing
        }
    }

    async log(): Promise<Array<{ class: string; message: string }>> {
        const paginatedLogs = await this.logService.findAll(100, 0);
        const logsData = get(paginatedLogs, 'data', []);

        if (!isArray(logsData)) {
            this.logger.warn('Invalid logs data structure', 'LOG');
            return [];
        }

        return logsData.map((log) => {
            const createdAt = get(log, 'createdAt');
            const message = get(log, 'message', '');

            let timestamp = 'Unknown time';
            if (createdAt && typeof createdAt.toLocaleString === 'function') {
                try {
                    timestamp = createdAt.toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    });
                } catch (error) {
                    timestamp = createdAt.toString();
                }
            }

            if (message.includes('DELETE')) {
                return {
                    class: 'alert-danger',
                    message: `[${timestamp}] ${message}`,
                };
            } else if (message.includes('INVITE')) {
                return {
                    class: 'alert-info',
                    message: `[${timestamp}] ${message}`,
                };
            } else if (message.includes('ERROR') || message.includes('FAILED')) {
                return {
                    class: 'alert-danger',
                    message: `[${timestamp}] ${message}`,
                };
            } else if (message.includes('SUCCESS') || message.includes('COMPLETE')) {
                return {
                    class: 'alert-success',
                    message: `[${timestamp}] ${message}`,
                };
            } else {
                return {
                    class: 'alert-info',
                    message: `[${timestamp}] ${message}`,
                };
            }
        });
    }
}
