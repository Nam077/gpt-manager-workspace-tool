import { Body, Controller, Get, Param, Post, Redirect, Render, Res } from '@nestjs/common';
import { CookieService } from './cookie.service';
import { CreateCookieDto } from './dto/create-cookie.dto';
import { Response } from 'express';
@Controller('cookie')
export class CookieController {
    constructor(private readonly cookieService: CookieService) {}

    @Get('add')
    @Render('cookie/add')
    add() {
        return;
    }

    @Post('add')
    @Render('cookie/add') // Render the add cookie view'
    async create(@Body() createCookieDto: CreateCookieDto) {
        try {
            // Gửi dữ liệu đến service để tạo cookie
            await this.cookieService.create(createCookieDto);
            return { success: true };
        } catch (error) {
            // Xử lý lỗi và trả về view với thông báo lỗi
            return { error: error.message };
        }
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
    @Render('cookie/index') // Render the cookie index view
    async findAll() {
        const cookies = await this.cookieService.findAll();
        return { cookies };
    }

    @Get('/:id/edit')
    @Render('cookie/edit')
    async edit(@Param('id') id: string) {
        const cookie = await this.cookieService.findOne(+id);
        return { cookie }; // Trả về cookie để hiển thị trên trang chỉnh sửa
    }

    @Post('/:id/edit')
    @Render('cookie/edit')
    async update(@Param('id') id: string, @Body() updateCookieDto: CreateCookieDto) {
        try {
            const cookie = await this.cookieService.update(+id, updateCookieDto);
            return { cookie, success: true };
        } catch (error) {
            return { error: error.message };
        }
    }

    @Get('/:id/delete')
    @Redirect('/cookie')
    async delete(@Param('id') id: string) {
        try {
            const cookie = await this.cookieService.remove(+id);
            return { cookie, success: true };
        } catch (error) {
            return { error: error.message };
        }
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.cookieService.findOne(+id);
    }
}
