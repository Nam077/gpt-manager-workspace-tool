import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleSheet } from './google-sheet.servive';

@Injectable()
export class GoogleSheetInitializer implements OnModuleInit {
    constructor(private readonly googleSheet: GoogleSheet) {}

    async onModuleInit() {
        await this.googleSheet.init();
    }
}
