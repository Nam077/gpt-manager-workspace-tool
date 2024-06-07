import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Cookie } from '../../cookie/entities/cookie.entity';
import { Workspace } from '../../workspace/entities/workspace.entity';
import { Member } from '../../member/entities/member.entity';

@Injectable()
class ConfigMain implements TypeOrmOptionsFactory {
    constructor(private readonly configService: ConfigService) {}

    createTypeOrmOptions(): TypeOrmModuleOptions {
        return {
            type: 'better-sqlite3',
            database: './database.sqlite',
            entities: [Cookie, Workspace, Member],
            synchronize: true,
        };
    }
}

export default ConfigMain;
