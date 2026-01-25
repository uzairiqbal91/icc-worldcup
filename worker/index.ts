
import dotenv from 'dotenv';
import path from 'path';
import { RapidMatchInfo } from './types';

// 1. Load Environment Variables FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// 2. Main Async Function with Dynamic Imports
async function main() {
    console.log("Worker process started...");

    // Dynamically import dependencies so they pick up the loaded env vars
    const { getLiveMatches, getMatchScorecard } = await import('../lib/rapidapi');
    const { handlePlayingXI, handleToss, handleLiveEvents, handleInningsEnd, handleMatchEnd } = await import('./events');
    const { supabase } = await import('../lib/supabase'); // Now process.env is ready

    const LIVE_POLL_INTERVAL_MS = 20000; // 20 seconds
    const GLOBAL_POLL_INTERVAL_MS = 60000; // 1 minute
    const activeMonitors = new Set<number>();

    // Dedicated Monitor for a single Live Match
    function startLiveMonitor(matchId: number) {
        console.log(`>>> Starting Live Monitor for Match ${matchId}`);
        activeMonitors.add(matchId);

        const interval = setInterval(async () => {
            try {
                // 1. Fetch Fresh Data
                const scorecard = await getMatchScorecard(matchId);
                if (!scorecard) return;

                // 2. Process Live Events
                await handleLiveEvents(matchId, scorecard);
                await handleInningsEnd(matchId, scorecard);

                console.log(`[Match ${matchId}] Live update processed.`);

                // 3. Check for completion
                const state = scorecard.state || scorecard.matchHeader?.state;
                if (state === "Complete") {
                    console.log(`Match ${matchId} Complete. Stopping monitor.`);
                    await handleMatchEnd(matchId, scorecard);
                    clearInterval(interval);
                    activeMonitors.delete(matchId);
                }

            } catch (err) {
                console.error(`Error in monitor ${matchId}:`, err);
            }
        }, LIVE_POLL_INTERVAL_MS);
    }

    async function handleMatchState(match: RapidMatchInfo) {
        const timeToStart = parseInt(match.startDate) - Date.now();
        const isLive = match.state === "In Progress";

        // 1. Pre-Match Events
        if (match.state === "Upcoming") {
            const minutesToStart = timeToStart / 1000 / 60;

            // T-60m: Playing XI
            if (minutesToStart <= 60 && minutesToStart > 58) {
                console.log(`[Trigger] T-60m for match ${match.matchId} - Fetching Playing XI`);
                await handlePlayingXI(match.matchId);
            }

            // T-30m: Toss
            if (minutesToStart <= 30 && minutesToStart > 28) {
                console.log(`[Trigger] T-30m for match ${match.matchId} - Checking Toss`);
                await handleToss(match.matchId);
            }
        }

        // 2. Live Match Monitoring
        if (isLive) {
            if (!activeMonitors.has(match.matchId)) {
                startLiveMonitor(match.matchId);
            }
        }
    }

    // Main Scheduler Loop
    console.log(`[${new Date().toISOString()}] Scheduler started...`);

    // Run immediately once
    await checkMatches();

    setInterval(checkMatches, GLOBAL_POLL_INTERVAL_MS);

    async function checkMatches() {
        try {
            console.log(`[${new Date().toISOString()}] Checking for matches...`);
            const data = await getLiveMatches();

            if (!data || !data.typeMatches) return;

            const matches: RapidMatchInfo[] = [];
            data.typeMatches.forEach((type: any) => {
                const series = type.seriesMatches || [];
                series.forEach((s: any) => {
                    const ms = s.matches || [];
                    ms.forEach((m: any) => matches.push(m.matchInfo));
                });
            });

            for (const match of matches) {
                await handleMatchState(match);
            }

        } catch (error) {
            console.error("Scheduler Error:", error);
        }
    }
}

// Start execution
main().catch(err => console.error("Fatal Worker Error:", err));
