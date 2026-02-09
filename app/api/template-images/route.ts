import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Fetch saved template images
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('team_id');
        const imageType = searchParams.get('image_type'); // 'template' or 'logo'
        const milestone = searchParams.get('milestone');
        const templateType = searchParams.get('template_type'); // 'toss', 'powerplay', 'milestone', etc.

        let query = supabase
            .from('template_images')
            .select('*')
            .order('created_at', { ascending: false });

        if (teamId) {
            query = query.eq('team_id', parseInt(teamId));
        }
        if (imageType) {
            query = query.eq('image_type', imageType);
        }
        if (milestone) {
            if (milestone === 'null') {
                query = query.is('milestone', null);
            } else {
                query = query.eq('milestone', milestone);
            }
        }
        // Filter by template_type - this ensures toss images only show in toss template, etc.
        if (templateType) {
            if (templateType === 'null') {
                query = query.is('template_type', null);
            } else {
                query = query.eq('template_type', templateType);
            }
        }

        const { data: images, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ images });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Save a new template image
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { team_id, image_url, image_type, milestone, description, template_type } = body;

        if (!image_url || !image_type) {
            return NextResponse.json(
                { error: 'image_url and image_type are required' },
                { status: 400 }
            );
        }

        // Check for duplicates
        // For LOGOS: only check team_id + image_url + image_type (logos are reusable across templates)
        // For TEMPLATES: check team_id + image_url + image_type + template_type + milestone
        let duplicateQuery = supabase
            .from('template_images')
            .select('id')
            .eq('image_url', image_url)
            .eq('image_type', image_type);

        if (team_id) {
            duplicateQuery = duplicateQuery.eq('team_id', team_id);
        } else {
            duplicateQuery = duplicateQuery.is('team_id', null);
        }

        // Only check milestone and template_type for template images, not for logos
        if (image_type === 'template') {
            if (milestone) {
                duplicateQuery = duplicateQuery.eq('milestone', milestone);
            } else {
                duplicateQuery = duplicateQuery.is('milestone', null);
            }

            if (template_type) {
                duplicateQuery = duplicateQuery.eq('template_type', template_type);
            } else {
                duplicateQuery = duplicateQuery.is('template_type', null);
            }
        }

        const { data: existing, error: queryError } = await duplicateQuery.maybeSingle();

        if (existing) {
            // Image already exists, return the existing one
            return NextResponse.json({ image: existing, duplicate: true }, { status: 200 });
        }

        const { data, error } = await supabase
            .from('template_images')
            .insert({
                team_id: team_id || null,
                image_url,
                image_type,
                milestone: milestone || null,
                description: description || null,
                template_type: template_type || null
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ image: data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove a saved image
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get('id');

        if (!imageId) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('template_images')
            .delete()
            .eq('id', parseInt(imageId));

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
