const https = require('https');

exports.handler = async function (event, context) {
    const data = await fetchJSON('https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel');

    if (!data || !data.scores) {
        return { statusCode: 500, body: JSON.stringify({ success: false, message: 'API fetch failed' }) };
    }

    let allMatches = [];

    for (const league of data.scores) {
        if (league.events) {
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
                    description: event.description,
                    state: event.status.type.state,
                    status: event.status.summary || event.status.type.description,
                    team1: {
                        name: comps[0].team.abbreviation || comps[0].team.name,
                        score: comps[0].score || 'Yet to bat',
                        logo: comps[0].team.logo,
                        isWinner: comps[0].winner === 'true'
                    },
                    team2: {
                        name: comps[1].team.abbreviation || comps[1].team.name,
                        score: comps[1].score || 'Yet to bat',
                        logo: comps[1].team.logo,
                        isWinner: comps[1].winner === 'true'
                    },
                    players: keyPlayers,
                    date: new Date(event.date).getTime()
                });
            }
        }
    }

    // Sort: World Cup / India / Major FIRST, then Live, then Closest Date
    allMatches.sort((a, b) => {
        const aIsMajor = a.league.toLowerCase().includes('world cup') || a.league.toLowerCase().includes('international') || a.matchName.toLowerCase().includes('india') || a.matchName.toLowerCase().includes('ind v');
        const bIsMajor = b.league.toLowerCase().includes('world cup') || b.league.toLowerCase().includes('international') || b.matchName.toLowerCase().includes('india') || b.matchName.toLowerCase().includes('ind v');

        if (aIsMajor && !bIsMajor) return -1;
        if (!aIsMajor && bIsMajor) return 1;
        if (a.state === 'in' && b.state !== 'in') return -1;
        if (a.state !== 'in' && b.state === 'in') return 1;

        const now = Date.now();
        return Math.abs(now - a.date) - Math.abs(now - b.date);
    });

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            success: allMatches.length > 0,
            featured: allMatches[0] || null,
            upcoming: allMatches.slice(1, 6)
        })
    };
};

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}
