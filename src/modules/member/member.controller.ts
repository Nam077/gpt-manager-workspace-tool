import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MemberService, BulkCreateResult } from './member.service';
import { CreateMemberDto, BulkCreateMemberDto, SearchEmailsDto, AutoAssignEmailsDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Member')
@Controller('member')
export class MemberController {
    constructor(private readonly memberService: MemberService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new member' })
    @ApiResponse({ status: 201, description: 'Member created successfully' })
    @ApiResponse({ status: 409, description: 'Member already exists' })
    @ApiResponse({ status: 404, description: 'Workspace not found' })
    create(@Body() createMemberDto: CreateMemberDto) {
        return this.memberService.create(createMemberDto);
    }

    @Post('bulk')
    @ApiOperation({ summary: 'Bulk create members from email array' })
    @ApiResponse({
        status: 201,
        description: 'Members bulk created successfully',
        type: 'object',
        schema: {
            properties: {
                created: { type: 'array', items: { $ref: '#/components/schemas/Member' } },
                skipped: { type: 'array', items: { type: 'string' } },
                errors: { type: 'array', items: { type: 'string' } },
                totalFound: { type: 'number' },
                summary: { type: 'string' },
            },
        },
    })
    async bulkCreate(@Body() bulkCreateMemberDto: BulkCreateMemberDto): Promise<BulkCreateResult> {
        return await this.memberService.bulkCreate(bulkCreateMemberDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all members' })
    findAll() {
        return this.memberService.findAll();
    }

    @Get('/workspace/:id')
    @ApiOperation({ summary: 'Get members by workspace ID' })
    findByIdWorkSpace(@Param('id') id: string) {
        return this.memberService.findByIdWorkSpace(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get member by ID' })
    findOne(@Param('id') id: string) {
        return this.memberService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update member' })
    update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
        return this.memberService.update(id, updateMemberDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete member' })
    remove(@Param('id') id: string) {
        return this.memberService.remove(id);
    }

    @Delete('workspace/:id/all')
    @ApiOperation({ summary: 'Delete all members from workspace' })
    @ApiResponse({
        status: 200,
        description: 'All members deleted successfully',
        schema: {
            type: 'object',
            properties: {
                deleted: { type: 'number' },
                message: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Workspace not found' })
    async deleteAllByWorkspace(@Param('id') workspaceId: string) {
        return await this.memberService.deleteAllByWorkspace(workspaceId);
    }

    @Post('search')
    @ApiOperation({ summary: 'Search emails across all workspaces' })
    @ApiResponse({
        status: 200,
        description: 'Email search results',
        schema: {
            type: 'object',
            properties: {
                found: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            email: { type: 'string' },
                            member: { $ref: '#/components/schemas/Member' },
                            workspace: { type: 'object' },
                        },
                    },
                },
                notFound: { type: 'array', items: { type: 'string' } },
            },
        },
    })
    async searchEmails(@Body() searchEmailsDto: SearchEmailsDto) {
        return await this.memberService.findEmailsInWorkspaces(searchEmailsDto.emails);
    }

    @Post('auto-assign')
    @ApiOperation({ summary: 'Auto assign emails to available workspaces' })
    @ApiResponse({
        status: 201,
        description: 'Emails auto assigned successfully',
        schema: {
            type: 'object',
            properties: {
                assigned: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            email: { type: 'string' },
                            workspaceId: { type: 'string' },
                            workspaceEmail: { type: 'string' },
                        },
                    },
                },
                failed: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            email: { type: 'string' },
                            reason: { type: 'string' },
                        },
                    },
                },
                summary: { type: 'string' },
            },
        },
    })
    async autoAssignEmails(@Body() autoAssignEmailsDto: AutoAssignEmailsDto) {
        return await this.memberService.autoAssignToWorkspaces(autoAssignEmailsDto.emails);
    }
}
