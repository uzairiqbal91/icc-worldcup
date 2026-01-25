import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyData() {
    console.log('='.repeat(70));
    console.log('DATABASE VERIFICATION - ALL TABLES');
    console.log('='.repeat(70));

    // TEAMS
    console.log('\n' + '─'.repeat(70));
    console.log('TABLE: teams');
    console.log('─'.repeat(70));
    const { data: teams } = await supabase.from('teams').select('*');
    console.log(JSON.stringify(teams, null, 2));

    // PLAYERS
    console.log('\n' + '─'.repeat(70));
    console.log('TABLE: players');
    console.log('─'.repeat(70));
    const { data: players } = await supabase.from('players').select('*').order('name');
    console.log(`Total players: ${players?.length}`);
    console.log(JSON.stringify(players, null, 2));

    // SCORES
    console.log('\n' + '─'.repeat(70));
    console.log('TABLE: scores');
    console.log('─'.repeat(70));
    const { data: scores } = await supabase.from('scores').select('*').eq('match_id', 121406);
    console.log(`Total score records: ${scores?.length}`);
    console.log(JSON.stringify(scores, null, 2));

    // MATCHES
    console.log('\n' + '─'.repeat(70));
    console.log('TABLE: matches');
    console.log('─'.repeat(70));
    const { data: matches } = await supabase.from('matches').select('*').eq('match_id', 121406);
    console.log(JSON.stringify(matches, null, 2));

    // EVENTS - Summary
    console.log('\n' + '─'.repeat(70));
    console.log('TABLE: events (Summary)');
    console.log('─'.repeat(70));
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('match_id', 121406)
        .order('event_time');

    console.log(`Total events: ${events?.length}\n`);

    for (const event of events || []) {
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`EVENT: ${event.event_type}`);
        console.log(`${'═'.repeat(70)}`);
        console.log(`ID: ${event.id}`);
        console.log(`Time: ${event.event_time}`);
        console.log('\nPAYLOAD:');
        console.log(JSON.stringify(event.payload, null, 2));
    }

    console.log('\n' + '='.repeat(70));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(70));
}

verifyData();
