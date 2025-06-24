import { HttpException, HttpStatus, Injectable, BadRequestException } from '@nestjs/common';
import { CreateMemberDto, BulkCreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { WorkspaceService } from '../workspace/workspace.service';
import { Logger } from '@nestjs/common';

export interface BulkCreateResult {
    created: Member[];
    skipped: string[];
    errors: string[];
    totalFound: number;
    summary: string;
}

@Injectable()
export class MemberService {
    constructor(
        @InjectRepository(Member) private readonly memberRepository: Repository<Member>,
        @InjectRepository(Workspace) private readonly workspaceRepository: Repository<Workspace>,
        private readonly workspaceService: WorkspaceService,
        private readonly logger: Logger,
    ) {}

    async checkExistByEmailAndWorkspaceId(email: string, workspaceId: string): Promise<boolean> {
        const member = await this.memberRepository.findOne({ where: { email, workspaceId } });
        return !!member;
    }

    async create(createMemberDto: CreateMemberDto): Promise<Member> {
        const { email, workspaceId } = createMemberDto;

        // Check if workspace exists
        const workspace = await this.workspaceService.findOne(workspaceId);
        if (!workspace) {
            throw new HttpException('Workspace not found', HttpStatus.NOT_FOUND);
        }

        // Check if member already exists
        if (await this.checkExistByEmailAndWorkspaceId(email, workspaceId)) {
            throw new HttpException('Member already exists in this workspace', HttpStatus.CONFLICT);
        }

        // Check workspace capacity
        if (workspace.members.length >= workspace.maxSlots) {
            throw new HttpException('Workspace is full', HttpStatus.BAD_REQUEST);
        }

        const member = this.memberRepository.create(createMemberDto);
        return await this.memberRepository.save(member);
    }

    async bulkCreate(bulkCreateDto: BulkCreateMemberDto): Promise<BulkCreateResult> {
        const { emails, workspaceId } = bulkCreateDto;

        // Remove duplicates and validate emails
        const uniqueEmails = [...new Set(emails.map((email) => email.toLowerCase().trim()))];

        if (uniqueEmails.length === 0) {
            throw new BadRequestException('No valid emails provided');
        }

        try {
            // Check workspace exists and get current member count
            const workspace = await this.workspaceService.findOne(workspaceId);
            if (!workspace) {
                throw new BadRequestException('Workspace not found');
            }

            // Check which emails already exist (optimized single query)
            const existingMembers = await this.memberRepository.find({
                where: {
                    workspaceId,
                    email: In(uniqueEmails), // TypeORM In operator for type safety
                },
                select: ['email'], // Only select email field for performance
            });

            const existingEmails = new Set(existingMembers.map((member) => member.email));

            const results = {
                created: [] as Member[],
                skipped: [] as string[],
                errors: [] as string[],
                totalFound: uniqueEmails.length,
                summary: '',
            };

            // Filter out existing emails
            const emailsToCreate = uniqueEmails.filter((email) => !existingEmails.has(email));
            results.skipped = uniqueEmails.filter((email) => existingEmails.has(email));

            // Check workspace capacity
            const currentMemberCount = workspace.members.length;
            const availableSlots = workspace.maxSlots - currentMemberCount;

            if (availableSlots <= 0) {
                throw new BadRequestException(
                    `Workspace is full (${currentMemberCount}/${workspace.maxSlots} slots used)`,
                );
            }

            // Limit emails to create based on available slots
            if (emailsToCreate.length > availableSlots) {
                const emailsExceedingLimit = emailsToCreate.slice(availableSlots);
                emailsToCreate.splice(availableSlots); // Keep only what fits

                // Add exceeded emails to errors
                emailsExceedingLimit.forEach((email) => {
                    results.errors.push(`${email}: Workspace capacity exceeded (${availableSlots} slots available)`);
                });
            }

            // Bulk create new members if any
            if (emailsToCreate.length > 0) {
                try {
                    const membersToCreate = emailsToCreate.map((email) => ({
                        email,
                        workspaceId,
                    }));

                    // Use insert for better performance with large datasets
                    const insertResult = await this.memberRepository.insert(membersToCreate);

                    // Fetch the created members to return complete data
                    if (insertResult.identifiers && insertResult.identifiers.length > 0) {
                        const createdMembers = await this.memberRepository.find({
                            where: {
                                id: In(insertResult.identifiers.map((identifier) => identifier.id)),
                            },
                        });
                        results.created = createdMembers;
                    }
                } catch (error) {
                    // Fallback to individual inserts if bulk insert fails
                    this.logger.warn('Bulk insert failed, falling back to individual inserts:', error.message);

                    for (const email of emailsToCreate) {
                        try {
                            const member = this.memberRepository.create({
                                email,
                                workspaceId,
                            });
                            const savedMember = await this.memberRepository.save(member);
                            results.created.push(savedMember);
                        } catch (individualError) {
                            this.logger.error(`Failed to create member with email ${email}:`, individualError.message);
                            results.errors.push(`${email}: ${individualError.message}`);
                        }
                    }
                }
            }

            // Generate summary
            const capacityInfo = availableSlots < uniqueEmails.length ? ` (${availableSlots} slots available)` : '';
            results.summary = `Processed ${results.totalFound} emails${capacityInfo}. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`;

            return results;
        } catch (error) {
            this.logger.error('Bulk create failed:', error);
            throw new BadRequestException(`Bulk member creation failed: ${error.message}`);
        }
    }

    async findAll(): Promise<Member[]> {
        return await this.memberRepository.find({ relations: { workspace: true } });
    }

    async findOne(id: string): Promise<Member> {
        return await this.memberRepository.findOne({ where: { id }, relations: { workspace: true } });
    }

    async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
        const member = await this.findOne(id);
        if (!member) {
            throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
        }

        const { email, workspaceId } = updateMemberDto;

        if (email && email !== member.email) {
            if (await this.checkExistByEmailAndWorkspaceId(email, member.workspaceId)) {
                throw new HttpException('Member already exists in this workspace', HttpStatus.CONFLICT);
            }
        }

        if (workspaceId && workspaceId !== member.workspaceId) {
            if (await this.checkExistByEmailAndWorkspaceId(member.email, workspaceId)) {
                throw new HttpException('Member already exists in target workspace', HttpStatus.CONFLICT);
            }
        }

        await this.memberRepository.update(id, updateMemberDto);
        return await this.findOne(id);
    }

    async remove(id: string): Promise<Member> {
        const member = await this.findOne(id);
        if (!member) {
            throw new HttpException('Member not found', HttpStatus.NOT_FOUND);
        }
        return await this.memberRepository.remove(member);
    }

    async findByIdWorkSpace(workspaceId: string) {
        return await this.memberRepository.find({ where: { workspaceId }, relations: { workspace: true } });
    }

    async deleteAllByWorkspace(workspaceId: string): Promise<{ deleted: number; message: string }> {
        try {
            // Check if workspace exists
            const workspace = await this.workspaceService.findOne(workspaceId);
            if (!workspace) {
                throw new BadRequestException('Workspace not found');
            }

            // Count members before deletion
            const memberCount = await this.memberRepository.count({
                where: { workspaceId },
            });

            if (memberCount === 0) {
                return {
                    deleted: 0,
                    message: 'No members found in this workspace',
                };
            }

            // Delete all members in workspace
            const deleteResult = await this.memberRepository.delete({ workspaceId });

            return {
                deleted: deleteResult.affected || 0,
                message: `Successfully deleted ${deleteResult.affected || 0} members from workspace`,
            };
        } catch (error) {
            this.logger.error(`Failed to delete all members from workspace ${workspaceId}:`, error);
            throw new BadRequestException(`Failed to delete members: ${error.message}`);
        }
    }

    async findEmailsInWorkspaces(emails: string[]): Promise<{
        found: Array<{ email: string; member: Member; workspace: any }>;
        notFound: string[];
    }> {
        try {
            const normalizedEmails = emails.map((email) => email.toLowerCase().trim());

            // Find all members with these emails across all workspaces
            const foundMembers = await this.memberRepository.find({
                where: {
                    email: In(normalizedEmails),
                },
                relations: ['workspace'],
            });

            const foundEmails = new Set(foundMembers.map((member) => member.email));
            const notFoundEmails = normalizedEmails.filter((email) => !foundEmails.has(email));

            // Get current member counts for each workspace in one query
            const workspaceIds = [...new Set(foundMembers.map((member) => member.workspace.id))];
            const memberCounts = await this.memberRepository
                .createQueryBuilder('member')
                .select('member.workspaceId', 'workspaceId')
                .addSelect('COUNT(member.id)', 'count')
                .where('member.workspaceId IN (:...workspaceIds)', { workspaceIds })
                .groupBy('member.workspaceId')
                .getRawMany();

            const memberCountMap = new Map(memberCounts.map((item) => [item.workspaceId, parseInt(item.count)]));

            const found = foundMembers.map((member) => ({
                email: member.email,
                member,
                workspace: {
                    id: member.workspace.id,
                    email: member.workspace.email,
                    maxSlots: member.workspace.maxSlots,
                    currentMembers: memberCountMap.get(member.workspace.id) || 0,
                },
            }));

            return {
                found,
                notFound: notFoundEmails,
            };
        } catch (error) {
            this.logger.error('Failed to find emails in workspaces:', error);
            throw new BadRequestException(`Failed to search emails: ${error.message}`);
        }
    }

    async autoAssignToWorkspaces(emails: string[]): Promise<{
        assigned: Array<{ email: string; workspaceId: string; workspaceEmail: string }>;
        failed: Array<{ email: string; reason: string }>;
        summary: string;
    }> {
        try {
            const normalizedEmails = [...new Set(emails.map((email) => email.toLowerCase().trim()))];

            // Get all workspaces with their current member counts in one query
            const workspaces = await this.workspaceRepository
                .createQueryBuilder('workspace')
                .leftJoin('workspace.members', 'member')
                .select(['workspace.id', 'workspace.email', 'workspace.maxSlots', 'COUNT(member.id) as currentMembers'])
                .groupBy('workspace.id, workspace.email, workspace.maxSlots')
                .getRawMany();

            // Filter available workspaces and sort by available slots
            const availableWorkspaces = workspaces
                .map((ws) => ({
                    id: ws.workspace_id,
                    email: ws.workspace_email,
                    maxSlots: ws.workspace_maxSlots,
                    currentMembers: parseInt(ws.currentMembers) || 0,
                    availableSlots: ws.workspace_maxSlots - (parseInt(ws.currentMembers) || 0),
                }))
                .filter((ws) => ws.availableSlots > 0)
                .sort((a, b) => b.availableSlots - a.availableSlots);

            if (availableWorkspaces.length === 0) {
                throw new BadRequestException('All workspaces are at maximum capacity');
            }

            // Check which emails already exist in one query
            const existingEmails = new Set(
                (
                    await this.memberRepository.find({
                        where: { email: In(normalizedEmails) },
                        select: ['email'],
                    })
                ).map((member) => member.email),
            );

            const emailsToAssign = normalizedEmails.filter((email) => !existingEmails.has(email));
            const results = {
                assigned: [] as Array<{ email: string; workspaceId: string; workspaceEmail: string }>,
                failed: [] as Array<{ email: string; reason: string }>,
                summary: '',
            };

            // Add existing emails to failed list
            normalizedEmails.forEach((email) => {
                if (existingEmails.has(email)) {
                    results.failed.push({ email, reason: 'Email already exists in system' });
                }
            });

            // Prepare members to insert in batch
            const membersToCreate: Array<{ email: string; workspaceId: string; workspaceEmail: string }> = [];
            let workspaceIndex = 0;
            let currentWorkspaceSlots = 0;

            for (const email of emailsToAssign) {
                // Find next available workspace
                while (
                    workspaceIndex < availableWorkspaces.length &&
                    currentWorkspaceSlots >= availableWorkspaces[workspaceIndex].availableSlots
                ) {
                    workspaceIndex++;
                    currentWorkspaceSlots = 0;
                }

                if (workspaceIndex >= availableWorkspaces.length) {
                    results.failed.push({ email, reason: 'No workspace has available slots' });
                    continue;
                }

                const workspace = availableWorkspaces[workspaceIndex];
                membersToCreate.push({
                    email,
                    workspaceId: workspace.id,
                    workspaceEmail: workspace.email,
                });

                currentWorkspaceSlots++;
            }

            // Batch insert all members
            if (membersToCreate.length > 0) {
                try {
                    const memberEntities = this.memberRepository.create(
                        membersToCreate.map((m) => ({ email: m.email, workspaceId: m.workspaceId })),
                    );

                    await this.memberRepository.save(memberEntities);

                    // All succeeded
                    results.assigned = membersToCreate;
                } catch (error) {
                    this.logger.error('Batch insert failed, falling back to individual inserts:', error);

                    // Fallback to individual inserts
                    for (const memberData of membersToCreate) {
                        try {
                            const member = this.memberRepository.create({
                                email: memberData.email,
                                workspaceId: memberData.workspaceId,
                            });
                            await this.memberRepository.save(member);

                            results.assigned.push(memberData);
                        } catch (individualError) {
                            results.failed.push({
                                email: memberData.email,
                                reason: `Failed to create: ${individualError.message}`,
                            });
                        }
                    }
                }
            }

            results.summary = `Processed ${normalizedEmails.length} emails. Assigned: ${results.assigned.length}, Failed: ${results.failed.length}`;
            return results;
        } catch (error) {
            this.logger.error('Auto assignment failed:', error);
            throw new BadRequestException(`Auto assignment failed: ${error.message}`);
        }
    }
}
