// 해구별 기상 정보 조회 함수 (발표 시각 자동 검색 로직 추가)
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
                const cachedStr = await blobStore.get(`sea_zone_${zoneCode}`);
                if (cachedStr) {
                    cached = JSON.parse(cachedStr);
                    // 캐시가 3시간 이내면 사용
                    if (now - cached.lastUpdate < 3 * 3600000) {
                        return new Response(JSON.stringify({ success: true, source: 'cache', data: cached.data }), { status: 200, headers });
                    }
                }
            } catch (e) { console.log('캐시 읽기 실패:', e.message); }
        }

        const data = await fetchLatestHubSeaForecast(zoneCode);
        if (data && data.length > 0) {
            const cacheData = { lastUpdate: now, data: data };
            if (blobStore) await blobStore.set(`sea_zone_${zoneCode}`, JSON.stringify(cacheData));
            return new Response(JSON.stringify({ success: true, source: 'api', data: data }), { status: 200, headers });
        }

        return new Response(JSON.stringify({ success: false, error: '데이터를 찾을 수 없습니다.' }), { status: 404, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchLatestHubSeaForecast(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;
    const lZone = zoneId.split('-')[0];
    const sZone = zoneId.split('-')[1] || '';

    // 현재 시간부터 1시간씩 뒤로 가며 데이터가 있는지 확인 (최대 24시간)
    for (let i = 0; i < 24; i++) {
        const d = new Date();
        d.setHours(d.getHours() - i);
        const tm = d.toISOString().replace(/[^0-9]/g, '').substring(0, 10) + '00'; // YYYYMMDDHH 형식

        let url = `${baseUrl}?tma_fc=${tm}&tma_ef=${tm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
        if (sZone) url += `&Szone=${sZone}`;

        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);

            // 데이터가 유효한지 확인 (헤더만 있는 경우 제외)
            if (text.length > 300 && !text.includes('Error') && !text.includes('없습니다')) {
                console.log(`[SeaZone] Found valid data at ${tm}`);
                return parseHubMarineText(text);
            }
        } catch (e) { continue; }
    }
    return null;
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
    // 시간순 정렬
    return result.sort((a, b) => a.tm.localeCompare(b.tm));
}
