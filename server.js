const express = require('express');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const axios = require('axios'); // For fetching cricket scores or Tenor GIFs if needed later

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (your high-ad-revenue website)
app.use(express.static(path.join(__dirname, 'public')));

// Your ad-friendly website's URL (change this once hosted on Vercel/Netlify)
const WEBSITE_URL = `http://localhost:${PORT}`;

// ------------- WHATSAPP BOT SETUP -------------
// We use LocalAuth so you don't have to scan the QR code every time the server restarts
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Good for server deployments
    }
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone (WhatsApp Web)
    console.log('SCAN THIS QR CODE WITH WHATSAPP TO LINK THE BOT:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp Cricket Bot is ready and running!');
});

// Listen for messages
client.on('message', async msg => {
    const text = msg.body.toLowerCase();

    // Check if the user is asking for the score or cricket updates
    if (text.includes('score') || text.includes('cricket') || text.includes('match') || text === 'hi' || text === 'hello') {

        try {
            // Fetch live scores from a free public API (ESPNcricinfo open API)
            const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel');
            const scores = response.data.scores;

            let selectedEvent = null;
            // 1. Try to find a live match first
            for (const league of scores) {
                if (league.events) {
                    const liveEvent = league.events.find(e => e.status.type.state === 'in');
                    if (liveEvent) {
                        selectedEvent = liveEvent;
                        break;
                    }
                }
            }
            // 2. Fallback to any recent/completed match
            if (!selectedEvent) {
                for (const league of scores) {
                    if (league.events && league.events.length > 0) {
                        selectedEvent = league.events[0];
                        break;
                    }
                }
            }

            let liveScoreMessage = `🏆 *LIVE CRICKET UPDATE* 🏆\n\nNo matches found.`;

            if (selectedEvent) {
                const name = selectedEvent.name;
                const status = selectedEvent.status.summary || selectedEvent.status.type.description;
                const comps = selectedEvent.competitions[0].competitors;

                const t1 = comps[0];
                const t2 = comps[1];

                const t1Name = t1.team.abbreviation || t1.team.name;
                const t1Score = t1.score || "Yet to bat";
                const t2Name = t2.team.abbreviation || t2.team.name;
                const t2Score = t2.score || "Yet to bat";

                liveScoreMessage = `🏆 *LIVE CRICKET UPDATE* 🏆\n\n🏏 *${name}*\n\n🔹 *${t1Name}*: ${t1Score}\n🔹 *${t2Name}*: ${t2Score}\n\n📌 *Status*: ${status}\n\nWant to see the *Boundary GIF* and the *Full Scorecard*? 👇\n\n🔗 ${WEBSITE_URL}?match=latest`;
            }

            msg.reply(liveScoreMessage);
            console.log('Sent live score update to a user.');
        } catch (error) {
            console.error('Error fetching score:', error.message);
            msg.reply(`🏆 *LIVE CRICKET UPDATE* 🏆\n\nFailed to fetch the live score at the moment. Try again later!\n\n🔗 ${WEBSITE_URL}`);
        }
    }
});

// Start the WhatsApp Client
client.initialize();

// ------------- EXPRESS SERVER -------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/score', async (req, res) => {
    try {
        const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel');
        const scores = response.data.scores;
        
        let allMatches = [];
        
        // Extract all events across all leagues
        for (const league of scores) {
            if (league.events) {
                for (const event of league.events) {
                    const comps = event.competitions[0].competitors;
                    
                    // Look for featured athletes (current batters, bowlers, or player of the match)
                    let keyPlayers = [];
                    if (event.status.featuredAthletes && event.status.featuredAthletes.length > 0) {
                        keyPlayers = event.status.featuredAthletes.map(athlete => ({
                            name: athlete.athlete.displayName,
                            role: athlete.displayName
                        }));
                    }

                    allMatches.push({
                        id: event.id,
                        league: league.leagues ? league.leagues[0].name : league.name,
                        matchName: event.name,
                        description: event.description,
                        state: event.status.type.state, // 'in' (live), 'pre' (upcoming), 'post' (completed)
                        status: event.status.summary || event.status.type.description,
                        team1: {
                            name: comps[0].team.abbreviation || comps[0].team.name,
                            score: comps[0].score || "Yet to bat",
                            logo: comps[0].team.logo,
                            isWinner: comps[0].winner === "true"
                        },
                        team2: {
                            name: comps[1].team.abbreviation || comps[1].team.name,
                            score: comps[1].score || "Yet to bat",
                            logo: comps[1].team.logo,
                            isWinner: comps[1].winner === "true"
                        },
                        players: keyPlayers,
                        date: new Date(event.date).getTime()
                    });
                }
            }
        }

        // Prioritize: World Cup / India / Major matches FIRST, then Live status, then Date.
        allMatches.sort((a, b) => {
            const aIsMajor = a.league.toLowerCase().includes('world cup') || a.league.toLowerCase().includes('international') || a.matchName.toLowerCase().includes('india') || a.matchName.toLowerCase().includes('ind v');
            const bIsMajor = b.league.toLowerCase().includes('world cup') || b.league.toLowerCase().includes('international') || b.matchName.toLowerCase().includes('india') || b.matchName.toLowerCase().includes('ind v');
            
            // 1. Major taking absolute precedence over domestic minor
            if (aIsMajor && !bIsMajor) return -1;
            if (!aIsMajor && bIsMajor) return 1;
            
            // 2. Both are major or both are minor -> Live matches next
            if (a.state === 'in' && b.state !== 'in') return -1;
            if (a.state !== 'in' && b.state === 'in') return 1;
            
            // 3. Closest to Current Date (Upcoming first if very close, or recent completed)
            const now = Date.now();
            return Math.abs(now - a.date) - Math.abs(now - b.date);
        });

        if (allMatches.length > 0) {
            const featuredMatch = allMatches[0];
            const otherMatches = allMatches.slice(1, 6); 

            res.json({
                success: true,
                featured: featuredMatch,
                upcoming: otherMatches
            });
        } else {
            res.json({ success: false, message: "No matches found." });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Start the Web Server
app.listen(PORT, () => {
    console.log(`🚀 Ad-Revenue Website is running on port ${PORT}`);
    console.log(`👉 Visit: ${WEBSITE_URL}`);
});
