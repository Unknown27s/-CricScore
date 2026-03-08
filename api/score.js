const https = require('https');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

    const data = await fetchJSON('https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel');

    if (!data || !data.scores) {
        return res.status(500).json({ success: false, message: 'Failed to fetch cricket data' });
    }

    let allMatches = [];

    for (const league of data.scores) {
        if (!league.events) continue;
        for (const event of league.events) {
            const comps = event.competitions[0].competitors;

            let keyPlayers = [];
            if (event.status.featuredAthletes && event.status.featuredAthletes.length > 0) {
                keyPlayers = event.status.featuredAthletes.map(a => ({
                    name: a.athlete.displayName,
                    role: a.displayName
                }));
            }

            allMatches.push({
                id: event.id,
                league: league.leagues ? league.leagues[0].name : 'Cricket',
                matchName: event.name,
                description: event.description || '',
                state: event.status.type.state, // 'in' = live, 'pre' = upcoming, 'post' = completed
                status: event.status.summary || event.status.type.description,
                team1: {
                    name: comps[0].team.abbreviation || comps[0].team.name,
                    score: comps[0].score || 'Yet to bat',
                    logo: comps[0].team.logo || '',
                    isWinner: comps[0].winner === 'true'
                },
                team2: {
                    name: comps[1].team.abbreviation || comps[1].team.name,
                    score: comps[1].score || 'Yet to bat',
                    logo: comps[1].team.logo || '',
                    isWinner: comps[1].winner === 'true'
                },
                players: keyPlayers,
                date: new Date(event.date).getTime()
            });
        }
    }

    // Sort Priority:
    // 1. World Cup / India matches ALWAYS first (even over live domestic matches)
    // 2. Live matches next (within same tier)
    // 3. Closest to current time (upcoming or recently finished)
    allMatches.sort((a, b) => {
        const aIsMajor = isMajor(a);
        const bIsMajor = isMajor(b);

        if (aIsMajor && !bIsMajor) return -1;
        if (!aIsMajor && bIsMajor) return 1;

        if (a.state === 'in' && b.state !== 'in') return -1;
        if (a.state !== 'in' && b.state === 'in') return 1;

        const now = Date.now();
        return Math.abs(now - a.date) - Math.abs(now - b.date);
    });

    return res.json({
        success: allMatches.length > 0,
        featured: allMatches[0] || null,
        upcoming: allMatches.slice(1, 7)
    });
};

function isMajor(match) {
    const l = match.league.toLowerCase();
    const n = match.matchName.toLowerCase();
    return l.includes('world cup') || l.includes('international') ||
           n.includes('india') || n.includes('ind v') ||
           n.includes('ind vs') || n.includes('australia') ||
           n.includes('england') || n.includes('pakistan');
}

function fetchJSON(url) {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve(JSON.parse(raw)); } catch { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}
