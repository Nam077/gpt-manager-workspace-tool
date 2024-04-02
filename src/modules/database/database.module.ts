import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import ConfigMain from './configs/config.main';

@Module({
    imports: [
        ConfigModule.forRoot({}),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useClass: ConfigMain,
        }),
    ],
})
export class DatabaseModule {}
