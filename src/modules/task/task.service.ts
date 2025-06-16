import { Injectable } from '@nestjs/common';
import { CookieService } from '../cookie/cookie.service';
import { chunk } from './gpt.axios.service';
import { ConfigService } from '@nestjs/config';
import { parseTimeToSeconds } from '../../util';
import { WorkspaceService } from '../workspace/workspace.service';
import { GPTWithCookie } from './gpt.fetch.service';
import { LogService } from '../log/log.service';

@Injectable()
export class TaskService {
    private isScanning = false;

    constructor(
        private readonly cookieService: CookieService,
        private readonly configService: ConfigService,
        private readonly workspaceService: WorkspaceService,
        private readonly logService: LogService,
    ) {}

    async findAll(): Promise<string> {
        if (!this.isScanning) {
            console.log('Running...');
            await this.scan(); // Thực hiện quét lần đầu
            this.isScanning = true; // Đặt biến điều khiển đang được quét
            const checkTimeInterval = parseTimeToSeconds(this.configService.get('CHECK_TIME') || '50s');
            setInterval(async () => {
                await this.scan();
            }, checkTimeInterval);
        }

        return this.isScanning ? 'Scanning...' : 'Done';
    }

    async scan(): Promise<void> {
        console.log('SCAN STARTED | Checking all workspaces for member synchronization...');
        const record = await this.workspaceService.groupByEmail();
        const task = [];
        const cookies = await this.cookieService.finAllNoError();

        console.log(
            `SCAN STATUS | Total Workspaces: ${Object.keys(record).length} | Active Cookies: ${cookies.length}`,
        );

        for (const cookie of cookies) {
            try {
                // Validate cookie before creating GPT instance
                if (!cookie || !cookie.value || cookie.value === 'error') {
                    console.warn(
                        `SCAN WARNING | Skipping invalid cookie | Email: ${cookie?.email || 'unknown'} | Reason: Invalid/Error value`,
                    );
                    continue;
                }

                const gptAPI = new GPTWithCookie(cookie, this.cookieService, this.configService, this.logService);
                task.push(gptAPI.processMain(record));
            } catch (error) {
                console.error(
                    `SCAN ERROR | Failed to create GPT instance | Email: ${cookie?.email || 'unknown'} | Error: ${error.message || error}`,
                );
                // Mark cookie as error
                if (cookie?.email) {
                    await this.cookieService.updateValueToError(cookie.email);
                }
            }
        }

        const taskChunks = chunk(task, 3);
        console.log(`PROCESSING | Running ${task.length} tasks in ${taskChunks.length} chunks of 3`);

        for (let i = 0; i < taskChunks.length; i++) {
            const chunk = taskChunks[i];
            try {
                console.log(`CHUNK ${i + 1}/${taskChunks.length} | Processing ${chunk.length} tasks...`);
                await Promise.all(chunk);
                console.log(`CHUNK ${i + 1}/${taskChunks.length} | Completed successfully`);
            } catch (error) {
                console.error(
                    `CHUNK ${i + 1}/${taskChunks.length} | Error processing chunk: ${error.message || error}`,
                );
            }
        }
        console.log('SCAN COMPLETED | All workspace synchronization tasks finished\n');
    }

    async invite(): Promise<string[]> {
        console.log('INVITE STARTED | Processing member invitations...');
        const record = await this.workspaceService.groupByEmail();
        const task = [];
        const cookies = await this.cookieService.finAllNoError();

        console.log(
            `INVITE STATUS | Total Workspaces: ${Object.keys(record).length} | Active Cookies: ${cookies.length}`,
        );

        for (const cookie of cookies) {
            try {
                // Validate cookie before creating GPT instance
                if (!cookie || !cookie.value || cookie.value === 'error') {
                    console.warn(
                        `INVITE WARNING | Skipping invalid cookie | Email: ${cookie?.email || 'unknown'} | Reason: Invalid/Error value`,
                    );
                    continue;
                }

                const gptAPI = new GPTWithCookie(cookie, this.cookieService, this.configService, this.logService);
                task.push(gptAPI.processInvite(record));
            } catch (error) {
                console.error(
                    `INVITE ERROR | Failed to create GPT instance | Email: ${cookie?.email || 'unknown'} | Error: ${error.message || error}`,
                );
                // Mark cookie as error
                if (cookie?.email) {
                    await this.cookieService.updateValueToError(cookie.email);
                }
            }
        }

        const result = [];
        const taskChunks = chunk(task, 3);
        console.log(`PROCESSING | Running ${task.length} invite tasks in ${taskChunks.length} chunks of 3`);

        for (let i = 0; i < taskChunks.length; i++) {
            const chunk = taskChunks[i];
            try {
                console.log(`CHUNK ${i + 1}/${taskChunks.length} | Processing ${chunk.length} invite tasks...`);
                result.push(...(await Promise.all(chunk)));
                console.log(`CHUNK ${i + 1}/${taskChunks.length} | Completed successfully`);
            } catch (error) {
                console.error(
                    `CHUNK ${i + 1}/${taskChunks.length} | Error processing chunk: ${error.message || error}`,
                );
            }
        }

        const finalResult: string[] = [];
        for (const item of result) {
            if (item && Array.isArray(item)) {
                finalResult.push(...item);
            }
        }

        console.log(`INVITE COMPLETED | Total invitations sent: ${finalResult.length}`);
        if (finalResult.length > 0) {
            console.log(`INVITED MEMBERS | [${finalResult.join(', ')}]`);
        }

        return finalResult;
    }

    async log(): Promise<Array<{ class: string; message: string }>> {
        const paginatedLogs = await this.logService.findAll(100, 0);
        return paginatedLogs.data.map((log) => {
            const timestamp = log.createdAt.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            if (log.message.includes('DELETE')) {
                return {
                    class: 'alert-danger',
                    message: `[${timestamp}] ${log.message}`,
                };
            } else if (log.message.includes('INVITE')) {
                return {
                    class: 'alert-info',
                    message: `[${timestamp}] ${log.message}`,
                };
            } else if (log.message.includes('ERROR') || log.message.includes('FAILED')) {
                return {
                    class: 'alert-danger',
                    message: `[${timestamp}] ${log.message}`,
                };
            } else if (log.message.includes('SUCCESS') || log.message.includes('COMPLETE')) {
                return {
                    class: 'alert-success',
                    message: `[${timestamp}] ${log.message}`,
                };
            } else {
                return {
                    class: 'alert-info',
                    message: `[${timestamp}] ${log.message}`,
                };
            }
        });
    }
}
