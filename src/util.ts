import * as fs from 'fs';
import { Transform } from 'class-transformer';
import * as moment from 'moment-timezone';

export function parseTimeToSeconds(timeString: string): number {
    const regex = /(\d+[Dd])?(\d+[Hh])?(\d+[Mm])?(\d+[Ss])?/; // Mẫu regex để phân tích chuỗi
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
    // đọc file txt tách nhau bởi "\n"
    const fileContent: string = fs.readFileSync(path, 'utf8');
    return fileContent.split('\n').filter((line) => line.trim() !== '');
}

// Hàm chuyển đổi ngày giờ sang múi giờ và định dạng mong muốn
export function toTimeZone(date: Date, timeZone: string): string {
    // Bạn có thể thay đổi định dạng ngày giờ bên dưới để phù hợp với nhu cầu của mình.
    // Ví dụ: "YYYY-MM-DD HH:mm:ss" sẽ định dạng ngày giờ theo kiểu năm-tháng-ngày giờ:phút:giây
    try {
        return moment(date).tz(timeZone).format('HH:mm:ss YYYY-MM-DD');
    } catch (error) {
        return '';
    }
}

// Decorator này sử dụng hàm toTimeZone để tự động chuyển đổi các giá trị ngày giờ sang múi giờ chỉ định.
export function TimeZoneTransform(timeZone: string = 'UTC'): PropertyDecorator {
    return Transform(({ value }) => (value ? toTimeZone(value, timeZone) : null), { toClassOnly: true });
}
