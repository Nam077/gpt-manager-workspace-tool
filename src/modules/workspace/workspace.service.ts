import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './entities/workspace.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../member/entities/member.entity';

@Injectable()
export class WorkspaceService {
    constructor(@InjectRepository(Workspace) private workspaceRepository: Repository<Workspace>) {}

    async findByEmail(email: string): Promise<Workspace> {
        return await this.workspaceRepository.findOne({ where: { email }, relations: { members: true } });
    }

    async checkExistByEmail(email: string): Promise<boolean> {
        return await this.workspaceRepository.existsBy({ email });
    }

    async create(createWorkspaceDto: CreateWorkspaceDto): Promise<Workspace> {
        const { email, maxSlots } = createWorkspaceDto;
        if (await this.checkExistByEmail(email)) {
            throw new HttpException('Workspace already exists', HttpStatus.BAD_REQUEST);
        }
        const workspace = new Workspace();
        workspace.email = email;
        workspace.maxSlots = maxSlots;
        return await this.workspaceRepository.save(workspace);
    }

    async findAll(): Promise<Workspace[]> {
        return await this.workspaceRepository.find({ relations: { members: true } });
    }

    async findOne(id: number): Promise<Workspace> {
        return await this.workspaceRepository.findOne({ where: { id }, relations: { members: true } });
    }

    async update(id: number, updateWorkspaceDto: UpdateWorkspaceDto): Promise<Workspace> {
        const workspace = await this.findOne(id);
        if (!workspace) {
            throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
        }
        if (updateWorkspaceDto.email && workspace.email !== updateWorkspaceDto.email) {
            if (await this.checkExistByEmail(updateWorkspaceDto.email)) {
                throw new HttpException('Workspace already exists', HttpStatus.BAD_REQUEST);
            }
            workspace.email = updateWorkspaceDto.email;
        }
        if (updateWorkspaceDto.maxSlots) {
            if (updateWorkspaceDto.maxSlots < workspace.members.length) {
                throw new HttpException('Max slots cannot be less than the number of members', HttpStatus.BAD_REQUEST);
            }
            workspace.maxSlots = updateWorkspaceDto.maxSlots;
        }
        return await this.workspaceRepository.save(workspace);
    }

    async remove(id: number): Promise<Workspace> {
        const workspace = await this.findOne(id);
        if (!workspace) {
            throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
        }
        if (workspace.members.length > 0) {
            throw new HttpException('Workspace has members', HttpStatus.BAD_REQUEST);
        }
        return await this.workspaceRepository.remove(workspace);
    }

    async groupByEmail(): Promise<Record<string, Member[]>> {
        const workspaces = await this.findAll();
        const result: Record<string, Member[]> = {};
        for (const workspace of workspaces) {
            result[workspace.email] = workspace.members;
        }
        return result;
    }
}
