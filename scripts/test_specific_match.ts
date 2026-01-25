
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testScorecard() {
    // Dynamic import to ensure env vars are loaded first
    const { getMatchScorecard } = await import('../lib/rapidapi');

    const matchId = 123815; // Bihar vs Manipur (Stumps)
    console.log(`Fetching scorecard for Match ${matchId}...`);

    const data = await getMatchScorecard(matchId);

    if (!data) {
        console.error("Failed to fetch scorecard.");
        return;
    }

    console.log("DEBUG DATA:", JSON.stringify(data, null, 2));

    const header = data; // Flat structure
    const team1 = data.team1;
    const team2 = data.team2;

    console.log("Match Status:", header.status);
    console.log("Toss:", header.tossResults?.tossWinnerName || "No toss info");
    console.log("Team 1:", team1.name);
    console.log("Team 2:", team2.name);

    if (data.scoreCard) {
        console.log("Innings found:", data.scoreCard.length);
        data.scoreCard.forEach((inn: any) => {
            console.log(`Innings ${inn.inningsId}: ${inn.batTeamDetails.batTeamName} ${inn.score}/${inn.wkts} (${inn.overs} ov)`);
        });
    }
}

testScorecard();
