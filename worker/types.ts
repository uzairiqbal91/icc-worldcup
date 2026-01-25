
export interface RapidMatchInfo {
    matchId: number;
    seriesId: number;
    seriesName: string;
    matchDesc: string;
    matchFormat: string;
    startDate: string; // "1706425800000" (timestamp string)
    endDate: string;
    state: string; // "Upcoming", "In Progress", "Complete"
    status: string;
    team1: { teamId: number; teamName: string; teamSName: string; imageId: number };
    team2: { teamId: number; teamName: string; teamSName: string; imageId: number };
    venueInfo: { id: number; ground: string; city: string; timezone: string };
}

export interface RapidLiveResponse {
    typeMatches: {
        matchType: string;
        seriesMatches: {
            seriesId: number;
            seriesName: string;
            matches: {
                matchInfo: RapidMatchInfo;
                matchScore?: any;
            }[];
        }[];
    }[];
}
