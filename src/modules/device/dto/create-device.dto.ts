// create-device.dto.ts
import { IsInt, IsNotEmpty, IsBoolean, IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceDto {
    @ApiProperty({ description: 'The name of the device', example: 'Đèn phòng tắm' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'The status of the device', example: true })
    @IsNotEmpty()
    @IsBoolean()
    status: boolean;

    @ApiProperty({ description: 'Is the device a sensor', example: false })
    @IsNotEmpty()
    @IsBoolean()
    isSensor: boolean;

    @ApiProperty({
        description: 'The image of the device',
        example: 'https://cdn-icons-png.flaticon.com/512/1804/1804486.png',
    })
    @IsNotEmpty()
    @IsString()
    image: string;

    @ApiPropertyOptional({ description: 'The pinMode of the device', example: '1' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    pinMode: string;

    @ApiProperty({ description: 'The value of the device', example: 1 })
    @IsNotEmpty()
    @IsInt()
    value: number;

    @ApiProperty({ description: 'The description of the device', example: 'Đèn phòng tắm dưới chân cầu thang' })
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty({ description: 'The Id of the room', example: 1 })
    @IsNotEmpty()
    @IsInt()
    roomId: number;

    @ApiProperty({ description: 'The Id of the unit', example: 1 })
    unitId: number;
}
