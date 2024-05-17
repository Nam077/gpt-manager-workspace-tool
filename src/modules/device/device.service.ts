import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Observable, from, switchMap, map } from 'rxjs';
import { RoomService } from '../room/room.service';
import { Room } from '../room/entities/room.entity';
import { UnitService } from '../unit/unit.service';
import { Unit } from '../unit/entities/unit.entity';
import { TextDto } from './dto/text.dto';
@Injectable()
export class DeviceService {


    constructor(
        @InjectRepository(Device)
        private readonly deviceRepository: Repository<Device>,
        private readonly roomService: RoomService,
        private readonly unitService: UnitService,
    ) { }

    async checkExistByPinModeAndRoomId(pinMode: string, room: Room): Promise<boolean> {
        return await this.deviceRepository.exists({ where: { pinMode, room } });
    }

    async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
        const { roomId, pinMode, unitId, isSensor } = createDeviceDto;
        const room = await this.roomService.findOne(roomId);
        const unit: Unit = unitId ? await this.unitService.findOne(unitId) : null;
        if (await this.checkExistByPinModeAndRoomId(pinMode, room)) {
            throw new HttpException('Device already exists', HttpStatus.BAD_REQUEST);
        }
        if (!(await this.roomService.findOne(roomId))) {
            throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
        }
        const device = new Device();
        device.name = createDeviceDto.name;
        device.pinMode = createDeviceDto.pinMode;
        device.status = createDeviceDto.status;
        device.value = createDeviceDto.value;
        device.image = createDeviceDto.image;
        device.description =  `${createDeviceDto.name} ${room.name}`;
        device.clean = removeAccent(device.description);
        device.room = room;
        device.unit = unit;
        device.isSensor = isSensor;
        const deviceCreate = this.deviceRepository.create(device);
        return await this.deviceRepository.save(deviceCreate);
    }

    async findAll(): Promise<Device[]> {
        return await this.deviceRepository.find({
            relations: {
                unit: true,
                room: true,
            },
        });
    }

    async findOne(id: number): Promise<Device> {
        return await this.deviceRepository.findOne({
            where: { id },
            relations: {
                unit: true,
                room: true,
            },
        });
    }

    async update(id: number, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
        const device = await this.findOne(id);
        delete updateDeviceDto.description;
        delete updateDeviceDto.clean;
        if (!device) {
            throw new HttpException('Device not found', HttpStatus.NOT_FOUND);
        }
        let roomCheck = device.room;
        let pinModeCheck = device.pinMode;
        if (updateDeviceDto.name && updateDeviceDto.name !== device.name) {
            device.name = updateDeviceDto.name;
            device.description = `${updateDeviceDto.name || device.name} ${device.room.name}`
            device.clean = removeAccent(device.description);
        }
        if (updateDeviceDto.roomId) {
            const room = await this.roomService.findOne(updateDeviceDto.roomId);
            if (!room) {
                throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
            }
            device.description = `${updateDeviceDto.name || device.name} ${room.name}`
            device.clean = removeAccent(device.description);
            roomCheck = room;
            device.room = room;
        }
        if (updateDeviceDto.unitId && updateDeviceDto.unitId !== device.unit.id) {
            const unit = await this.unitService.findOne(updateDeviceDto.unitId);
            if (!unit) {
                throw new HttpException('Unit not found', HttpStatus.NOT_FOUND);
            }
            device.unit = unit;
        }
        if (updateDeviceDto.pinMode && updateDeviceDto.pinMode !== device.pinMode) {
            pinModeCheck = updateDeviceDto.pinMode;
        }
        if (updateDeviceDto.roomId && updateDeviceDto.pinMode) {
            if (await this.checkExistByPinModeAndRoomId(pinModeCheck, roomCheck)) {
                throw new HttpException('Device already exists', HttpStatus.BAD_REQUEST);
            }
        }
        this.deviceRepository.merge(device, updateDeviceDto);
        return await this.deviceRepository.save(device);
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

    async findAllByRoom(roomId: number) {
        return await this.deviceRepository.find({
            where: { room: { id: roomId } },
            relations: {
                room: true,
                unit: true,
            }
        });
    }

    async searchByClean(clean: string) {
        return await this.deviceRepository.findOne({ where: { clean : Like(`%${clean}%`) } });
    }

    async handleText(textDto: TextDto) {
        const enable = ['bật', 'mở'];
        const disable = ['tắt', 'đóng'];

        textDto.text = textDto.text.toLowerCase();
        const { text } = textDto;
        
        const regexEnable = new RegExp(enable.join('|'), 'i');
        const regexDisable = new RegExp(disable.join('|'), 'i');
        if (text.match(regexEnable)) {
            
            const description = text.replace(regexEnable, '').trim();
            const device = await this.searchByClean(removeAccent(description));
            
            if (!device) {
                return { message: 'Không tìm thấy thiết bị' };
            }
            const deviceUpdate = await this.deviceRepository.save({ ...device, status: true });
            return  {
                message: `Đã bật thiết bị ${deviceUpdate.description}`,
                device: deviceUpdate,
            }
        }
        if (text.match(regexDisable)) {
            const description = text.replace(regexDisable, '').trim();
            const device = await this.searchByClean(removeAccent(description));
            if (!device) {
                return { message: 'Không tìm thấy thiết bị' };
            }
            const deviceUpdate = await this.deviceRepository.save({ ...device, status: false });
            return  {
                message: `Đã tắt thiết bị ${deviceUpdate.description}`,
                device: deviceUpdate,
            }
        }

        return { message: 'Không tìm thấy thiết bị' };

    }
}

export const removeAccent = (str: string) => {
    const map = {
        a: 'á|à|ã|ả|ạ|ă|ắ|ằ|ẵ|ẳ|ặ|â|ấ|ầ|ẫ|ẩ|ậ',
        d: 'đ',
        e: 'é|è|ẽ|ẻ|ẹ|ê|ế|ề|ễ|ể|ệ',
        i: 'í|ì|ĩ|ỉ|ị',
        o: 'ó|ò|õ|ỏ|ọ|ô|ố|ồ|ỗ|ổ|ộ|ơ|ớ|ờ|ỡ|ở|ợ',
        u: 'ú|ù|ũ|ủ|ụ|ư|ứ|ừ|ữ|ử|ự',
        y: 'ý|ỳ|ỹ|ỷ|ỵ',
    };
    for (const pattern in map) {
        str = str.replace(new RegExp(map[pattern], 'g'), pattern);
    }
    return str;
}