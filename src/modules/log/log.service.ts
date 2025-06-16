import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './entities/log.entity';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

@Injectable()
export class LogService {
    constructor(
        @InjectRepository(Log)
        private logRepository: Repository<Log>,
    ) {}

    async create(level: string, message: string, additionalInfo?: string): Promise<Log> {
        const log = this.logRepository.create({
            level,
            message,
            additionalInfo,
        });
        return this.logRepository.save(log);
    }

    async findAll(limit = 100, offset = 0): Promise<PaginatedResponse<Log>> {
        const [data, total] = await this.logRepository.findAndCount({
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        const page = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    async findAllWithoutPagination(): Promise<Log[]> {
        return this.logRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findByLevel(level: string, limit = 100, offset = 0): Promise<Log[]> {
        return this.logRepository.find({
            where: { level },
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async deleteOldLogs(days = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const result = await this.logRepository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :cutoffDate', { cutoffDate })
            .execute();

        return result.affected || 0;
    }

    // Convenience methods for different log levels
    async info(message: string, additionalInfo?: string): Promise<Log> {
        return this.create('info', message, additionalInfo);
    }

    async warn(message: string, additionalInfo?: string): Promise<Log> {
        return this.create('warn', message, additionalInfo);
    }

    async error(message: string, additionalInfo?: string): Promise<Log> {
        return this.create('error', message, additionalInfo);
    }

    async debug(message: string, additionalInfo?: string): Promise<Log> {
        return this.create('debug', message, additionalInfo);
    }
}
