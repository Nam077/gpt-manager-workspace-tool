import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
@Injectable()
export class AppService {
    getHello(): string {
        return 'Hello World!';
    }

    loadJson() {
        const data = fs.readFileSync('data.json', 'utf8');
        return JSON.parse(data);
    }
}
