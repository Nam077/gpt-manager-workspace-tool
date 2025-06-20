import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({ summary: 'Get application info' })
    @ApiResponse({ status: 200, description: 'Application information' })
    root() {
        return {
            message: 'GPT Manager Workspace API',
            version: '1.0.0',
            status: 'running',
            docs: '/api',
        };
    }

    @Post('auth-login.php')
    @ApiOperation({ summary: 'Load JSON data' })
    @ApiResponse({ status: 200, description: 'JSON data loaded successfully' })
    test() {
        return this.appService.loadJson();
    }
}
