import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
    const { getMatchScorecard, getMatchInfo } = await import('../lib/rapidapi');

    // Use one of the live match IDs
    const matchId = 138567;

    console.log('=== Fetching Match Info ===');
    const info = await getMatchInfo(matchId);
    console.log('\nMatch Info top-level keys:', Object.keys(info || {}));

    // Check team1/team2 directly on info (since matchInfo doesn't exist, data is at top level)
    if (info?.team1) {
        console.log('\nteam1 keys:', Object.keys(info.team1));
        console.log('team1.playerdetails exists?', !!info.team1.playerdetails);
        if (info.team1.playerdetails) {
            console.log('team1 player count:', info.team1.playerdetails.length);
            console.log('team1 player sample:', JSON.stringify(info.team1.playerdetails[0], null, 2));
        }
    }

    if (info?.team2) {
        console.log('\nteam2 keys:', Object.keys(info.team2));
    }

    console.log('\n\n=== Fetching Scorecard ===');
    const scorecard = await getMatchScorecard(matchId);
    console.log('\nScorecard top-level keys:', Object.keys(scorecard || {}));

    // Note: it's 'scorecard' not 'scoreCard'
    if (scorecard?.scorecard && scorecard.scorecard.length > 0) {
        const inning = scorecard.scorecard[0];
        console.log('\nFirst innings keys:', Object.keys(inning));
        console.log('inningsid:', inning.inningsid);
        console.log('score/runs:', inning.score || inning.runs);
        console.log('wickets:', inning.wickets);
        console.log('overs:', inning.overs);

        // Check batsman array
        if (inning.batsman && inning.batsman.length > 0) {
            console.log('\nbatsman count:', inning.batsman.length);
            console.log('Sample batsman:', JSON.stringify(inning.batsman[0], null, 2));
        }

        // Check bowler array
        if (inning.bowler && inning.bowler.length > 0) {
            console.log('\nbowler count:', inning.bowler.length);
            console.log('Sample bowler:', JSON.stringify(inning.bowler[0], null, 2));
        }
    }

    // Check second innings if exists
    if (scorecard?.scorecard && scorecard.scorecard.length > 1) {
        const inning2 = scorecard.scorecard[1];
        console.log('\n=== Second Innings ===');
        console.log('batteamname:', inning2.batteamname);
        console.log('score:', inning2.score, 'wickets:', inning2.wickets, 'overs:', inning2.overs);
        if (inning2.batsman) {
            console.log('batsman count:', inning2.batsman.length);
        }
    }
}

main().catch(console.error);
