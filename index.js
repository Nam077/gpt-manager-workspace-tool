async function fetchAccountInfo(accessToken: string): Promise<void> {
    const url = 'https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27';
    const headers = new Headers({
        'authorization': `Bearer ${accessToken}`,
        'accept': '*/*',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
        'oai-language': 'vi-VN',
        'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "YaBrowser";v="24.4", "Yowser";v="2.5"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"24.4.4.1168"',
        'sec-ch-ua-full-version-list': '"Chromium";v="122.0.6261.156", "Not(A:Brand";v="24.0.0.0", "YaBrowser";v="24.4.4.1168", "Yowser";v="2.5"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': '"Windows"',
        'sec-ch-ua-platform-version': '"15.0.0"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'Referer': 'https://chatgpt.com/',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    });

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}
