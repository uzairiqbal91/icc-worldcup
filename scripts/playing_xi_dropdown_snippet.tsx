// Playing XI Form - Player Dropdowns Section
// Replace lines 1046-1051 in app/templates/page.tsx

<div>
    <label className={labelClass}>Players (select 11 from {playingXIForm.teamName || 'team'})</label>
    {playingXIForm.teamName ? (
        <div className="grid grid-cols-2 gap-2">
            {[...Array(11)].map((_, index) => {
                const teamPlayers = players.filter(p => {
                    const team = teams.find(t => t.name.toUpperCase() === playingXIForm.teamName);
                    return team && p.team_id === team.team_id;
                });

                return (
                    <select
                        key={index}
                        className={inputClass}
                        value={playingXIForm.playerIds[index] || ''}
                        onChange={e => {
                            const newPlayerIds = [...playingXIForm.playerIds];
                            if (e.target.value) {
                                newPlayerIds[index] = parseInt(e.target.value);
                            } else {
                                newPlayerIds.splice(index, 1);
                            }
                            setPlayingXIForm(f => ({ ...f, playerIds: newPlayerIds }));
                        }}
                    >
                        <option value="">Player {index + 1}</option>
                        {teamPlayers.map(player => (
                            <option key={player.player_id} value={player.player_id}>
                                {player.name}
                            </option>
                        ))}
                    </select>
                );
            })}
        </div>
    ) : (
        <p className="text-sm text-gray-400 italic">Please select a team first</p>
    )}
</div>
