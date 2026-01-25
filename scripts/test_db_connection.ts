
import dotenv from 'dotenv';
import path from 'path';

// Load env vars FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testConnection() {
    console.log("Testing Supabase Connection...");
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    // console.log("Key:", process.env.SUPABASE_SERVICE_ROLE_KEY); // Don't log full key

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is missing/undefined!");
        return;
    }

    // Dynamic import to ensure it uses the loaded env
    const { supabase } = await import('../lib/supabase');

    const { data, error } = await supabase.from('matches').select('count', { count: 'exact', head: true });

    if (error) {
        console.error("Connection Failed:", error.message);
    } else {
        console.log("Connection Successful. Match count:", data);

        // Try inserting a dummy event to check write permissions
        const { error: insertError } = await supabase.from('events').insert({
            event_type: 'TEST_CONNECTION',
            payload: { message: 'Hello Supabase' }
        });

        if (insertError) {
            console.error("Insert Failed:", insertError.message);
        } else {
            console.log("Insert Successful: Test event created.");
        }
    }
}

testConnection();
