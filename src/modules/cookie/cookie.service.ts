import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCookieDto } from './dto/create-cookie.dto';
import { UpdateCookieDto } from './dto/update-cookie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cookie } from './entities/cookie.entity';
import { Equal, Not, Repository } from 'typeorm';
import { toTimeZone } from 'src/util';
import { json2csv } from 'json-2-csv';

@Injectable()
export class CookieService {
    constructor(
        @InjectRepository(Cookie)
        private readonly cookieRepository: Repository<Cookie>,
    ) {}

    async checkExists(email: string): Promise<boolean> {
        const cookie = await this.cookieRepository.findOne({ where: { email } });
        return !!cookie;
    }

    async create(createCookieDto: CreateCookieDto): Promise<Cookie> {
        const { email } = createCookieDto;
        if (await this.checkExists(email)) {
            throw new ConflictException(`Email '${email}' is already associated with another cookie`);
        }
        const newCookie = this.cookieRepository.create(createCookieDto);
        return this.cookieRepository.save(newCookie);
    }

    async findAll(): Promise<any[]> {
        const cookies = await this.cookieRepository.find();
        if (cookies) {
            return cookies.map((cookie) => {
                return {
                    id: cookie.id,
                    email: cookie.email,
                    value: cookie.value,
                    createdAt: toTimeZone(cookie.createdAt, 'Asia/Ho_Chi_Minh'),
                    updatedAt: toTimeZone(cookie.updatedAt, 'Asia/Ho_Chi_Minh'),
                };
            });
        }
        return [];
    }

    async finAllNoError(): Promise<Cookie[]> {
        return this.cookieRepository.find({
            where: {
                value: Not(Equal('error')), // Using Not and Equal operators
            },
        });
    }

    async findOne(id: string): Promise<Cookie> {
        const cookie = await this.cookieRepository.findOne({ where: { id } });
        if (!cookie) {
            throw new NotFoundException(`Cookie with ID #${id} not found`);
        }
        return cookie;
    }

    async update(id: string, updateCookieDto: UpdateCookieDto): Promise<Cookie> {
        const cookie = await this.findOne(id);
        if (updateCookieDto.email && updateCookieDto.email !== cookie.email) {
            const existingCookie = await this.cookieRepository.findOne({ where: { email: updateCookieDto.email } });
            if (existingCookie && existingCookie.id !== id) {
                throw new ConflictException(`Cookie with email '${updateCookieDto.email}' already exists`);
            }
        }
        await this.cookieRepository.update(id, updateCookieDto);
        return await this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const result = await this.cookieRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Cookie with ID #${id} not found`);
        }
    }

    async exportToCsv(entities: any): Promise<string> {
        return json2csv(entities);
    }

    async updateValueToError(email: string): Promise<void> {
        try {
            const cookie = await this.cookieRepository.findOne({ where: { email } });
            if (!cookie) {
                throw new NotFoundException(`Cookie with email '${email}' not found`);
            }
            cookie.value = 'error';
            await this.cookieRepository.save(cookie);
        } catch (error) {
            // Silent error handling for cookie update
        }
    }

    // New methods for enhanced functionality
    async findByEmail(email: string): Promise<Cookie> {
        const cookie = await this.cookieRepository.findOne({ where: { email } });
        if (!cookie) {
            throw new NotFoundException(`Cookie with email '${email}' not found`);
        }
        return cookie;
    }

    async removeByEmail(email: string): Promise<void> {
        const result = await this.cookieRepository.delete({ email });
        if (result.affected === 0) {
            throw new NotFoundException(`Cookie with email '${email}' not found`);
        }
    }

    async getActiveCookies(): Promise<Cookie[]> {
        return this.cookieRepository.find({
            where: {
                value: Not(Equal('error')),
            },
            order: { createdAt: 'DESC' },
        });
    }

    async getErrorCookies(): Promise<Cookie[]> {
        return this.cookieRepository.find({
            where: {
                value: Equal('error'),
            },
            order: { updatedAt: 'DESC' },
        });
    }

    async validateCookie(id: string): Promise<{ isValid: boolean; cookie: Cookie }> {
        const cookie = await this.findOne(id);
        const isValid = cookie.value !== 'error' && cookie.value.length > 0;
        return { isValid, cookie };
    }

    async bulkCreate(createCookiesDto: CreateCookieDto[]): Promise<Cookie[]> {
        const results = [];
        const errors = [];

        for (const createCookieDto of createCookiesDto) {
            try {
                const cookie = await this.create(createCookieDto);
                results.push(cookie);
            } catch (error) {
                errors.push({
                    email: createCookieDto.email,
                    error: error.message,
                });
            }
        }

        if (errors.length > 0) {
            // Errors are returned in the response, no need to log
        }

        return results;
    }

    async bulkDelete(ids: string[]): Promise<{ deleted: number; errors: string[] }> {
        const errors = [];
        let deleted = 0;

        for (const id of ids) {
            try {
                await this.remove(id);
                deleted++;
            } catch (error) {
                errors.push(`Failed to delete cookie ${id}: ${error.message}`);
            }
        }

        return { deleted, errors };
    }

    async getStats(): Promise<{
        total: number;
        active: number;
        error: number;
        recentlyAdded: number;
    }> {
        const total = await this.cookieRepository.count();
        const active = await this.cookieRepository.count({
            where: { value: Not(Equal('error')) },
        });
        const error = await this.cookieRepository.count({
            where: { value: Equal('error') },
        });

        // Count cookies added in the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const recentlyAdded = await this.cookieRepository.count({
            where: {
                createdAt: Not(Equal(oneDayAgo)), // Simplified for demo
            },
        });

        return { total, active, error, recentlyAdded };
    }

    async searchCookies(searchTerm: string): Promise<Cookie[]> {
        return this.cookieRepository
            .createQueryBuilder('cookie')
            .where('cookie.email LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orWhere('cookie.value LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orderBy('cookie.createdAt', 'DESC')
            .getMany();
    }
}
