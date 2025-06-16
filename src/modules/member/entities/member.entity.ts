import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeUpdate,
    BeforeInsert,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Workspace } from '../../workspace/entities/workspace.entity';

@Entity({ name: 'members' })
@Unique(['email', 'workspaceId'])
export class Member {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn({
        nullable: true,
    })
    updatedAt: Date;

    @Column()
    workspaceId: number;

    @BeforeInsert()
    @BeforeUpdate()
    validate() {
        this.email = this.email.toLowerCase();
    }

    @ManyToOne(() => Workspace, (workspace) => workspace.members)
    @JoinColumn({ name: 'workspaceId' })
    workspace: Workspace;
}
