import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, Max, Min } from 'class-validator';

export class CreateWorkspaceDto {
    @ApiProperty({
        description: 'The email address for the workspace',
        example: 'workspace@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The maximum number of slots in the workspace',
        example: 10,
    })
    @IsInt()
    @Min(1)
    @Max(100)
    @IsNotEmpty()
    maxSlots: number;
}
