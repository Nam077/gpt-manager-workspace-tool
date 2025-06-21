import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Workspace')
@Controller('workspace')
export class WorkspaceController {
    constructor(private readonly workspaceService: WorkspaceService) {}

    @Post()
    create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
        return this.workspaceService.create(createWorkspaceDto);
    }

    @Get()
    findAll() {
        return this.workspaceService.findAll();
    }

    @Get('list')
    @ApiOperation({ summary: 'Get workspaces list with metadata' })
    @ApiResponse({ status: 200, description: 'Workspaces list retrieved successfully' })
    async findAllView() {
        const workspaces = await this.workspaceService.findAll();
        return {
            message: 'Workspaces list retrieved successfully',
            data: workspaces,
            count: workspaces.length,
        };
    }

    @Get('group')
    group() {
        return this.workspaceService.groupByEmail();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.workspaceService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
        return this.workspaceService.update(id, updateWorkspaceDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.workspaceService.remove(id);
    }
}
