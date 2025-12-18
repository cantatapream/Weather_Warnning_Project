/**
 * 🌊 해구별 기상 정보 조회 서비스 (API 파라미터 최종 보정 버전)
 */
export default async function handler(request, context) {
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
        const result = await fetchMarineForecastSecurely(zoneCode);
        return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchMarineForecastSecurely(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;

    let lZone = String(zoneId).split('-')[0].replace(/[^0-9]/g, '');
    let sZone = String(zoneId).split('-')[1] || '0';

    const kstOffset = 9 * 60 * 60 * 1000;
    let lastRawResponse = "";

    for (let i = 0; i < 24; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);

        // YYYYMMDDHH00 포맷
        const tm = d.getUTCFullYear() +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            String(d.getUTCDate()).padStart(2, '0') +
            String(d.getUTCHours()).padStart(2, '0') + '00';

        // tm_fc 파라미터가 Typ06 정석
        let url = `${baseUrl}?tm_fc=${tm}&Lzone=${lZone}&Szone=${sZone}&help=1&authKey=${API_KEY}`;

        try {
            const resp = await fetch(url);
            const buffer = await resp.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);
            lastRawResponse = text.substring(0, 100).replace(/[\r\n]/g, ' ');

            const hasData = text.split('\n').some(line => {
                const trimmed = line.trim();
                return trimmed && !trimmed.startsWith('#') && /^[0-9]/.test(trimmed);
            });

            if (hasData) {
                const data = parseMarineData(text, sZone);
                if (data.length > 0) {
                    return { success: true, source: 'api', baseTime: tm, data: data };
                }
            }
        } catch (e) { continue; }
    }

    return {
        success: true,
        source: 'api',
        data: [],
        message: "현재 이용 가능한 해구 예보 데이터가 없습니다.",
        debug: lastRawResponse
    };
}

function parseMarineData(text, sZoneTarget) {
    const lines = text.split('\n');
    const results = [];

    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const p = line.trim().split(/\s+/);

        if (p.length >= 10) {
            if (sZoneTarget !== '0' && p[3] !== sZoneTarget) continue;

            const parseV = (v) => {
                const n = parseFloat(v);
                return (isNaN(n) || n < -90) ? 0 : n;
            };

            results.push({
                tm: p[1],
                wd: parseV(p[6]), ws: parseV(p[7]),
                wh: parseV(p[10]), waveDir: parseV(p[11]), wp: parseV(p[12]),
                ta: parseV(p[13]), tw: parseV(p[14])
            });
        }
    }
    return results.sort((a, b) => a.tm.localeCompare(b.tm));
}
