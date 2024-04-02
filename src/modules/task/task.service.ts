import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GoogleSheet } from './google-sheet.servive';
import { CookieService } from '../cookie/cookie.service';
import { chunk, GPTAPI } from './gpt.axios.service';
import { ConfigService } from '@nestjs/config';
import { parseTimeToSeconds, readFileTXT } from '../../util';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class TaskService {
    private isScanning = false;
    constructor(
        private readonly cookieService: CookieService,
        private readonly configService: ConfigService,
        private readonly workspaceService: WorkspaceService,
    ) {}

    create(createTaskDto: CreateTaskDto) {
        return 'This action adds a new task';
    }

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
        for (const cookie of cookies) {
            const gptAPI = new GPTAPI(cookie, this.cookieService);
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
            const gptAPI = new GPTAPI(cookie, this.cookieService);
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

    findOne(id: number) {
        return `This action returns a #${id} task`;
    }

    update(id: number, updateTaskDto: UpdateTaskDto) {
        return `This action updates a #${id} task`;
    }

    remove(id: number) {
        return `This action removes a #${id} task`;
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
