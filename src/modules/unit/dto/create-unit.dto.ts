import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnitDto {
    @ApiProperty({ example: 'Meter', description: 'The name of the unit' })
    @IsString()
    name: string;

    @ApiProperty({ example: '°C', description: 'The abbreviation of the unit' })
    @IsString()
    abbreviation: string;
}
