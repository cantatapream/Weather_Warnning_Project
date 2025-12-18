// 앞바다 기상예보 자동 수집 함수 (스케줄: 05:30, 06:30, 17:30, 18:30)
// 모든 앞바다 구역의 예보 데이터를 수집하여 Netlify Blob에 저장

const COASTAL_ZONE_CODES = [
    '12C10101', '12C10102', '12C10103', '12C10100',
    '12C20101', '12C20102', '12C20103', '12C20100',
    '12A20101', '12A20102', '12A20103', '12A20104', '12A20100',
    '22A30101', '22A30102', '22A30103', '22A30104', '22A30105', '12A30100',
    '12B20103', '12B20102', '12B20101', '12B20104', '12B20100',
    '12B10101', '12B10102', '12B10100',
    '12B10302', '12B10303', '12B10301', '12B10304', '12B10300'
];

export default async function handler(request, context) {
    console.log('⏰ [Cron] 앞바다 기상예보 전체 갱신 시작...');
    const now = Date.now();
    const blobStore = context.blobs ? await context.blobs('cache') : null;

    if (!blobStore) {
        console.error('Blob Storage를 사용할 수 없습니다.');
        return;
    }

    const allData = {};
    const API_KEY = process.env.KMA_HUB_KEY || 'ZKEQU5ukRvGhEFObpBbxVw';

    for (const code of COASTAL_ZONE_CODES) {
        try {
            const url = `https://apihub.kma.go.kr/api/typ02/openApi/VilageFcstMsgService/getSeaFcst?pageNo=1&numOfRows=30&dataType=JSON&regId=${code}&authKey=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.response?.body?.items?.item) {
                let items = data.response.body.items.item;
                if (!Array.isArray(items)) items = [items];
                allData[code] = items;
            }
            // API 부하 방지
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.warn(`[Cron] 구역 ${code} 조회 실패:`, e.message);
        }
    }

    const count = Object.keys(allData).length;
    console.log(`⏰ [Cron] 수집 완료: ${count}개 구역`);

    if (count > 0) {
        const cacheData = {
            lastUpdate: now,
            data: allData
        };
        await blobStore.set('coastal_forecast', JSON.stringify(cacheData));
        console.log('⏰ [Cron] Blob Storage에 저장 완료');
    }
}

export const config = {
    schedule: "30 5,6,17,18 * * *"
};
