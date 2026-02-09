import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPlayers() {
    const { data: indiaPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', 1);

    console.log('India players:', indiaPlayers?.length);
    console.log('Sample:', indiaPlayers?.slice(0, 3).map(p => ({ id: p.player_id, name: p.name })));
}

checkPlayers();
