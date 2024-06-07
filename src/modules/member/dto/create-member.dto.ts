import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMemberDto {
    @ApiProperty({
        description: 'Email address of the member',
        example: 'member@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'ID of the workspace to which the member belongs',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    workspaceId: number;
}
