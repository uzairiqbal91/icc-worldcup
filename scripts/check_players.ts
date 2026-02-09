import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPlayers() {
    const { data: players, error } = await supabase
        .from('players')
        .select('player_id, name, team_id')
        .limit(10);

    const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true });

    console.log('Total players:', count);
    console.log('Sample players:', JSON.stringify(players, null, 2));
}

checkPlayers();
