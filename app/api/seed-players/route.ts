import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// T20 World Cup 2026 Squad Data
const squadData: { teamName: string; captain: string; players: string[] }[] = [
    // Group A
    {
        teamName: 'India',
        captain: 'Suryakumar Yadav',
        players: ['Suryakumar Yadav', 'Abhishek Sharma', 'Tilak Varma', 'Sanju Samson', 'Shivam Dube', 'Ishan Kishan', 'Hardik Pandya', 'Arshdeep Singh', 'Jasprit Bumrah', 'Harshit Rana', 'Varun Chakaravarthy', 'Kuldeep Yadav', 'Axar Patel', 'Washington Sundar', 'Rinku Singh']
    },
    {
        teamName: 'Namibia',
        captain: 'Gerhard Erasmus',
        players: ['Gerhard Erasmus', 'Zane Green', 'Bernard Scholtz', 'Ruben Trumpelmann', 'JJ Smit', 'Jan Frylinck', 'Louren Steenkamp', 'Malan Kruger', 'Nicol Loftie-Eaton', 'Jack Brassell', 'Ben Shikongo', 'JC Balt', 'Dylan Leicher', 'WP Myburgh', 'Max Heingo']
    },
    {
        teamName: 'Netherlands',
        captain: 'Scott Edwards',
        players: ['Scott Edwards', 'Max ODowd', 'Bas de Leede', 'Aryan Dutt', 'Fred Klaassen', 'Kyle Klein', 'Michael Levitt', 'Logan van Beek', 'Timm van der Gugten', 'Roelof van der Merwe', 'Paul van Meekeren', 'Saqib Zulfiqar', 'Colin Ackermann', 'Noah Croes', 'Zach Lion-Cachet']
    },
    {
        teamName: 'Pakistan',
        captain: 'Salman Ali Agha',
        players: ['Salman Ali Agha', 'Abrar Ahmed', 'Babar Azam', 'Faheem Ashraf', 'Fakhar Zaman', 'Khawaja Nafay', 'Mohammad Nawaz', 'Mohammad Salman Mirza', 'Naseem Shah', 'Sahibzada Farhan', 'Saim Ayub', 'Shaheen Shah Afridi', 'Shadab Khan', 'Usman Khan', 'Usman Tariq']
    },
    {
        teamName: 'United States',
        captain: 'Monank Patel',
        players: ['Monank Patel', 'Jessy Singh', 'Harmeet Singh', 'Mohammad Mohsin', 'Saiteja Mukkamalla', 'Milind Kumar', 'Shadley van Schalkwyk', 'Saurabh Netravalkar', 'Ali Khan', 'Shubham Ranjane', 'Sanjay Krishnamurthi', 'Shayan Jahangir', 'Shehan Jayasuriya', 'Nosthush Kenjige', 'Andries Gous']
    },
    // Group B
    {
        teamName: 'Australia',
        captain: 'Mitchell Marsh',
        players: ['Mitchell Marsh', 'Xavier Bartlett', 'Cooper Connolly', 'Tim David', 'Cameron Green', 'Nathan Ellis', 'Josh Hazlewood', 'Travis Head', 'Josh Inglis', 'Matthew Kuhnemann', 'Glenn Maxwell', 'Matthew Short', 'Marcus Stoinis', 'Adam Zampa', 'Pat Cummins']
    },
    {
        teamName: 'Ireland',
        captain: 'Paul Stirling',
        players: ['Paul Stirling', 'Lorcan Tucker', 'Mark Adair', 'Ross Adair', 'Ben Calitz', 'Curtis Campher', 'Gareth Delany', 'George Dockrell', 'Matthew Humphreys', 'Harry Tector', 'Tim Tector', 'Barry McCarthy', 'Josh Little', 'Ben White', 'Craig Young']
    },
    {
        teamName: 'Oman',
        captain: 'Jatinder Singh',
        players: ['Jatinder Singh', 'Vinayak Shukla', 'Mohammad Nadeem', 'Shakeel Ahmad', 'Hammad Mirza', 'Wasim Ali', 'Karan Sonavale', 'Shah Faisal', 'Nadeem Khan', 'Sufyan Mehmood', 'Jay Odedra', 'Shafiq Jan', 'Ashish Odedara', 'Jiten Ramanandi', 'Aamir Kaleem']
    },
    {
        teamName: 'Sri Lanka',
        captain: 'Dasun Shanaka',
        players: ['Dasun Shanaka', 'Pathum Nissanka', 'Kusal Mendis', 'Kusal Perera', 'Charith Asalanka', 'Kamindu Mendis', 'Wanindu Hasaranga', 'Maheesh Theekshana', 'Matheesha Pathirana', 'Dushmantha Chameera', 'Dunith Wellalage', 'Janith Liyanage', 'Kamil Mishara', 'Pavan Rathnayake', 'Eshan Malinga']
    },
    {
        teamName: 'Zimbabwe',
        captain: 'Sikandar Raza',
        players: ['Sikandar Raza', 'Brian Bennett', 'Ryan Burl', 'Graeme Cremer', 'Brad Evans', 'Clive Madande', 'Tinotenda Maposa', 'Tadiwanashe Marumani', 'Wellington Masakadza', 'Tony Munyonga', 'Blessing Muzarabani', 'Dion Myers', 'Richard Ngarava', 'Brendan Taylor']
    },
    // Group C
    {
        teamName: 'Bangladesh',
        captain: 'Litton Das',
        players: ['Litton Das', 'Tanzid Hasan', 'Parvez Hossain Emon', 'Tawhid Hridoy', 'Shamim Hossain', 'Rishad Hossain', 'Mustafizur Rahman', 'Taskin Ahmed']
    },
    {
        teamName: 'England',
        captain: 'Harry Brook',
        players: ['Harry Brook', 'Jos Buttler', 'Phil Salt', 'Jofra Archer', 'Sam Curran', 'Adil Rashid', 'Will Jacks', 'Ben Duckett', 'Jacob Bethell', 'Rehan Ahmed', 'Jamie Overton', 'Liam Dawson', 'Josh Tongue', 'Luke Wood', 'Tom Banton']
    },
    {
        teamName: 'Italy',
        captain: 'Wayne Madsen',
        players: ['Wayne Madsen', 'Grant Stewart', 'Gian-Piero Meade', 'Jaspreet Singh', 'Anthony Mosca', 'Syed Naqvi', 'Zain Ali', 'JJ Smuts', 'Marcus Campopiano', 'Harry Manenti', 'Ali Hasan', 'Ben Manenti', 'Thomas Draca', 'Crishan Kalugamage', 'Justin Mosca']
    },
    {
        teamName: 'Nepal',
        captain: 'Rohit Paudel',
        players: ['Rohit Paudel', 'Dipendra Singh Airee', 'Sandeep Lamichhane', 'Kushal Bhurtel', 'Aasif Sheikh', 'Sundeep Jora', 'Sompal Kami', 'Karan KC']
    },
    {
        teamName: 'Scotland',
        captain: 'Richie Berrington',
        players: ['Richie Berrington', 'Matthew Cross', 'Brandon McMullen', 'Michael Leask', 'George Munsey', 'Safyaan Sharif', 'Mark Watt', 'Brad Wheal', 'Michael Jones', 'Chris Greaves', 'Tom Bruce']
    },
    // Group D
    {
        teamName: 'Afghanistan',
        captain: 'Rashid Khan',
        players: ['Rashid Khan', 'Rahmanullah Gurbaz', 'Mohammad Nabi', 'Ibrahim Zadran', 'Noor Ahmad', 'Fazalhaq Farooqi', 'Naveen-ul-Haq', 'Azmatullah Omarzai', 'Mujeeb Ur Rahman', 'Gulbadin Naib']
    },
    {
        teamName: 'Canada',
        captain: 'Dilpreet Bajwa',
        players: ['Dilpreet Bajwa', 'Shreyas Movva', 'Kaleem Sana', 'Saad Bin Zafar', 'Nicholas Kirton', 'Dillon Heyliger', 'Harsh Thaker', 'Navneet Dhaliwal']
    },
    {
        teamName: 'New Zealand',
        captain: 'Mitchell Santner',
        players: ['Mitchell Santner', 'Finn Allen', 'Devon Conway', 'Glenn Phillips', 'Daryl Mitchell', 'Rachin Ravindra', 'Lockie Ferguson', 'Matt Henry', 'Ish Sodhi', 'James Neesham']
    },
    {
        teamName: 'South Africa',
        captain: 'Aiden Markram',
        players: ['Aiden Markram', 'Quinton de Kock', 'Kagiso Rabada', 'Anrich Nortje', 'Marco Jansen', 'Keshav Maharaj', 'David Miller', 'Lungi Ngidi']
    },
    {
        teamName: 'UAE',
        captain: 'Muhammad Waseem',
        players: ['Muhammad Waseem', 'Alishan Sharafu', 'Aryansh Sharma', 'Muhammad Rohid', 'Junaid Siddique', 'Muhammad Farooq']
    },
    {
        teamName: 'West Indies',
        captain: 'Shai Hope',
        players: ['Shai Hope', 'Nicholas Pooran', 'Andre Russell', 'Shimron Hetmyer', 'Brandon King', 'Roston Chase', 'Alzarri Joseph', 'Akeal Hosein', 'Gudakesh Motie', 'Romario Shepherd']
    }
];

// POST - Seed all players from squad data
export async function POST(request: Request) {
    try {
        const results: { team: string; playersAdded: number; errors: string[] }[] = [];
        let totalAdded = 0;
        let totalErrors = 0;

        // First, get all teams from database
        const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('team_id, name');

        if (teamsError) {
            return NextResponse.json({ error: 'Failed to fetch teams: ' + teamsError.message }, { status: 500 });
        }

        // Create a map of team names to team_ids (case insensitive)
        const teamMap = new Map<string, number>();
        teams?.forEach(team => {
            teamMap.set(team.name.toLowerCase(), team.team_id);
        });

        // Process each squad
        for (const squad of squadData) {
            const teamId = teamMap.get(squad.teamName.toLowerCase());
            const errors: string[] = [];
            let playersAdded = 0;

            if (!teamId) {
                errors.push(`Team "${squad.teamName}" not found in database`);
                results.push({ team: squad.teamName, playersAdded: 0, errors });
                totalErrors++;
                continue;
            }

            // Add each player
            for (const playerName of squad.players) {
                // Generate a unique player_id based on name hash (for players without Cricbuzz IDs)
                const playerId = Math.abs(hashCode(playerName + squad.teamName)) % 1000000 + 900000;

                const { error: insertError } = await supabase
                    .from('players')
                    .upsert({
                        player_id: playerId,
                        name: playerName,
                        team_id: teamId,
                        role: playerName === squad.captain ? 'Captain' : null,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'player_id',
                        ignoreDuplicates: false
                    });

                if (insertError) {
                    // Try with a different ID if conflict
                    const altPlayerId = playerId + 1000000;
                    const { error: retryError } = await supabase
                        .from('players')
                        .upsert({
                            player_id: altPlayerId,
                            name: playerName,
                            team_id: teamId,
                            role: playerName === squad.captain ? 'Captain' : null,
                            updated_at: new Date().toISOString()
                        }, {
                            onConflict: 'player_id',
                            ignoreDuplicates: false
                        });

                    if (retryError) {
                        errors.push(`Failed to add ${playerName}: ${retryError.message}`);
                        totalErrors++;
                    } else {
                        playersAdded++;
                        totalAdded++;
                    }
                } else {
                    playersAdded++;
                    totalAdded++;
                }
            }

            results.push({ team: squad.teamName, playersAdded, errors });
        }

        return NextResponse.json({
            success: true,
            message: `Seeded ${totalAdded} players with ${totalErrors} errors`,
            totalAdded,
            totalErrors,
            results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Simple hash function for generating player IDs
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

// GET - Show squad data (for verification)
export async function GET() {
    return NextResponse.json({
        message: 'POST to this endpoint to seed players',
        squads: squadData.map(s => ({ team: s.teamName, playerCount: s.players.length, captain: s.captain }))
    });
}
