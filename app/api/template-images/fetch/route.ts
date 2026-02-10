import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'team' or 'player'
        const name = searchParams.get('name');
        const templateType = searchParams.get('template_type');
        const milestone = searchParams.get('milestone');

        if (!type || !name) {
            return NextResponse.json(
                { success: false, error: 'type and name are required' },
                { status: 400 }
            );
        }

        let query;

        if (type === 'team') {
            // Query teams table to get team_id by name
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('id')
                .ilike('name', name)
                .single();

            if (teamError || !teamData) {
                return NextResponse.json({
                    success: true,
                    image: null,
                    message: 'Team not found in database',
                });
            }

            // Get team logo from template_images
            query = supabase
                .from('template_images')
                .select('*')
                .eq('team_id', teamData.id)
                .eq('image_type', 'logo')
                .order('created_at', { ascending: false })
                .limit(1);

        } else if (type === 'player') {
            // Query players table to get player_id by name
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('id')
                .ilike('name', name)
                .single();

            if (playerError || !playerData) {
                return NextResponse.json({
                    success: true,
                    image: null,
                    message: 'Player not found in database',
                });
            }

            // Get player image from template_images
            query = supabase
                .from('template_images')
                .select('*')
                .eq('player_id', playerData.id)
                .eq('image_type', 'template');

            // Filter by template_type if provided
            if (templateType) {
                query = query.eq('template_type', templateType);
            }

            // Filter by milestone if provided
            if (milestone) {
                query = query.eq('milestone', milestone);
            }

            query = query.order('created_at', { ascending: false }).limit(1);
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid type. Must be "team" or "player"' },
                { status: 400 }
            );
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        const image = data && data.length > 0 ? data[0] : null;

        return NextResponse.json({
            success: true,
            image: image ? { url: image.image_url, ...image } : null,
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
