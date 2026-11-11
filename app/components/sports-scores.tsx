type Competitor = { team?: { displayName?: string; abbreviation?: string; logo?: string }; score?: string; winner?: boolean };
type Event = {
  id: string;
  name?: string;
  date?: string;
  competitions?: Array<{ competitors?: Competitor[]; status?: { type?: { description?: string; detail?: string; shortDetail?: string; state?: string } } }>;
};
type League = { label: string; sport: string; league: string; href: string };

const leagues: League[] = [
  { label: "NBA", sport: "basketball", league: "nba", href: "https://www.espn.com/nba/scoreboard" },
  { label: "NFL", sport: "football", league: "nfl", href: "https://www.espn.com/nfl/scoreboard" },
  { label: "MLB", sport: "baseball", league: "mlb", href: "https://www.espn.com/mlb/scoreboard" },
  { label: "NHL", sport: "hockey", league: "nhl", href: "https://www.espn.com/nhl/scoreboard" },
  { label: "Soccer", sport: "soccer", league: "eng.1", href: "https://www.espn.com/soccer/scoreboard" },
];

async function getScores(league: League) {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${league.sport}/${league.league}/scoreboard`,
      { next: { revalidate: 180 }, signal: AbortSignal.timeout(7000) }
    );
    if (!response.ok) return { league, events: [] as Event[] };
    const data = await response.json() as { events?: Event[] };
    return { league, events: Array.isArray(data.events) ? data.events.slice(0, 5) : [] };
  } catch {
    return { league, events: [] as Event[] };
  }
}

export default async function SportsScores({ compact = false }: { compact?: boolean }) {
  const results = await Promise.all(leagues.map(getScores));
  const available = results.filter((result) => result.events.length > 0);
  const displayed = compact ? available.slice(0, 3) : available;

  return (
    <section className={compact ? "ctSportsScores ctSportsScoresCompact" : "ctSportsScores"} aria-labelledby="ct-sports-title">
      <div className="ctSportsHead">
        <div>
          <span className="ctSportsEyebrow">CONNECT SPORTS DESK</span>
          <h2 id="ct-sports-title">Scores, games & matchups</h2>
          <p>Follow game-day action across major leagues, all in one place.</p>
        </div>
        <span className="ctSportsUpdated">↻ Updates about every 3 minutes</span>
      </div>
      {displayed.length ? (
        <div className="ctSportsLeagueGrid">
          {displayed.map(({ league, events }) => (
            <section className="ctSportsLeague" key={league.label} aria-label={league.label + " scores"}>
              <div className="ctSportsLeagueHead"><strong>{league.label}</strong><a href={league.href} target="_blank" rel="noopener noreferrer">Full scoreboard ↗</a></div>
              {events.slice(0, compact ? 1 : 5).map((event) => {
                const competition = event.competitions?.[0];
                const competitors = competition?.competitors ?? [];
                const status = competition?.status?.type?.shortDetail ?? competition?.status?.type?.detail ?? competition?.status?.type?.description ?? "Scheduled";
                const state = competition?.status?.type?.state;
                return (
                  <article className="ctSportsGame" key={event.id}>
                    <div className="ctSportsGameStatus"><span className={state === "in" ? "ctSportsLiveDot" : "ctSportsStatusDot"} />{status}</div>
                    {competitors.map((competitor, index) => (
                      <div className="ctSportsTeam" key={competitor.team?.abbreviation ?? index}>
                        <span>{competitor.team?.displayName ?? "Team"}</span>
                        <strong>{competitor.score ?? "—"}</strong>
                      </div>
                    ))}
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <div className="ctSportsEmpty">No current games or scores are available right now. Check a league scoreboard for its upcoming schedule.</div>
      )}
      <p className="ctSportsDisclaimer">Scores and game details are provided by ESPN&apos;s public scoreboard feeds. Coverage and update timing may vary. ConnectTime is not affiliated with ESPN.</p>
    </section>
  );
}
