import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Device } from '../../device/entities/device.entity';

@Entity()
export class Unit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'text',
        nullable: true,
        unique: true,
    })
    abbreviation: string;

    @OneToMany(() => Device, (device) => device.unit)
    devices: Device[];
}
