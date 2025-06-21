import { Controller, Get, Query, Delete, Param } from '@nestjs/common';
import { LogService, PaginatedResponse } from './log.service';
import { Log } from './entities/log.entity';
import { LogGateway } from './log.gateway';
import { ConsoleInterceptorService } from './console-interceptor.service';

@Controller('logs')
export class LogController {
    constructor(
        private readonly logService: LogService,
        private readonly logGateway: LogGateway,
        private readonly consoleInterceptor: ConsoleInterceptorService,
    ) {}

    @Get()
    async findAll(@Query('limit') limit?: string, @Query('offset') offset?: string): Promise<PaginatedResponse<Log>> {
        const limitNum = limit ? parseInt(limit, 10) : 100;
        const offsetNum = offset ? parseInt(offset, 10) : 0;
        return this.logService.findAll(limitNum, offsetNum);
    }

    @Get('all')
    async findAllLogs(): Promise<Log[]> {
        return this.logService.findAllWithoutPagination();
    }

    @Get('level/:level')
    async findByLevel(
        @Param('level') level: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ): Promise<Log[]> {
        const limitNum = limit ? parseInt(limit, 10) : 100;
        const offsetNum = offset ? parseInt(offset, 10) : 0;
        return this.logService.findByLevel(level, limitNum, offsetNum);
    }

    @Delete('cleanup')
    async cleanup(@Query('days') days?: string): Promise<{ deleted: number }> {
        const daysNum = days ? parseInt(days, 10) : 30;
        const deleted = await this.logService.deleteOldLogs(daysNum);
        return { deleted };
    }

    // Console logs endpoints
    @Get('console/recent')
    async getRecentConsoleLogs(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit, 10) : 100;
        return {
            logs: this.logGateway.getRecentLogs(limitNum),
            connectedClients: this.logGateway.getConnectedClientsCount(),
        };
    }

    @Get('console/status')
    async getConsoleStatus() {
        return {
            interceptorActive: true,
            connectedClients: this.logGateway.getConnectedClientsCount(),
            bufferSize: this.logGateway.getRecentLogs().length,
        };
    }

    @Delete('console/clear')
    async clearConsoleBuffer() {
        this.logGateway.clearBuffer();
        return { message: 'Console log buffer cleared' };
    }

    // Test endpoint to generate sample logs
    @Get('console/test')
    async testConsoleLogs() {
        console.log('Test log message');
        console.info('Test info message');
        console.warn('Test warning message');
        console.error('Test error message');
        console.debug('Test debug message');

        return { message: 'Test logs generated - check your WebSocket connection!' };
    }
}
