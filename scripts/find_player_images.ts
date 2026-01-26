import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY!;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

async function callAPI(endpoint: string) {
    try {
        const response = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST,
            },
        });
        return await response.json();
    } catch (error: any) {
        console.error(`Error calling ${endpoint}:`, error.message);
        return null;
    }
}

async function main() {
    // Paul Stirling's player ID from the scorecard
    const playerId = 1114;

    console.log('=== Testing Player Info Endpoint ===');

    // Try different endpoints to find player images
    const endpoints = [
        `/stats/v1/player/${playerId}`,
        `/mcenter/v1/player/${playerId}`,
        `/stats/v1/player/${playerId}/career`,
        `/stats/v1/player/${playerId}/bowling`,
        `/stats/v1/player/${playerId}/batting`,
    ];

    for (const endpoint of endpoints) {
        console.log(`\nTrying: ${endpoint}`);
        const data = await callAPI(endpoint);

        if (data) {
            console.log('Response keys:', Object.keys(data));

            // Look for image-related fields
            const jsonStr = JSON.stringify(data);
            if (jsonStr.includes('image') || jsonStr.includes('Image') || jsonStr.includes('faceImage')) {
                console.log('Found image-related data!');

                // Check common locations
                if (data.image) console.log('data.image:', data.image);
                if (data.imageId) console.log('data.imageId:', data.imageId);
                if (data.faceImageId) console.log('data.faceImageId:', data.faceImageId);
                if (data.playerInfo?.faceImageId) console.log('playerInfo.faceImageId:', data.playerInfo.faceImageId);
                if (data.bat?.faceImageId) console.log('bat.faceImageId:', data.bat.faceImageId);
                if (data.appIndex?.seoTitle) console.log('Player name:', data.appIndex.seoTitle);

                // Print first 500 chars to see structure
                console.log('Data preview:', JSON.stringify(data).substring(0, 800));
            }
        }
    }
}

main().catch(console.error);
