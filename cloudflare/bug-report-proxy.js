

const ALLOWED_ORIGINS = [
    'https://dulcearte-29.web.app',
    'https://sameiflovi.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:5500',
    'https://dulcearte.bessie-viberossa.workers.dev',
    'https://dulcearte29.netlify.app/'
];

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const headers = corsHeaders(origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers });
        }

        try {
            const incoming = await request.formData();
            const photo = incoming.get('photo');
            const caption = (incoming.get('caption') || '').toString().substring(0, 1024);

            if (!photo) {
                return new Response(JSON.stringify({ ok: false, error: 'Falta la foto' }), {
                    status: 400,
                    headers: { ...headers, 'Content-Type': 'application/json' }
                });
            }

            const telegramForm = new FormData();
            telegramForm.append('chat_id', env.TELEGRAM_CHAT_ID);
            telegramForm.append('photo', photo, 'bug_report.png');
            telegramForm.append('caption', caption);
            telegramForm.append('parse_mode', 'Markdown');

            const tgResponse = await fetch(
                `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
                { method: 'POST', body: telegramForm }
            );

            if (!tgResponse.ok) {
                const errText = await tgResponse.text();
                return new Response(JSON.stringify({ ok: false, error: errText }), {
                    status: 502,
                    headers: { ...headers, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ ok: false, error: error.message }), {
                status: 500,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }
    }
};
