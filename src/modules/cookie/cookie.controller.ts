import { Body, Controller, Get, Param, Patch, Post, Res, Delete, Put } from '@nestjs/common';
import { CookieService } from './cookie.service';
import { CreateCookieDto } from './dto/create-cookie.dto';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Cookie')
@Controller('cookie')
export class CookieController {
    constructor(private readonly cookieService: CookieService) {}

    @Post()
    async create(@Body() createCookieDto: CreateCookieDto) {
        return await this.cookieService.create(createCookieDto);
    }

    @Get('list')
    @ApiOperation({ summary: 'Get cookies list with metadata' })
    @ApiResponse({ status: 200, description: 'Cookies list retrieved successfully' })
    async list() {
        const cookies = await this.cookieService.findAll();
        return {
            message: 'Cookies list retrieved successfully',
            data: cookies,
            count: cookies.length,
        };
    }

    @Get('export-csv')
    async exportCsv(@Res() res: Response) {
        const entities = await this.cookieService.findAll();
        const csv = await this.cookieService.exportToCsv(entities);

        res.header('Content-Type', 'text/csv');
        res.attachment('your-entity-data.csv');
        return res.send(csv);
    }

    @Get()
    async findAll() {
        return await this.cookieService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return await this.cookieService.findOne(+id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateCookieDto: CreateCookieDto) {
        return await this.cookieService.update(+id, updateCookieDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.cookieService.remove(+id);
    }

    // New frontend API endpoints
    @Put(':id')
    async updateCookie(@Param('id') id: string, @Body() updateCookieDto: CreateCookieDto) {
        return await this.cookieService.update(+id, updateCookieDto);
    }

    @Get('email/:email')
    async findByEmail(@Param('email') email: string) {
        return await this.cookieService.findByEmail(email);
    }

    @Delete('email/:email')
    async removeByEmail(@Param('email') email: string) {
        return await this.cookieService.removeByEmail(email);
    }

    @Get('status/active')
    async getActiveCookies() {
        return await this.cookieService.getActiveCookies();
    }

    @Get('status/error')
    async getErrorCookies() {
        return await this.cookieService.getErrorCookies();
    }

    @Post('validate/:id')
    async validateCookie(@Param('id') id: string) {
        return await this.cookieService.validateCookie(+id);
    }

    @Post('bulk-create')
    async bulkCreate(@Body() createCookiesDto: CreateCookieDto[]) {
        return await this.cookieService.bulkCreate(createCookiesDto);
    }

    @Delete('bulk-delete')
    async bulkDelete(@Body() ids: number[]) {
        return await this.cookieService.bulkDelete(ids);
    }
}
