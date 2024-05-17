// device.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { Unit } from '../../unit/entities/unit.entity';

@Entity({
    name: 'devices',
})
export class Device {
    @PrimaryGeneratedColumn({
        name: 'id',
        comment: 'ID of the device',
    })
    id: number;

    @Column({
        name: 'name',
        comment: 'Name of the device',
        type: 'text',
    })
    name: string;

    @Column({
        name: 'value',
        comment: 'Value of the device',
        type: 'int',
    })
    value: number;

    @Column({
        default: false,
        name: 'status',
        comment: 'Status of the device',
        type: 'boolean',
    })
    status: boolean;

    @Column({
        name: 'image',
        comment: 'Image of the device',
        type: 'text',
    })
    image: string;

    @Column({})
    pinMode: string;

    @Column({
        type: 'boolean',
        default: false,
        name: 'is_sensor',
    })
    isSensor: boolean;

    @Column({
        name: 'description',
        comment: 'Description of the device',
        type: 'text',
        nullable: true,
    })
    description: string;

    @Column({
        name: 'clean',
        comment: 'Clean of the device',
        type: 'text',
        nullable: true,
    })
    clean?: string;

    @CreateDateColumn({
        name: 'created_at',
        comment: 'Created at',
        select: false,
    })
    createdAt: Date;

    @CreateDateColumn({
        name: 'updated_at',
        comment: 'Updated at',
        select: false,
    })
    updatedAt: Date;

    @ManyToOne(() => Room, (room) => room.devices)
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @ManyToOne(() => Unit, (unit) => unit.devices, {
        nullable: true,
    })
    @JoinColumn({ name: 'unit_id' })
    unit: Unit;
}
