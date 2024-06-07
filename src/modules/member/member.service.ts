import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class MemberService {
    constructor(
        @InjectRepository(Member) private memberRepository: Repository<Member>,
        private readonly workspaceService: WorkspaceService,
    ) {}

    async checkExistByEmailAndWorkspaceId(email: string, workspaceId: number): Promise<boolean> {
        return await this.memberRepository.existsBy({ email, workspaceId });
    }

    async create(createMemberDto: CreateMemberDto): Promise<Member> {
        const { workspaceId, email } = createMemberDto;
        const workspace = await this.workspaceService.findOne(workspaceId);
        if (!workspace) {
            throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
        }
        if (workspace.members.length >= workspace.maxSlots) {
            throw new HttpException('Workspace is full', HttpStatus.BAD_REQUEST);
        }
        if (await this.checkExistByEmailAndWorkspaceId(email, workspaceId)) {
            throw new HttpException('Member already exists', HttpStatus.BAD_REQUEST);
        }
        const member = new Member();
        member.email = email;
        member.workspaceId = workspaceId;
        return await this.memberRepository.save(member);
    }

    async findAll(): Promise<Member[]> {
        return await this.memberRepository.find({ relations: { workspace: true } });
    }

    async findOne(id: number): Promise<Member> {
        return await this.memberRepository.findOne({ where: { id }, relations: { workspace: true } });
    }

    async update(id: number, updateMemberDto: UpdateMemberDto): Promise<Member> {
        const member = await this.findOne(id);
        if (!member) {
            throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
        }
        if (updateMemberDto.email && member.email !== updateMemberDto.email) {
            if (await this.checkExistByEmailAndWorkspaceId(updateMemberDto.email, member.workspaceId)) {
                throw new HttpException('Member already exists', HttpStatus.BAD_REQUEST);
            }
            member.email = updateMemberDto.email;
        }
        if (updateMemberDto.workspaceId && member.workspaceId !== updateMemberDto.workspaceId) {
            const workspace = await this.workspaceService.findOne(updateMemberDto.workspaceId);
            if (!workspace) {
                throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
            }
            if (workspace.members.length + 1 > workspace.maxSlots) {
                throw new HttpException('Workspace is full', HttpStatus.BAD_REQUEST);
            }
            member.workspaceId = updateMemberDto.workspaceId;
        }
        return await this.memberRepository.save(member);
    }

    async remove(id: number): Promise<Member> {
        const member = await this.findOne(id);
        if (!member) {
            throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
        }
        return await this.memberRepository.remove(member);
    }

    async findByIdWorkSpace(number: number) {
        return await this.memberRepository.find({ where: { workspaceId: number }, relations: { workspace: true } });
    }
}
