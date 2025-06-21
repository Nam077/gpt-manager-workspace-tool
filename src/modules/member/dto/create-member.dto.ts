import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUUID, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateMemberDto {
    @ApiProperty({
        description: 'The email of the member',
        example: 'user@example.com',
        required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'The workspace ID that the member belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsUUID()
    @IsNotEmpty()
    workspaceId: string;
}

export class BulkCreateMemberDto {
    @ApiProperty({
        description: 'String containing emails (will be auto-parsed using regex)',
        example: 'Contact us at: john@example.com, jane.doe@company.org or support@test.co.uk for more info',
        required: true,
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsEmail({}, { each: true })
    emails: string[];

    @ApiProperty({
        description: 'The workspace ID that members will be added to',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: true,
    })
    @IsUUID()
    @IsNotEmpty()
    workspaceId: string;
}

export class SearchEmailsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsEmail({}, { each: true })
    emails: string[];
}

export class AutoAssignEmailsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsEmail({}, { each: true })
    emails: string[];
}
