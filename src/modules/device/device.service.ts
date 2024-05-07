import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DeviceService {
    constructor(
        @InjectRepository(Device)
        private readonly deviceRepository: Repository<Device>,
    ) {}

    async findWithPinMode(pinMode: number): Promise<Device> {
        return await this.deviceRepository.findOne({ where: { pinMode } });
    }

    async checkExistPinMode(pinMode: number): Promise<boolean> {
        return await this.deviceRepository.exists({ where: { pinMode } });
    }
    async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
        if (await this.checkExistPinMode(createDeviceDto.pinMode)) {
            throw new HttpException('Pin mode already exists', HttpStatus.BAD_REQUEST);
        }
        return await this.deviceRepository.save(createDeviceDto);
    }

    async findAll(): Promise<Device[]> {
        return await this.deviceRepository.find();
    }

    async findOne(id: number): Promise<Device> {
        return await this.deviceRepository.findOneBy({ id });
    }

    async update(id: number, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
        const device = await this.findOne(id);
        if (!device) {
            throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
        }
        if (updateDeviceDto.pinMode && updateDeviceDto.pinMode !== device.pinMode) {
            if (await this.checkExistPinMode(updateDeviceDto.pinMode)) {
                throw new HttpException('Pin mode already exists', HttpStatus.BAD_REQUEST);
            }
        }
        return await this.deviceRepository.save({ ...device, ...updateDeviceDto });
    }

    async remove(id: number): Promise<Device> {
        const device = await this.findOne(id);
        if (!device) {
            throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
        }
        return await this.deviceRepository.remove(device);
    }

    async updateStatus(id: number): Promise<Device> {
        const device = await this.findOne(id);
        if (!device) {
            throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
        }
        return await this.deviceRepository.save({ ...device, status: !device.status });
    }
}
