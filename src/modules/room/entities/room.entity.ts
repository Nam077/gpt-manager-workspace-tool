import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Device } from '../../device/entities/device.entity';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    description: string;

    @OneToMany(() => Device, (device) => device.room)
    devices: Device[];
}
