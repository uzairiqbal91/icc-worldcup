
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'cricbuzz-cricket.p.rapidapi.com';

if (!RAPIDAPI_KEY) {
    console.error("Error: RAPIDAPI_KEY is not set in .env.local");
    process.exit(1);
}

async function findLiveMatches() {
    try {
        console.log("Fetching live matches...");
        const options = {
            method: "GET",
            url: `https://${RAPIDAPI_HOST}/matches/v1/live`,
            headers: {
                "x-rapidapi-key": RAPIDAPI_KEY,
                "x-rapidapi-host": RAPIDAPI_HOST,
            },
        };

        const response = await axios.request(options);
        console.log("Raw Response:", JSON.stringify(response.data, null, 2)); // DEBUG: See full structure
        const matches = response.data.typeMatches;

        if (!matches || matches.length === 0) {
            console.log("No live matches found.");
            return;
        }

        console.log("\n--- ALL MATCHES ---");
        let foundLive = false;
        for (const type of matches) {
            if (type.seriesMatches) {
                for (const series of type.seriesMatches) {
                    if (series.matches) {
                        for (const match of series.matches) {
                            // Check if match is truly live (inprogress)
                            const info = match.matchInfo;
                            console.log(`[${info.status}] (State: ${info.state}) ${info.team1.name} vs ${info.team2.name} (ID: ${info.matchId})`);
                            if (info.state === "In Progress" || info.status.toLowerCase().includes("live")) {
                                foundLive = true;
                                console.log(`>>> DATA FOR TESTING: Match ID ${info.matchId} is LIVE <<<`);
                            }
                        }
                    }
                }
            }
        }

        if (!foundLive) {
            console.log("\nNo 'In Progress' matches found right now. You might need to use a 'Recent' match for testing structure.");
        }

    } catch (error: any) {
        console.error("Failed to fetch matches:", error.response?.data || error.message);
    }
}

findLiveMatches();
