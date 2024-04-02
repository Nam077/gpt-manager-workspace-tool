import { User } from './google-sheet.servive';
import axios from 'axios';
import * as fs from 'fs';
import { Cookie } from '../cookie/entities/cookie.entity';
import { Injectable } from '@nestjs/common';
import { CookieService } from '../cookie/cookie.service';
import { Member } from '../member/entities/member.entity';

const cookieFile = 'cookie.txt';

if (!fs.existsSync(cookieFile)) {
    fs.writeFileSync(cookieFile, '');
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

type MODE_USING = 'cookie' | 'token';

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

const logFile = 'log.txt';
if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
}
const writeFileLog = (message: string) => {
    const time = new Date().toLocaleString();
    fs.appendFileSync(logFile, `[ ${time} ]: ${message}\n`);
};
const writeFileLogCookie = (message: string) => {
    const time = new Date().toLocaleString();
    fs.appendFileSync(cookieFile, `[ ${time} ]: ${message}\n`);
};

export interface UserData {
    user: {
        id: string;
        name: string;
        email: string;
        image: string;
        picture: string;
        idp: string;
        iat: number;
        mfa: boolean;
        groups: string[];
        intercom_hash: string;
        account_id?: string;
    };
    expires: string;
    accessToken: string;
    authProvider: string;
    idGroup?: string;
}

export interface UserWorkSpace {
    id: string;
    email_address: string;
    role: string;
    name: string;
    created_time: string;
    email?: string;
}

function findTeamAccount(accounts: Accounts): string | null {
    for (const account_id of accounts.account_ordering) {
        const accountInfo = accounts.accounts[account_id].account;
        if (accountInfo.plan_type === 'team') {
            return accountInfo.account_id;
        }
    }
    return null;
}

function getHeader(data: Cookie | UserData, mode: MODE_USING): Record<string, string> {
    const headers: Record<string, string> = {
        accept: '*/*',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
        'if-none-match': 'W/"9gu6jkqjnf1du"',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "YaBrowser";v="24.1", "Yowser";v="2.5"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36',
        Referer: 'https://chat.openai.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
    if (mode === 'cookie') {
        headers.Cookie = (data as Cookie).value; // data as Cookie
    }
    if (mode === 'token') {
        headers.Authorization = `Bearer ${(data as UserData).accessToken}`;
    }

    return headers;
}

@Injectable()
export class GPTAPI {
    private cookie: Cookie;
    private MAIN_URL = 'https://chat.openai.com';
    private userData: UserData;
    constructor(
        cookie: Cookie,
        private readonly cookieService: CookieService,
    ) {
        this.cookie = cookie;
    }

    async retryOperation(operation: () => Promise<any>, retryLimit = 5, delayTime = 1000) {
        for (let attempt = 1; attempt <= retryLimit; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === retryLimit) {
                    throw error; // Nếu hết số lần thử, throw lỗi
                }
                await new Promise((resolve) => setTimeout(resolve, delayTime));
                delayTime *= 1; // Tăng độ trễ cho lần thử tiếp theo
            }
        }
    }

    async getSession() {
        return await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/api/auth/session`;
                const { data } = await axios.get(url, {
                    headers: getHeader(this.cookie, 'cookie'),
                });
                this.userData = data;
                fs.writeFileSync(`./data/${this.cookie.email}.json`, JSON.stringify(data));
                return data;
            },
            5,
            1000,
        ).catch((error) => {
            // console.log(error.message);
            // writeFileLog(`[${this.cookie.email}] Error in getSession: ${error}`);
            throw new error();
        });
    }

    async checkAccessToken() {
        return await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/me`;
                const { data } = await axios.get(url, {
                    headers: getHeader(this.userData, 'token'),
                });
                this.userData = {
                    user: data,
                    expires: null,
                    accessToken: null,
                    authProvider: null,
                };
                return true;
            },
            1,
            0,
        ).catch(async (error: any) => {
            return false;
        });
    }

    async getGroupIdTeam() {
        if (!(await this.checkAccessToken()) || !this.userData.accessToken) {
            try {
                await this.getSession();
            } catch (error) {
                console.log(error);
            }
        }
        await this.retryOperation(async () => {
            const url = `${this.MAIN_URL}/backend-api/accounts/check/v4-2023-04-27`;
            const { data } = await axios.get(url, {
                headers: getHeader(this.userData, 'token'),
            });

            this.userData.idGroup = findTeamAccount(data);
            fs.writeFileSync(`./data/${this.cookie.email}.json`, JSON.stringify(this.userData));
            return this.userData.idGroup;
        }).catch(async (error) => {
            writeFileLogCookie(`[${this.cookie.email}] DIE`);
            await this.cookieService.updateValueToError(this.cookie.email);
        });
    }

    async getUserMainWorkSpace() {
        return await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/users`;
                const { data } = await axios.get(url, {
                    headers: getHeader(this.userData, 'token'),
                });
                return data.items as UserWorkSpace[];
            },
            5,
            1000,
        ).catch((error) => {
            // writeFileLog(`[${this.cookie.email}] Error in getUserMainWorkSpace: ${error}`);
            return undefined;
        });
    }

    async getPendingUserWorkSpace(): Promise<UserWorkSpace[] | undefined> {
        try {
            // Sử dụng hàm retryOperation để thực hiện yêu cầu
            return await this.retryOperation(
                async () => {
                    const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/invites`;
                    const { data } = await axios.get(url, {
                        headers: getHeader(this.userData, 'token'), // Đảm bảo rằng hàm getHeader được định nghĩa và trả về headers phù hợp
                    });
                    return data.items;
                },
                5,
                1000,
            ); // Giả sử retry 5 lần với khoảng thời gian chờ 1000ms
        } catch (error) {
            // Ghi log lỗi sử dụng hàm writeFileLog
            // writeFileLog(`[${this.cookie.email}] Error in getPendingUserWorkSpace: ${error}`);
            return undefined;
        }
    }

    async deleteUserMainWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/users/${userWorkSpace.id}`;
                const { data } = await axios.delete(url, {
                    headers: getHeader(this.userData, 'token'),
                });
                const message = `[${this.userData.user.email}] [DELETE MAIN WORKSPACE] [${userWorkSpace.email}] ${JSON.stringify(data)}`;
                writeFileLog(message);
                console.log(message);
            },
            1,
            1000,
        ).catch((error) => {
            // writeFileLog(`[${this.userData.user.email}] [ERROR DELETE MAIN WORKSPACE] Error in deleteUserMainWorkSpace: ${error}`);
            throw error; // Có thể throw lỗi hoặc handle nó tùy theo yêu cầu của ứng dụng
        });
    }

    getEmailInvited(data: any): string[] {
        return data.account_invites.map((invite) => invite.email_address);
    }

    async deleteUserPendingWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/invites`;
                const res = await axios.delete(url, {
                    headers: getHeader(this.userData, 'token'),
                    data: {
                        email_address: userWorkSpace.email_address,
                    },
                });
                const message = `[${this.userData.user.email}] [DELETE PENDING WORKSPACE] ${userWorkSpace.email_address} ${JSON.stringify(res.data)}`;
                console.log(message);
                writeFileLog(message);
            },
            1,
            1000,
        ).catch((error) => {
            // writeFileLog(`[${this.userData.user.email}] [ERROR DELETE PENDING WORKSPACE] Error in deleteUserPendingWorkSpace: ${error}`);
            throw error;
        });
    }

    async deleteUserMainWorkSpaceMulti(userWorkSpaces: UserWorkSpace[]): Promise<void> {
        const tasks = userWorkSpaces.map((userWorkSpace) => {
            return this.deleteUserMainWorkSpace(userWorkSpace);
        });
        const chunks = chunk(tasks, 10);
        for (const chunk of chunks) {
            await Promise.all(chunk);
        }
        return;
    }

    async deleteUserPendingWorkSpaceMulti(userWorkSpaces: UserWorkSpace[]): Promise<void> {
        const tasks = userWorkSpaces.map((userWorkSpace) => {
            return this.deleteUserPendingWorkSpace(userWorkSpace);
        });
        const chunks = chunk(tasks, 10);
        for (const chunk of chunks) {
            await Promise.all(chunk);
        }
        return;
    }

    getDefaultValue(): UserData {
        return {
            user: {
                id: '',
                name: '',
                email: this.cookie.email,
                image: '',
                picture: '',
                idp: '',
                iat: Date.now(),
                mfa: false,
                groups: [],
                intercom_hash: '',
                // account_id là tùy chọn, có thể không cần thiết phải cung cấp trong giá trị mặc định
            },
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Giả sử token hết hạn sau 1 ngày
            accessToken: '',
            authProvider: '',
            idGroup: '',
        };
    }

    async readJsonData(email: string): Promise<void> {
        try {
            if (fs.existsSync(`./data/${email}.json`)) {
                this.userData = JSON.parse(fs.readFileSync(`./data/${email}.json`, 'utf8'));
            } else {
                this.userData = this.getDefaultValue();
            }
        } catch (error) {
            console.log(error);
            this.userData = this.getDefaultValue();
        }
    }

    async processMainUser(usersSheet: Record<string, Member[]>): Promise<{
        redundantMainUsers: UserWorkSpace[];
        redundantPendingUsers: UserWorkSpace[];
    }> {
        const members: Member[] = usersSheet[this.userData.user.email] || [];
        let redundantMainUsers: UserWorkSpace[] = await this.getUserMainWorkSpace();
        if (redundantMainUsers) {
            redundantMainUsers = removeUserAdminMain(
                findDifferenceMainUser(members, redundantMainUsers),
                this.userData.user.email,
            );
        }
        let redundantPendingUsers: UserWorkSpace[] = await this.getPendingUserWorkSpace();
        if (redundantPendingUsers) {
            redundantPendingUsers = removeUserAdminPending(
                findDifferencePendingUser(members, redundantPendingUsers),
                this.userData.user.email,
            );
        }
        return {
            redundantMainUsers,
            redundantPendingUsers,
        };
    }

    async processMain(usersSheet: Record<string, Member[]>) {
        await this.readJsonData(this.cookie.email);
        try {
            await this.checkIdGroup();
            if (!this.userData.idGroup) {
                return;
            }
            console.log(`[PROCESS START] ${this.userData.user.email}`);
            const { redundantMainUsers, redundantPendingUsers } = await this.processMainUser(usersSheet);
            if (redundantMainUsers.length > 0) {
                await this.deleteUserMainWorkSpaceMulti(redundantMainUsers);
            }
            if (redundantPendingUsers.length > 0) {
                await this.deleteUserPendingWorkSpaceMulti(redundantPendingUsers);
            }
        } catch (error) {
            return;
        }
    }

    async checkIdGroup() {
        if (!this.userData.idGroup) {
            await this.getGroupIdTeam();
        }
    }
    async inviteUserToWorkSpace(emails: string[]): Promise<void> {
        return await this.retryOperation(
            async () => {
                const body = {
                    email_addresses: emails,
                    resend_emails: true,
                    role: 'standard-user',
                };
                const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/invites`;
                const res = await axios.post(url, body, {
                    headers: getHeader(this.userData, 'token'),
                });
                const message = `[${this.userData.user.email}] [INVITE MEMBER TO WORKSPACE] ${this.getEmailInvited(res.data).join(', ')}`;
                writeFileLog(message);
                return this.getEmailInvited(res.data);
            },
            1,
            1000,
        ).catch((error) => {
            // writeFileLog(`[${this.userData.user.email}] [INVITE MEMBER TO WORKSPACE] Error in inviteUserToWorkSpace: ${error}`);
        });
    }
    async processInvite(usersSheet: Record<string, Member[]>) {
        await this.readJsonData(this.cookie.email);
        try {
            await this.checkIdGroup();
            if (!this.userData.idGroup) {
                return;
            }
            console.log(`[PROCESS START] ${this.userData.user.email}`);
            const mainUsers = await this.getUserMainWorkSpace();
            const pendingUsers = await this.getPendingUserWorkSpace();
            const lostUsers = findLostUsers(usersSheet[this.userData.user.email], mainUsers, pendingUsers);
            if (lostUsers.length > 0) {
                const emails = convertUserToListEmail(lostUsers);
                return await this.inviteUserToWorkSpace(emails);
            }
        } catch (error) {
            return;
        }
    }
}
