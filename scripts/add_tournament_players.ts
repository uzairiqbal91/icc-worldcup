import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Team name to team_id mapping
const teamMapping: { [key: string]: number } = {
    'India': 1,
    'Australia': 2,
    'England': 3,
    'South Africa': 4,
    'Pakistan': 5,
    'Sri Lanka': 6,
    'West Indies': 7,
    'New Zealand': 8,
    'USA': 9,
    'Ireland': 10,
    'Scotland': 11,
    'Afghanistan': 12,
    'Netherlands': 13,
    'Zimbabwe': 14,
    'Nepal': 15,
    'Canada': 16,
    'Namibia': 17,
    'Oman': 18,
    'Italy': 19,
    'UAE': 20
};

const players = [
    // Group A - India
    { name: 'Suryakumar Yadav', team: 'India', role: 'Captain' },
    { name: 'Axar Patel', team: 'India', role: 'Vice Captain' },
    { name: 'Abhishek Sharma', team: 'India', role: 'Batsman' },
    { name: 'Tilak Varma', team: 'India', role: 'Batsman' },
    { name: 'Sanju Samson', team: 'India', role: 'Wicketkeeper' },
    { name: 'Shivam Dube', team: 'India', role: 'All-rounder' },
    { name: 'Ishan Kishan', team: 'India', role: 'Wicketkeeper' },
    { name: 'Hardik Pandya', team: 'India', role: 'All-rounder' },
    { name: 'Rinku Singh', team: 'India', role: 'Batsman' },
    { name: 'Washington Sundar', team: 'India', role: 'All-rounder' },
    { name: 'Jasprit Bumrah', team: 'India', role: 'Bowler' },
    { name: 'Arshdeep Singh', team: 'India', role: 'Bowler' },
    { name: 'Mohammed Siraj', team: 'India', role: 'Bowler' },
    { name: 'Kuldeep Yadav', team: 'India', role: 'Bowler' },
    { name: 'Varun Chakaravarthy', team: 'India', role: 'Bowler' },

    // Group A - Pakistan
    { name: 'Salman Ali Agha', team: 'Pakistan', role: 'Captain' },
    { name: 'Babar Azam', team: 'Pakistan', role: 'Batsman' },
    { name: 'Mohammad Nawaz', team: 'Pakistan', role: 'All-rounder' },
    { name: 'Shaheen Afridi', team: 'Pakistan', role: 'Bowler' },
    { name: 'Naseem Shah', team: 'Pakistan', role: 'Bowler' },
    { name: 'Shadab Khan', team: 'Pakistan', role: 'All-rounder' },
    { name: 'Fakhar Zaman', team: 'Pakistan', role: 'Batsman' },
    { name: 'Saim Ayub', team: 'Pakistan', role: 'Batsman' },
    { name: 'Abrar Ahmed', team: 'Pakistan', role: 'Bowler' },
    { name: 'Faheem Ashraf', team: 'Pakistan', role: 'All-rounder' },
    { name: 'Khawaja Nafay', team: 'Pakistan', role: 'Batsman' },
    { name: 'Usman Khan', team: 'Pakistan', role: 'Wicketkeeper' },

    // Group A - USA
    { name: 'Monank Patel', team: 'USA', role: 'Captain' },
    { name: 'Jessy Singh', team: 'USA', role: 'Vice Captain' },
    { name: 'Andries Gous', team: 'USA', role: 'Batsman' },
    { name: 'Harmeet Singh', team: 'USA', role: 'All-rounder' },
    { name: 'Saurabh Netravalkar', team: 'USA', role: 'Bowler' },
    { name: 'Ali Khan', team: 'USA', role: 'Bowler' },
    { name: 'Milind Kumar', team: 'USA', role: 'Batsman' },
    { name: 'Shayan Jahangir', team: 'USA', role: 'Batsman' },
    { name: 'Mohammad Mohsin', team: 'USA', role: 'All-rounder' },
    { name: 'Corey Anderson', team: 'USA', role: 'All-rounder' },

    // Group A - Netherlands
    { name: 'Scott Edwards', team: 'Netherlands', role: 'Captain' },
    { name: 'Max O\'Dowd', team: 'Netherlands', role: 'Batsman' },
    { name: 'Vikramjit Singh', team: 'Netherlands', role: 'Batsman' },
    { name: 'Bas de Leede', team: 'Netherlands', role: 'All-rounder' },
    { name: 'Paul van Meekeren', team: 'Netherlands', role: 'Bowler' },
    { name: 'Logan van Beek', team: 'Netherlands', role: 'All-rounder' },
    { name: 'Aryan Dutt', team: 'Netherlands', role: 'Bowler' },
    { name: 'Vivian Kingma', team: 'Netherlands', role: 'Bowler' },
    { name: 'Michael Levitt', team: 'Netherlands', role: 'Batsman' },

    // Group A - Namibia
    { name: 'Gerhard Erasmus', team: 'Namibia', role: 'Captain' },
    { name: 'JJ Smit', team: 'Namibia', role: 'All-rounder' },
    { name: 'Bernard Scholtz', team: 'Namibia', role: 'Bowler' },
    { name: 'Jan Frylinck', team: 'Namibia', role: 'All-rounder' },
    { name: 'Tangeni Lungameni', team: 'Namibia', role: 'Bowler' },
    { name: 'Malan Kruger', team: 'Namibia', role: 'Batsman' },
    { name: 'JP Kotze', team: 'Namibia', role: 'Batsman' },
    { name: 'Zane Green', team: 'Namibia', role: 'Wicketkeeper' },
    { name: 'Ruben Trumpelmann', team: 'Namibia', role: 'Bowler' },

    // Group B - Australia
    { name: 'Mitchell Marsh', team: 'Australia', role: 'Captain' },
    { name: 'Travis Head', team: 'Australia', role: 'Batsman' },
    { name: 'Glenn Maxwell', team: 'Australia', role: 'All-rounder' },
    { name: 'Marcus Stoinis', team: 'Australia', role: 'All-rounder' },
    { name: 'Tim David', team: 'Australia', role: 'Batsman' },
    { name: 'Cameron Green', team: 'Australia', role: 'All-rounder' },
    { name: 'Josh Inglis', team: 'Australia', role: 'Wicketkeeper' },
    { name: 'Adam Zampa', team: 'Australia', role: 'Bowler' },
    { name: 'Nathan Ellis', team: 'Australia', role: 'Bowler' },
    { name: 'Xavier Bartlett', team: 'Australia', role: 'Bowler' },
    { name: 'Ben Dwarshuis', team: 'Australia', role: 'Bowler' },

    // Group B - Sri Lanka
    { name: 'Charith Asalanka', team: 'Sri Lanka', role: 'Captain' },
    { name: 'Pathum Nissanka', team: 'Sri Lanka', role: 'Batsman' },
    { name: 'Kusal Mendis', team: 'Sri Lanka', role: 'Wicketkeeper' },
    { name: 'Wanindu Hasaranga', team: 'Sri Lanka', role: 'All-rounder' },
    { name: 'Maheesh Theekshana', team: 'Sri Lanka', role: 'Bowler' },
    { name: 'Matheesha Pathirana', team: 'Sri Lanka', role: 'Bowler' },
    { name: 'Kamindu Mendis', team: 'Sri Lanka', role: 'All-rounder' },
    { name: 'Dunith Wellalage', team: 'Sri Lanka', role: 'All-rounder' },
    { name: 'Dushmantha Chameera', team: 'Sri Lanka', role: 'Bowler' },

    // Group B - Ireland
    { name: 'Paul Stirling', team: 'Ireland', role: 'Captain' },
    { name: 'Lorcan Tucker', team: 'Ireland', role: 'Wicketkeeper' },
    { name: 'Josh Little', team: 'Ireland', role: 'Bowler' },
    { name: 'Harry Tector', team: 'Ireland', role: 'Batsman' },
    { name: 'Mark Adair', team: 'Ireland', role: 'All-rounder' },
    { name: 'Curtis Campher', team: 'Ireland', role: 'All-rounder' },
    { name: 'George Dockrell', team: 'Ireland', role: 'All-rounder' },
    { name: 'Gareth Delany', team: 'Ireland', role: 'All-rounder' },
    { name: 'Craig Young', team: 'Ireland', role: 'Bowler' },

    // Group B - Zimbabwe
    { name: 'Sikandar Raza', team: 'Zimbabwe', role: 'Captain' },
    { name: 'Craig Ervine', team: 'Zimbabwe', role: 'Batsman' },
    { name: 'Sean Williams', team: 'Zimbabwe', role: 'All-rounder' },
    { name: 'Blessing Muzarabani', team: 'Zimbabwe', role: 'Bowler' },
    { name: 'Richard Ngarava', team: 'Zimbabwe', role: 'Bowler' },
    { name: 'Ryan Burl', team: 'Zimbabwe', role: 'All-rounder' },
    { name: 'Clive Madande', team: 'Zimbabwe', role: 'Wicketkeeper' },
    { name: 'Brian Bennett', team: 'Zimbabwe', role: 'Batsman' },
    { name: 'Tadiwanashe Marumani', team: 'Zimbabwe', role: 'Batsman' },

    // Group B - Oman
    { name: 'Aqib Ilyas', team: 'Oman', role: 'Captain' },
    { name: 'Zeeshan Maqsood', team: 'Oman', role: 'All-rounder' },
    { name: 'Kashyap Prajapati', team: 'Oman', role: 'Batsman' },
    { name: 'Bilal Khan', team: 'Oman', role: 'Bowler' },
    { name: 'Shoaib Khan', team: 'Oman', role: 'All-rounder' },
    { name: 'Naseem Khushi', team: 'Oman', role: 'Wicketkeeper' },
    { name: 'Khalid Kail', team: 'Oman', role: 'Batsman' },
    { name: 'Shakeel Ahmed', team: 'Oman', role: 'All-rounder' },
    { name: 'Fayyaz Butt', team: 'Oman', role: 'All-rounder' },

    // Group C - England
    { name: 'Harry Brook', team: 'England', role: 'Captain' },
    { name: 'Jos Buttler', team: 'England', role: 'Wicketkeeper' },
    { name: 'Phil Salt', team: 'England', role: 'Wicketkeeper' },
    { name: 'Jofra Archer', team: 'England', role: 'Bowler' },
    { name: 'Sam Curran', team: 'England', role: 'All-rounder' },
    { name: 'Adil Rashid', team: 'England', role: 'Bowler' },
    { name: 'Rehan Ahmed', team: 'England', role: 'Bowler' },
    { name: 'Liam Dawson', team: 'England', role: 'All-rounder' },
    { name: 'Will Jacks', team: 'England', role: 'All-rounder' },
    { name: 'Tom Banton', team: 'England', role: 'Batsman' },

    // Group C - West Indies
    { name: 'Shai Hope', team: 'West Indies', role: 'Captain' },
    { name: 'Nicholas Pooran', team: 'West Indies', role: 'Wicketkeeper' },
    { name: 'Andre Russell', team: 'West Indies', role: 'All-rounder' },
    { name: 'Rovman Powell', team: 'West Indies', role: 'All-rounder' },
    { name: 'Shimron Hetmyer', team: 'West Indies', role: 'Batsman' },
    { name: 'Alzarri Joseph', team: 'West Indies', role: 'Bowler' },
    { name: 'Akeal Hosein', team: 'West Indies', role: 'Bowler' },
    { name: 'Gudakesh Motie', team: 'West Indies', role: 'Bowler' },
    { name: 'Shamar Joseph', team: 'West Indies', role: 'Bowler' },

    // Group C - Scotland
    { name: 'Richie Berrington', team: 'Scotland', role: 'Captain' },
    { name: 'Matthew Cross', team: 'Scotland', role: 'Wicketkeeper' },
    { name: 'George Munsey', team: 'Scotland', role: 'Batsman' },
    { name: 'Michael Leask', team: 'Scotland', role: 'All-rounder' },
    { name: 'Mark Watt', team: 'Scotland', role: 'Bowler' },
    { name: 'Brad Wheal', team: 'Scotland', role: 'Bowler' },
    { name: 'Chris Sole', team: 'Scotland', role: 'Bowler' },
    { name: 'Brandon McMullen', team: 'Scotland', role: 'All-rounder' },
    { name: 'Jack Jarvis', team: 'Scotland', role: 'Batsman' },

    // Group C - Nepal
    { name: 'Rohit Paudel', team: 'Nepal', role: 'Captain' },
    { name: 'Dipendra Singh Airee', team: 'Nepal', role: 'All-rounder' },
    { name: 'Kushal Bhurtel', team: 'Nepal', role: 'Batsman' },
    { name: 'Sandeep Lamichhane', team: 'Nepal', role: 'Bowler' },
    { name: 'Aasif Sheikh', team: 'Nepal', role: 'Wicketkeeper' },
    { name: 'Sompal Kami', team: 'Nepal', role: 'All-rounder' },
    { name: 'Gulsan Jha', team: 'Nepal', role: 'Bowler' },
    { name: 'Karan KC', team: 'Nepal', role: 'Bowler' },
    { name: 'Lalit Rajbanshi', team: 'Nepal', role: 'Bowler' },

    // Group C - Italy
    { name: 'Wayne Madsen', team: 'Italy', role: 'Captain' },
    { name: 'Marcus Campopiano', team: 'Italy', role: 'Batsman' },
    { name: 'Harry Manenti', team: 'Italy', role: 'All-rounder' },
    { name: 'JJ Smuts', team: 'Italy', role: 'All-rounder' },
    { name: 'Grant Stewart', team: 'Italy', role: 'All-rounder' },
    { name: 'Thomas Draca', team: 'Italy', role: 'Batsman' },
    { name: 'Benjamin Manenti', team: 'Italy', role: 'All-rounder' },

    // Group D - South Africa
    { name: 'Aiden Markram', team: 'South Africa', role: 'Captain' },
    { name: 'Kagiso Rabada', team: 'South Africa', role: 'Bowler' },
    { name: 'Heinrich Klaasen', team: 'South Africa', role: 'Wicketkeeper' },
    { name: 'David Miller', team: 'South Africa', role: 'Batsman' },
    { name: 'Quinton de Kock', team: 'South Africa', role: 'Wicketkeeper' },
    { name: 'Tristan Stubbs', team: 'South Africa', role: 'Batsman' },
    { name: 'Marco Jansen', team: 'South Africa', role: 'All-rounder' },
    { name: 'Anrich Nortje', team: 'South Africa', role: 'Bowler' },
    { name: 'Kwena Maphaka', team: 'South Africa', role: 'Bowler' },

    // Group D - New Zealand
    { name: 'Mitchell Santner', team: 'New Zealand', role: 'Captain' },
    { name: 'Devon Conway', team: 'New Zealand', role: 'Batsman' },
    { name: 'Daryl Mitchell', team: 'New Zealand', role: 'All-rounder' },
    { name: 'Rachin Ravindra', team: 'New Zealand', role: 'All-rounder' },
    { name: 'Glenn Phillips', team: 'New Zealand', role: 'All-rounder' },
    { name: 'Lockie Ferguson', team: 'New Zealand', role: 'Bowler' },
    { name: 'Matt Henry', team: 'New Zealand', role: 'Bowler' },
    { name: 'Ish Sodhi', team: 'New Zealand', role: 'Bowler' },
    { name: 'Finn Allen', team: 'New Zealand', role: 'Batsman' },

    // Group D - Afghanistan
    { name: 'Rashid Khan', team: 'Afghanistan', role: 'Captain' },
    { name: 'Rahmanullah Gurbaz', team: 'Afghanistan', role: 'Wicketkeeper' },
    { name: 'Ibrahim Zadran', team: 'Afghanistan', role: 'Batsman' },
    { name: 'Fazalhaq Farooqi', team: 'Afghanistan', role: 'Bowler' },
    { name: 'Naveen-ul-Haq', team: 'Afghanistan', role: 'Bowler' },
    { name: 'Mohammad Nabi', team: 'Afghanistan', role: 'All-rounder' },
    { name: 'Azmatullah Omarzai', team: 'Afghanistan', role: 'All-rounder' },
    { name: 'Mujeeb Ur Rahman', team: 'Afghanistan', role: 'Bowler' },

    // Group D - Canada
    { name: 'Nicholas Kirton', team: 'Canada', role: 'Captain' },
    { name: 'Aaron Johnson', team: 'Canada', role: 'Batsman' },
    { name: 'Dilpreet Bajwa', team: 'Canada', role: 'Batsman' },
    { name: 'Saad Bin Zafar', team: 'Canada', role: 'All-rounder' },
    { name: 'Kaleem Sana', team: 'Canada', role: 'Bowler' },
    { name: 'Jeremy Gordon', team: 'Canada', role: 'Bowler' },
    { name: 'Harsh Thaker', team: 'Canada', role: 'All-rounder' },
    { name: 'Dilon Heyliger', team: 'Canada', role: 'Bowler' },

    // Group D - UAE
    { name: 'Muhammad Waseem', team: 'UAE', role: 'Captain' },
    { name: 'Vriitya Aravind', team: 'UAE', role: 'Wicketkeeper' },
    { name: 'Basil Hameed', team: 'UAE', role: 'All-rounder' },
    { name: 'Aayan Afzal Khan', team: 'UAE', role: 'Bowler' },
    { name: 'Alishan Sharafu', team: 'UAE', role: 'Batsman' },
    { name: 'Junaid Siddique', team: 'UAE', role: 'Batsman' },
    { name: 'Zahoor Khan', team: 'UAE', role: 'Bowler' },
    { name: 'Ali Naseer', team: 'UAE', role: 'All-rounder' },
];

async function addPlayers() {
    console.log('🏏 Adding Tournament Players to Database...\n');

    try {
        // Get the highest existing player_id
        const { data: maxPlayerData } = await supabase
            .from('players')
            .select('player_id')
            .order('player_id', { ascending: false })
            .limit(1)
            .single();

        let nextPlayerId = (maxPlayerData?.player_id || 20000) + 1;

        let addedCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        for (const player of players) {
            const teamId = teamMapping[player.team];

            if (!teamId) {
                console.error(`❌ Team not found: ${player.team}`);
                errorCount++;
                continue;
            }

            // Check if player already exists
            const { data: existing } = await supabase
                .from('players')
                .select('player_id, name')
                .eq('name', player.name)
                .eq('team_id', teamId)
                .single();

            if (existing) {
                // Update existing player
                const { error } = await supabase
                    .from('players')
                    .update({ role: player.role })
                    .eq('player_id', existing.player_id);

                if (error) {
                    console.error(`❌ Error updating ${player.name}:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Updated: ${player.name} (${player.team})`);
                    updatedCount++;
                }
            } else {
                // Insert new player with generated player_id
                const { error } = await supabase
                    .from('players')
                    .insert({
                        player_id: nextPlayerId,
                        name: player.name,
                        team_id: teamId,
                        role: player.role
                    });

                if (error) {
                    console.error(`❌ Error adding ${player.name}:`, error.message);
                    errorCount++;
                } else {
                    console.log(`✨ Added: ${player.name} (${player.team}) - ID: ${nextPlayerId}`);
                    addedCount++;
                    nextPlayerId++;
                }
            }
        }

        console.log('\n📈 Summary:');
        console.log(`   ✨ Added: ${addedCount} players`);
        console.log(`   ✅ Updated: ${updatedCount} players`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   Total Processed: ${players.length}`);

        // Verify final count
        const { count } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true });

        console.log(`\n🏏 Total players in database: ${count}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addPlayers();
