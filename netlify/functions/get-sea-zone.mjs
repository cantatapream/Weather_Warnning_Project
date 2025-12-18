// 해구별 기상 정보 조회 함수 (숫자형 해구 번호 최적화 및 검색 효율 개선)
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
        const data = await fetchLatestHubSeaForecast(zoneCode);
        if (data && data.length > 0) {
            return new Response(JSON.stringify({ success: true, source: 'api', data: data }), { status: 200, headers });
        }

        return new Response(JSON.stringify({ success: true, source: 'api', data: [], message: '해당 구역의 최신 데이터를 찾을 수 없습니다.' }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchLatestHubSeaForecast(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;

    // 대해구 번호만 추출 (숫자 3자리 최적화)
    let lZone = String(zoneId).split('-')[0].replace(/[^0-9]/g, '');

    const kstOffset = 9 * 60 * 60 * 1000;

    // 최근 48시간을 정시 기준으로 탐색
    for (let i = 0; i < 48; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);

        const tm = d.getUTCFullYear() +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            String(d.getUTCDate()).padStart(2, '0') +
            String(d.getUTCHours()).padStart(2, '0') + '00';

        let url = `${baseUrl}?tma_fc=${tm}&tma_ef=${tm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;

        try {
            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);

            if (text.length > 300 && !text.includes('Error') && !text.includes('확인하여') && !text.includes('없습니다')) {
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
