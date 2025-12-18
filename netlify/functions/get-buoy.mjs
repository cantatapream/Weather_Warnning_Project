// 부이관측 데이터 조회 함수 (온디맨드)
// 사용자 요청 시 API 호출, 메모리 캐시 사용

let buoyCache = {
    lastUpdate: 0,
    data: null
};

const CACHE_TTL = 600000; // 10분 (밀리초)

export default async function handler(request, context) {
    const now = Date.now();

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        // 메모리 캐시 확인 (10분 이내면 캐시 반환)
        if (buoyCache.data && buoyCache.lastUpdate && (now - buoyCache.lastUpdate) < CACHE_TTL) {
            console.log('📦 부이 캐시 사용, 나이:', Math.round((now - buoyCache.lastUpdate) / 1000), '초');
            return new Response(JSON.stringify({
                success: true,
                source: 'cache',
                lastUpdate: buoyCache.lastUpdate,
                age: Math.round((now - buoyCache.lastUpdate) / 1000),
                data: buoyCache.data
            }), { status: 200, headers });
        }

        // API 호출
        console.log('🔄 부이 API 호출 중...');
        const API_KEY = process.env.KMA_HUB_KEY || '';

        if (!API_KEY) {
            console.error('API 키가 설정되지 않음');
            return new Response(JSON.stringify({
                success: false,
                error: 'API key not configured'
            }), { status: 500, headers });
        }

        const apiUrl = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?stn=0&help=0&authKey=${API_KEY}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        // EUC-KR 인코딩 처리
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buffer);

        console.log('부이 API 응답 (처음 200자):', text.substring(0, 200));

        // 데이터 파싱
        const buoyData = parseBuoyData(text);
        console.log('파싱된 부이 수:', buoyData.length);

        // 캐시 저장
        buoyCache = {
            lastUpdate: now,
            data: buoyData
        };

        return new Response(JSON.stringify({
            success: true,
            source: 'api',
            lastUpdate: now,
            data: buoyData
        }), { status: 200, headers });

    } catch (error) {
        console.error('부이 데이터 조회 오류:', error.message);

        // 이전 캐시가 있으면 반환
        if (buoyCache.data) {
            return new Response(JSON.stringify({
                success: true,
                source: 'stale_cache',
                lastUpdate: buoyCache.lastUpdate,
                data: buoyCache.data
            }), { status: 200, headers });
        }

        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}

// 부이 데이터 파싱
function parseBuoyData(text) {
    const buoys = [];
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;

        const parts = line.trim().split(/\s+/);

        // sea_obs.php 응답 포맷:
        // TP(0), TM(1), STN_ID(2), STN_KO(3), LON(4), LAT(5), WH(6), WD(7), WS(8), WS_GST(9), TW(10), TA(11), PA(12), HM(13)
        if (parts.length >= 10) {
            const stnId = parts[2];
            const stnName = parts[3];
            const lon = parseFloat(parts[4]);
            const lat = parseFloat(parts[5]);
            const wh = parseFloat(parts[6]) || 0;
            const wd = parseFloat(parts[7]) || 0;
            const ws = parseFloat(parts[8]) || 0;
            const tw = parts.length > 10 ? parseFloat(parts[10]) || 0 : 0;
            const ta = parts.length > 11 ? parseFloat(parts[11]) || 0 : 0;

            if (stnId && !isNaN(lon) && !isNaN(lat)) {
                buoys.push({
                    id: stnId,
                    name: stnName,
                    lat: lat,
                    lon: lon,
                    windDir: wd,
                    windSpd: ws,
                    temp: ta || tw,
                    waveHeight: wh,
                    wavePeriod: 0
                });
            }
        }
    }

    return buoys;
}
