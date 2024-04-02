import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeUpdate,
    BeforeInsert,
    OneToMany,
} from 'typeorm';
import { Member } from '../../member/entities/member.entity';

@Entity({ name: 'workspaces' })
export class Workspace {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    email: string;

    @Column({
        unique: true,
    })
    maxSlots: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn({
        nullable: true,
    })
    updatedAt: Date;

    @OneToMany(() => Member, (member) => member.workspace)
    members: Member[];

    @BeforeInsert()
    @BeforeUpdate()
    validate() {
        this.email = toLowerCase(this.email);
    }
}
const toLowerCase = (inputString: string): string => {
    return inputString.toLowerCase();
};
