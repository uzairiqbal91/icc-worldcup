
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

// Helper to get image URL via local proxy (hides API key)
export const getImageUrl = (imageId: number | string) => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    return `/api/proxy-image?id=${imageId}`;
};

// Helper to get full image URL for storing in database
// Uses Cricbuzz get-image API format: p=de, d=high, imageId with 'c' prefix
export const getFullImageUrl = (imageId: number | string | undefined | null): string | null => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    // Format: https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c{imageId}/i.jpg?p=de&d=high
    return `https://${RAPIDAPI_HOST}/img/v1/i1/c${imageId}/i.jpg?p=de&d=high`;
};

// Helper to get image URL for different sizes
export const getImageUrlWithSize = (imageId: number | string | undefined | null, size: 'de' | 'hs' | 'vs' = 'de', quality: 'high' | 'low' = 'high'): string | null => {
    if (!imageId || imageId === 0 || imageId === '0') return null;
    // p parameter: de (default), hs (horizontal small), vs (vertical small)
    // d parameter: high, low
    return `https://${RAPIDAPI_HOST}/img/v1/i1/c${imageId}/i.jpg?p=${size}&d=${quality}`;
};

export const getPlayerParams = async (playerId: string) => {
    // Determine face image ID from player Profile if needed
}
