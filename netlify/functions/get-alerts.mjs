// 기상특보 조회 함수 (온디맨드 + 2분 캐싱)
// 사용자 요청 시 호출, 마지막 호출 후 2분 이내면 캐시 반환

// 메모리 캐시 (서버리스 환경에서는 요청 간 공유 안됨, Blob Storage 필요)
let alertsCache = {
    lastUpdate: 0,
    data: null
};

const CACHE_TTL = 120000; // 2분 (밀리초)

export default async function handler(request, context) {
    const now = Date.now();

    // CORS 헤더
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=60'
    };

    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        // Netlify Blobs에서 캐시 확인 (영구 저장소)
        const blobStore = context.blobs ? await context.blobs('cache') : null;
        let cached = null;

        if (blobStore) {
            try {
                const cachedStr = await blobStore.get('weather_alerts');
                if (cachedStr) {
                    cached = JSON.parse(cachedStr);
                }
            } catch (e) {
                console.log('캐시 읽기 실패:', e.message);
            }
        } else {
            // Blobs 사용 불가 시 메모리 캐시 사용
            cached = alertsCache;
        }

        // 캐시가 있고 2분 이내면 캐시 반환
        if (cached && cached.lastUpdate && (now - cached.lastUpdate) < CACHE_TTL) {
            console.log('📦 캐시 사용, 나이:', Math.round((now - cached.lastUpdate) / 1000), '초');
            return new Response(JSON.stringify({
                success: true,
                source: 'cache',
                lastUpdate: cached.lastUpdate,
                age: Math.round((now - cached.lastUpdate) / 1000),
                data: cached.data
            }), { status: 200, headers });
        }

        // API 호출
        console.log('🔄 기상청 API 호출 중...');
        const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
        const apiUrl = `https://apihub.kma.go.kr/api/typ01/cgi-bin/wrn/wrn_now_data.php?wrn=W&mode=0&disp=0&authKey=${API_KEY}`;

        const response = await fetch(apiUrl);
        const text = await response.text();

        // 데이터 파싱
        const alerts = parseWrnNowData(text);

        // 캐시 저장
        const cacheData = {
            lastUpdate: now,
            data: alerts
        };

        if (blobStore) {
            try {
                await blobStore.set('weather_alerts', JSON.stringify(cacheData));
            } catch (e) {
                console.log('캐시 저장 실패:', e.message);
            }
        } else {
            alertsCache = cacheData;
        }

        return new Response(JSON.stringify({
            success: true,
            source: 'api',
            lastUpdate: now,
            data: alerts
        }), { status: 200, headers });

    } catch (error) {
        console.error('기상특보 조회 오류:', error);

        // 오류 시 이전 캐시라도 반환
        if (alertsCache.data) {
            return new Response(JSON.stringify({
                success: true,
                source: 'stale_cache',
                lastUpdate: alertsCache.lastUpdate,
                data: alertsCache.data,
                error: error.message
            }), { status: 200, headers });
        }

        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}

// wrn_now_data 파싱 함수
function parseWrnNowData(text) {
    const alerts = [];
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;

        const parts = line.split(',');
        if (parts.length >= 7) {
            const zone = parts[0]?.trim();
            const warnType = parts[1]?.trim();
            const warnLevel = parts[2]?.trim();
            const startTime = parts[3]?.trim();
            const content = parts[6]?.trim();

            if (zone && warnType) {
                alerts.push({
                    zone,
                    warnType,
                    warnLevel,
                    startTime,
                    content,
                    raw: line
                });
            }
        }
    }

    return alerts;
}

// Netlify Functions 설정
export const config = {
    path: "/api/alerts"
};
