import { Module } from '@nestjs/common';
import { UnitService } from './unit.service';
import { UnitController } from './unit.controller';
import { Unit } from './entities/unit.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Unit])],
    controllers: [UnitController],
    providers: [UnitService],
    exports: [UnitService],
})
export class UnitModule {}
