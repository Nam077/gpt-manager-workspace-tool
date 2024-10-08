import { Controller, Get, Render } from '@nestjs/common';
import { TaskService } from './task.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('task')
@ApiTags('Task')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Get()
    findAll() {
        return this.taskService.findAll();
    }
    @Get('invite')
    invite() {
        return this.taskService.invite();
    }
    @Get('log')
    @Render('log/index')
    log() {
        const logs = this.taskService.log();
        return { logs };
    }
}
