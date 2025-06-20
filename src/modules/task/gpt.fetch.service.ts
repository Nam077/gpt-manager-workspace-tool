import { Cookie } from '../cookie/entities/cookie.entity';
import * as fs from 'fs';
import { Member } from '../member/entities/member.entity';
import { UserWorkSpace } from './gpt.axios.service';
import { CookieService } from '../cookie/cookie.service';
import { get, isEmpty, isString, size, chunk as lodashChunk } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../log/log.service';
import { LoggerService } from '../../utils/logger.service';

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
        // Silently handle file removal errors
    }
};

function convertUserToListEmail(members: Member[]): string[] {
    if (!members || !Array.isArray(members)) return [];
    return members.map((member) => get(member, 'email', ''));
}

function findDifferencePendingUser(members: Member[], userWorkSpaces: UserWorkSpace[]) {
    if (!Array.isArray(userWorkSpaces) || !Array.isArray(members)) return [];
    return userWorkSpaces.filter((member) => !members.some((u) => get(u, 'email') === get(member, 'email_address')));
}

function findDifferenceMainUser(members: Member[], userWorkSpaces: UserWorkSpace[]) {
    if (!Array.isArray(userWorkSpaces) || !Array.isArray(members)) return [];
    return userWorkSpaces.filter((member) => !members.some((u) => get(u, 'email') === get(member, 'email')));
}

function removeUserAdminPending(userWorkSpaces: UserWorkSpace[], email: string) {
    if (!Array.isArray(userWorkSpaces)) return [];
    return userWorkSpaces.filter((user) => get(user, 'email_address') !== email);
}

function removeUserAdminMain(userWorkSpaces: UserWorkSpace[], email: string) {
    if (!Array.isArray(userWorkSpaces)) return [];
    return userWorkSpaces.filter((user) => get(user, 'email') !== email);
}

function findLostUsers(members: Member[], userWorkSpaces: UserWorkSpace[], pendingUsers: UserWorkSpace[]) {
    if (!Array.isArray(members)) return [];
    const safeUserWorkSpaces = Array.isArray(userWorkSpaces) ? userWorkSpaces : [];
    const safePendingUsers = Array.isArray(pendingUsers) ? pendingUsers : [];

    return members.filter(
        (member) =>
            !safeUserWorkSpaces.some((u) => get(u, 'email') === get(member, 'email')) &&
            !safePendingUsers.some((u) => get(u, 'email_address') === get(member, 'email')),
    );
}

export const chunk = <T>(array: T[], chunkSize: number): T[][] => {
    if (!Array.isArray(array) || !size(array)) return [];
    return lodashChunk(array, chunkSize);
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
    const accountOrdering = get(accounts, 'account_ordering', []);
    const accountsData = get(accounts, 'accounts', {});

    for (const account_id of accountOrdering) {
        const accountInfo = get(accountsData, `${account_id}.account`);
        if (get(accountInfo, 'plan_type') === 'team') {
            return get(accountInfo, 'account_id') || null;
        }
    }
    return null;
}

function extractSessionData(htmlContent: string): any | null {
    if (!isString(htmlContent) || isEmpty(htmlContent)) return null;

    // First try to extract from __NEXT_DATA__ script tag
    const regex = /<script id="__NEXT_DATA__" type="application\/json" crossorigin="anonymous">(.*?)<\/script>/;
    const match = htmlContent.match(regex);

    if (match && get(match, '1')) {
        try {
            const jsonData = JSON.parse(get(match, '1', ''));
            const sessionData = get(jsonData, 'props.pageProps.session');
            return sessionData;
        } catch (error) {
            // Silent error handling for session data extraction
        }
    }

    // If __NEXT_DATA__ extraction fails, try to extract from React Router stream
    try {
        const streamData = extractFromReactRouterStream(htmlContent);
        if (streamData) {
            return streamData;
        }
    } catch (error) {
        // Silent error handling for React Router stream extraction
    }

    return null;
}

function extractFromReactRouterStream(htmlContent: string): any | null {
    if (!isString(htmlContent)) return null;

    try {
        // Look for the React Router stream data pattern
        const streamRegex = /window\.__reactRouterContext\.streamController\.enqueue\("([^"]+)"\)/;
        const streamMatch = htmlContent.match(streamRegex);

        if (streamMatch && get(streamMatch, '1')) {
            // Unescape the JSON string
            // Parse the JSON array
            // Extract session data from the parsed stream
            return extractSessionFromStreamData();
        }

        // Alternative: look for accessToken directly in the HTML content
        const accessTokenMatch = htmlContent.match(/"accessToken","([^"]+)"/);
        const emailMatch = htmlContent.match(/"email","([^"]+)"/);
        const expiresMatch = htmlContent.match(/"expires","([^"]+)"/);
        const userIdMatch = htmlContent.match(/"id","(user-[^"]+)"/);

        if (accessTokenMatch && emailMatch) {
            return {
                user: {
                    id: get(userIdMatch, '1', ''),
                    email: get(emailMatch, '1', ''),
                    name: '',
                    image: '',
                    picture: '',
                    idp: 'auth0',
                    iat: Date.now(),
                    mfa: false,
                    groups: [],
                    intercom_hash: '',
                },
                accessToken: get(accessTokenMatch, '1', ''),
                expires: get(expiresMatch, '1') || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
                authProvider: 'openai',
            };
        }
    } catch (error) {
        // Silent error handling for React Router stream extraction
    }

    return null;
}

function extractSessionFromStreamData(): any | null {
    try {
        // This function would need to be implemented based on the specific structure
        // of the React Router stream data. For now, return null as the structure
        // is complex and would need more analysis
        return null;
    } catch (error) {
        return null;
    }
}

// Function to extract just the access token from HTML content
function extractAccessToken(htmlContent: string): string | null {
    if (!isString(htmlContent) || isEmpty(htmlContent)) return null;

    try {
        // Pattern 1: "accessToken","TOKEN_VALUE"
        const accessTokenMatch1 = htmlContent.match(/"accessToken","([^"]+)"/);
        if (accessTokenMatch1 && get(accessTokenMatch1, '1')) {
            return get(accessTokenMatch1, '1');
        }

        // Pattern 2: "accessToken": "TOKEN_VALUE"
        const accessTokenMatch2 = htmlContent.match(/"accessToken":\s*"([^"]+)"/);
        if (accessTokenMatch2 && get(accessTokenMatch2, '1')) {
            return get(accessTokenMatch2, '1');
        }

        // Pattern 3: accessToken","TOKEN_VALUE" (without quotes around accessToken)
        const accessTokenMatch3 = htmlContent.match(/accessToken","([^"]+)"/);
        if (accessTokenMatch3 && get(accessTokenMatch3, '1')) {
            return get(accessTokenMatch3, '1');
        }

        // Pattern 4: More specific pattern for escaped quotes in JSON stream
        const accessTokenMatch4 = htmlContent.match(/accessToken\\",\\"([^\\]+)\\"/);
        if (accessTokenMatch4 && get(accessTokenMatch4, '1')) {
            return get(accessTokenMatch4, '1');
        }

        // First try the __NEXT_DATA__ approach
        const sessionData = extractSessionData(htmlContent);
        if (sessionData && get(sessionData, 'accessToken')) {
            return get(sessionData, 'accessToken');
        }

        // Alternative pattern for accessToken
        const altTokenMatch = htmlContent.match(/"accessToken":\s*"([^"]+)"/);
        if (altTokenMatch && get(altTokenMatch, '1')) {
            return get(altTokenMatch, '1');
        }
    } catch (error) {
        // Silent error handling for access token extraction
    }

    return null;
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
    private readonly logger = new LoggerService();
    private readonly baseUrl = 'https://chatgpt.com/';
    private headers: Headers = new Headers({
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        priority: 'u=0, i',
        'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "YaBrowser";v="25.4", "Yowser";v="2.5"',
        'sec-ch-ua-arch': '"arm"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"25.4.1.1056"',
        'sec-ch-ua-full-version-list':
            '"Chromium";v="134.0.6998.1056", "Not:A-Brand";v="24.0.0.0", "YaBrowser";v="25.4.1.1056", "Yowser";v="2.5"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"macOS"',
        'sec-ch-ua-platform-version': '"15.5.0"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        Referer: 'https://chatgpt.com/',
    });
    private cookie: Cookie;
    userData: UserData | null = null;

    // Helper method to safely set cookie header
    private setCookieHeader(cookieValue: string): void {
        try {
            // Check if the cookie value contains non-ASCII characters
            if (cookieValue && this.isValidCookieValue(cookieValue)) {
                this.headers.set('cookie', cookieValue);
            } else {
                this.logger.cookieWarning(
                    get(this.cookie, 'email', 'unknown'),
                    'Invalid cookie value detected, skipping cookie header',
                );
                // Mark cookie as error if it contains invalid characters
                this.cookieService.updateValueToError(get(this.cookie, 'email'));
            }
        } catch (error) {
            this.logger.error(
                `Error setting cookie header for ${get(this.cookie, 'email', 'unknown')}`,
                'COOKIE',
                error,
            );
            // Mark cookie as error
            this.cookieService.updateValueToError(get(this.cookie, 'email'));
        }
    }

    // Validate if cookie value contains only valid ASCII characters
    private isValidCookieValue(value: string): boolean {
        if (!isString(value) || isEmpty(value)) {
            return false;
        }

        // Check if all characters are ASCII (0-127) and valid for HTTP headers
        for (let i = 0; i < size(value); i++) {
            const charCode = value.charCodeAt(i);
            // HTTP headers should only contain ASCII characters (0-127)
            // and avoid control characters except tab (9)
            if (charCode > 127 || (charCode < 32 && charCode !== 9)) {
                return false;
            }
        }
        return true;
    }

    // Enhanced cookie validation and sanitization
    private sanitizeCookieValue(value: string): string {
        if (!value) return '';

        // Remove any non-ASCII characters and control characters
        return value.replace(/[^\x20-\x7E\x09]/g, '').trim();
    }

    setAccessToken(accessToken: string) {
        if (accessToken && typeof accessToken === 'string') {
            this.headers.set('authorization', `Bearer ${accessToken}`);
        }
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
        private readonly configService: ConfigService,
        private readonly logService: LogService,
    ) {
        this.cookie = cookie;

        // Safely set the cookie header with validation
        const cookieValue = get(cookie, 'value');
        if (cookie && cookieValue) {
            this.setCookieHeader(cookieValue);
        } else {
            this.logger.cookieWarning(get(cookie, 'email', 'unknown'), 'Empty or invalid cookie value');
        }
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
                email: get(this.cookie, 'email', ''),
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
        if (!get(this.userData, 'accessToken')) {
            try {
                this.logger.info(`Getting access token for ${get(this.cookie, 'email', 'unknown')}`, 'TOKEN');
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
                    this.saveUserData(get(this.userData, 'user.email', ''));
                }
            }
        } catch (error) {}
    }

    async setAuthorization(accessToken: string) {
        this.headers.set('authorization', `Bearer ${accessToken}`);
    }

    async setCookie(cookie: Cookie) {
        if (cookie && cookie.value) {
            this.setCookieHeader(cookie.value);
        }
    }

    async getUserData(): Promise<void> {
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
                        user: get(sessionData, 'user', {}),
                        expires: get(sessionData, 'expires', ''),
                        accessToken: get(sessionData, 'accessToken', ''),
                        authProvider: get(sessionData, 'authProvider', ''),
                    };
                    this.setAccessToken(get(sessionData, 'accessToken', ''));
                    this.saveUserData(get(this.userData, 'user.email', ''));
                } else {
                    // Try to extract just the access token as fallback
                    const accessToken = extractAccessToken(htmlContent);
                    if (accessToken) {
                        this.logger.tokenExtraction(get(this.cookie, 'email', 'unknown'), 'FALLBACK', 'SUCCESS');
                        const defaultUserData = this.getDefaultValue();
                        defaultUserData.accessToken = accessToken;
                        this.userData = defaultUserData;
                        this.setAccessToken(accessToken);
                        this.saveUserData(get(this.userData, 'user.email', ''));
                    } else {
                        await this.cookieService.updateValueToError(get(this.cookie, 'email'));
                        this.logger.sessionExpired(get(this.cookie, 'email', 'unknown'));
                        const message = `SESSION EXPIRED | Email: ${get(this.cookie, 'email', 'unknown')} | Status: FAILED | Action: MARKED_AS_ERROR`;
                        this.sendLogToAdmin(message);
                        await this.logService.error(message);
                        removeFile(`${FOLDER_DATA}/${get(this.cookie, 'email', 'unknown')}.json`);
                    }
                }
            }
        } catch (error) {
            await this.cookieService.updateValueToError(get(this.cookie, 'email'));
            this.logger.tokenExtraction(get(this.cookie, 'email', 'unknown'), 'FAILED', 'FAILED');
            const message = `TOKEN FAILED | Email: ${get(this.cookie, 'email', 'unknown')} | Error: ${get(error, 'message') || error} | Action: MARKED_AS_ERROR`;
            removeFile(`${FOLDER_DATA}/${get(this.cookie, 'email', 'unknown')}.json`);
            this.sendLogToAdmin(message);
            await this.logService.error(message);
        }
    }

    // Fix missing return type and implementation
    async getUserMainWorkSpace(): Promise<UserWorkSpace[] | undefined> {
        try {
            const apiHeaders = this.getApiHeaders();

            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${get(this.userData, 'idGroup')}/users?limit=100&offset=0`,
                {
                    method: 'GET',
                    headers: apiHeaders,
                },
                5,
            );
            if (response && response.ok) {
                const data = await response.json();
                return get(data, 'items', []) as UserWorkSpace[];
            }
            return undefined;
        } catch (error) {
            return undefined;
        }
    }
    async getPendingUserWorkSpace(): Promise<UserWorkSpace[] | undefined> {
        try {
            const apiHeaders = this.getApiHeaders();

            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${get(this.userData, 'idGroup')}/invites?limit=100&offset=0`,
                {
                    method: 'GET',
                    headers: apiHeaders,
                },
                5,
            );
            if (response && response.ok) {
                const data = await response.json();
                return get(data, 'items', []) as UserWorkSpace[];
            }
        } catch (error) {
            return undefined;
        }
    }
    getEmailInvited(data: any): string[] {
        const accountInvites = get(data, 'account_invites', []);
        return accountInvites.map((invite: any) => get(invite, 'email_address', ''));
    }

    // Helper method to get headers for API requests
    private getApiHeaders(): HeadersInit {
        const cookieValue = get(this.cookie, 'value', '');
        const safeCookieValue = this.isValidCookieValue(cookieValue)
            ? cookieValue
            : this.sanitizeCookieValue(cookieValue);

        const headers: HeadersInit = {
            accept: '*/*',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
            authorization: this.headers.get('authorization') || '',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            pragma: 'no-cache',
            priority: 'u=1, i',
            referer: 'https://chatgpt.com/admin?tab=invites',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "YaBrowser";v="25.4", "Yowser";v="2.5"',
            'sec-ch-ua-arch': '"arm"',
            'sec-ch-ua-bitness': '"64"',
            'sec-ch-ua-full-version': '"25.4.1.1056"',
            'sec-ch-ua-full-version-list':
                '"Chromium";v="134.0.6998.1056", "Not:A-Brand";v="24.0.0.0", "YaBrowser";v="25.4.1.1056", "Yowser";v="2.5"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"macOS"',
            'sec-ch-ua-platform-version': '"15.5.0"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 YaBrowser/25.4.0.0 Safari/537.36',
            origin: 'https://chatgpt.com',
        };

        // Only add cookie header if it's valid
        if (safeCookieValue) {
            headers['cookie'] = safeCookieValue;
        }

        // Add chatgpt-account-id if available
        const idGroup = get(this.userData, 'idGroup');
        if (idGroup) {
            headers['chatgpt-account-id'] = idGroup;
        }

        return headers;
    }

    async deleteUserPendingWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        try {
            const body = {
                email_address: get(userWorkSpace, 'email_address'),
            };

            const apiHeaders = this.getApiHeaders();

            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${get(this.userData, 'idGroup')}/invites`,
                {
                    method: 'DELETE',
                    headers: apiHeaders,
                    body: JSON.stringify(body),
                },
                5,
            );

            if (response && response.ok) {
                const data = await response.json();
                const status = get(data, 'success') ? 'SUCCESS' : 'FAILED';
                this.logger.workspaceAction(
                    'DELETE_PENDING',
                    get(this.userData, 'user.email', 'unknown'),
                    get(userWorkSpace, 'email_address', 'unknown'),
                    status as 'SUCCESS' | 'FAILED',
                );
                const message = `DELETE PENDING WORKSPACE | Admin: ${get(this.userData, 'user.email', 'unknown')} | Removed: ${get(userWorkSpace, 'email_address', 'unknown')} | Status: ${status}`;
                this.sendLogToAdmin(message);
                await this.logService.info(message);
            }
        } catch (error) {
            // Silent error handling for admin log
        }
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
            const apiHeaders = this.getApiHeaders();

            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${get(this.userData, 'idGroup')}/users/${get(userWorkSpace, 'id')}`,
                {
                    method: 'DELETE',
                    headers: apiHeaders,
                },
                5,
            );
            if (response && response.ok) {
                this.logger.workspaceAction(
                    'DELETE_MAIN',
                    get(this.userData, 'user.email', 'unknown'),
                    get(userWorkSpace, 'email', 'unknown'),
                    'SUCCESS',
                    `User ID: ${get(userWorkSpace, 'id', 'unknown')}`,
                );
                const message = `DELETE MAIN WORKSPACE | Admin: ${get(this.userData, 'user.email', 'unknown')} | Removed: ${get(userWorkSpace, 'email', 'unknown')} | User ID: ${get(userWorkSpace, 'id', 'unknown')} | Status: SUCCESS`;
                this.sendLogToAdmin(message);
                await this.logService.info(message);
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
            const apiHeaders = this.getApiHeaders();

            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${get(this.userData, 'idGroup')}/invites`,
                {
                    method: 'POST',
                    headers: apiHeaders,
                    body: JSON.stringify(body),
                },
                5,
            );

            if (response && response.ok) {
                const data = await response.json();
                const invitedEmails = this.getEmailInvited(data);
                this.logger.workspaceAction(
                    'INVITE',
                    get(this.userData, 'user.email', 'unknown'),
                    `[${invitedEmails.join(', ')}]`,
                    'SUCCESS',
                    `Count: ${size(invitedEmails)}`,
                );
                const message = `INVITE MEMBERS | Admin: ${get(this.userData, 'user.email', 'unknown')} | Invited: [${invitedEmails.join(', ')}] | Count: ${size(invitedEmails)} | Status: SUCCESS`;
                this.sendLogToAdmin(message);
                await this.logService.info(message);
                return invitedEmails;
            }
        } catch (error) {}
    }
    async processMainUser(usersSheet: Record<string, Member[]>): Promise<{
        redundantMainUsers: UserWorkSpace[];
        redundantPendingUsers: UserWorkSpace[];
    }> {
        const userEmail = get(this.userData, 'user.email', '');
        const members: Member[] = get(usersSheet, userEmail, []);
        let redundantMainUsers: UserWorkSpace[] = (await this.getUserMainWorkSpace()) || [];

        if (redundantMainUsers && size(redundantMainUsers) > 0) {
            redundantMainUsers = removeUserAdminMain(findDifferenceMainUser(members, redundantMainUsers), userEmail);
        }
        let redundantPendingUsers: UserWorkSpace[] = (await this.getPendingUserWorkSpace()) || [];
        if (redundantPendingUsers && size(redundantPendingUsers) > 0) {
            redundantPendingUsers = removeUserAdminPending(
                findDifferencePendingUser(members, redundantPendingUsers),
                userEmail,
            );
        }

        return {
            redundantMainUsers: redundantMainUsers || [],
            redundantPendingUsers: redundantPendingUsers || [],
        };
    }

    async processMain(usersSheet: Record<string, Member[]>) {
        const cookieEmail = get(this.cookie, 'email', 'unknown');
        await this.readJsonData(cookieEmail);
        try {
            if (!(await this.checkAccessTokenLive())) {
                await this.getUserData();
            }

            await this.checkIdGroup();
            if (!get(this.userData, 'idGroup')) {
                return;
            }

            const userEmail = get(this.userData, 'user.email', 'unknown');
            this.logger.processStart(userEmail, 'MAIN_SCAN');
            const { redundantMainUsers, redundantPendingUsers } = await this.processMainUser(usersSheet);
            if (size(redundantMainUsers) > 0) {
                await this.deleteUserMainWorkSpaceMulti(redundantMainUsers);
            }
            if (size(redundantPendingUsers) > 0) {
                await this.deleteUserPendingWorkSpaceMulti(redundantPendingUsers);
            }
            this.logger.processComplete(userEmail, size(redundantMainUsers), size(redundantPendingUsers));
        } catch (error) {
            const message = `PROCESS FAILED | Admin: ${cookieEmail} | Error: ${get(error, 'message') || error}`;
            this.logger.processFailed(cookieEmail, error);
            await this.logService.error(message);
            return;
        }
    }

    async checkIdGroup() {
        if (!get(this.userData, 'idGroup')) {
            await this.getGroupIdTeam();
        }
    }
    async processInvite(usersSheet: Record<string, Member[]>) {
        const cookieEmail = get(this.cookie, 'email', 'unknown');
        await this.readJsonData(cookieEmail);
        try {
            if (!(await this.checkAccessTokenLive())) {
                await this.getUserData();
            }

            await this.checkIdGroup();
            if (!get(this.userData, 'idGroup')) {
                return;
            }

            const userEmail = get(this.userData, 'user.email', 'unknown');
            this.logger.processStart(userEmail, 'INVITE_SCAN');
            const mainUsers = (await this.getUserMainWorkSpace()) || [];
            const pendingUsers = (await this.getPendingUserWorkSpace()) || [];
            const userMembers = get(usersSheet, userEmail, []);
            const lostUsers = findLostUsers(userMembers, mainUsers, pendingUsers);
            if (size(lostUsers) > 0) {
                const emails = convertUserToListEmail(lostUsers);
                this.logger.info(
                    `Found missing users | Count: ${size(lostUsers)} | Emails: [${emails.join(', ')}]`,
                    'INVITE',
                );
                return await this.inviteUserToWorkSpace(emails);
            } else {
                this.logger.info(`All members are up to date`, 'INVITE');
            }
        } catch (error) {
            const message = `INVITE PROCESS FAILED | Admin: ${cookieEmail} | Error: ${get(error, 'message') || error}`;
            this.logger.processFailed(cookieEmail, error);
            await this.logService.error(message);
            return;
        }
    }
    sendLogToAdmin(message: string): void {
        try {
            message;
            // Log message handling logic would go here
            // Admin log functionality can be implemented here
        } catch (error) {
            // Handle error silently
        }
    }
}
