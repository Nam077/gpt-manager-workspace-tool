import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
    @ApiProperty({
        description: 'Type of notification',
        example: 'user_removed_pending',
        enum: ['user_removed_pending', 'user_removed_main', 'cookie_expired'],
    })
    @IsString()
    @IsNotEmpty()
    type: string;

    @ApiProperty({
        description: 'Admin email who performed the action',
        example: 'admin@example.com',
    })
    @IsString()
    @IsNotEmpty()
    adminEmail: string;

    @ApiProperty({
        description: 'Target user email (if applicable)',
        example: 'user@example.com',
        required: false,
    })
    @IsString()
    @IsOptional()
    targetEmail?: string;

    @ApiProperty({
        description: 'Notification message',
        example: 'User has been removed from workspace',
    })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({
        description: 'Additional information as JSON string',
        example: '{"workspaceId": "123", "reason": "expired"}',
        required: false,
    })
    @IsString()
    @IsOptional()
    additionalInfo?: string;

    @ApiProperty({
        description: 'Whether notification is read',
        example: false,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isRead?: boolean;
}
