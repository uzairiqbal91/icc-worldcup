
import axios from 'axios';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

const client = axios.create({
    baseURL: `https://${RAPIDAPI_HOST}`,
    headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
    },
});

export const getLiveMatches = async () => {
    try {
        const { data } = await client.get('/matches/v1/live');
        return data;
    } catch (error) {
        console.error('Error fetching live matches:', error);
        return null;
    }
};

export const getMatchScorecard = async (matchId: string | number) => {
    try {
        const { data } = await client.get(`/mcenter/v1/${matchId}/scard`);
        return data;
    } catch (error) {
        // Fallback for some endpoints if v1 fails or strictly v1 required
        console.error(`Error fetching scorecard for ${matchId}:`, error);
        return null;
    }
};


export const getMatchInfo = async (matchId: string | number) => {
    try {
        const { data } = await client.get(`/mcenter/v1/${matchId}`);
        return data;
    } catch (error) {
        console.error(`Error fetching match info for ${matchId}:`, error);
        return null;
    }
}

export const getUpcomingMatches = async () => {
    try {
        const { data } = await client.get('/matches/v1/upcoming');
        return data;
    } catch (error) {
        console.error('Error fetching upcoming matches:', error);
        return null;
    }
};

export const getInternationalSeries = async () => {
    try {
        const { data } = await client.get('/series/v1/international');
        return data;
    } catch (error) {
        console.error('Error fetching international series:', error);
        return null;
    }
};

// Helper to get image URL
export const getImageUrl = (imageId: number | string) => {
    // Cricbuzz images are often accessible directly via a pattern, or we use the API
    // We use our local proxy to hide keys
    // Assuming the app is hosted at the same domain.
    // For the backend worker (which inserts into DB), we should store the RELATIVE path
    // or the FULL path if we know the domain. 
    // Since the frontend uses the specific payload, standard practice is to store the image ID
    // or store the proxy URL. 
    // Let's store the proxy URL path: `/api/proxy-image?id=${imageId}`
    // The frontend will prepend the domain if needed, or if it's Next.js it works naturally.
    return `/api/proxy-image?id=${imageId}`;
};

export const getPlayerParams = async (playerId: string) => {
    // Determine face image ID from player Profile if needed
}
