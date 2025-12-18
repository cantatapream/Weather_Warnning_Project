// 앞바다 기상예보 조회 함수 (스케줄: 05:30, 06:30, 17:30, 18:30)

const COASTAL_ZONE_CODES = [
    // 동해남부
    '12C10101', '12C10102', '12C10103', '12C10100',
    // 동해중부
    '12C20101', '12C20102', '12C20103', '12C20100',
    // 서해중부
    '12A20101', '12A20102', '12A20103', '12A20104', '12A20100',
    // 서해남부
    '22A30101', '22A30102', '22A30103', '22A30104', '22A30105', '12A30100',
    // 남해동부
    '12B20103', '12B20102', '12B20101', '12B20104', '12B20100',
    // 남해서부
    '12B10101', '12B10102', '12B10100',
    // 제주
    '12B10302', '12B10303', '12B10301', '12B10304', '12B10300'
];

let coastalCache = {
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
                const cachedStr = await blobStore.get('coastal_forecast');
                if (cachedStr) {
                    cached = JSON.parse(cachedStr);
                }
            } catch (e) {
                console.log('캐시 읽기 실패:', e.message);
            }
        } else {
            cached = coastalCache;
        }

        // 특정 구역 요청
        if (zoneCode) {
            if (cached && cached.data && cached.data[zoneCode]) {
                return new Response(JSON.stringify({
                    success: true,
                    source: 'cache',
                    lastUpdate: cached.lastUpdate,
                    data: cached.data[zoneCode]
                }), { status: 200, headers });
            }

            const data = await fetchCoastalForecast(zoneCode);
            return new Response(JSON.stringify({
                success: true,
                source: 'api',
                lastUpdate: now,
                data: data
            }), { status: 200, headers });
        }

        // 전체 갱신
        console.log('🔄 앞바다 기상예보 전체 갱신 시작...');
        const allData = {};

        for (const code of COASTAL_ZONE_CODES) {
            try {
                const data = await fetchCoastalForecast(code);
                allData[code] = data;
                await new Promise(r => setTimeout(r, 200));
            } catch (e) {
                console.log(`구역 ${code} 조회 실패:`, e.message);
            }
        }

        // 캐시 저장
        const cacheData = {
            lastUpdate: now,
            data: allData
        };

        if (blobStore) {
            try {
                await blobStore.set('coastal_forecast', JSON.stringify(cacheData));
            } catch (e) {
                console.log('캐시 저장 실패:', e.message);
            }
        } else {
            coastalCache = cacheData;
        }

        return new Response(JSON.stringify({
            success: true,
            source: 'api',
            lastUpdate: now,
            count: Object.keys(allData).length
        }), { status: 200, headers });

    } catch (error) {
        console.error('앞바다 기상예보 조회 오류:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}

// 앞바다 기상예보 조회
async function fetchCoastalForecast(regId) {
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

// 스케줄 설정: 05:30, 06:30, 17:30, 18:30
export const config = {
    path: "/api/coastal",
    schedule: "30 5,6,17,18 * * *"
};
