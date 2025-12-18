// 연안바다 특보 수집 함수
const CACHE_TTL = 300000; // 5분
let coastalCache = { lastUpdate: 0, data: {} };

export default async function handler(request, context) {
    const now = Date.now();
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    try {
        const blobStore = context.blobs ? await context.blobs('cache') : null;
        let cached = null;

        if (blobStore) {
            try {
                const cachedStr = await blobStore.get('coastal_alerts');
                if (cachedStr) cached = JSON.parse(cachedStr);
            } catch (e) { console.log('Blob 캐시 읽기 실패:', e.message); }
        }

        if (!cached) cached = coastalCache;

        if (cached && cached.data && (now - cached.lastUpdate) < CACHE_TTL) {
            return new Response(JSON.stringify({ success: true, source: 'cache', data: cached.data }), { status: 200, headers });
        }

        const data = await fetchAfsoCoastalData();
        const cacheData = { lastUpdate: now, data: data };

        if (blobStore) {
            try { await blobStore.set('coastal_alerts', JSON.stringify(cacheData)); }
            catch (e) { console.log('Blob 저장 실패:', e.message); }
        }
        coastalCache = cacheData;

        return new Response(JSON.stringify({ success: true, source: 'api', data: data }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

async function fetchAfsoCoastalData() {
    const now = new Date();
    const tmFc = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
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
        if (zoneName.endsWith('평수구') && !zoneName.endsWith('평수구역')) zoneName = zoneName + '역';

        coastalAlerts[zoneName] = {
            zoneName: zoneName,
            warnType: item.wrnTp === '해일' ? '폭풍해일' : item.wrnTp,
            level: item.lvl === '3' ? '경보' : (item.lvl === '2' ? '주의보' : '예비특보'),
            startTime: item.tmEf,
            isCoastal: true,
            source: 'AFSO'
        };
    }
    return coastalAlerts;
}
