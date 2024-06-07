import { Injectable } from '@nestjs/common';
import { CookieService } from '../cookie/cookie.service';
import { chunk } from './gpt.axios.service';
import { ConfigService } from '@nestjs/config';
import { parseTimeToSeconds, readFileTXT } from '../../util';
import { WorkspaceService } from '../workspace/workspace.service';
import { GPTAPIFix } from './gpt.fix';

@Injectable()
export class TaskService {
    private isScanning = false;
    constructor(
        private readonly cookieService: CookieService,
        private readonly configService: ConfigService,
        private readonly workspaceService: WorkspaceService,
    ) {}
    async findAll() {
        if (!this.isScanning) {
            console.log('Running...');
            await this.scan(); // Thực hiện quét lần đầu
            this.isScanning = true; // Đặt biến điều khiển đang được quét
            const checkTimeInterval = parseTimeToSeconds(this.configService.get('CHECK_TIME') || '50s');
            setInterval(async () => {
                await this.scan();
            }, checkTimeInterval);
        }

        return this.isScanning ? 'Scanning...' : 'Done';
    }

    async scan() {
        const record = await this.workspaceService.groupByEmail();
        const task = [];
        const cookies = await this.cookieService.finAllNoError();
        console.log(cookies.length);
        for (const cookie of cookies) {
            const gptAPI = new GPTAPIFix(cookie, this.cookieService);
            task.push(gptAPI.processMain(record));
        }
        const taskChunks = chunk(task, 3);
        for (const chunk of taskChunks) {
            await Promise.all(chunk);
        }
    }

    async invite() {
        const record = await this.workspaceService.groupByEmail();
        const task = [];
        const cookies = await this.cookieService.finAllNoError();
        for (const cookie of cookies) {
            const gptAPI = new GPTAPIFix(cookie, this.cookieService);
            task.push(gptAPI.processInvite(record));
        }
        const result = [];
        const taskChunks = chunk(task, 3);
        for (const chunk of taskChunks) {
            result.push(...(await Promise.all(chunk)));
        }
        const finalResult = [];
        for (const item of result) {
            if (item) {
                finalResult.push(...item);
            }
        }
        return finalResult;
    }

    log() {
        const logs = readFileTXT('log.txt').reverse();
        return logs.map((item) => {
            if (item.includes('DELETE')) {
                return {
                    class: 'alert-danger',
                    message: item,
                };
            } else if (item.includes('INVITE')) {
                return {
                    class: 'alert-info',
                    message: item,
                };
            } else {
                return {
                    class: 'alert-success',
                    message: item,
                };
            }
        });
    }
}
