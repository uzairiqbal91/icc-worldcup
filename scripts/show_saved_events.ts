import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function showData() {
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('match_id', 121406)
        .order('event_time', { ascending: true });

    console.log('\n' + '='.repeat(60));
    console.log('SAVED EVENTS IN DATABASE');
    console.log('='.repeat(60) + '\n');

    for (const event of events || []) {
        console.log('─'.repeat(60));
        console.log(`EVENT: ${event.event_type}`);
        console.log('─'.repeat(60));
        console.log(`ID: ${event.id}`);
        console.log(`Match ID: ${event.match_id}`);
        console.log(`Time: ${event.event_time}`);
        console.log(`Processed: ${event.is_processed}`);
        console.log('\nPAYLOAD:');
        console.log(JSON.stringify(event.payload, null, 2));
        console.log('\n');
    }

    console.log('='.repeat(60));
    console.log(`Total: ${events?.length || 0} events`);
    console.log('='.repeat(60));
}

showData();
