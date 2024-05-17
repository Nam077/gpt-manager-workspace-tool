import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';

@Injectable()
export class RoomService {
    constructor(
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) {}

    async checkExistByName(name: string): Promise<boolean> {
        return await this.roomRepository.existsBy({ name: ILike(name) });
    }

    async create(createRoomDto: CreateRoomDto): Promise<Room> {
        const { name } = createRoomDto;
        if (await this.checkExistByName(name)) {
            throw new ConflictException('Room name already exists');
        }
        const room = this.roomRepository.create(createRoomDto);
        return await this.roomRepository.save(room);
    }

    async findAll(): Promise<Room[]> {
        return await this.roomRepository.find({
            relations: {
                devices: {
                    unit: true,
                    room: true,
                },
            },
            order: {
                id: 'ASC',
            },
        });
    }

    async findOne(id: number): Promise<Room> {
        const room = await this.roomRepository.findOne({
            where: { id },
        });
        if (!room) {
            throw new NotFoundException(`Room with id ${id} not found`);
        }
        return room;
    }

    async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
        const { name } = updateRoomDto;

        const roomExist = await this.findOne(id);
        if (name && name !== roomExist.name && (await this.checkExistByName(name))) {
            throw new ConflictException('Room name already exists');
        }
        this.roomRepository.merge(roomExist, updateRoomDto);
        return await this.roomRepository.save(roomExist);
    }

    async remove(id: number): Promise<void> {
        const room = await this.findOne(id);
        await this.roomRepository.remove(room);
    }
}
