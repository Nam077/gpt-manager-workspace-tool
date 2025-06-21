import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { ConfigModule } from '@nestjs/config';
import { CookieModule } from '../cookie/cookie.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { LogModule } from '../log/log.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [ConfigModule.forRoot({}), CookieModule, WorkspaceModule, LogModule, NotificationModule],
    controllers: [TaskController],
    providers: [TaskService],
})
export class TaskModule {}
