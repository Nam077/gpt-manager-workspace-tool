import { Controller, Get, Post, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}
    @Get()
    @Render('index')
    root() {
        return { message: 'Hello world!' };
    }

    @Post('auth-login.php')
    test() {
        return this.appService.loadJson();
    }
}
