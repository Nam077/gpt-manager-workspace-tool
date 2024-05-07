// device.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

    @Column({
        name: 'pin_mode',
        comment: 'Pin mode of the device',
        type: 'int',
    })
    pinMode: number;

    @Column({
        name: 'description',
        comment: 'Description of the device',
        type: 'text',
        nullable: true,
    })
    description: string;

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
}
