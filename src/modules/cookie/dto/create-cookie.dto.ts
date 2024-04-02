import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCookieDto {
    @ApiProperty({
        description: 'Email associated with the cookie',
        example: 'user@example.com',
    })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({
        description: 'Value of the cookie',
        example: 'session_token_xxx',
    })
    @IsNotEmpty()
    @IsString()
    value: string;
}
