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
} from 'typeorm';
import { Workspace } from '../../workspace/entities/workspace.entity';

@Entity({ name: 'members' })
export class Member {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
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
