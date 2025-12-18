// 기상특보 조회 함수
const CACHE_TTL = 120000; // 2분
let alertsCache = { lastUpdate: 0, data: null };

export default async function handler(request, context) {
    const now = Date.now();
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    try {
        const blobStore = context.blobs ? await context.blobs('cache') : null;
        let cached = null;
        if (blobStore) {
            try {
                const cachedStr = await blobStore.get('weather_alerts');
                if (cachedStr) cached = JSON.parse(cachedStr);
            } catch (e) { console.log('캐시 읽기 실패:', e.message); }
        }
        if (!cached) cached = alertsCache;

        if (cached && cached.data && (now - cached.lastUpdate) < CACHE_TTL) {
            return new Response(JSON.stringify({ success: true, source: 'cache', data: cached.data }), { status: 200, headers });
        }

        const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
        const apiUrl = `https://apihub.kma.go.kr/api/typ01/url/wrn_now_data.php?mode=1&authKey=${API_KEY}`;

        const response = await fetch(apiUrl);
        const buffer = await response.arrayBuffer();
        const text = new TextDecoder('euc-kr').decode(buffer);
        const alerts = parseWrnNowData(text);

        const cacheData = { lastUpdate: now, data: alerts };
        if (blobStore) await blobStore.set('weather_alerts', JSON.stringify(cacheData));
        alertsCache = cacheData;

        return new Response(JSON.stringify({ success: true, source: 'api', data: alerts }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

function parseWrnNowData(text) {
    const alerts = [];
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const p = line.split(',');
        if (p.length >= 8) {
            alerts.push({
                zone: p[3]?.trim(),
                warnType: p[6]?.trim(),
                level: p[7]?.trim(),
                startTime: p[5]?.trim(),
                raw: line
            });
        }
    }
    return alerts;
}
