import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
const FOLDER_DATA = 'data';
import axios from 'axios';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { get } from 'lodash';
import { LoggerService } from './utils/logger.service';
if (!fs.existsSync(FOLDER_DATA)) {
    fs.mkdirSync(FOLDER_DATA);
}
let port = 3000;
import * as os from 'os';
fs.readdir(FOLDER_DATA, (err, files) => {
    if (err) throw err;
    for (const file of files) {
        fs.unlink(`${FOLDER_DATA}/${file}`, (err) => {
            if (err) throw err;
        });
    }
});

const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    for (const key in interfaces) {
        const iface = interfaces[key];
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
};

async function runTask(port: number = 3000) {
    const logger = new LoggerService();
    try {
        const url = `http://localhost:${port}/task`;
        const { data } = await axios.get(url);
        const message = get(data, 'message') || get(data, 'status') || 'Task completed';
        logger.success(message, 'STARTUP');
    } catch (error) {
        logger.error('Failed to run initial task', 'STARTUP', error);
    }
}
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Enable CORS for API access
    app.enableCors();

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe());

    // Swagger API documentation
    const configSwagger = new DocumentBuilder()
        .setTitle('GPT Manager Workspace API')
        .setDescription('API for managing GPT workspaces, members, and tasks')
        .setVersion('1.0')
        .addTag('workspace')
        .addTag('members')
        .addTag('tasks')
        .addTag('cookies')
        .build();
    const document = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('api', app, document);

    port = configService.get('PORT') || 3000;
    const logger = new LoggerService();

    await app.listen(port).then(() => {
        logger.serverStart(port, getLocalIp());
    });
}
(async () => {
    await bootstrap();
    await runTask(port);
})();
