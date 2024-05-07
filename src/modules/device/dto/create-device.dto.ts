// create-device.dto.ts
import { IsInt, IsNotEmpty, IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
    @ApiProperty({ description: 'The name of the device', example: 'Đèn phòng tắm' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'The status of the device', example: true })
    @IsNotEmpty()
    @IsBoolean()
    status: boolean;

    @ApiProperty({
        description: 'The image of the device',
        example: 'https://cdn-icons-png.flaticon.com/512/1804/1804486.png',
    })
    @IsNotEmpty()
    @IsString()
    image: string;

    @ApiProperty({ description: 'The pinMode of the device', example: 1 })
    @IsNotEmpty()
    @IsInt()
    pinMode: number;

    @ApiProperty({ description: 'The value of the device', example: 1 })
    @IsNotEmpty()
    @IsInt()
    value: number;

    @ApiProperty({ description: 'The description of the device', example: 'Đèn phòng tắm dưới chân cầu thang' })
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    description: string;
}
