import { Cookie } from '../cookie/entities/cookie.entity';
import * as fs from 'fs';
import { Member } from '../member/entities/member.entity';
import { UserWorkSpace } from './gpt.axios.service';
import { CookieService } from '../cookie/cookie.service';
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
const removeFile = (path: string) => {
    try {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }
    } catch (error) {
        console.log(error);
    }
};
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

interface Accounts {
    account_ordering: string[];
    accounts: {
        [key: string]: {
            account: AccountInfo;
        };
    };
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
function extractSessionData(htmlContent: string) {
    const regex = /<script id="__NEXT_DATA__" type="application\/json" crossorigin="anonymous">(.*?)<\/script>/;

    const match = htmlContent.match(regex);

    if (match && match[1]) {
        try {
            const jsonData = JSON.parse(match[1]);

            const sessionData = jsonData.props.pageProps.session;

            return sessionData;
        } catch (error) {
            return null;
        }
    } else {
        return null;
    }
}
const FOLDER_DATA = 'data';
if (!fs.existsSync(FOLDER_DATA)) {
    fs.mkdirSync(FOLDER_DATA);
}

// Interface for user data
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

// Class to handle GPT operations with cookies
export class GPTWithCookie {
    private readonly baseUrl = 'https://chatgpt.com/';
    private headers: Headers = new Headers({
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'sec-ch-ua': '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        Referer: 'https://chat.openai.com',
        'Content-Type': 'application/json',
    });
    private cookie: Cookie;
    userData: UserData | null = null;

    setAccessToken(accessToken: string) {
        this.headers.set('authorization', `Bearer ${accessToken}`);
    }

    async checkAccessTokenLive(): Promise<boolean> {
        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}backend-api/me`, {
                method: 'GET',
                headers: this.headers,
            });
            if (response && response.ok) {
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }

    constructor(
        cookie: Cookie,
        private readonly cookieService: CookieService,
        private bot: Bot<Context>,
        private readonly configService: ConfigService,
    ) {
        this.cookie = cookie;
        this.headers.set('cookie', cookie.value);
    }

    saveUserData(email: string) {
        try {
            fs.writeFileSync(`${FOLDER_DATA}/${email}.json`, JSON.stringify(this.userData, null, 2));
        } catch (error) {}
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
            const file = `${FOLDER_DATA}/${email}.json`;

            if (fs.existsSync(file)) {
                this.userData = JSON.parse(fs.readFileSync(`${FOLDER_DATA}/${email}.json`, 'utf8'));
                this.setAccessToken(this.userData.accessToken);
            } else {
                this.userData = this.getDefaultValue();
            }
        } catch (error) {
            this.userData = this.getDefaultValue();
        }
    }
    fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response | null> => {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            if (retries > 0) {
                return this.fetchWithRetry(url, options, retries - 1);
            } else {
                throw error;
            }
        }
    };

    async getGroupIdTeam() {
        if (!this.userData.accessToken) {
            try {
                console.log(`[GET ACCESS TOKEN] ${this.cookie.email}`);
                await this.getUserData();
            } catch (error) {}
        }
        try {
            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/check/v4-2023-04-27`,
                {
                    method: 'GET',
                    headers: this.headers,
                },
                5,
            );
            if (response && response.ok) {
                const data = await response.json();
                const teamAccountId = findTeamAccount(data);
                if (teamAccountId) {
                    this.userData.idGroup = teamAccountId;
                    this.saveUserData(this.userData.user.email);
                }
            }
        } catch (error) {}
    }

    async setAuthorization(accessToken: string) {
        this.headers.set('authorization', `Bearer ${accessToken}`);
    }

    async setCookie(cookie: Cookie) {
        this.headers.set('cookie', cookie.value);
    }

    async getUserData() {
        this.headers.delete('authorization');
        try {
            const response = await this.fetchWithRetry(
                this.baseUrl,
                {
                    method: 'GET',
                    headers: this.headers,
                },
                5,
            );
            if (response && response.ok) {
                const htmlContent = await response.text();
                const sessionData = extractSessionData(htmlContent);

                if (sessionData) {
                    this.userData = {
                        user: sessionData.user,
                        expires: sessionData.expires,
                        accessToken: sessionData.accessToken,
                        authProvider: sessionData.authProvider,
                    };
                    this.setAccessToken(sessionData.accessToken);
                    this.saveUserData(this.userData.user.email);
                } else {
                    await this.cookieService.updateValueToError(this.cookie.email);
                    const message = `[${this.cookie.email}] [SESSION-DIE]`;
                    console.log(message);
                    this.sendLogToAdmin(message);
                    removeFile(`${FOLDER_DATA}/${this.cookie.email}.json`);
                }
            }
        } catch (error) {
            await this.cookieService.updateValueToError(this.cookie.email);
            const message = `[${this.cookie.email}] [TOKEN-DIE] ${error}`;
            console.log(message);
            removeFile(`${FOLDER_DATA}/${this.cookie.email}.json`);
            this.sendLogToAdmin(message);
        }
    }
    async getUserMainWorkSpace() {
        try {
            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/users?limit=100&offset=0`,
                {
                    method: 'GET',
                    headers: this.headers,
                },
                5,
            );
            if (response && response.ok) {
                const data = await response.json();
                return data.items as UserWorkSpace[];
            }
        } catch (error) {
            return undefined;
        }
    }
    async getPendingUserWorkSpace(): Promise<UserWorkSpace[] | undefined> {
        try {
            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/invites?limit=100&offset=0`,
                {
                    method: 'GET',
                    headers: this.headers,
                },
                5,
            );
            if (response && response.ok) {
                const data = await response.json();
                return data.items as UserWorkSpace[];
            }
        } catch (error) {
            return undefined;
        }
    }
    getEmailInvited(data: any): string[] {
        return data.account_invites.map((invite: any) => invite.email_address);
    }

    async deleteUserPendingWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        try {
            const body = {
                email_address: userWorkSpace.email_address,
            };
            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/invites`,
                {
                    method: 'DELETE',
                    headers: this.headers,
                    body: JSON.stringify(body),
                },
                5,
            );

            if (response && response.ok) {
                const data = await response.json();
                const message = `[${this.userData.user.email}] [DELETE PENDING WORKSPACE] ${userWorkSpace.email_address} ${JSON.stringify(data)}`;
                console.log(message);
                this.sendLogToAdmin(message);
                writeFileLog(message);
            }
        } catch (error) {}
    }

    async deleteUserPendingWorkSpaceMulti(userWorkSpaces: UserWorkSpace[]): Promise<void> {
        const tasks = userWorkSpaces.map((userWorkSpace) => this.deleteUserPendingWorkSpace(userWorkSpace));
        const chunks = chunk(tasks, 10);
        for (const chunk of chunks) {
            await Promise.all(chunk);
        }
        return;
    }

    async deleteUserMainWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        try {
            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/users/${userWorkSpace.id}`,
                {
                    method: 'DELETE',
                    headers: this.headers,
                },
                5,
            );
            if (response && response.ok) {
                const data = await response.json();
                const message = `[${this.userData.user.email}] [DELETE MAIN WORKSPACE] ${userWorkSpace.email_address} ${JSON.stringify(data)}`;
                console.log(message);
                this.sendLogToAdmin(message);
                writeFileLog(message);
            }
        } catch (error) {}
    }

    async deleteUserMainWorkSpaceMulti(userWorkSpaces: UserWorkSpace[]): Promise<void> {
        const tasks = userWorkSpaces.map((userWorkSpace) => this.deleteUserMainWorkSpace(userWorkSpace));
        const chunks = chunk(tasks, 10);
        for (const chunk of chunks) {
            await Promise.all(chunk);
        }
        return;
    }

    async inviteUserToWorkSpace(emails: string[]) {
        const body = {
            email_addresses: emails,
            resend_emails: true,
            role: 'standard-user',
        };

        try {
            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/invites`,
                {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify(body),
                },
                5,
            );

            if (response && response.ok) {
                const data = await response.json();
                const invitedEmails = this.getEmailInvited(data);
                const message = `[${this.userData.user.email}] [INVITE MEMBER TO WORKSPACE] ${invitedEmails.join(', ')} `;
                console.log(message);
                this.sendLogToAdmin(message);
                writeFileLog(message);
                return invitedEmails;
            }
        } catch (error) {}
    }
    async processMainUser(usersSheet: Record<string, Member[]>): Promise<{
        redundantMainUsers: UserWorkSpace[];
        redundantPendingUsers: UserWorkSpace[];
    }> {
        const members: Member[] = usersSheet[this.userData.user.email] || [];
        let redundantMainUsers: UserWorkSpace[] = await this.getUserMainWorkSpace();
        if (redundantMainUsers && redundantMainUsers.length > 0) {
            redundantMainUsers = removeUserAdminMain(
                findDifferenceMainUser(members, redundantMainUsers),
                this.userData.user.email,
            );
        }
        let redundantPendingUsers: UserWorkSpace[] = await this.getPendingUserWorkSpace();
        if (redundantPendingUsers && redundantPendingUsers.length > 0) {
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
            if (!(await this.checkAccessTokenLive())) {
                await this.getUserData();
            }

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
    async processInvite(usersSheet: Record<string, Member[]>) {
        await this.readJsonData(this.cookie.email);
        try {
            if (!(await this.checkAccessTokenLive())) {
                await this.getUserData();
            }

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
    sendLogToAdmin(message: string) {
        try {
            this.bot.api.sendMessage(this.configService.get('ADMIN_ID'), message);
        } catch (error) {
            return;
        }
    }
}
