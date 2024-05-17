import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitService {
    constructor(
        @InjectRepository(Unit)
        private readonly unitRepository: Repository<Unit>,
    ) {}

    async checkExistByAbbreviation(abbreviation: string): Promise<boolean> {
        return await this.unitRepository.exists({ where: { abbreviation } });
    }

    async create(createUnitDto: CreateUnitDto): Promise<Unit> {
        const { name, abbreviation } = createUnitDto;

        if (await this.checkExistByAbbreviation(abbreviation)) {
            throw new ConflictException('Unit abbreviation already exists');
        }
        const unit = this.unitRepository.create({ name, abbreviation });
        return await this.unitRepository.save(unit);
    }

    async findAll(): Promise<Unit[]> {
        return await this.unitRepository.find();
    }

    async findOne(id: number): Promise<Unit> {
        const unit = await this.unitRepository.findOne({
            where: { id },
        });
        if (!unit) {
            throw new NotFoundException(`Unit with id ${id} not found`);
        }
        return unit;
    }

    async update(id: number, updateUnitDto: UpdateUnitDto): Promise<Unit> {
        const { name, abbreviation } = updateUnitDto;

        const unitExist = await this.findOne(id);
        if (abbreviation && abbreviation !== unitExist.abbreviation) {
            if (await this.checkExistByAbbreviation(abbreviation)) {
                throw new ConflictException('Unit abbreviation already exists');
            }
        }
        this.unitRepository.merge(unitExist, { name, abbreviation });
        return await this.unitRepository.save(unitExist);
    }

    async remove(id: number): Promise<void> {
        const unit = await this.findOne(id);
        await this.unitRepository.remove(unit);
    }
}
