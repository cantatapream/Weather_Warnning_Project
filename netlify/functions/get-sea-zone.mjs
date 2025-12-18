// 해구별 기상 정보 조회 함수 (한국 시간 시차 보정 완료)
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

        // 캐시 확인 시 zoneCode 포함하여 고유하게 관리
        if (blobStore) {
            try {
                const cachedStr = await blobStore.get(`sea_zone_${zoneCode}`);
                if (cachedStr) {
                    const cached = JSON.parse(cachedStr);
                    if (now - cached.lastUpdate < 3600000) { // 1시간 이내 캐시 사용
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
    const parts = zoneId.split('-');
    const lZone = parts[0];
    const sZone = parts[1] || '';

    // 한국 시간(KST, UTC+9) 계산
    const kstOffset = 9 * 60 * 60 * 1000;

    for (let i = 0; i < 24; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);

        // YYYYMMDDHH00 포맷 생성
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        const hour = String(d.getUTCHours()).padStart(2, '0');
        const tm = `${year}${month}${day}${hour}00`;

        let url = `${baseUrl}?tma_fc=${tm}&tma_ef=${tm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
        if (sZone) url += `&Szone=${sZone}`;

        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);

            if (text.length > 400 && !text.includes('Error') && !text.includes('없습니다')) {
                return parseHubMarineText(text);
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
                tm: p[1], windDir: parseFloat(p[6]), ws: parseFloat(p[7]),
                wh: parseFloat(p[10]), waveDir: parseFloat(p[11]), wp: parseFloat(p[12]),
                ta: parseFloat(p[13]), tw: parseFloat(p[14])
            });
        }
    }
    return result.sort((a, b) => a.tm.localeCompare(b.tm));
}
