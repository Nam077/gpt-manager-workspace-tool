import { Cookie } from '../cookie/entities/cookie.entity';
import * as fs from 'fs';
import { Member } from '../member/entities/member.entity';
import { UserWorkSpace } from './gpt.axios.service';
import { CookieService } from '../cookie/cookie.service';
import { get } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { LogService } from '../log/log.service';
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

function extractSessionData(htmlContent: string): any | null {
    // First try to extract from __NEXT_DATA__ script tag
    const regex = /<script id="__NEXT_DATA__" type="application\/json" crossorigin="anonymous">(.*?)<\/script>/;
    const match = htmlContent.match(regex);

    if (match && match[1]) {
        try {
            const jsonData = JSON.parse(match[1]);
            const sessionData = jsonData.props.pageProps.session;
            return sessionData;
        } catch (error) {
            console.log('Failed to parse __NEXT_DATA__:', error);
        }
    }

    // If __NEXT_DATA__ extraction fails, try to extract from React Router stream
    try {
        const streamData = extractFromReactRouterStream(htmlContent);
        if (streamData) {
            return streamData;
        }
    } catch (error) {
        console.log('Failed to parse React Router stream:', error);
    }

    return null;
}

function extractFromReactRouterStream(htmlContent: string): any | null {
    try {
        // Look for the React Router stream data pattern
        const streamRegex = /window\.__reactRouterContext\.streamController\.enqueue\("([^"]+)"\)/;
        const streamMatch = htmlContent.match(streamRegex);

        if (streamMatch && streamMatch[1]) {
            // Unescape the JSON string
            const unescapedData = streamMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            // Parse the JSON array
            const parsedData = JSON.parse(unescapedData);
            // Extract session data from the parsed stream
            return extractSessionFromStreamData(parsedData);
        }

        // Alternative: look for accessToken directly in the HTML content
        const accessTokenMatch = htmlContent.match(/"accessToken","([^"]+)"/);
        const emailMatch = htmlContent.match(/"email","([^"]+)"/);
        const expiresMatch = htmlContent.match(/"expires","([^"]+)"/);
        const userIdMatch = htmlContent.match(/"id","(user-[^"]+)"/);

        if (accessTokenMatch && emailMatch) {
            console.log(accessTokenMatch[1]);

            return {
                user: {
                    id: userIdMatch ? userIdMatch[1] : '',
                    email: emailMatch[1],
                    name: '',
                    image: '',
                    picture: '',
                    idp: 'auth0',
                    iat: Date.now(),
                    mfa: false,
                    groups: [],
                    intercom_hash: '',
                },
                accessToken: accessTokenMatch[1],
                expires: expiresMatch ? expiresMatch[1] : new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
                authProvider: 'openai',
            };
        }
    } catch (error) {
        console.log('Error extracting from React Router stream:', error);
    }

    return null;
}

function extractSessionFromStreamData(_streamData: any): any | null {
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
    try {
        // Pattern 1: "accessToken","TOKEN_VALUE"
        const accessTokenMatch1 = htmlContent.match(/"accessToken","([^"]+)"/);
        if (accessTokenMatch1 && accessTokenMatch1[1]) {
            return accessTokenMatch1[1];
        }

        // Pattern 2: "accessToken": "TOKEN_VALUE"
        const accessTokenMatch2 = htmlContent.match(/"accessToken":\s*"([^"]+)"/);
        if (accessTokenMatch2 && accessTokenMatch2[1]) {
            return accessTokenMatch2[1];
        }

        // Pattern 3: accessToken","TOKEN_VALUE" (without quotes around accessToken)
        const accessTokenMatch3 = htmlContent.match(/accessToken","([^"]+)"/);
        if (accessTokenMatch3 && accessTokenMatch3[1]) {
            return accessTokenMatch3[1];
        }

        // Pattern 4: More specific pattern for escaped quotes in JSON stream
        const accessTokenMatch4 = htmlContent.match(/accessToken\\",\\"([^\\]+)\\"/);
        if (accessTokenMatch4 && accessTokenMatch4[1]) {
            return accessTokenMatch4[1];
        }

        // First try the __NEXT_DATA__ approach
        const sessionData = extractSessionData(htmlContent);
        if (sessionData && sessionData.accessToken) {
            return sessionData.accessToken;
        }

        // Alternative pattern for accessToken
        const altTokenMatch = htmlContent.match(/"accessToken":\s*"([^"]+)"/);
        if (altTokenMatch && altTokenMatch[1]) {
            return altTokenMatch[1];
        }
    } catch (error) {
        console.log('Error extracting access token:', error);
    }

    return null;
}

// Test function to verify token extraction
export function testTokenExtraction() {
    const sampleData =
        '"planType","team","structure","workspace","organizationId","org-sGNoH1XUtrf0EsbMxGCStmCx","accessToken","eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5MzQ0ZTY1LWJiYzktNDRkMS1hOWQwLWY5NTdiMDc5YmQwZSIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSJdLCJjbGllbnRfaWQiOiJhcHBfWDh6WTZ2VzJwUTl0UjNkRTduSzFqTDVnSCIsImV4cCI6MTc1MDAwNTk1NiwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7InVzZXJfaWQiOiJ1c2VyLUEyQ2QxQkZYWWcxbXJUdW5IOGRCZmFVcSJ9LCJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJteWphY2tpZS5hd2Vzb21lMDNAb3V0bG9vay5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sImlhdCI6MTc0OTE0MTk1NSwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9wZW5haS5jb20iLCJqdGkiOiJiMTY2OWUyOS1iMGMzLTQ4MWItYjNjMS1lMjdmMjgzMTQzOGQiLCJuYmYiOjE3NDkxNDE5NTUsInB3ZF9hdXRoX3RpbWUiOjE3NDkxNDE5NTQ1MDYsInNjcCI6WyJvcGVuaWQiLCJlbWFpbCIsInByb2ZpbGUiLCJvZmZsaW5lX2FjY2VzcyIsIm1vZGVsLnJlcXVlc3QiLCJtb2RlbC5yZWFkIiwib3JnYW5pemF0aW9uLnJlYWQiLCJvcmdhbml6YXRpb24ud3JpdGUiXSwic2Vzc2lvbl9pZCI6ImF1dGhzZXNzX09UTGk4UFBpUUpZVU5pc2lIMFBsWmE2aSIsInN1YiI6ImF1dGgwfDY4NDFiMDU0MjRhOWM2NDA5M2U5OGFkMSJ9.5Fag_UI_ibyZ4nsVUScqTRrCZjQT73CZr1-nCFb4vufoau23LEwL1s0uP6Yn0aclebjm0TLkCgvHlOFhqsX9A6d-mBtT2HpEdgZxSJIcQKFryGTWdxKNJBcdt0McX2SSO984AL3hqwxeunMyGXAWCzV35wAyCAdrcEFDfKeO5N90kmj5zKobp9GelHnz0DemakZWHYIGf53CLAemphiQqb1sdOMH4CSUuVjGHI2-6FmvxB3xip77Y2-vRGDvYVO-quQWPc5quOFJWPzZofa4WxaQfAAhJrg5ilXhqZT6f-3C13F7ykt5fqqW8wTOqGd7lCHmcVaXT7uj-y7BqwNPHaiSDjA4iZPDeP_2hOWvX2jagcdeeQBLtIn4mfZi7umZO37gi019ZhMIR1tTGHU-xVQ2ob81cwgz1c8DJmKnalMqff7G1mcL-sgMbBdyVgtNYjCsBXaltt3SBJhBd_ikiIltDdrmucrNlZaBAbqdha0rveTbRr7XeqpU3j1ljB5MuTgVDxzr6_SOFU5GH4mu7Hm6BbqcbThGMcthS3iEn6kCkYljSIKmRER2njKHv7dA9GuJyFSRxs0jZs1J9Y4E-RLa2x50hS3b8f8BGWyxvjPgWEi-m5KEQOVClOywcj8W0a3Op0djsRCXN_rlwg4bajGcEJJVWAK6uOAI1zxNODg","authProvider","openai"';

    console.log('=== TESTING TOKEN EXTRACTION ===');

    // Test with direct regex
    const accessTokenMatch = sampleData.match(/"accessToken","([^"]+)"/);
    if (accessTokenMatch && accessTokenMatch[1]) {
        console.log('✅ Direct regex extraction successful!');
        console.log('Token length:', accessTokenMatch[1].length);
        console.log('Token starts with:', accessTokenMatch[1].substring(0, 50) + '...');
    } else {
        console.log('❌ Direct regex extraction failed');
    }

    // Test with the extraction function
    const extractedToken = extractAccessToken(sampleData);
    if (extractedToken) {
        console.log('✅ Function extraction successful!');
        console.log('Extracted token length:', extractedToken.length);
        console.log('Extracted token starts with:', extractedToken.substring(0, 50) + '...');
    } else {
        console.log('❌ Function extraction failed');
    }

    console.log('=== END TEST ===');
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
                console.warn(`[${this.cookie.email}] Invalid cookie value detected, skipping cookie header`);
                // Mark cookie as error if it contains invalid characters
                this.cookieService.updateValueToError(this.cookie.email);
            }
        } catch (error) {
            console.error(`[${this.cookie.email}] Error setting cookie header:`, error);
            // Mark cookie as error
            this.cookieService.updateValueToError(this.cookie.email);
        }
    }

    // Validate if cookie value contains only valid ASCII characters
    private isValidCookieValue(value: string): boolean {
        if (!value || typeof value !== 'string') {
            return false;
        }

        // Check if all characters are ASCII (0-127) and valid for HTTP headers
        for (let i = 0; i < value.length; i++) {
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
        if (cookie && cookie.value) {
            this.setCookieHeader(cookie.value);
        } else {
            console.warn(`[${cookie?.email || 'unknown'}] Empty or invalid cookie value`);
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
                        user: sessionData.user,
                        expires: sessionData.expires,
                        accessToken: sessionData.accessToken,
                        authProvider: sessionData.authProvider,
                    };
                    this.setAccessToken(sessionData.accessToken);
                    this.saveUserData(this.userData.user.email);
                } else {
                    // Try to extract just the access token as fallback
                    const accessToken = extractAccessToken(htmlContent);
                    if (accessToken) {
                        console.log(
                            `TOKEN EXTRACTION | Email: ${this.cookie.email} | Method: FALLBACK | Status: SUCCESS`,
                        );
                        const defaultUserData = this.getDefaultValue();
                        defaultUserData.accessToken = accessToken;
                        this.userData = defaultUserData;
                        this.setAccessToken(accessToken);
                        this.saveUserData(this.userData.user.email);
                    } else {
                        await this.cookieService.updateValueToError(this.cookie.email);
                        const message = `SESSION EXPIRED | Email: ${this.cookie.email} | Status: FAILED | Action: MARKED_AS_ERROR`;
                        console.log(message);
                        this.sendLogToAdmin(message);
                        await this.logService.error(message);
                        removeFile(`${FOLDER_DATA}/${this.cookie.email}.json`);
                    }
                }
            }
        } catch (error) {
            await this.cookieService.updateValueToError(this.cookie.email);
            const message = `TOKEN FAILED | Email: ${this.cookie.email} | Error: ${error.message || error} | Action: MARKED_AS_ERROR`;
            console.log(message);
            removeFile(`${FOLDER_DATA}/${this.cookie.email}.json`);
            this.sendLogToAdmin(message);
            await this.logService.error(message);
        }
    }

    // Fix missing return type and implementation
    async getUserMainWorkSpace(): Promise<UserWorkSpace[] | undefined> {
        try {
            const apiHeaders = this.getApiHeaders();

            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${this.userData?.idGroup}/users?limit=100&offset=0`,
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
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/invites?limit=100&offset=0`,
                {
                    method: 'GET',
                    headers: apiHeaders,
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

    // Helper method to get headers for API requests
    private getApiHeaders(): HeadersInit {
        const cookieValue = this.cookie?.value || '';
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
        if (this.userData?.idGroup) {
            headers['chatgpt-account-id'] = this.userData.idGroup;
        }

        return headers;
    }

    async deleteUserPendingWorkSpace(userWorkSpace: UserWorkSpace): Promise<void> {
        try {
            const body = {
                email_address: userWorkSpace.email_address,
            };

            const apiHeaders = this.getApiHeaders();

            const response = await this.fetchWithRetry(
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/invites`,
                {
                    method: 'DELETE',
                    headers: apiHeaders,
                    body: JSON.stringify(body),
                },
                5,
            );

            if (response && response.ok) {
                const data = await response.json();
                const message = `DELETE PENDING WORKSPACE | Admin: ${this.userData.user.email} | Removed: ${userWorkSpace.email_address} | Status: ${data.success ? 'SUCCESS' : 'FAILED'}`;
                console.log(message);
                this.sendLogToAdmin(message);
                await this.logService.info(message); // Changed from error to info for consistency
            }
        } catch (error) {
            console.log(error);
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
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/users/${userWorkSpace.id}`,
                {
                    method: 'DELETE',
                    headers: apiHeaders,
                },
                5,
            );
            if (response && response.ok) {
                const data = await response.json();
                const message = `DELETE MAIN WORKSPACE | Admin: ${this.userData.user.email} | Removed: ${userWorkSpace.email} | User ID: ${userWorkSpace.id} | Status: SUCCESS`;
                console.log(message);
                this.sendLogToAdmin(message);
                await this.logService.info(message); // Changed from error to info for consistency
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
                `${this.baseUrl}backend-api/accounts/${this.userData.idGroup}/invites`,
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
                const message = `INVITE MEMBERS | Admin: ${this.userData.user.email} | Invited: [${invitedEmails.join(', ')}] | Count: ${invitedEmails.length} | Status: SUCCESS`;
                console.log(message);
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

            console.log(`PROCESS START | Admin: ${this.userData.user.email} | Type: MAIN_SCAN`);
            const { redundantMainUsers, redundantPendingUsers } = await this.processMainUser(usersSheet);
            if (redundantMainUsers.length > 0) {
                await this.deleteUserMainWorkSpaceMulti(redundantMainUsers);
            }
            if (redundantPendingUsers.length > 0) {
                await this.deleteUserPendingWorkSpaceMulti(redundantPendingUsers);
            }
            console.log(
                `PROCESS COMPLETE | Admin: ${this.userData.user.email} | Removed Main: ${redundantMainUsers.length} | Removed Pending: ${redundantPendingUsers.length}`,
            );
        } catch (error) {
            const message = `PROCESS FAILED | Admin: ${this.cookie.email} | Error: ${error.message || error}`;
            console.log(message);
            await this.logService.error(message);
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

            console.log(`PROCESS START | Admin: ${this.userData.user.email} | Type: INVITE_SCAN`);
            const mainUsers = await this.getUserMainWorkSpace();
            const pendingUsers = await this.getPendingUserWorkSpace();
            const lostUsers = findLostUsers(usersSheet[this.userData.user.email], mainUsers, pendingUsers);
            if (lostUsers.length > 0) {
                const emails = convertUserToListEmail(lostUsers);
                console.log(
                    `FOUND MISSING USERS | Admin: ${this.userData.user.email} | Count: ${lostUsers.length} | Emails: [${emails.join(', ')}]`,
                );
                return await this.inviteUserToWorkSpace(emails);
            } else {
                console.log(`NO MISSING USERS | Admin: ${this.userData.user.email} | All members are up to date`);
            }
        } catch (error) {
            const message = `INVITE PROCESS FAILED | Admin: ${this.cookie.email} | Error: ${error.message || error}`;
            console.log(message);
            await this.logService.error(message);
            return;
        }
    }
    sendLogToAdmin(message: string): void {
        try {
            // Log message handling logic would go here
            console.log('Admin log:', message);
        } catch (error) {
            // Handle error silently
        }
    }
}
