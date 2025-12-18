/**
 * 🌊 해구별 기상 정보 조회 서비스 (지능형 검색 및 디버깅 강화 버전)
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

    // 대해구(Lzone) 번호를 3자리 숫자로 보정 (예: 221 -> 221, 1 -> 001)
    let lZone = String(zoneId).split('-')[0].replace(/[^0-9]/g, '').padStart(3, '0');
    const sZone = String(zoneId).split('-')[1] || '';

    const kstOffset = 9 * 60 * 60 * 1000;
    let lastRawResponse = "";

    // 최근 48시간을 뒤져서 데이터가 있는 가장 최신 발표 시점 찾기
    for (let i = 0; i < 48; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);
        const tm = d.getUTCFullYear() +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            String(d.getUTCDate()).padStart(2, '0') +
            String(d.getUTCHours()).padStart(2, '0') + '00';

        let url = `${baseUrl}?tma_fc=${tm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
        if (sZone) url += `&Szone=${sZone}`;

        try {
            const resp = await fetch(url);
            const buffer = await resp.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);
            lastRawResponse = text.substring(0, 200).replace(/[\r\n]/g, ' ');

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
        message: "기상청에서 해당 구역의 자료를 찾을 수 없습니다.",
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
            if (sZoneTarget && p[3] !== sZoneTarget && p[3] !== '0') continue;

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
