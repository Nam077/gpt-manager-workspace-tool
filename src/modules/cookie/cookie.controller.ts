import { Body, Controller, Get, Param, Patch, Post, Res, Delete, Render } from '@nestjs/common';
import { CookieService } from './cookie.service';
import { CreateCookieDto } from './dto/create-cookie.dto';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Cookie')
@Controller('cookie')
export class CookieController {
    constructor(private readonly cookieService: CookieService) {}

    @Post()
    async create(@Body() createCookieDto: CreateCookieDto) {
        return await this.cookieService.create(createCookieDto);
    }

    @Get('list')
    @Render('cookie/index')
    async list() {
        return { message: 'Hello world!' };
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
}
