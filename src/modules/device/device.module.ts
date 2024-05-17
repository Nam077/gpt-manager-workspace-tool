import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { Device } from './entities/device.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from '../room/room.module';
import { UnitModule } from '../unit/unit.module';

@Module({
    imports: [TypeOrmModule.forFeature([Device]), RoomModule, UnitModule],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule {}
