import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CookieModule } from './modules/cookie/cookie.module';
import { DatabaseModule } from './modules/database/database.module';
import { TaskModule } from './modules/task/task.module';
import { ConfigModule } from '@nestjs/config';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { MemberModule } from './modules/member/member.module';
import { DeviceModule } from './modules/device/device.module';
import { RoomModule } from './modules/room/room.module';
import { UnitModule } from './modules/unit/unit.module';

@Module({
    imports: [
        CookieModule,
        DatabaseModule,
        TaskModule,
        ConfigModule.forRoot({}),
        WorkspaceModule,
        MemberModule,
        DeviceModule,
        RoomModule,
        UnitModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
