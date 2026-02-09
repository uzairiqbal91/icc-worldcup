import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ICC Teams with their short names
const iccTeams = [
    { name: 'India', short_name: 'IND', team_id: 1 },
    { name: 'Australia', short_name: 'AUS', team_id: 2 },
    { name: 'England', short_name: 'ENG', team_id: 3 },
    { name: 'South Africa', short_name: 'RSA', team_id: 4 },
    { name: 'Pakistan', short_name: 'PAK', team_id: 5 },
    { name: 'Sri Lanka', short_name: 'SL', team_id: 6 },
    { name: 'West Indies', short_name: 'WI', team_id: 7 },
    { name: 'New Zealand', short_name: 'NZ', team_id: 8 },
    { name: 'USA', short_name: 'USA', team_id: 9 },
    { name: 'Ireland', short_name: 'IRE', team_id: 10 },
    { name: 'Scotland', short_name: 'SCO', team_id: 11 },
    { name: 'Afghanistan', short_name: 'AFG', team_id: 12 },
    { name: 'Netherlands', short_name: 'NED', team_id: 13 },
    { name: 'Zimbabwe', short_name: 'ZIM', team_id: 14 },
    { name: 'Nepal', short_name: 'NEP', team_id: 15 },
    { name: 'Canada', short_name: 'CAN', team_id: 16 },
    { name: 'Namibia', short_name: 'NAM', team_id: 17 },
    { name: 'Oman', short_name: 'OMA', team_id: 18 },
    { name: 'Italy', short_name: 'ITA', team_id: 19 },
    { name: 'UAE', short_name: 'UAE', team_id: 20 },
];

async function addICCTeams() {
    console.log('🏏 Adding ICC Teams to Database...\n');

    try {
        // First, check existing teams
        const { data: existingTeams } = await supabase
            .from('teams')
            .select('team_id, name');

        console.log(`📊 Found ${existingTeams?.length || 0} existing teams in database\n`);

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const team of iccTeams) {
            const exists = existingTeams?.find(t => t.team_id === team.team_id);

            if (exists) {
                // Update existing team
                const { error } = await supabase
                    .from('teams')
                    .update({
                        name: team.name,
                        short_name: team.short_name
                    })
                    .eq('team_id', team.team_id);

                if (error) {
                    console.error(`❌ Error updating ${team.name}:`, error.message);
                } else {
                    console.log(`✅ Updated: ${team.name} (${team.short_name})`);
                    updatedCount++;
                }
            } else {
                // Insert new team
                const { error } = await supabase
                    .from('teams')
                    .insert({
                        team_id: team.team_id,
                        name: team.name,
                        short_name: team.short_name
                    });

                if (error) {
                    console.error(`❌ Error adding ${team.name}:`, error.message);
                } else {
                    console.log(`✨ Added: ${team.name} (${team.short_name})`);
                    addedCount++;
                }
            }
        }

        console.log('\n📈 Summary:');
        console.log(`   ✨ Added: ${addedCount} teams`);
        console.log(`   ✅ Updated: ${updatedCount} teams`);
        console.log(`   Total ICC Teams: ${iccTeams.length}`);

        // Verify final count
        const { data: allTeams } = await supabase
            .from('teams')
            .select('team_id, name, short_name')
            .order('name');

        console.log(`\n🏏 Total teams in database: ${allTeams?.length || 0}`);
        console.log('\n📋 All Teams:');
        allTeams?.forEach(team => {
            console.log(`   ${team.name.padEnd(20)} (${team.short_name})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addICCTeams();
