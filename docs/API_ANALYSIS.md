# Cricbuzz RapidAPI - Complete Analysis

Based on live API testing on January 25, 2026.

## Base Configuration

```
Base URL: https://cricbuzz-cricket.p.rapidapi.com
Headers:
  x-rapidapi-host: cricbuzz-cricket.p.rapidapi.com
  x-rapidapi-key: YOUR_API_KEY
```

---

## 1. Live Matches

**Endpoint:** `GET /matches/v1/live`

**Response Structure:**
```json
{
  "typeMatches": [
    {
      "matchType": "International",  // or "League", "Domestic", "Women"
      "seriesMatches": [
        {
          "seriesAdWrapper": {
            "seriesId": 10102,
            "seriesName": "New Zealand tour of India, 2026",
            "matches": [
              {
                "matchInfo": {
                  "matchId": 121406,
                  "seriesId": 10102,
                  "seriesName": "New Zealand tour of India, 2026",
                  "matchDesc": "3rd T20I",
                  "matchFormat": "T20",
                  "startDate": "1769347800000",
                  "endDate": "1769360400000",
                  "state": "Complete",          // "Upcoming", "In Progress", "Complete", "Stumps"
                  "status": "India won by 8 wkts",
                  "team1": {
                    "teamId": 13,
                    "teamName": "New Zealand",
                    "teamSName": "NZ",
                    "imageId": 776333           // Team logo image ID
                  },
                  "team2": {
                    "teamId": 2,
                    "teamName": "India",
                    "teamSName": "IND",
                    "imageId": 776162
                  },
                  "venueInfo": {
                    "id": 380,
                    "ground": "Barsapara Cricket Stadium",
                    "city": "Guwahati",
                    "timezone": "+05:30"
                  },
                  "currBatTeamId": 2,
                  "isTimeAnnounced": true,
                  "stateTitle": "Complete",
                  "isFantasyEnabled": true
                },
                "matchScore": {
                  "team1Score": {
                    "inngs1": {
                      "inningsId": 1,
                      "runs": 153,
                      "wickets": 9,
                      "overs": 19.6
                    }
                  },
                  "team2Score": {
                    "inngs1": {
                      "inningsId": 2,
                      "runs": 155,
                      "wickets": 2,
                      "overs": 9.6
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ],
  "filters": {
    "matchType": ["International", "League", "Domestic", "Women"]
  }
}
```

**Key Fields:**
| Field | Description |
|-------|-------------|
| `state` | Match state: "Upcoming", "In Progress", "Complete", "Stumps", "Preview" |
| `startDate` | Epoch timestamp in milliseconds |
| `team*.imageId` | Team logo image ID for `/img/v1/i1/c{imageId}/i.jpg` |
| `currBatTeamId` | Currently batting team ID |

---

## 2. Match Scorecard

**Endpoint:** `GET /mcenter/v1/{matchId}/scard`

**Response Structure:**
```json
{
  "scorecard": [
    {
      "inningsid": 1,
      "batteamname": "New Zealand",
      "batteamsname": "NZ",
      "score": 153,
      "wickets": 9,
      "overs": 20.0,
      "runrate": 7.65,
      "batsman": [
        {
          "id": 9838,
          "name": "Devon Conway",
          "nickname": "Conway",
          "runs": 1,
          "balls": 2,
          "fours": 0,
          "sixes": 0,
          "strkrate": "50",
          "iscaptain": false,
          "iskeeper": false,
          "outdec": "c Hardik Pandya b Harshit Rana",
          "isoverseas": false,
          "playingxichange": ""      // "IN" if added to playing XI
        }
      ],
      "bowler": [
        {
          "id": 24729,
          "name": "Harshit Rana",
          "overs": "4",
          "maidens": 0,
          "wickets": 1,
          "runs": 35,
          "economy": "8.8",
          "dots": 0,
          "balls": 24
        }
      ],
      "pp": {
        "powerplay": [
          {
            "id": 29,
            "ovrfrom": 0.1,
            "ovrto": 6.0,
            "pptype": "mandatory",
            "run": 36,                 // Runs in powerplay
            "wickets": 0               // Wickets in powerplay
          }
        ]
      },
      "fow": [...],                    // Fall of wickets
      "extras": {...},
      "partnership": {...}
    }
  ],
  "ismatchcomplete": true,
  "status": "India won by 8 wkts"
}
```

**Key Fields for Events:**

| Your Event | API Fields |
|------------|------------|
| PLAYING_XI | `scorecard[*].batsman[]` (all players who batted) |
| POWERPLAY_END | `scorecard[*].pp.powerplay[0]` with `run`, `wickets` |
| MILESTONE | `scorecard[*].batsman[*].runs` |
| INNINGS_END | `scorecard[*].score`, `wickets`, `overs` |

---

## 3. Match Info

**Endpoint:** `GET /mcenter/v1/{matchId}`

**Response Structure:**
```json
{
  "matchid": 121406,
  "seriesid": 10102,
  "seriesname": "New Zealand tour of India, 2026",
  "matchdesc": "3rd T20I",
  "matchformat": "T20",
  "startdate": 1769347800000,
  "state": "Complete",
  "status": "India opt to bowl",
  "tossstatus": "India opt to bowl",    // Toss result!
  "team1": {
    "teamid": 2,
    "teamname": "India",
    "teamsname": "IND",
    "imageid": 0                         // Note: imageId may be 0 here
  },
  "team2": {
    "teamid": 13,
    "teamname": "New Zealand",
    "teamsname": "NZ"
  },
  "umpire1": { "id": 8905, "name": "Jayaraman Madanagopal", "country": "IND" },
  "umpire2": { "id": 8862, "name": "Nitin Menon", "country": "IND" },
  "referee": { "id": 3894, "name": "Javagal Srinath", "country": "IND" },
  "venueinfo": {
    "id": 380,
    "ground": "Barsapara Cricket Stadium",
    "city": "Guwahati",
    "country": "India",
    "timezone": "+05:30",
    "capacity": "40000"
  },
  "matchimageid": 835905,               // Match image
  "shortstatus": "IND won"
}
```

**Key Fields:**
| Field | Description |
|-------|-------------|
| `tossstatus` | Toss result: "India opt to bowl" |
| `matchimageid` | Match banner/action image |

---

## 4. Leanback (Mini Score / Live Data)

**Endpoint:** `GET /mcenter/v1/{matchId}/leanback`

**Response Structure:**
```json
{
  "miniscore": {
    "batsmanstriker": {
      "id": 12086,
      "name": "Abhishek Sharma",
      "runs": 68,
      "balls": 20,
      "fours": 7,
      "sixes": 5,
      "strkrate": "340"
    },
    "batsmannonstriker": {
      "id": 7915,
      "name": "Suryakumar Yadav",
      "runs": 57,
      "balls": 26
    },
    "bowlerstriker": {
      "id": 10100,
      "name": "Mitchell Santner",
      "overs": "2",
      "wickets": 0,
      "runs": 28,
      "economy": "14"
    },
    "crr": 15.5,                        // Current run rate
    "rrr": 0.0,                         // Required run rate
    "inningsnbr": "1st inn",
    "lastwkt": "Ishan Kishan c Chapman b Ish Sodhi 28(13) - 53/2 in 3.2 ov.",
    "inningsscores": {
      "inningsscore": [
        {
          "inningsid": 2,
          "batteamid": 2,
          "batteamshortname": "IND",
          "runs": 155,
          "wickets": 2,
          "overs": 9.6,
          "target": 154
        }
      ]
    },
    "pp": {
      "powerplay": [
        {
          "id": 30,
          "ovrfrom": 0.1,
          "ovrto": 6.0,
          "pptype": "Mandatory",
          "run": 94,
          "wickets": 0
        }
      ]
    },
    "partnership": "102(40)",
    "performance": [
      { "runs": 83, "wickets": 0, "label": "Last 5 overs" },
      { "runs": 50, "wickets": 0, "label": "Last 3 overs" }
    ]
  }
}
```

**Best endpoint for live tracking!**

---

## 5. Player Profile

**Endpoint:** `GET /stats/v1/player/{playerId}`

**Response Structure:**
```json
{
  "id": "9647",
  "name": "Hardik Pandya",
  "nickName": "Hardik Pandya",
  "role": "Batting Allrounder",
  "bat": "Right Handed Bat",
  "bowl": "Right-arm fast-medium",
  "intlTeam": "India",
  "birthPlace": "Choryasi, Gujarat",
  "DoB": "October 11, 1993 (32 years)",
  "image": "http://i.cricketcb.com/stats/img/faceImages/9647.jpg",
  "faceImageId": 616519,               // Use this for API image fetch
  "intlTeamImageId": 776162,           // Team logo
  "rankings": {
    "bat": { "t20Rank": "55", "odiBestRank": "42" },
    "bowl": { "odiRank": "98", "t20Rank": "77" },
    "all": { "t20Rank": "4", "t20BestRank": "1" }
  },
  "bio": "..."
}
```

---

## 6. Series Squad

**Endpoint:** `GET /series/v1/{seriesId}/squads/{teamId}`

**Response Structure:**
```json
{
  "player": [
    { "name": "BATTERS", "isHeader": true },
    {
      "id": "1413",
      "name": "Virat Kohli",
      "role": "Batsman",
      "imageId": 616517,              // Player face image
      "battingStyle": "Right-hand bat",
      "bowlingStyle": "Right-arm medium"
    },
    { "name": "WICKET KEEPERS", "isHeader": true },
    {
      "id": "265",
      "name": "MS Dhoni",
      "captain": true,                // Captain flag
      "role": "WK-Batsman",
      "keeper": true,                 // Keeper flag
      "imageId": 170677
    }
  ]
}
```

---

## 7. Images

**Endpoint:** `GET /img/v1/i1/c{imageId}/i.jpg`

**Types:**
| Type | Source Field | Example ID |
|------|--------------|------------|
| Team Logo | `team.imageId` | 776162 (India) |
| Player Face | `player.faceImageId` | 616519 (Hardik) |
| Match Banner | `matchInfo.matchimageid` | 835905 |

**Tested & Working:**
```bash
# Team logo (returns PNG)
curl "https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c776162/i.jpg" -H "..."

# Player face (returns JPEG)
curl "https://cricbuzz-cricket.p.rapidapi.com/img/v1/i1/c616519/i.jpg" -H "..."
```

---

## 8. Commentary

**Endpoint:** `GET /mcenter/v1/{matchId}/comm`

Contains ball-by-ball commentary including:
- Post-match interviews
- Player of the Match info
- Ball-by-ball events

---

## Event Detection Logic

### 1. PLAYING_XI (1 hour before)
```typescript
// From scorecard, get all batsmen from both innings
const team1Players = scorecard[0]?.batsman || [];
const team2Players = scorecard[1]?.batsman || [];

// Or from series squad endpoint
// GET /series/v1/{seriesId}/squads/{teamId}
```

### 2. TOSS (30 mins before)
```typescript
// From match info
const tossResult = matchInfo.tossstatus;  // "India opt to bowl"

// Parse it
const [winner, decision] = parseToss(tossResult);
// winner = "India", decision = "bowl"
```

### 3. POWERPLAY_END
```typescript
// From scorecard or leanback
const pp = innings.pp?.powerplay?.[0];
if (pp && pp.ovrto === 6.0) {
  // Powerplay complete
  const ppRuns = pp.run;
  const ppWickets = pp.wickets;
}

// Or check if current overs >= 6.0
if (parseFloat(innings.overs) >= 6.0 && !powerplayEventSent) {
  triggerPowerplayEnd();
}
```

### 4. MILESTONE (50/100/150)
```typescript
const MILESTONES = [50, 100, 150, 200];
for (const batsman of innings.batsman) {
  const runs = parseInt(batsman.runs);
  const prevRuns = playerScoreCache[batsman.id] || 0;

  for (const milestone of MILESTONES) {
    if (runs >= milestone && prevRuns < milestone) {
      triggerMilestone(batsman, milestone);
    }
  }
  playerScoreCache[batsman.id] = runs;
}
```

### 5. INNINGS_END
```typescript
// T20: 20 overs or 10 wickets
if (innings.wickets === 10 || parseFloat(innings.overs) >= 20.0) {
  triggerInningsEnd(innings);
}
```

### 6. INNINGS_BREAK (Target Set)
```typescript
// After innings 1 ends, innings 2 has target
const innings2 = scorecard[1];
if (innings2 && innings2.target > 0) {
  // Target is set
  const target = scorecard[0].score + 1;
}

// Or from leanback
const target = miniscore.inningsscores.inningsscore[0].target;
```

### 7. MATCH_END
```typescript
if (matchInfo.state === "Complete") {
  // Get Player of Match from commentary endpoint
  // Or parse from status: "India won by 8 wkts"
}
```

---

## Image ID Sources

| For | Endpoint | Field Path |
|-----|----------|------------|
| Team Logo | `/matches/v1/live` | `matchInfo.team1.imageId` |
| Player Face | `/stats/v1/player/{id}` | `faceImageId` |
| Match Action | `/mcenter/v1/{id}` | `matchimageid` |
| Squad Player | `/series/v1/{sid}/squads/{tid}` | `player[].imageId` |

---

## API Field Case Notes

The API uses **lowercase** field names:
- `matchid` not `matchId`
- `teamid` not `teamId`
- `batteamname` not `batTeamName`
- `iscaptain` not `isCaptain`

**Exception:** In `/matches/v1/live`, fields are camelCase:
- `matchId`, `teamName`, `imageId`

Always handle both cases in code!

---

## Rate Limits

Based on RapidAPI plan. For production:
- Implement caching (20-30 second TTL)
- Use webhooks if available
- Batch requests where possible

---

## Recommended Polling Intervals

| Phase | Interval | Endpoint |
|-------|----------|----------|
| Check for matches | 60 seconds | `/matches/v1/live` |
| Pre-match (T-60m to start) | 60 seconds | `/mcenter/v1/{id}` |
| Live match | 20 seconds | `/mcenter/v1/{id}/leanback` |
| Post-match | Once | `/mcenter/v1/{id}/scard` |
