// 해구별 기상 정보 조회 함수 (404 에러 방지 및 검색 강화)
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
    if (!zoneCode) return new Response(JSON.stringify({ success: false, error: 'code is required' }), { status: 400, headers });

    try {
        const blobStore = context.blobs ? await context.blobs('cache') : null;
        if (blobStore) {
            try {
                const cached = await blobStore.get(`sea_zone_${zoneCode}`, { type: 'json' });
                if (cached && (now - cached.lastUpdate < 3600000)) { // 1시간 캐시
                    return new Response(JSON.stringify({ success: true, source: 'cache', data: cached.data }), { status: 200, headers });
                }
            } catch (e) { }
        }

        const data = await fetchLatestHubSeaForecast(zoneCode);
        if (data && data.length > 0) {
            const cacheData = { lastUpdate: now, data: data };
            if (blobStore) await blobStore.set(`sea_zone_${zoneCode}`, JSON.stringify(cacheData));
            return new Response(JSON.stringify({ success: true, source: 'api', data: data }), { status: 200, headers });
        }

        // 데이터가 정말 없는 경우 (404 대신 빈 배열을 주어 앱이 멈추지 않게 함)
        return new Response(JSON.stringify({ success: true, source: 'api', data: [], message: 'No data found' }), { status: 200, headers });
    } catch (error) {
        console.error(`[SeaZone] Error for ${zoneCode}:`, error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchLatestHubSeaForecast(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;

    // 숫자형 해구 번호 처리 (예: 221)
    const parts = String(zoneId).split('-');
    const lZone = parts[0];
    const sZone = parts[1] || '';

    const kstOffset = 9 * 60 * 60 * 1000;

    for (let i = 0; i < 24; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);

        const tm = d.getUTCFullYear() +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            String(d.getUTCDate()).padStart(2, '0') +
            String(d.getUTCHours()).padStart(2, '0') + '00';

        let url = `${baseUrl}?tma_fc=${tm}&tma_ef=${tm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
        if (sZone) url += `&Szone=${sZone}`;

        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);

            // "데이터가 없습니다" 문구가 들어있지 않고, 내용이 어느 정도 있는 경우 데이터로 인정
            if (text.length > 200 && !text.includes('Error') && !text.includes('확인하여')) {
                const parsed = parseHubMarineText(text);
                if (parsed.length > 0) return parsed;
            }
        } catch (e) { continue; }
    }
    return null;
}

function parseHubMarineText(text) {
    const result = [];
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const p = line.trim().split(/\s+/);
        if (p.length >= 15) {
            result.push({
                tm: p[1],
                wd: parseFloat(p[6]), ws: parseFloat(p[7]),
                wh: parseFloat(p[10]), waveDir: parseFloat(p[11]), wp: parseFloat(p[12]),
                ta: parseFloat(p[13]), tw: parseFloat(p[14])
            });
        }
    }
    return result;
}
