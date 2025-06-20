import { Controller, Get } from '@nestjs/common';
import { TaskService } from './task.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { get, size } from 'lodash';

@Controller('task')
@ApiTags('Task')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Get()
    @ApiOperation({ summary: 'Execute main task processing' })
    @ApiResponse({ status: 200, description: 'Task processing completed successfully' })
    async findAll() {
        try {
            const result = await this.taskService.findAll();
            return { status: 'success', message: result || 'Processing started' };
        } catch (error) {
            const errorMessage = get(error, 'message', 'Unknown error occurred');
            return { status: 'error', message: errorMessage };
        }
    }

    @Get('invite')
    @ApiOperation({ summary: 'Execute member invitation task' })
    @ApiResponse({ status: 200, description: 'Member invitations processed successfully' })
    async invite() {
        try {
            const result = await this.taskService.invite();
            return {
                status: 'success',
                invitedCount: size(result) || 0,
                invitedEmails: result || [],
            };
        } catch (error) {
            const errorMessage = get(error, 'message', 'Unknown error occurred');
            return { status: 'error', message: errorMessage };
        }
    }

    @Get('log')
    @ApiOperation({ summary: 'Get task logs' })
    @ApiResponse({ status: 200, description: 'Task logs retrieved successfully' })
    async log() {
        try {
            const logs = await this.taskService.log();
            return {
                status: 'success',
                message: 'Task logs retrieved successfully',
                data: logs || [],
                count: size(logs) || 0,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            const errorMessage = get(error, 'message', 'Failed to load logs');
            return {
                status: 'error',
                message: errorMessage,
                data: [],
                count: 0,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
