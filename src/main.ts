import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as expressHandlebars from 'express-handlebars';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
const FOLDER_DATA = 'data';
import axios from 'axios';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
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
    const url = `http://localhost:${port}/task`;
    const { data } = await axios.get(url);
    console.log(data.data);
}
async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService = app.get(ConfigService);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());
    // Thiết lập engine sử dụng expressHandlebars
    app.engine(
        'hbs',
        expressHandlebars.engine({
            extname: 'hbs',
            defaultLayout: 'main',
            layoutsDir: join(__dirname, 'views', 'layouts'),
            partialsDir: join(__dirname, 'views', 'partials'),
        }),
    );

    app.setViewEngine('hbs');
    app.setBaseViewsDir(join(__dirname, 'views'));
    app.useStaticAssets(join(__dirname, 'public'));
    const configSwagger = new DocumentBuilder()
        .setTitle('Cats example')
        .setDescription('The cats API description')
        .setVersion('1.0')
        .addTag('cats')
        .build();
    const document = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('api', app, document);
    port = configService.get('PORT');
    await app.listen(configService.get('PORT')).then(() => {
        console.log(
            `Server is running on port ${configService.get('PORT')} at http://${getLocalIp()}:${configService.get('PORT')}`,
        );
    });
}
(async () => {
    await bootstrap();
    await runTask(port);
})();
