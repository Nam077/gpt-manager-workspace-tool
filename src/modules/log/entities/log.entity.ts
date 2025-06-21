import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('logs')
export class Log {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    level: string; // info, warn, error, debug

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'text', nullable: true })
    additionalInfo: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
