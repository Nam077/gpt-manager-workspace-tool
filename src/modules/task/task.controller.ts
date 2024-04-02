import { Controller, Get, Post, Body, Patch, Param, Delete, Render } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('task')
@ApiTags('Task')
export class TaskController {
    constructor(private readonly taskService: TaskService) {}

    @Post()
    create(@Body() createTaskDto: CreateTaskDto) {
        return this.taskService.create(createTaskDto);
    }

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
