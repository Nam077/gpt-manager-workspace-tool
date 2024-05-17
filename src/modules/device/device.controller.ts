import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ApiTags } from '@nestjs/swagger';
import { TextDto } from './dto/text.dto';

@ApiTags('Device')
@Controller('device')
export class DeviceController {
    constructor(private readonly deviceService: DeviceService) {}

    @Post()
    create(@Body() createDeviceDto: CreateDeviceDto) {
        return this.deviceService.create(createDeviceDto);
    }

    @Patch('text')
    createText(@Body() textDto: TextDto) {
        // hàm xử lý text
        return this.deviceService.handleText(textDto);
    }

    @Get()
    findAll() {
        return this.deviceService.findAll();
    }


    @Get('room/:id')
    findAllByRoom(@Param('id') id: string) {
        return this.deviceService.findAllByRoom(+id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.deviceService.findOne(+id);
    }

    @Patch('status/:id')
    updateStatus(@Param('id') id: string) {
        return this.deviceService.updateStatus(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
        return this.deviceService.update(+id, updateDeviceDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.deviceService.remove(+id);
    }
}
