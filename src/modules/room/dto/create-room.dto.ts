import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
    @ApiProperty({ example: 'Living Room', description: 'The name of the room' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'A spacious living room with a big TV.', description: 'The description of the room' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    description?: string;
}
