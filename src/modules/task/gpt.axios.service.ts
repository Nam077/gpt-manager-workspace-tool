import * as fs from 'fs';
import { Cookie } from '../cookie/entities/cookie.entity';
import { Injectable } from '@nestjs/common';
import { CookieService } from '../cookie/cookie.service';
import { Member } from '../member/entities/member.entity';

const cookieFile = 'cookie.txt';
if (!fs.existsSync(cookieFile)) {
    fs.writeFileSync(cookieFile, '');
}
async function fetchWithRetry(url: string, options: RequestInit, retryLimit = 5, delayTime = 1000): Promise<Response> {
    for (let attempt = 1; attempt <= retryLimit; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (attempt === retryLimit) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, delayTime));
            delayTime *= 1;
        }
    }
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
    id?: string;
    email?: string;
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

function getHeader(data: Cookie): Headers {
    const headers = new Headers({
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
        Referer: 'https://chat.openai.com',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        authorization: `Bearer ${data.value}`,
    });

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
                    throw error;
                }
                await new Promise((resolve) => setTimeout(resolve, delayTime));
                delayTime *= 1;
            }
        }
    }

    async checkAccessToken() {
        return await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/me`;
                const response = await fetchWithRetry(url, {
                    method: 'GET',
                    headers: getHeader(this.cookie),
                });
                const data = await response.json();
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
        await this.retryOperation(async () => {
            const url = `${this.MAIN_URL}/backend-api/accounts/check/v4-2023-04-27`;
            const response = await fetchWithRetry(url, {
                method: 'GET',
                headers: getHeader(this.cookie),
            });
            const data = await response.json();
            console.log(data);

            this.userData.idGroup = findTeamAccount(data);
            return this.userData.idGroup;
        }).catch(async (error) => {
            console.log(error);
        });
    }

    async getUserMainWorkSpace() {
        return await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/users`;
                const response = await fetchWithRetry(url, {
                    method: 'GET',
                    headers: getHeader(this.cookie),
                });
                const data = await response.json();
                return data.items as UserWorkSpace[];
            },
            5,
            1000,
        ).catch((error) => {
            return undefined;
        });
    }

    async getPendingUserWorkSpace(): Promise<UserWorkSpace[] | undefined> {
        try {
            return await this.retryOperation(
                async () => {
                    const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/invites`;
                    const response = await fetchWithRetry(url, {
                        method: 'GET',
                        headers: getHeader(this.cookie),
                    });
                    const data = await response.json();
                    return data.items;
                },
                5,
                1000,
            );
        } catch (error) {
            return undefined;
        }
    }

    async deleteUserMainWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/users/${userWorkSpace.id}`;
                const response = await fetchWithRetry(url, {
                    method: 'DELETE',
                    headers: getHeader(this.cookie),
                });
                const data = await response.json();
                const message = `[${this.userData.user.email}] [DELETE MAIN WORKSPACE] [${userWorkSpace.email}] ${JSON.stringify(data)}`;
                writeFileLog(message);
                console.log(message);
            },
            1,
            1000,
        ).catch((error) => {
            throw error;
        });
    }

    getEmailInvited(data: any): string[] {
        return data.account_invites.map((invite) => invite.email_address);
    }

    async deleteUserPendingWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        await this.retryOperation(
            async () => {
                const url = `${this.MAIN_URL}/backend-api/accounts/${this.userData.idGroup}/invites`;
                const response = await fetchWithRetry(url, {
                    method: 'DELETE',
                    headers: getHeader(this.cookie),
                    body: JSON.stringify({
                        email_address: userWorkSpace.email_address,
                    }),
                });
                const data = await response.json();
                const message = `[${this.userData.user.email}] [DELETE PENDING WORKSPACE] ${userWorkSpace.email_address} ${JSON.stringify(data)}`;
                console.log(message);
                writeFileLog(message);
            },
            1,
            1000,
        ).catch((error) => {
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
            },
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
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
        if (!this.userData && !this.userData?.idGroup) {
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
                const response = await fetchWithRetry(url, {
                    method: 'POST',
                    headers: getHeader(this.cookie),
                    body: JSON.stringify(body),
                });
                const data = await response.json();
                const message = `[${this.userData.user.email}] [INVITE MEMBER TO WORKSPACE] ${this.getEmailInvited(data).join(', ')}`;
                writeFileLog(message);
                return this.getEmailInvited(data);
            },
            1,
            1000,
        ).catch((error) => {});
    }
    async processInvite(usersSheet: Record<string, Member[]>) {
        try {
            await this.checkIdGroup();
            if (!this.userData.idGroup) {
                return;
            }
            console.log(`[PROCESS START] ${this.userData.email}`);
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
