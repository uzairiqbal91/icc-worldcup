
import { NextResponse } from 'next/server';
import { handlePlayingXI as hXI, handleToss as hToss } from '../../../worker/events';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const matchId = searchParams.get('matchId');

    if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

    const id = parseInt(matchId);

    try {
        if (type === 'PLAYING_XI') {
            await hXI(id);
            return NextResponse.json({ success: true, message: `Triggered Playing XI for ${id}` });
        }
        if (type === 'TOSS') {
            await hToss(id);
            return NextResponse.json({ success: true, message: `Triggered Toss for ${id}` });
        }

        return NextResponse.json({ error: "Invalid type. Use PLAYING_XI or TOSS" }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
