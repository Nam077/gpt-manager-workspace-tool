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

    async findOne(id: number): Promise<Cookie> {
        const cookie = await this.cookieRepository.findOne({ where: { id } });
        if (!cookie) {
            throw new NotFoundException(`Cookie with ID #${id} not found`);
        }
        return cookie;
    }

    async update(id: number, updateCookieDto: UpdateCookieDto): Promise<Cookie> {
        const { email, ...rest } = updateCookieDto;
        const existingCookie = await this.findOne(id);

        // Kiểm tra xem email được cung cấp có trùng với email khác trong database hay không
        if (email && email !== existingCookie.email) {
            const emailExists = await this.checkExists(email);
            if (emailExists) {
                throw new ConflictException(`Email '${email}' is already associated with another cookie`);
            }
        }

        this.cookieRepository.merge(existingCookie, { ...rest, email });
        return this.cookieRepository.save(existingCookie);
    }

    async remove(id: number): Promise<void> {
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
            console.log(error);
        }
    }
}
