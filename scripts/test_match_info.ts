
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testMatchInfo() {
    const { getMatchInfo } = await import('../lib/rapidapi');

    // const matchId = 123815; // Bihar vs Manipur
    const matchId = 123815;

    console.log(`Fetching Match Info for ${matchId}...`);
    const data = await getMatchInfo(matchId);

    if (!data) {
        console.error("Failed to fetch match info.");
        return;
    }

    console.log("Team 1 Object:", JSON.stringify(data.team1, null, 2));
    console.log("Team 2 Object:", JSON.stringify(data.team2, null, 2));
    console.log("Full Keys:", Object.keys(data));
}

testMatchInfo();
