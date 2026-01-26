
import dotenv from 'dotenv';
import path from 'path';

// Fix env loading order
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function checkUpcoming() {
    console.log("Checking for upcoming matches...");

    // We need to import after dotenv config
    const { getUpcomingMatches } = await import('../lib/rapidapi');

    const data = await getUpcomingMatches();

    if (!data || !data.typeMatches) {
        console.error("No upcoming match data found.");
        return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`UPCOMING INTERNATIONAL MATCHES`);
    console.log(`${'='.repeat(60)}\n`);

    const now = new Date();
    let matchesFound = 0;
    let shouldStartWorker = false;

    data.typeMatches.forEach((type: any) => {
        // Filter for International ideally, but let's look at the type
        const matchType = type.matchType;

        // We typically care about International or League T20s for this app? 
        // User asked for "International". 
        // Let's rely on type.matchType usually being "International" or similar categories if structured that way.
        // Actually structure is typeMatches -> matchType (e.g. "International", "League", "Domestic")

        if (matchType !== 'International') return;

        const seriesList = type.seriesMatches || [];

        seriesList.forEach((series: any) => {
            const seriesName = series.seriesAdWrapper?.seriesName || "Unknown Series";

            if (series.seriesAdWrapper?.matches) {
                series.seriesAdWrapper.matches.forEach((match: any) => {
                    const info = match.matchInfo;
                    if (!info) return;

                    // Time encoding matches typical JS timestamp or ISO
                    const startDate = new Date(parseInt(info.startDate));

                    // Local Time String
                    const localTime = startDate.toLocaleString(undefined, {
                        timeZoneName: 'short',
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // Time difference
                    const diffMs = startDate.getTime() - now.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);

                    console.log(`[${seriesName}]`);
                    console.log(`  ${info.team1.teamSName} vs ${info.team2.teamSName}`);
                    console.log(`  Start: ${localTime}`);

                    if (diffMs > 0) {
                        console.log(`  Starts in: ${diffHours}h ${diffMins % 60}m`);
                    } else {
                        console.log(`  Started ${Math.abs(diffHours)}h ${Math.abs(diffMins % 60)}m ago (Status: ${info.state})`);
                    }
                    console.log(`  ID: ${info.matchId}\n`);
                    matchesFound++;

                    // Logic to start worker
                    // If match starts within 1 hour or has already started (and is not complete)
                    if (diffMins <= 60 && info.state !== 'Complete') {
                        shouldStartWorker = true;
                    }
                });
            }
        });
    });

    if (matchesFound === 0) {
        console.log("No upcoming International matches found in the immediate feed.");
    }

    console.log(`${'='.repeat(60)}`);

    if (shouldStartWorker) {
        console.log("\n>>> ACTION REQUIRED <<<");
        console.log("A match is starting soon or in progress!");
        console.log("Run the worker to track events:");
        console.log("\n    npx tsx worker/index.ts\n");
    } else {
        console.log("\nNo immediate matches requiring worker startup.");
    }
}

checkUpcoming();
