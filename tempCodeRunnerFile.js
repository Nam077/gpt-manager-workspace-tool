fetch('https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27', {
    headers: {
        authorization:
            'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJwd2RfYXV0aF90aW1lIjoxNzE3NzYwMzk2MDk0LCJzZXNzaW9uX2lkIjoiSjZnbHhmZzBGaDVFNFVjZHNLVlhxc3NObUZEaUY0UWwiLCJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJzYWl3YXJyY3BxNTJAaG90bWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sImh0dHBzOi8vYXBpLm9wZW5haS5jb20vYXV0aCI6eyJwb2lkIjoib3JnLUk5Q1BycjlnNHFKWDVCRHFnbzFjY3ROUyIsInVzZXJfaWQiOiJ1c2VyLTFLT0t4cnJKNGlsM21nRzZWbjhCRFN6cCJ9LCJpc3MiOiJodHRwczovL2F1dGgwLm9wZW5haS5jb20vIiwic3ViIjoiYXV0aDB8NjY0ZDdmNmI0Y2IwZWNmNjRhYjIzM2Q3IiwiYXVkIjpbImh0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEiLCJodHRwczovL29wZW5haS5vcGVuYWkuYXV0aDBhcHAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTcxNzc2MDM5NywiZXhwIjoxNzE4NjI0Mzk3LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG1vZGVsLnJlYWQgbW9kZWwucmVxdWVzdCBvcmdhbml6YXRpb24ucmVhZCBvcmdhbml6YXRpb24ud3JpdGUgb2ZmbGluZV9hY2Nlc3MiLCJhenAiOiJUZEpJY2JlMTZXb1RIdE45NW55eXdoNUU0eU9vNkl0RyJ9.asv6Rwj0zW1n_o2Z1fWqz15lCPjcCBlQTjaZBGhUq55zDEYtafVYFTMBX7d5tFoTK52XZKBD-eRQh4sd1lmVY1wAfYauQ_HQCexgyQzi3R7xkdL0k1eTRIc8Jh4sHztQR2aztw7glokicnV0Oz0iOEjT6NGPUUYPgLVrJqBXQ-XFv_0xt9j10TWG-MYotGK-r1q8kI5fNWZVUoVay5rgbi9C9FN2xLPV9LaF49UVHFMkY6vBpz6aH96pMV13A_ggAyk9CntsM5RdURfmNAsBS-EOZABbqKB6lZoNKkFltL8wvp4FOee3LRNleRPK_A5ItDCSW2Gl3GI6458YlSBsMg',
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
    },
    body: null,
    method: 'GET',
})
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        console.log(data);
    });
