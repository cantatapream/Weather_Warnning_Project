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

const CACHE_TTL = 300000; // 5분 (밀리초)

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
                const cachedStr = await blobStore.get('coastal_alerts');
                if (cachedStr) {
                    cached = JSON.parse(cachedStr);
                }
            } catch (e) {
                console.log('캐시 읽기 실패:', e.message);
            }
        } else {
            cached = coastalCache;
        }

        // 캐시가 있고 5분 이내면 캐시 반환
        if (cached && cached.data && cached.lastUpdate && (now - cached.lastUpdate) < CACHE_TTL) {
            console.log('📦 연안 특보 캐시 사용, 나이:', Math.round((now - cached.lastUpdate) / 1000), '초');
            return new Response(JSON.stringify({
                success: true,
                source: 'cache',
                lastUpdate: cached.lastUpdate,
                data: cached.data
            }), { status: 200, headers });
        }

        // 수동 갱신 (또는 캐시 만료 시)
        console.log('🔄 연안 특보 API 호출 중 (AFSO)...');
        const data = await fetchAfsoCoastalData();

        const cacheData = {
            lastUpdate: now,
            data: data
        };

        if (blobStore) {
            try {
                await blobStore.set('coastal_alerts', JSON.stringify(cacheData));
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
            data: data
        }), { status: 200, headers });

    } catch (error) {
        console.error('연안 특보 조회 오류:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}

// AFSO API에서 연안바다 특보 수집
async function fetchAfsoCoastalData() {
    const now = new Date();
    const tmFc = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0');

    const apiUrl = `https://afso.kma.go.kr/afsOut/mmr/warning/retMmrWarningSeaNow.kajx?tmFc=${tmFc}&stnId=108&fe=f&mmr=mmr&tmFe=`;

    const response = await fetch(apiUrl);
    const result = await response.json();

    const metData = result.data?.metData || result.metData;
    if (!metData) return {};

    const coastalAlerts = {};
    for (const item of metData) {
        const regKo = item.regKo || '';
        if (!regKo.includes('연안바다') && !regKo.includes('평수구')) continue;
        if (!item.wrnTp || item.wrnTp.trim() === '') continue;

        let zoneName = regKo.replace(/\s+/g, '');
        if (zoneName.endsWith('평수구') && !zoneName.endsWith('평수구역')) {
            zoneName = zoneName + '역';
        }

        coastalAlerts[zoneName] = {
            zoneName: zoneName,
            warnType: item.wrnTp === '해일' ? '폭풍해일' : item.wrnTp,
            level: item.lvl === '3' ? '경보' : (item.lvl === '2' ? '주의보' : '예비특보'),
            startTime: item.tmEf,
            endTime: item.tmFe,
            content: item.t1,
            isCoastal: true,
            source: 'AFSO'
        };
    }
    return coastalAlerts;
}

// Netlify Functions 설정 (온디맨드 함수)
// 경로: /.netlify/functions/get-coastal
