/**
 * 🌊 해구별 기상 정보 조회 서비스 (최종 최적화 버전)
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
        const data = await fetchMarineForecast(zoneCode);
        if (data && data.length > 0) {
            return new Response(JSON.stringify({ success: true, source: 'api', data: data }), { status: 200, headers });
        }

        return new Response(JSON.stringify({
            success: true,
            source: 'api',
            data: [],
            message: "최신 예보 데이터를 찾을 수 없습니다. 잠시 후 다시 시도해주세요."
        }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchMarineForecast(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;

    // 대해구(Lzone) 번호 추출
    const lZone = String(zoneId).split('-')[0].replace(/[^0-9]/g, '');
    const sZone = String(zoneId).split('-')[1] || '';

    const kstOffset = 9 * 60 * 60 * 1000;

    // 최근 48시간 동안의 발표 시점을 역순으로 검색
    for (let i = 0; i < 48; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);
        const tm = d.getUTCFullYear() +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            String(d.getUTCDate()).padStart(2, '0') +
            String(d.getUTCHours()).padStart(2, '0') + '00';

        // tma_ef를 생략하여 해당 발표 시점의 전체 데이터를 한 번에 요청
        let url = `${baseUrl}?tma_fc=${tm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
        if (sZone) url += `&Szone=${sZone}`;

        try {
            const resp = await fetch(url);
            const buffer = await resp.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);

            // 데이터 유효성 검사 및 파싱
            if (text.includes('#') && text.length > 500 && !text.includes('없습니다')) {
                const results = parseMarineData(text, zoneId);
                if (results.length > 0) return results;
            }
        } catch (e) { continue; }
    }
    return null;
}

function parseMarineData(text, originalZoneId) {
    const lines = text.split('\n');
    const results = [];
    const sZoneTarget = originalZoneId.includes('-') ? originalZoneId.split('-')[1] : '';

    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const p = line.trim().split(/\s+/);

        if (p.length >= 15) {
            if (sZoneTarget && p[3] !== sZoneTarget) continue;

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
