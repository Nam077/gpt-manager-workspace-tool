// create-device.dto.ts
import { IsInt, IsNotEmpty, IsBoolean, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class TextDto {
    @ApiProperty({ description: 'The text of the device', example: 'Bật đèn phòng tắm' })
    @IsNotEmpty()
    @IsString()
    text: string;
}