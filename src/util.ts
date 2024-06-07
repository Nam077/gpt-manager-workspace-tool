import * as fs from 'fs';
import { Transform } from 'class-transformer';
import * as moment from 'moment-timezone';

export function parseTimeToSeconds(timeString: string): number {
    const regex = /(\d+[Dd])?(\d+[Hh])?(\d+[Mm])?(\d+[Ss])?/;
    const matches = timeString.match(regex);
    if (!matches) {
        throw new Error('Invalid time format');
    }
    const days = parseInt(matches[1]?.replace(/[Dd]/g, '') || '0', 10);
    const hours = parseInt(matches[2]?.replace(/[Hh]/g, '') || '0', 10);
    const minutes = parseInt(matches[3]?.replace(/[Mm]/g, '') || '0', 10);
    const seconds = parseInt(matches[4]?.replace(/[Ss]/g, '') || '0', 10);
    const totalSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
    return totalSeconds * 1000;
}

export function readFileTXT(path: string): string[] {
    const fileContent: string = fs.readFileSync(path, 'utf8');
    return fileContent.split('\n').filter((line) => line.trim() !== '');
}

export function toTimeZone(date: Date, timeZone: string): string {
    try {
        return moment(date).tz(timeZone).format('HH:mm:ss YYYY-MM-DD');
    } catch (error) {
        return '';
    }
}

export function TimeZoneTransform(timeZone: string = 'UTC'): PropertyDecorator {
    return Transform(({ value }) => (value ? toTimeZone(value, timeZone) : null), { toClassOnly: true });
}
