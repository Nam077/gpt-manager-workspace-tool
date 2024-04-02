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
if (!fs.existsSync(FOLDER_DATA)) {
    fs.mkdirSync(FOLDER_DATA);
}
fs.readdir(FOLDER_DATA, (err, files) => {
    if (err) throw err;
    for (const file of files) {
        fs.unlink(`${FOLDER_DATA}/${file}`, (err) => {
            if (err) throw err;
        });
    }
});

async function runTask() {
    const url = 'http://localhost:3000/task';
    const { data } = await axios.get(url);
    console.log(data);
}
async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
    const config = new DocumentBuilder()
        .setTitle('Cats example')
        .setDescription('The cats API description')
        .setVersion('1.0')
        .addTag('cats')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    await app.listen(3000);
}
(async () => {
    await bootstrap();
    await runTask();
})();
