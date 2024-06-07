import { Module } from '@nestjs/common';
import { CookieService } from './cookie.service';
import { CookieController } from './cookie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cookie } from './entities/cookie.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Cookie])],
    controllers: [CookieController],
    providers: [CookieService],
    exports: [CookieService],
})
export class CookieModule {}
