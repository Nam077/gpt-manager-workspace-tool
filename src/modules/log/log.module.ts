import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogService } from './log.service';
import { LogController } from './log.controller';
import { Log } from './entities/log.entity';
import { LogGateway } from './log.gateway';
import { ConsoleInterceptorService } from './console-interceptor.service';

@Module({
    imports: [TypeOrmModule.forFeature([Log])],
    controllers: [LogController],
    providers: [LogService, LogGateway, ConsoleInterceptorService],
    exports: [LogService, LogGateway, ConsoleInterceptorService],
})
export class LogModule {}
