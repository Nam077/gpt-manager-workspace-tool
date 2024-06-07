import { Cookie } from '../cookie/entities/cookie.entity';
import { Member } from '../member/entities/member.entity';
import { UserWorkSpace } from './gpt.axios.service';
import { Injectable } from '@nestjs/common';
import { CookieService } from '../cookie/cookie.service';
import * as fs from 'fs';
import { Bot, Context } from 'grammy';
import { ConfigService } from '@nestjs/config';
const logFile = 'log.txt';

if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
}
const writeFileLog = (message: string) => {
    const time = new Date().toLocaleString();
    fs.appendFileSync(logFile, `[ ${time} ]: ${message}\n`);
};
interface AccountInfo {
    account_id: string;
    plan_type: string;
}

interface Accounts {
    account_ordering: string[];
    accounts: {
        [key: string]: {
            account: AccountInfo;
        };
    };
}
interface UserData {
    id?: string;
    email?: string;
    idGroup?: string;
}
function convertUserToListEmail(members: Member[]): string[] {
    return members.map((member) => member.email);
}

function findDifferencePendingUser(members: Member[], userWorkSpaces: UserWorkSpace[]) {
    return userWorkSpaces.filter((member) => !members.some((u) => u.email === member.email_address));
}

function findDifferenceMainUser(members: Member[], userWorkSpaces: UserWorkSpace[]) {
    return userWorkSpaces.filter((member) => !members.some((u) => u.email === member.email));
}

function removeUserAdminPending(userWorkSpaces: UserWorkSpace[], email: string) {
    return userWorkSpaces.filter((user) => user.email_address !== email);
}

function removeUserAdminMain(userWorkSpaces: UserWorkSpace[], email: string) {
    return userWorkSpaces.filter((user) => user.email !== email);
}

function findLostUsers(members: Member[], userWorkSpaces: UserWorkSpace[], pendingUsers: UserWorkSpace[]) {
    return members.filter(
        (member) =>
            !userWorkSpaces.some((u) => u.email === member.email) &&
            !pendingUsers.some((u) => u.email_address === member.email),
    );
}

export const chunk = <T>(array: T[], size: number): T[][] => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

@Injectable()
export class GPTAPIFix {
    private _userData: UserData = {};
    private _accessToken: string;
    private _cookie: Cookie;
    constructor(
        cookie: Cookie,
        private readonly cookieService: CookieService,
        private bot: Bot<Context>,
        private readonly configService: ConfigService,
    ) {
        this.accessToken = cookie.value;
        this._cookie = cookie;
    }

    get accessToken(): string {
        return this._accessToken;
    }

    set accessToken(value: string) {
        this._accessToken = value;
        this.headers.set('authorization', `Bearer ${value}`);
    }

    private headers = new Headers({
        authorization: `Bearer ${this.accessToken}`,
        accept: '*/*',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
        'oai-language': 'vi-VN',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "YaBrowser";v="24.4", "Yowser";v="2.5"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"24.4.4.1168"',
        'sec-ch-ua-full-version-list':
            '"Chromium";v="122.0.6261.156", "Not(A:Brand";v="24.0.0.0", "YaBrowser";v="24.4.4.1168", "Yowser";v="2.5"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua-platform-version': '"15.0.0"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        Referer: 'https://chatgpt.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    });

    private findTeamAccount = (accounts: Accounts): string | null => {
        for (const account_id of accounts.account_ordering) {
            const accountInfo = accounts.accounts[account_id].account;
            if (accountInfo.plan_type === 'team') {
                return accountInfo.account_id;
            }
        }
        return null;
    };
    getEmailInvited(data: any): string[] {
        return data.account_invites.map((invite: any) => invite.email_address);
    }

    private fetchWithRetry = async (
        url: string,
        method: string = 'GET',
        body?: any,
        retries: number = 3,
        delay: number = 1000,
    ): Promise<Response> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const options: RequestInit = { headers: this.headers, method };
                if (body) {
                    options.body = JSON.stringify(body);
                    this.headers.set('Content-Type', 'application/json');
                }
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response;
            } catch (error) {
                if (attempt === retries) {
                    throw error;
                }
                console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max retries reached');
    };

    fetchAccountInformation = async (): Promise<string | null> => {
        const url = 'https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27';
        try {
            const response = await this.fetchWithRetry(url, 'GET', undefined, 5, 1000);
            const data: Accounts = await response.json();
            this._userData.idGroup = this.findTeamAccount(data);
        } catch (error) {
            this.cookieService.updateValueToError(this._cookie.email);
            this.accessToken = '';
            const message = `[${this._cookie.email}] [TOKEN-DIE] ${error}`;
            this.sendLogToAdmin(message);
            return null;
        }
    };

    fetchMainUser = async (): Promise<UserWorkSpace[] | undefined> => {
        const url = `https://chatgpt.com/backend-api/accounts/${this._userData.idGroup}/users`;
        try {
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            return data.items;
        } catch (error) {
            return undefined;
        }
    };

    fetchPendingUser = async (): Promise<UserWorkSpace[] | undefined> => {
        const url = `https://chatgpt.com/backend-api/accounts/${this._userData.idGroup}/invites`;
        try {
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            return data.items;
        } catch (error) {
            return undefined;
        }
    };

    deleteMainUser = async (userWorkSpace: UserWorkSpace): Promise<void> => {
        const url = `https://chatgpt.com/backend-api/accounts/${this._userData.idGroup}/users/${userWorkSpace.id}`;
        try {
            const response = await this.fetchWithRetry(url, 'DELETE');
            const data = await response.json();

            const message = `[${this._userData.email}] [DELETE MAIN WORKSPACE] ${userWorkSpace.email} ${JSON.stringify(data)}`;
            console.log(message);
            this.sendLogToAdmin(message);
            writeFileLog(message);
        } catch (error) {}
    };

    deletePendingUser = async (userWorkSpace: UserWorkSpace): Promise<void> => {
        const url = `https://chatgpt.com/backend-api/accounts/${this._userData.idGroup}/invites`;
        const body = {
            email_address: userWorkSpace.email_address,
        };

        try {
            const response = await this.fetchWithRetry(url, 'DELETE', body);
            const data = await response.json();
            const message = `[${this._userData.email}] [DELETE PENDING WORKSPACE] ${userWorkSpace.email_address} ${JSON.stringify(data)}`;
            console.log(message);
            this.sendLogToAdmin(message);
            writeFileLog(message);
        } catch (error) {}
    };

    deleteMainUsers = async (userWorkSpaces: UserWorkSpace[]): Promise<void> => {
        const task = userWorkSpaces.map((user) => this.deleteMainUser(user));
        const taskChunks = chunk(task, 3);
        for (const chunk of taskChunks) {
            await Promise.all(chunk);
        }
    };

    deletePendingUsers = async (userWorkSpaces: UserWorkSpace[]): Promise<void> => {
        const task = userWorkSpaces.map((user) => this.deletePendingUser(user));
        const taskChunks = chunk(task, 3);
        for (const chunk of taskChunks) {
            await Promise.all(chunk);
        }
    };

    async inviteUserToWorkSpace(emails: string[]) {
        const url = `https://chatgpt.com/backend-api/accounts/${this._userData.idGroup}/invites`;
        const body = {
            email_addresses: emails,
            resend_emails: false,
            role: 'standard-user',
        };
        try {
            const response = await this.fetchWithRetry(url, 'POST', body);
            const data = await response.json();
            const message = `[${this._userData.email}] [INVITE MEMBER TO WORKSPACE] ${this.getEmailInvited(data).join(', ')}`;
            console.log(message);
            writeFileLog(message);
            this.sendLogToAdmin(message);
            return this.getEmailInvited(data);
        } catch (error) {}
    }
    getMe = async () => {
        const url = 'https://chatgpt.com/backend-api/me';
        try {
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            Object.assign(this._userData, data);
        } catch (error) {
            this._userData = {};
        }
    };
    async processInvite(usersSheet: Record<string, Member[]>) {
        try {
            await this.getMe();
            await this.fetchAccountInformation();
            if (!this._userData || !this._userData.idGroup) {
                return;
            }
            console.log(`[PROCESS START] ${this._userData.email}`);
            const mainUsers = await this.fetchMainUser();
            const pendingUsers = await this.fetchPendingUser();
            const lostUsers = findLostUsers(usersSheet[this._userData.email], mainUsers, pendingUsers);
            if (lostUsers.length > 0) {
                const emails = convertUserToListEmail(lostUsers);
                return await this.inviteUserToWorkSpace(emails);
            }
        } catch (error) {
            return;
        }
    }
    async processMainUser(usersSheet: Record<string, Member[]>): Promise<{
        redundantMainUsers: UserWorkSpace[];
        redundantPendingUsers: UserWorkSpace[];
    }> {
        const members: Member[] = usersSheet[this._userData.email] || [];
        let redundantMainUsers: UserWorkSpace[] = await this.fetchMainUser();
        if (redundantMainUsers) {
            redundantMainUsers = removeUserAdminMain(
                findDifferenceMainUser(members, redundantMainUsers),
                this._userData.email,
            );
        }
        let redundantPendingUsers: UserWorkSpace[] = await this.fetchPendingUser();
        if (redundantPendingUsers) {
            redundantPendingUsers = removeUserAdminPending(
                findDifferencePendingUser(members, redundantPendingUsers),
                this._userData.email,
            );
        }
        return {
            redundantMainUsers,
            redundantPendingUsers,
        };
    }

    async processMain(usersSheet: Record<string, Member[]>) {
        try {
            await this.fetchAccountInformation();
            if (!this._userData.idGroup) {
                return;
            }
            console.log(`[PROCESS START] ${this._userData.email}`);
            const { redundantMainUsers, redundantPendingUsers } = await this.processMainUser(usersSheet);
            if (redundantMainUsers.length > 0) {
                await this.deleteMainUsers(redundantMainUsers);
            }
            if (redundantPendingUsers.length > 0) {
                await this.deletePendingUsers(redundantPendingUsers);
            }
        } catch (error) {
            return;
        }
    }

    sendLogToAdmin(message: string) {
        try {
            this.bot.api.sendMessage(this.configService.get('ADMIN_ID'), message);
        } catch (error) {
            return;
        }
    }
}
