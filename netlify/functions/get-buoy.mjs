// 부이관측 데이터 조회 함수 (스케줄 + 온디맨드)
// 매시 10분에 자동 호출, 또는 사용자 요청 시

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
        // Netlify Blobs 캐시 확인
        const blobStore = context.blobs ? await context.blobs('cache') : null;
        let cached = null;

        if (blobStore) {
            try {
                const cachedStr = await blobStore.get('buoy_data');
                if (cachedStr) {
                    cached = JSON.parse(cachedStr);
                }
            } catch (e) {
                console.log('캐시 읽기 실패:', e.message);
            }
        } else {
            cached = buoyCache;
        }

        // 캐시가 있고 10분 이내면 캐시 반환
        if (cached && cached.lastUpdate && (now - cached.lastUpdate) < CACHE_TTL) {
            console.log('📦 부이 캐시 사용, 나이:', Math.round((now - cached.lastUpdate) / 1000), '초');
            return new Response(JSON.stringify({
                success: true,
                source: 'cache',
                lastUpdate: cached.lastUpdate,
                age: Math.round((now - cached.lastUpdate) / 1000),
                data: cached.data
            }), { status: 200, headers });
        }

        // API 호출
        console.log('🔄 부이 API 호출 중...');
        const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
        const apiUrl = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?tm=0&ob=0&ef=8&authKey=${API_KEY}`;

        const response = await fetch(apiUrl);
        const text = await response.text();

        // 데이터 파싱
        const buoyData = parseBuoyData(text);

        // 캐시 저장
        const cacheData = {
            lastUpdate: now,
            data: buoyData
        };

        if (blobStore) {
            try {
                await blobStore.set('buoy_data', JSON.stringify(cacheData));
            } catch (e) {
                console.log('캐시 저장 실패:', e.message);
            }
        } else {
            buoyCache = cacheData;
        }

        return new Response(JSON.stringify({
            success: true,
            source: 'api',
            lastUpdate: now,
            data: buoyData
        }), { status: 200, headers });

    } catch (error) {
        console.error('부이 데이터 조회 오류:', error);

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

        const parts = line.split(/\s+/);
        if (parts.length >= 10) {
            buoys.push({
                id: parts[1],
                name: parts[2],
                lat: parseFloat(parts[3]),
                lon: parseFloat(parts[4]),
                windDir: parseFloat(parts[5]),
                windSpd: parseFloat(parts[6]),
                temp: parseFloat(parts[7]),
                waveHeight: parseFloat(parts[8]),
                wavePeriod: parseFloat(parts[9])
            });
        }
    }

    return buoys;
}

// 스케줄 설정: 매시 10분 (00:10, 01:10, ...)
// on-demand 경로: /.netlify/functions/get-buoy
export const config = {
    schedule: "10 * * * *"
};
