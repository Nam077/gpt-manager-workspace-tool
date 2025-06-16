import { Controller, Get, Query, Delete, Param } from '@nestjs/common';
import { LogService, PaginatedResponse } from './log.service';
import { Log } from './entities/log.entity';

@Controller('logs')
export class LogController {
    constructor(private readonly logService: LogService) {}

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
}
