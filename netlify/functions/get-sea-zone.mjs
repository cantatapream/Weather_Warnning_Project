// 해구별 기상 정보 조회 함수 (검색 유연성 극대화)
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
                // 캐시가 2시간 이내면 사용
                if (cached && (now - cached.lastUpdate < 7200000)) {
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

        return new Response(JSON.stringify({ success: true, source: 'api', data: [], message: '데이터를 찾을 수 없습니다.' }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchLatestHubSeaForecast(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;

    // 숫자형 해구 번호 처리 (예: 221, 231-5)
    let parts = String(zoneId).split('-');
    let lZone = parts[0];
    let sZone = parts[1] || '';

    const kstOffset = 9 * 60 * 60 * 1000;

    // 현재 시간부터 최대 48시간(이틀) 전까지 거슬러 올라가며 데이터 탐색
    for (let i = 0; i < 48; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);

        // 정시(HH:00) 기준으로 조회
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

            // 데이터 유효성 검사 (확인하여 주시기 바랍니다... 등의 메시지 제외)
            if (text.length > 300 && !text.includes('Error') && !text.includes('확인하여') && !text.includes('없습니다')) {
                const parsed = parseHubMarineText(text);
                if (parsed && parsed.length > 0) {
                    console.log(`[SeaZone] Success for ${zoneId} at baseTime: ${tm}`);
                    return parsed;
                }
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
        // Typ06 데이터는 보통 15개 이상의 컬럼을 가짐
        if (p.length >= 10) {
            // 결측치 필터링 (-999, -99.0 등)
            const parseV = (v) => {
                const n = parseFloat(v);
                return n < -90 ? 0 : n; // 에러값은 0으로 처리하거나 필터링
            };

            result.push({
                tm: p[1],
                wd: parseV(p[6]), ws: parseV(p[7]),
                wh: parseV(p[10]), waveDir: parseV(p[11]), wp: parseV(p[12]),
                ta: parseV(p[13]), tw: parseV(p[14])
            });
        }
    }
    return result;
}
