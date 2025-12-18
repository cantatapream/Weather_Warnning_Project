/**
 * 🌊 해구별 기상 정보 조회 서비스 (최종 통합 버전)
 * 하나의 발표 시각(tma_fc)에 대해 전체 예보 기간 데이터를 수집하여 반환합니다.
 */
export default async function handler(request, context) {
    const now = Date.now();
    const url = new URL(request.url);
    const zoneCode = url.searchParams.get('code'); // 예: "231-5" 또는 "221"
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!zoneCode) return new Response(JSON.stringify({ success: false, error: 'code is required' }), { status: 400, headers });

    try {
        const data = await fetchFullMarineForecast(zoneCode);
        if (data && data.length > 0) {
            return new Response(JSON.stringify({ success: true, source: 'api', data: data }), { status: 200, headers });
        }

        return new Response(JSON.stringify({
            success: true,
            source: 'api',
            data: [],
            message: `해당 구역(${zoneCode})의 예보 데이터를 찾을 수 없습니다.`
        }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchFullMarineForecast(zoneId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;

    // 대해구(Lzone)와 소해구(Szone) 분리
    const parts = String(zoneId).split('-');
    const lZone = parts[0].replace(/[^0-9]/g, '');
    const sZone = parts[1] || '';

    const kstOffset = 9 * 60 * 60 * 1000;

    // 1. 유효한 최신 발표 시각(tma_fc) 찾기
    let validFcTime = null;

    for (let i = 0; i < 48; i++) {
        const d = new Date(Date.now() + kstOffset);
        d.setHours(d.getHours() - i);
        const tm = d.getUTCFullYear() +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            String(d.getUTCDate()).padStart(2, '0') +
            String(d.getUTCHours()).padStart(2, '0') + '00';

        let testUrl = `${baseUrl}?tma_fc=${tm}&tma_ef=${tm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
        if (sZone) testUrl += `&Szone=${sZone}`;

        try {
            const resp = await fetch(testUrl);
            const text = await resp.text();
            if (text.length > 400 && !text.includes('Error') && !text.includes('없습니다')) {
                validFcTime = tm;
                break;
            }
        } catch (e) { continue; }
    }

    if (!validFcTime) return null;

    // 2. 향후 72시간 데이터를 병렬로 수집
    const fetchPromises = [];
    for (let h = 0; h <= 72; h += 1) { // 1시간 간격으로 72시간치 조회
        const fetchTime = (targetHour) => {
            const fd = new Date(
                parseInt(validFcTime.substring(0, 4)),
                parseInt(validFcTime.substring(4, 6)) - 1,
                parseInt(validFcTime.substring(6, 8)),
                parseInt(validFcTime.substring(8, 10)) + targetHour
            );
            const efTm = fd.getFullYear() +
                String(fd.getMonth() + 1).padStart(2, '0') +
                String(fd.getDate()).padStart(2, '0') +
                String(fd.getHours()).padStart(2, '0') + '00';

            let efUrl = `${baseUrl}?tma_fc=${validFcTime}&tma_ef=${efTm}&Lzone=${lZone}&help=1&authKey=${API_KEY}`;
            if (sZone) efUrl += `&Szone=${sZone}`;

            return fetch(efUrl)
                .then(r => r.arrayBuffer())
                .then(buf => new TextDecoder('euc-kr').decode(buf))
                .then(text => parseLine(text))
                .catch(() => null);
        };
        fetchPromises.push(fetchTime(h));
    }

    const allResponses = await Promise.all(fetchPromises);
    const forecastResults = allResponses.filter(item => item !== null);

    return forecastResults.sort((a, b) => a.tm.localeCompare(b.tm));
}

function parseLine(text) {
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        const p = line.trim().split(/\s+/);
        if (p.length >= 10) {
            const parseV = (v) => {
                const n = parseFloat(v);
                return n < -90 ? 0 : n;
            };
            return {
                tm: p[1],
                wd: parseV(p[6]), ws: parseV(p[7]),
                wh: parseV(p[10]), waveDir: parseV(p[11]), wp: parseV(p[12]),
                ta: parseV(p[13]), tw: parseV(p[14])
            };
        }
    }
    return null;
}
