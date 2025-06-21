import { HttpException, HttpStatus, Injectable, BadRequestException } from '@nestjs/common';
import { CreateMemberDto, BulkCreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { Member } from './entities/member.entity';
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

            const found = foundMembers.map((member) => ({
                email: member.email,
                member,
                workspace: {
                    id: member.workspace.id,
                    email: member.workspace.email,
                    maxSlots: member.workspace.maxSlots,
                    currentMembers: member.workspace.members?.length || 0,
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

            // Get all workspaces with their current member counts
            const workspaces = await this.workspaceService.findAll();
            const availableWorkspaces = workspaces.filter(
                (workspace) => (workspace.members?.length || 0) < workspace.maxSlots,
            );

            if (availableWorkspaces.length === 0) {
                throw new BadRequestException('All workspaces are at maximum capacity');
            }

            // Check which emails already exist
            const existingMembers = await this.memberRepository.find({
                where: { email: In(normalizedEmails) },
                select: ['email'],
            });
            const existingEmails = new Set(existingMembers.map((member) => member.email));

            const emailsToAssign = normalizedEmails.filter((email) => !existingEmails.has(email));
            const results = {
                assigned: [] as Array<{ email: string; workspaceId: string; workspaceEmail: string }>,
                failed: [] as Array<{ email: string; reason: string }>,
                summary: '',
            };

            // Add existing emails to failed list
            existingEmails.forEach((email) => {
                if (normalizedEmails.includes(email)) {
                    results.failed.push({ email, reason: 'Email already exists in system' });
                }
            });

            // Sort workspaces by available slots (most available first)
            availableWorkspaces.sort((a, b) => {
                const slotsA = a.maxSlots - (a.members?.length || 0);
                const slotsB = b.maxSlots - (b.members?.length || 0);
                return slotsB - slotsA;
            });

            // Assign emails to workspaces
            let workspaceIndex = 0;
            for (const email of emailsToAssign) {
                if (workspaceIndex >= availableWorkspaces.length) {
                    results.failed.push({ email, reason: 'No workspace has available slots' });
                    continue;
                }

                const workspace = availableWorkspaces[workspaceIndex];
                const currentSlots = workspace.members?.length || 0;

                if (currentSlots >= workspace.maxSlots) {
                    // Move to next workspace
                    workspaceIndex++;
                    if (workspaceIndex >= availableWorkspaces.length) {
                        results.failed.push({ email, reason: 'No workspace has available slots' });
                        continue;
                    }
                }

                try {
                    const member = this.memberRepository.create({
                        email,
                        workspaceId: workspace.id,
                    });
                    await this.memberRepository.save(member);

                    results.assigned.push({
                        email,
                        workspaceId: workspace.id,
                        workspaceEmail: workspace.email,
                    });

                    // Update local counter
                    workspace.members = workspace.members || [];
                    workspace.members.push(member);
                } catch (error) {
                    results.failed.push({ email, reason: `Failed to create: ${error.message}` });
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
