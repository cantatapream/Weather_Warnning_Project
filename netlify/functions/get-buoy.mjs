// 부이 데이터 조회 함수 (콤마/공백 혼용 파싱 지원)
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
        if (blobStore) {
            try {
                const cachedStr = await blobStore.get('buoy_data_all');
                if (cachedStr) {
                    const cached = JSON.parse(cachedStr);
                    if (now - cached.lastUpdate < 600000) { // 10분 캐시
                        return new Response(JSON.stringify({ success: true, source: 'cache', data: cached.data }), { status: 200, headers });
                    }
                }
            } catch (e) { }
        }

        const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';
        const apiUrl = `https://apihub.kma.go.kr/api/typ01/url/sea_obs.php?stn=0&authKey=${API_KEY}`;

        const response = await fetch(apiUrl);
        const buffer = await response.arrayBuffer();
        const text = new TextDecoder('euc-kr').decode(buffer);
        const buoyData = parseBuoyData(text);

        const cacheData = { lastUpdate: now, data: buoyData };
        if (blobStore) await blobStore.set('buoy_data_all', JSON.stringify(cacheData));

        return new Response(JSON.stringify({ success: true, source: 'api', data: buoyData }), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

function parseBuoyData(text) {
    const buoys = {};
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;

        // 콤마(,) 또는 공백(\s+) 모두 처리
        const p = line.includes(',') ? line.split(',') : line.trim().split(/\s+/);

        if (p.length >= 10) {
            const stnId = p[2]?.trim();
            if (!stnId) continue;

            buoys[stnId] = {
                id: stnId, name: p[3]?.trim(), lat: parseFloat(p[5]), lon: parseFloat(p[4]),
                windDir: parseFloat(p[7]), windSpeed: parseFloat(p[8]),
                waveHeight: parseFloat(p[6]), airTemp: parseFloat(p[11]), waterTemp: parseFloat(p[10]),
                tm: p[1]?.trim()
            };
        }
    }
    return buoys;
}
