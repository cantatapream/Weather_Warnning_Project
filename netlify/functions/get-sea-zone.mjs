// 해구별 기상 예보 조회 함수 (스케줄: 00:30, 01:30, 12:30, 13:30)
// 모든 해구 데이터를 한번에 가져와서 캐시

const SEA_ZONE_CODES = [
    '12C10101', '12C10102', '12C10103', '12C10100', '12C10200',
    '12C20101', '12C20102', '12C20103', '12C20100', '12C20200',
    '12C30100', '12C30200',
    '12A10100', '12A10200',
    '12A20101', '12A20102', '12A20103', '12A20104', '12A20100', '12A20200',
    '22A30101', '22A30102', '22A30103', '22A30104', '22A30105', '12A30100', '12A30200',
    '12B20103', '12B20102', '12B20101', '12B20104', '12B20100', '12B20200',
    '12B10101', '12B10102', '12B10100', '12B10201', '12B10202',
    '12B10302', '12B10303', '12B10301', '12B10304', '12B10300', '12B10400'
];

let seaZoneCache = {
    lastUpdate: 0,
    data: {}
};

export default async function handler(request, context) {
    const now = Date.now();
    const url = new URL(request.url);
    const zoneCode = url.searchParams.get('code');

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
                const cachedStr = await blobStore.get('sea_zone_forecast');
                if (cachedStr) {
                    cached = JSON.parse(cachedStr);
                }
            } catch (e) {
                console.log('캐시 읽기 실패:', e.message);
            }
        } else {
            cached = seaZoneCache;
        }

        // 특정 해구 요청 시
        if (zoneCode) {
            // 캐시에 있으면 캐시에서 반환
            if (cached && cached.data && cached.data[zoneCode]) {
                return new Response(JSON.stringify({
                    success: true,
                    source: 'cache',
                    lastUpdate: cached.lastUpdate,
                    data: cached.data[zoneCode]
                }), { status: 200, headers });
            }

            // 없으면 개별 호출
            const data = await fetchZoneForecast(zoneCode);
            return new Response(JSON.stringify({
                success: true,
                source: 'api',
                lastUpdate: now,
                data: data
            }), { status: 200, headers });
        }

        // 전체 갱신 요청 (스케줄 함수에서 호출)
        console.log('🔄 해구별 기상 전체 갱신 시작...');
        const allData = {};

        for (const code of SEA_ZONE_CODES) {
            try {
                const data = await fetchZoneForecast(code);
                allData[code] = data;
                // API 부하 방지를 위한 딜레이
                await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                console.log(`해구 ${code} 조회 실패:`, e.message);
            }
        }

        // 캐시 저장
        const cacheData = {
            lastUpdate: now,
            data: allData
        };

        if (blobStore) {
            try {
                await blobStore.set('sea_zone_forecast', JSON.stringify(cacheData));
            } catch (e) {
                console.log('캐시 저장 실패:', e.message);
            }
        } else {
            seaZoneCache = cacheData;
        }

        return new Response(JSON.stringify({
            success: true,
            source: 'api',
            lastUpdate: now,
            count: Object.keys(allData).length
        }), { status: 200, headers });

    } catch (error) {
        console.error('해구별 기상 조회 오류:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}

// 개별 해구 예보 조회
async function fetchZoneForecast(regId) {
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
    const url = `https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstMsgService/getSeaFcst?pageNo=1&numOfRows=30&dataType=JSON&regId=${regId}&authKey=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.response?.body?.items?.item) {
        let items = data.response.body.items.item;
        if (!Array.isArray(items)) items = [items];
        return items;
    }

    return null;
}

// Netlify Functions 설정 (온디맨드 함수)
// 경로: /.netlify/functions/get-sea-zone
