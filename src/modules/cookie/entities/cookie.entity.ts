import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BeforeInsert,
    BeforeUpdate,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({
    name: 'cookies',
})
export class Cookie {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        unique: true,
    })
    email: string;

    @Column()
    value: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn({
        nullable: true,
    })
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    validate() {
        this.email = validateString(this.email);
        this.value = validateString(this.value);
    }
}
const validateString = (inputString: string): string => {
    return inputString.replace(/^[\n\t]+|[\n\t]+$/g, '').trim();
};
