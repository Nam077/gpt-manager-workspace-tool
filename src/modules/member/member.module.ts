import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';
import { Member } from './entities/member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceModule } from '../workspace/workspace.module';
import { Logger } from '@nestjs/common';

@Module({
    imports: [TypeOrmModule.forFeature([Member]), WorkspaceModule],
    controllers: [MemberController],
    providers: [MemberService, Logger],
    exports: [MemberService],
})
export class MemberModule {}
