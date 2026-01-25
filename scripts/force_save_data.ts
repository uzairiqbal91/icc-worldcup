
import dotenv from 'dotenv';
import path from 'path';

// Fix env loading order
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function forceSave() {
    console.log("Forcing data save for Match 123815...");

    const { getMatchScorecard } = await import('../lib/rapidapi');
    const { handleLiveEvents, handleInningsEnd, handleMatchEnd, handlePlayingXI, handleToss } = await import('../worker/events');

    const matchId = 123815;

    console.log("Fetching scorecard...");
    const scorecard = await getMatchScorecard(matchId);

    if (!scorecard) {
        console.error("No scorecard data returned.");
        return;
    }

    console.log("Triggering Event Handlers...");

    // 1. Live Events (Milestones, etc.)
    await handleLiveEvents(matchId, scorecard);

    // 2. Innings End (since it's at Stumps/Complete)
    await handleInningsEnd(matchId, scorecard);

    // 3. Playing XI (Pre-match data)
    // Note: This might fetch matchInfo internally
    await handlePlayingXI(matchId);

    // 4. Toss
    await handleToss(matchId);

    // 5. Match End (if complete)
    await handleMatchEnd(matchId, scorecard);

    console.log("Done. Check Supabase 'events' table.");
}

forceSave();
