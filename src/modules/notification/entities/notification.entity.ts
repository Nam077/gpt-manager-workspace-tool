import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    type: string; // 'user_removed_pending', 'user_removed_main', 'cookie_expired', 'users_invited'

    @Column({ type: 'text' })
    adminEmail: string; // Email của admin thực hiện hành động

    @Column({ type: 'text', nullable: true })
    targetEmail: string; // Email của user bị ảnh hưởng

    @Column({ type: 'text' })
    message: string; // Nội dung thông báo

    @Column({ type: 'text', nullable: true })
    additionalInfo: string; // Thông tin bổ sung (JSON string)

    @Column({ type: 'boolean', default: false })
    isRead: boolean; // Đã đọc hay chưa

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
