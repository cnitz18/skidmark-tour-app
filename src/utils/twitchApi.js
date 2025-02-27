const clientId = process.env.REACT_APP_TWITCH_CLIENT_ID;
const clientSecret = process.env.REACT_APP_TWITCH_CLIENT_SECRET;

async function getAccessToken() {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials'
        })
    });
    
    const data = await response.json();
    return data.access_token;
}

export async function getLiveStreams(usernames) {
    try {
        const token = await getAccessToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Client-Id': clientId
        };

        // Get users by login names
        const userQuery = usernames.map(name => `login=${name}`).join('&');
        const usersResponse = await fetch(
            `https://api.twitch.tv/helix/users?${userQuery}`,
            { headers }
        );
        const usersData = await usersResponse.json();

        // Get streams for those users
        const userIds = usersData.data.map(user => user.id);
        const streamQuery = userIds.map(id => `user_id=${id}`).join('&');
        const streamsResponse = await fetch(
            `https://api.twitch.tv/helix/streams?${streamQuery}`,
            { headers }
        );
        const streamsData = await streamsResponse.json();
        
        return streamsData.data;
    } catch (error) {
        console.error('Error fetching streams:', error);
        return [];
    }
}