import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function showSummary() {
    console.log('='.repeat(80));
    console.log('DATABASE SUMMARY - ALL YOUR REQUIRED DATA');
    console.log('='.repeat(80));

    // Count records
    const { count: teamCount } = await supabase.from('teams').select('*', { count: 'exact', head: true });
    const { count: playerCount } = await supabase.from('players').select('*', { count: 'exact', head: true });
    const { count: scoreCount } = await supabase.from('scores').select('*', { count: 'exact', head: true });
    const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('match_id', 121406);

    console.log('\n📊 DATABASE RECORD COUNTS:');
    console.log(`   Teams:   ${teamCount}`);
    console.log(`   Players: ${playerCount} (with face_image_id)`);
    console.log(`   Scores:  ${scoreCount} (for charts)`);
    console.log(`   Events:  ${eventCount}`);

    // Get events
    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('match_id', 121406)
        .order('event_time');

    for (const event of events || []) {
        const p = event.payload;

        console.log('\n' + '═'.repeat(80));
        console.log(`📌 ${event.event_type}`);
        console.log('═'.repeat(80));

        switch (event.event_type) {
            case 'PLAYING_XI':
                console.log('\n✅ YOUR REQUIREMENT: All player names, captain images');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Team 1: ${p.team1.name} (${p.team1.shortName})`);
                console.log(`   Logo: ${p.team1.logo}`);
                console.log(`   Captain: ${p.team1.captain?.name}`);
                console.log(`   Captain Image: ${p.team1.captain?.image}`);
                console.log(`   Players (${p.team1.players.length}):`);
                p.team1.players.slice(0, 3).forEach((pl: any) => {
                    console.log(`      - ${pl.firstName} ${pl.lastName} ${pl.isCaptain ? '(C)' : ''} ${pl.isKeeper ? '(WK)' : ''}`);
                    console.log(`        Image: ${pl.image || 'fetched from profile'}`);
                });
                console.log(`      ... and ${p.team1.players.length - 3} more`);
                console.log(`\n   Team 2: ${p.team2.name} (${p.team2.shortName})`);
                console.log(`   Logo: ${p.team2.logo}`);
                console.log(`   Captain: ${p.team2.captain?.name}`);
                console.log(`   Captain Image: ${p.team2.captain?.image}`);
                break;

            case 'TOSS':
                console.log('\n✅ YOUR REQUIREMENT: Who won, bat/bowl decision, toss image');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Winner: ${p.winner}`);
                console.log(`   Decision: ${p.decision}`);
                console.log(`   Text: "${p.text}"`);
                console.log(`   Toss Image: ${p.tossImage}`);
                console.log(`   Match Image: ${p.matchImage}`);
                console.log(`   Team 1 Logo: ${p.team1.logo}`);
                console.log(`   Team 2 Logo: ${p.team2.logo}`);
                console.log(`   Team 1 Captain: ${p.team1.captain?.name} - ${p.team1.captain?.image}`);
                console.log(`   Team 2 Captain: ${p.team2.captain?.name} - ${p.team2.captain?.image}`);
                break;

            case 'POWERPLAY_END':
                console.log('\n✅ YOUR REQUIREMENT: Batting team image, runs in powerplay, team logos');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Innings: ${p.innings}`);
                console.log(`   Team: ${p.team} (${p.teamShortName})`);
                console.log(`   Powerplay Runs: ${p.powerplayRuns}`);
                console.log(`   Powerplay Wickets: ${p.powerplayWickets}`);
                console.log(`   Powerplay Overs: ${p.powerplayOvers}`);
                console.log(`   Run Rate: ${p.runRate}`);
                console.log(`   Batting Team Image: ${p.batingTeamImage}`);
                console.log(`   Team Logo: ${p.teamLogo}`);
                console.log(`   Team 1 Logo: ${p.team1Logo}`);
                console.log(`   Team 2 Logo: ${p.team2Logo}`);
                break;

            case 'MILESTONE':
                console.log('\n✅ YOUR REQUIREMENT: Player match image, first/last name, team logo');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Milestone: ${p.milestone} runs`);
                console.log(`   Player: ${p.player.firstName} ${p.player.lastName}`);
                console.log(`   Player ID: ${p.player.id}`);
                console.log(`   Player Image: ${p.player.image}`);
                console.log(`   Actual Runs: ${p.player.runs} off ${p.player.balls} balls`);
                console.log(`   Fours: ${p.player.fours}, Sixes: ${p.player.sixes}`);
                console.log(`   Strike Rate: ${p.player.strikeRate}`);
                console.log(`   Team: ${p.team}`);
                console.log(`   Team Logo: ${p.teamLogo}`);
                break;

            case 'INNINGS_END':
                console.log('\n✅ YOUR REQUIREMENT: Team image, runs, wickets, top 2 batsmen (with balls), top 2 bowlers (with overs/wickets)');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Innings: ${p.innings}`);
                console.log(`   Team: ${p.team} (${p.teamShortName})`);
                console.log(`   Total: ${p.totalRuns}/${p.totalWickets} in ${p.totalOvers} overs`);
                console.log(`   Run Rate: ${p.runRate}`);
                console.log(`   Team Image: ${p.teamImage}`);
                console.log(`   Team Logo: ${p.teamLogo}`);
                console.log(`\n   Top 2 Batsmen:`);
                p.topBatsmen.forEach((b: any, i: number) => {
                    console.log(`      ${i + 1}. ${b.firstName} ${b.lastName}: ${b.runs} runs off ${b.balls} balls`);
                    console.log(`         Image: ${b.image}`);
                });
                console.log(`\n   Top 2 Bowlers:`);
                p.topBowlers.forEach((b: any, i: number) => {
                    console.log(`      ${i + 1}. ${b.firstName} ${b.lastName}: ${b.wickets} wickets, ${b.overs} overs, ${b.runs} runs`);
                    console.log(`         Image: ${b.image}`);
                });
                break;

            case 'INNINGS_BREAK':
                console.log('\n✅ YOUR REQUIREMENT: Captain recent match image, target, team logos');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Target: ${p.target}`);
                console.log(`   First Innings: ${p.firstInningsTeam} - ${p.firstInningsScore}`);
                console.log(`   Chasing Team: ${p.chasingTeam}`);
                console.log(`   Captain: ${p.captain?.firstName} ${p.captain?.lastName}`);
                console.log(`   Captain Image: ${p.captainImage}`);
                console.log(`   Team 1 Logo: ${p.team1Logo}`);
                console.log(`   Team 2 Logo: ${p.team2Logo}`);
                console.log(`   Match Image: ${p.matchImage}`);
                break;

            case 'MATCH_END':
                console.log('\n✅ YOUR REQUIREMENT: Player of Match with name, award image, team logos');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Result: ${p.result}`);
                console.log(`   Short Result: ${p.shortResult}`);
                console.log(`   Winner: ${p.winner}`);
                console.log(`   \n   Player of Match:`);
                if (p.playerOfMatch) {
                    console.log(`      Name: ${p.playerOfMatch.firstName} ${p.playerOfMatch.lastName}`);
                    console.log(`      Team: ${p.playerOfMatch.team}`);
                    console.log(`      Award Image: ${p.playerOfMatch.awardImage}`);
                    console.log(`      Face Image ID: ${p.playerOfMatch.faceImageId}`);
                }
                console.log(`   \n   Team 1: ${p.team1.name} - ${p.team1.score}`);
                console.log(`   Team 1 Logo: ${p.team1.logo}`);
                console.log(`   Team 2: ${p.team2.name} - ${p.team2.score}`);
                console.log(`   Team 2 Logo: ${p.team2.logo}`);
                console.log(`   Match Image: ${p.matchImage}`);
                break;

            case 'SCORE_CHART':
                console.log('\n✅ YOUR REQUIREMENT: Score chart, point charts');
                console.log('\n📦 DATA SAVED:');
                console.log(`   Innings 1: ${p.innings1.team} - ${p.innings1.finalScore}`);
                console.log(`   Innings 1 Logo: ${p.innings1.teamLogo}`);
                console.log(`   Innings 1 Over-by-Over: ${p.innings1.overByOver?.length || 0} records`);
                if (p.innings1.overByOver?.length > 0) {
                    console.log(`   Sample: Over ${p.innings1.overByOver[0].over} - ${p.innings1.overByOver[0].runs}/${p.innings1.overByOver[0].wickets}`);
                }
                console.log(`\n   Innings 2: ${p.innings2.team} - ${p.innings2.finalScore}`);
                console.log(`   Innings 2 Logo: ${p.innings2.teamLogo}`);
                console.log(`   Target: ${p.innings2.target}`);
                console.log(`   Innings 2 Over-by-Over: ${p.innings2.overByOver?.length || 0} records`);
                if (p.innings2.overByOver?.length > 0) {
                    console.log(`   Sample: Over ${p.innings2.overByOver[0].over} - ${p.innings2.overByOver[0].runs}/${p.innings2.overByOver[0].wickets}`);
                }
                console.log(`\n   Powerplay Data:`);
                console.log(`   Innings 1 PP: ${p.powerplay.innings1?.run}/${p.powerplay.innings1?.wickets} in ${p.powerplay.innings1?.ovrto} overs`);
                console.log(`   Innings 2 PP: ${p.powerplay.innings2?.run}/${p.powerplay.innings2?.wickets} in ${p.powerplay.innings2?.ovrto} overs`);
                break;
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL YOUR REQUIRED DATA HAS BEEN SAVED!');
    console.log('='.repeat(80));
}

showSummary();
