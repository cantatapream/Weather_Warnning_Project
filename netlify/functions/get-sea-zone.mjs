// 해구별 기상 정보 조회 함수 (Hub API 전용)
let seaZoneCache = { lastUpdate: 0, data: {} };

export default async function handler(request, context) {
    const now = Date.now();
    const url = new URL(request.url);
    const zoneCode = url.searchParams.get('code');
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
                const cachedStr = await blobStore.get('sea_zone_forecast');
                if (cachedStr) cached = JSON.parse(cachedStr);
            } catch (e) { console.log('캐시 읽기 실패:', e.message); }
        }
        if (!cached) cached = seaZoneCache;

        // 특정 해구 요청 시
        if (zoneCode) {
            if (cached && cached.data && cached.data[zoneCode]) {
                return new Response(JSON.stringify({ success: true, source: 'cache', data: cached.data[zoneCode] }), { status: 200, headers });
            }
            const data = await fetchHubSeaForecast(zoneCode);
            return new Response(JSON.stringify({ success: true, source: 'api', data: data }), { status: 200, headers });
        }

        return new Response(JSON.stringify({ success: false, error: 'No zone code provided' }), { status: 400, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchHubSeaForecast(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const tm = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 10); // 오늘 날짜

    // 3일치 데이터를 가져오기 위해 0시간부터 72시간까지 순회 (기본 0, 12, 24... 등 예시)
    // 여기서는 가장 최신 1개 시점 예시를 보여줌 (실제 앱 로직에 맞춰 확장 가능)
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;
    const lZone = zoneId.split('-')[0];
    const sZone = zoneId.split('-')[1] || '';

    let url = `${baseUrl}?tma_fc=${tm}00&tma_ef=${tm}00&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
    if (sZone) url += `&Szone=${sZone}`;

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder('euc-kr').decode(buffer);

    return parseHubMarineText(text);
}

function parseHubMarineText(text) {
    const lines = text.split('\n');
    const result = [];
    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const p = line.trim().split(/\s+/);
        if (p.length >= 15) {
            result.push({
                tm: p[1], windDir: parseFloat(p[6]), ws: parseFloat(p[7]),
                wh: parseFloat(p[10]), waveDir: parseFloat(p[11]), wp: parseFloat(p[12]),
                ta: parseFloat(p[13]), tw: parseFloat(p[14])
            });
        }
    }
    return result;
}
