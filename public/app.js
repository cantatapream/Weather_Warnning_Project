// Configuration
const CONFIG = {
    // API 키는 서버(Netlify 환경변수)에 안전하게 저장됨
    // 클라이언트에서는 서버리스 함수를 통해 API 호출

    // 서버리스 함수 엔드포인트 (Netlify Functions)
    SERVERLESS_BASE_URL: '/.netlify/functions',

    // 기존 API 엔드포인트 (fallback용, CORS 프록시 필요)
    KMA_API_URL: 'https://apihub.kma.go.kr/api/typ01/url/wrn_now_data.php',
    BUOY_API_URL: 'https://apihub.kma.go.kr/api/typ01/url/sea_obs.php',
    PORTAL_API_URL: 'https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrWrnList',

    // CORS 프록시 설정 - corsproxy.io 사용
    USE_CORS_PROXY: true,
    CORS_PROXY: 'https://corsproxy.io/?',

    // 서버리스 함수 사용 여부 (true: 서버리스 함수, false: 직접 API 호출)
    USE_SERVERLESS: true,

    // 테스트 모드 - true로 설정하면 Mock 데이터 사용
    USE_MOCK_DATA: false
};


// ----------------------------------------------------------------------------
// Constants & Mappings
// ----------------------------------------------------------------------------

// 해역 분류 키워드 (기존 호환용 - 대분류 매칭)
const ZONE_CLASSIFICATION = {
    '동해': [
        '동해', '울릉도', '독도',
        '강원북부', '강원중부', '강원남부',  // 강원 앞바다
        '경북북부', '경북남부',  // 경북 앞바다
        '울산'  // 울산앞바다
    ],
    '서해': [
        '서해',
        '인천', '경기',  // 인천·경기 앞바다
        '충남',  // 충남북부/남부앞바다
        '전북',  // 전북북부/남부앞바다
        '전남북부서해', '전남중부서해', '전남남부서해'  // 전남 서해쪽
    ],
    '남해': [
        '남해',
        '부산', '거제', '경남',  // 부산, 거제, 경남 앞바다
        '전남서부남해', '전남동부남해'  // 전남 남해쪽
    ],
    '제주': [
        '제주', '추자도', '마라도', '가파도', '우도'
    ]
};

// ============================================================================
// 2단계 해역 분류 체계 (대분류 → 중분류 → 해역)
// ============================================================================

// 대분류 → 중분류 매핑
const SEA_REGIONS = {
    '동해': {
        subRegions: ['동해남부해상', '동해중부해상'],
        icon: '🌊'
    },
    '서해': {
        subRegions: ['서해중부해상', '서해남부해상'],
        icon: '🌅'
    },
    '남해': {
        subRegions: ['남해동부해상', '남해서부해상'],
        icon: '🏖️'
    },
    '제주': {
        subRegions: ['제주해역'],
        icon: '🏝️'
    }
};

// 중분류 → 해역 목록 (메인 해역만, 연안바다/평수구역 제외)
const SUB_REGION_ZONES = {
    '동해남부해상': [
        '동해남부앞바다',
        '울산앞바다',
        '경북남부앞바다',
        '경북북부앞바다',
        '동해남부남쪽안쪽먼바다',
        '동해남부남쪽바깥먼바다',
        '동해남부북쪽안쪽먼바다',
        '동해남부북쪽바깥먼바다'
    ],
    '동해중부해상': [
        '동해중부앞바다',
        '강원북부앞바다',
        '강원중부앞바다',
        '강원남부앞바다',
        '동해중부안쪽먼바다',
        '동해중부바깥먼바다'
    ],
    '서해중부해상': [
        '서해중부앞바다',
        '인천·경기북부앞바다',
        '인천·경기남부앞바다',
        '충남북부앞바다',
        '충남남부앞바다',
        '서해중부안쪽먼바다',
        '서해중부바깥먼바다'
    ],
    '서해남부해상': [
        '서해남부앞바다',
        '전북북부앞바다',
        '전북남부앞바다',
        '전남북부서해앞바다',
        '전남중부서해앞바다',
        '전남남부서해앞바다',
        '서해남부북쪽안쪽먼바다',
        '서해남부북쪽바깥먼바다',
        '서해남부남쪽안쪽먼바다',
        '서해남부남쪽바깥먼바다'
    ],
    '남해동부해상': [
        '남해동부앞바다',
        '부산앞바다',
        '경남서부남해앞바다',
        '경남중부남해앞바다',
        '거제시동부앞바다',
        '남해동부안쪽먼바다',
        '남해동부바깥먼바다'
    ],
    '남해서부해상': [
        '남해서부앞바다',
        '전남서부남해앞바다',
        '전남동부남해앞바다',
        '남해서부서쪽먼바다',
        '남해서부동쪽먼바다'
    ],
    '제주해역': [
        '제주도북부앞바다',
        '제주도남부앞바다',
        '제주도동부앞바다',
        '제주도서부앞바다',
        '제주도남서쪽먼바다',
        '제주도남동쪽먼바다',
        '제주도남쪽바깥먼바다'
    ]
};

// 특보 구역명 → 중분류 찾기
function getSubRegion(zoneName) {
    if (!zoneName) return null;

    // 연안바다/평수구역은 상위 해역으로 처리 (중 앞부분만 추출)
    const cleanName = zoneName.replace(/중.*(연안바다|평수구역).*$/, '');

    for (const [subRegion, zones] of Object.entries(SUB_REGION_ZONES)) {
        if (zones.some(zone => cleanName.includes(zone) || zone.includes(cleanName) || cleanName === zone)) {
            return subRegion;
        }
    }

    // 키워드 기반 폴백 매칭
    if (zoneName.includes('울산') || zoneName.includes('경북') ||
        (zoneName.includes('동해') && (zoneName.includes('남부') || zoneName.includes('남쪽')))) {
        return '동해남부해상';
    }
    if (zoneName.includes('강원') || zoneName.includes('울릉') || zoneName.includes('독도') ||
        (zoneName.includes('동해') && (zoneName.includes('중부') || zoneName.includes('바깥')))) {
        return '동해중부해상';
    }
    if (zoneName.includes('인천') || zoneName.includes('경기') || zoneName.includes('충남') ||
        (zoneName.includes('서해') && zoneName.includes('중부'))) {
        return '서해중부해상';
    }
    if (zoneName.includes('전북') ||
        (zoneName.includes('전남') && zoneName.includes('서해')) ||
        (zoneName.includes('서해') && zoneName.includes('남부'))) {
        return '서해남부해상';
    }
    if (zoneName.includes('부산') || zoneName.includes('거제') || zoneName.includes('경남') ||
        (zoneName.includes('남해') && zoneName.includes('동부'))) {
        return '남해동부해상';
    }
    if ((zoneName.includes('전남') && zoneName.includes('남해')) ||
        (zoneName.includes('남해') && zoneName.includes('서부'))) {
        return '남해서부해상';
    }
    if (zoneName.includes('제주') || zoneName.includes('추자')) {
        return '제주해역';
    }

    return null;
}

// 중분류 → 대분류 찾기
function getMainRegion(subRegion) {
    for (const [main, data] of Object.entries(SEA_REGIONS)) {
        if (data.subRegions.includes(subRegion)) {
            return main;
        }
    }
    return '기타';
}

// 기존 호환용: 구역명 → 대분류 (동해/서해/남해/제주)
function getSeaArea(zoneName) {
    const subRegion = getSubRegion(zoneName);
    if (subRegion) {
        return getMainRegion(subRegion);
    }

    // 기존 ZONE_CLASSIFICATION 폴백
    for (const [sea, keywords] of Object.entries(ZONE_CLASSIFICATION)) {
        if (keywords.some(kw => zoneName.includes(kw))) {
            return sea;
        }
    }
    return '기타';
}

// 연안바다/평수구역 매핑 (상위구역 → 하위구역)
const COASTAL_MAPPING = {
    // 🔵 동해남부 지역
    '울산앞바다': [
        { name: '평수구역', fullName: '울산앞바다중평수구역' },
        { name: '연안바다', fullName: '울산앞바다중연안바다' }
    ],
    '경북남부앞바다': [
        { name: '평수구역', fullName: '경북남부앞바다중평수구역' },
        { name: '연안바다', fullName: '경북남부앞바다중연안바다' }
    ],
    '경북북부앞바다': [
        { name: '연안바다', fullName: '경북북부앞바다중연안바다' }
    ],

    // 🔵 동해중부 지역
    '강원북부앞바다': [
        { name: '연안바다', fullName: '강원북부앞바다중연안바다' }
    ],
    '강원중부앞바다': [
        { name: '연안바다', fullName: '강원중부앞바다중연안바다' }
    ],
    '강원남부앞바다': [
        { name: '연안바다', fullName: '강원남부앞바다중연안바다' }
    ],
    '울릉도': [
        { name: '울릉읍연안바다', fullName: '울릉도울릉읍연안바다' },
        { name: '서면연안바다', fullName: '울릉도서면연안바다' },
        { name: '북면연안바다', fullName: '울릉도북면연안바다' }
    ],

    // 🔵 서해남부 지역
    '전북북부앞바다': [
        { name: '평수구역', fullName: '전북북부앞바다중평수구역' }
    ],
    '전북남부앞바다': [
        { name: '평수구역', fullName: '전북남부앞바다중평수구역' }
    ],
    '전남북부서해앞바다': [
        { name: '평수구역', fullName: '전남북부서해앞바다중평수구역' }
    ],
    '전남중부서해앞바다': [
        { name: '먼평수구역', fullName: '전남중부서해앞바다중먼평수구역' },
        { name: '앞평수구역', fullName: '전남중부서해앞바다중앞평수구역' }
    ],
    '전남남부서해앞바다': [
        { name: '평수구역', fullName: '전남남부서해앞바다중평수구역' }
    ],
    '서해남부남쪽안쪽먼바다': [
        { name: '조도부근평수구역', fullName: '서해남부남쪽안쪽먼바다중조도부근평수구역' }
    ],

    // 🔵 서해중부 지역
    '경기북부앞바다': [
        { name: '연안바다', fullName: '경기북부앞바다중연안바다' },
        { name: '평수구역', fullName: '경기북부앞바다중평수구역' }
    ],
    '인천·경기북부앞바다': [
        { name: '평수구역', fullName: '인천·경기북부앞바다중평수구역' },
        { name: '연안바다', fullName: '인천·경기북부앞바다중연안바다' }
    ],
    '인천·경기남부앞바다': [
        { name: '먼평수구역', fullName: '인천·경기남부앞바다중먼평수구역' },
        { name: '북부앞평수구역', fullName: '인천·경기남부앞바다중북부앞평수구역' },
        { name: '남부앞평수구역', fullName: '인천·경기남부앞바다중남부앞평수구역' }
    ],
    '충남북부앞바다': [
        { name: '천수만평수구역', fullName: '천수만평수구역' },
        { name: '안면도서쪽평수구역', fullName: '안면도서쪽평수구역' },
        { name: '당진평수구역', fullName: '당진평수구역' },
        { name: '태안·서산북쪽평수구역', fullName: '태안·서산북쪽평수구역' }
    ],
    '충남남부앞바다': [
        { name: '평수구역', fullName: '충남남부앞바다중평수구역' }
    ],

    // 🔵 남해동부 지역
    '부산앞바다': [
        { name: '동부평수구역', fullName: '부산앞바다중동부평수구역' },
        { name: '서부평수구역', fullName: '부산앞바다중서부평수구역' },
        { name: '연안바다', fullName: '부산앞바다중연안바다' }
    ],
    '경남서부남해앞바다': [
        { name: '동부평수구역', fullName: '경남서부남해앞바다중동부평수구역' },
        { name: '서부평수구역', fullName: '경남서부남해앞바다중서부평수구역' },
        { name: '남부평수구역', fullName: '경남서부남해앞바다중남부평수구역' },
        { name: '남해군연안바다', fullName: '경남서부남해앞바다중남해군연안바다' }
    ],
    '경남중부남해앞바다': [
        { name: '평수구역', fullName: '경남중부남해앞바다중평수구역' },
        { name: '연안바다', fullName: '경남중부남해앞바다중연안바다' }
    ],
    '거제시동부앞바다': [
        { name: '연안바다', fullName: '거제시동부앞바다중연안바다' }
    ],

    // 🔵 남해서부 지역
    '전남서부남해앞바다': [
        { name: '평수구역', fullName: '전남서부남해앞바다중평수구역' }
    ],
    '전남동부남해앞바다': [
        { name: '서부평수구역', fullName: '전남동부남해앞바다중서부평수구역' },
        { name: '동부평수구역', fullName: '전남동부남해앞바다중동부평수구역' }
    ],
    '남해서부서쪽먼바다': [
        { name: '추자도연안바다', fullName: '남해서부서쪽먼바다중추자도연안바다' }
    ],

    // 🔵 제주도 지역
    '제주도북부앞바다': [
        { name: '연안바다', fullName: '제주도북부앞바다중연안바다' }
    ],
    '제주도동부앞바다': [
        { name: '북동연안바다', fullName: '제주도동부앞바다중북동연안바다' },
        { name: '남동연안바다', fullName: '제주도동부앞바다중남동연안바다' },
        { name: '우도연안바다', fullName: '제주도동부앞바다중우도연안바다' }
    ],
    '제주도남부앞바다': [
        { name: '연안바다', fullName: '제주도남부앞바다중연안바다' }
    ],
    '제주도서부앞바다': [
        { name: '북서연안바다', fullName: '제주도서부앞바다중북서연안바다' },
        { name: '남서연안바다', fullName: '제주도서부앞바다중남서연안바다' },
        { name: '가파도연안바다', fullName: '제주도서부앞바다중가파도연안바다' }
    ]
};

// 부이 매핑 (특보구역 → 부이 목록)
// type: B=기상부이(풍속,온도,파고), C=파고부이(파고만), L=등표, F=연안방재, J=기상1호
const BUOY_MAPPING = {
    // === 서해 (West Sea) ===

    // 서해중부
    '인천·경기북부앞바다': [
        { id: '22525', name: '볼음도', type: 'C', lat: 37.61, lon: 126.13 },
        { id: '22496', name: '장봉도', type: 'C', lat: 37.49, lon: 126.35 },
        { id: '22522', name: '연평도', type: 'B', lat: 37.62, lon: 125.65 },
        { id: '955', name: '서수도', type: 'L', lat: 37.33, lon: 126.39 }
    ],
    '인천·경기남부앞바다': [
        { id: '22101', name: '덕적도', type: 'B', lat: 37.24, lon: 126.02 },
        { id: '22185', name: '인천', type: 'B', lat: 37.09, lon: 125.43 },
        { id: '22303', name: '풍도', type: 'B', lat: 37.16, lon: 126.41 },
        { id: '22461', name: '이작도', type: 'C', lat: 37.17, lon: 126.21 },
        { id: '22472', name: '자월도', type: 'C', lat: 37.30, lon: 126.16 },
        { id: '22509', name: '장안퇴', type: 'C', lat: 37.03, lon: 126.28 }
    ],
    '충남북부앞바다': [
        { id: '22444', name: '신진도', type: 'C', lat: 36.61, lon: 126.13 },
        { id: '22487', name: '천수만', type: 'C', lat: 36.47, lon: 126.44 },
        { id: '22488', name: '안면도', type: 'C', lat: 36.54, lon: 126.30 },
        { id: '22446', name: '내파수도', type: 'B', lat: 36.45, lon: 126.24 },
        { id: '956', name: '가대암', type: 'L', lat: 36.77, lon: 125.98 }
    ],
    '충남남부앞바다': [
        { id: '22108', name: '외연도', type: 'B', lat: 36.25, lon: 125.75 },
        { id: '22445', name: '삽시도', type: 'C', lat: 36.37, lon: 126.34 },
        { id: '22473', name: '서천', type: 'C', lat: 36.17, lon: 126.33 },
        { id: '22526', name: '녹도', type: 'C', lat: 36.26, lon: 126.21 }
    ],

    // 서해남부
    '전북북부앞바다': [
        { id: '22474', name: '군산', type: 'C', lat: 35.89, lon: 126.43 },
        { id: '22492', name: '비안도', type: 'C', lat: 35.74, lon: 126.35 },
        { id: '957', name: '십이동파', type: 'L', lat: 35.99, lon: 126.23 }
    ],
    '전북남부앞바다': [
        { id: '22186', name: '부안', type: 'B', lat: 35.66, lon: 125.81 },
        { id: '22497', name: '변산', type: 'C', lat: 35.66, lon: 126.46 },
        { id: '22504', name: '위도', type: 'C', lat: 35.66, lon: 126.26 },
        { id: '22510', name: '위도동부', type: 'B', lat: 35.64, lon: 126.36 },
        { id: '958', name: '갈매여', type: 'L', lat: 35.61, lon: 126.25 }
    ],
    '전남북부서해앞바다': [
        { id: '22475', name: '영광', type: 'C', lat: 35.44, lon: 126.18 },
        { id: '22494', name: '낙월', type: 'C', lat: 35.20, lon: 126.21 },
        { id: '22503', name: '불무도', type: 'C', lat: 34.32, lon: 126.17 }
    ],
    '전남중부서해앞바다': [
        { id: '22183', name: '신안', type: 'B', lat: 34.73, lon: 126.24 },
        { id: '22493', name: '자은', type: 'B', lat: 34.92, lon: 125.87 },
        { id: '22102', name: '칠발도', type: 'B', lat: 34.79, lon: 125.78 }
    ],
    '전남남부서해앞바다': [
        { id: '22500', name: '조도', type: 'C', lat: 34.29, lon: 126.11 },
        { id: '22481', name: '맹골수도', type: 'C', lat: 34.23, lon: 125.95 }
    ],

    // 서해 먼바다
    '서해중부안쪽먼바다': [
        { id: '22193', name: '서해143', type: 'B', lat: 37.00, lon: 124.50 }
    ],
    '서해중부바깥먼바다': [
        { id: '22191', name: '서해170', type: 'B', lat: 37.50, lon: 123.50 }
    ],
    '서해남부북쪽안쪽먼바다': [
        { id: '22489', name: '대치마도', type: 'B', lat: 35.02, lon: 126.03 },
        { id: '22299', name: '서해190', type: 'B', lat: 35.50, lon: 124.00 }
    ],
    '서해남부남쪽안쪽먼바다': [
        { id: '22297', name: '가거도', type: 'B', lat: 34.03, lon: 125.21 },
        { id: '22298', name: '홍도', type: 'B', lat: 34.75, lon: 125.25 },
        { id: '959', name: '해수서', type: 'L', lat: 34.26, lon: 126.03 }
    ],
    '서해남부남쪽바깥먼바다': [
        { id: '22192', name: '서해206', type: 'B', lat: 34.00, lon: 123.00 }
    ],

    // === 남해 (South Sea) ===

    '전남서부남해앞바다': [
        { id: '22477', name: '노화도', type: 'C', lat: 34.24, lon: 126.49 },
        { id: '22456', name: '청산도', type: 'C', lat: 34.14, lon: 126.74 }
    ],
    '전남동부남해앞바다': [
        { id: '22478', name: '고흥', type: 'C', lat: 34.38, lon: 127.18 },
        { id: '22466', name: '금오도', type: 'C', lat: 34.57, lon: 127.78 },
        { id: '22502', name: '나로도', type: 'C', lat: 34.43, lon: 127.59 },
        { id: '961', name: '간여암', type: 'L', lat: 34.29, lon: 127.86 }
    ],
    '경남서부남해앞바다': [
        { id: '22450', name: '두미도', type: 'C', lat: 34.71, lon: 128.15 },
        { id: '22501', name: '사량도', type: 'C', lat: 34.86, lon: 128.14 },
        { id: '22499', name: '연화도', type: 'C', lat: 34.67, lon: 128.37 },
        { id: '22498', name: '남해', type: 'C', lat: 34.70, lon: 127.99 }
    ],
    '경남중부남해앞바다': [
        { id: '22188', name: '통영', type: 'B', lat: 34.39, lon: 128.23 },
        { id: '22467', name: '한산도', type: 'C', lat: 34.71, lon: 128.50 }
    ],
    '거제시동부앞바다': [
        { id: '22104', name: '거제도', type: 'B', lat: 34.77, lon: 128.90 },
        { id: '22455', name: '해금강', type: 'C', lat: 34.74, lon: 128.69 },
        { id: '22512', name: '지심도', type: 'B', lat: 34.83, lon: 128.78 },
        { id: '22513', name: '이수도', type: 'B', lat: 34.97, lon: 128.76 },
        { id: '22484', name: '잠도', type: 'C', lat: 35.06, lon: 128.68 },
        { id: '22485', name: '소매물도', type: 'B', lat: 34.62, lon: 128.54 }
    ],
    '부산앞바다': [
        { id: '22460', name: '다대포', type: 'C', lat: 35.02, lon: 128.96 },
        { id: '22459', name: '오륙도', type: 'C', lat: 35.10, lon: 129.13 },
        { id: '22511', name: '기장', type: 'C', lat: 35.22, lon: 129.26 },
        { id: '984', name: '오륙도', type: 'L', lat: 35.09, lon: 129.13 }
    ],

    // 남해 먼바다
    '남해서부서쪽먼바다': [
        { id: '22184', name: '추자도', type: 'B', lat: 33.79, lon: 126.14 },
        { id: '22468', name: '추자도', type: 'C', lat: 33.97, lon: 126.28 }
    ],
    '남해서부동쪽먼바다': [
        { id: '22103', name: '거문도', type: 'B', lat: 34.00, lon: 127.50 },
        { id: '22507', name: '초도', type: 'C', lat: 34.15, lon: 127.22 },
        { id: '22309', name: '남해111', type: 'B', lat: 33.50, lon: 128.00 }
    ],
    '남해동부바깥먼바다': [
        { id: '22304', name: '남해244', type: 'B', lat: 33.50, lon: 129.50 }
    ],

    // === 제주도 (Jeju Sea) ===

    '제주도북부앞바다': [
        { id: '22457', name: '제주항', type: 'C', lat: 33.52, lon: 126.49 },
        { id: '22491', name: '김녕', type: 'C', lat: 33.58, lon: 126.76 },
        { id: '22514', name: '구엄', type: 'B', lat: 33.52, lon: 126.37 },
        { id: '22517', name: '하도', type: 'C', lat: 33.56, lon: 126.93 }
    ],
    '제주도서부앞바다': [
        { id: '22486', name: '협재', type: 'C', lat: 33.40, lon: 126.21 },
        { id: '22516', name: '신창', type: 'C', lat: 33.37, lon: 126.11 }
    ],
    '제주도동부앞바다': [
        { id: '22469', name: '우도', type: 'C', lat: 33.52, lon: 126.97 },
        { id: '22495', name: '신산', type: 'C', lat: 33.38, lon: 126.91 }
    ],
    '제주도남부앞바다': [
        { id: '22107', name: '마라도', type: 'B', lat: 33.08, lon: 126.03 },
        { id: '22458', name: '중문', type: 'C', lat: 33.23, lon: 126.39 },
        { id: '22515', name: '위미', type: 'C', lat: 33.22, lon: 126.71 },
        { id: '22187', name: '서귀포', type: 'B', lat: 33.13, lon: 127.02 },
        { id: '22505', name: '영락', type: 'C', lat: 33.24, lon: 126.19 },
        { id: '22476', name: '가파도', type: 'C', lat: 33.16, lon: 126.26 },
        { id: '960', name: '지귀도', type: 'L', lat: 33.22, lon: 126.65 },
        { id: '22003', name: '기상1호', type: 'J', lat: 33.23, lon: 126.57 }
    ],

    // 제주도 먼바다
    '제주도남서쪽안쪽먼바다': [
        { id: '22300', name: '남해239', type: 'B', lat: 32.50, lon: 125.50 }
    ],
    '제주도남쪽바깥먼바다': [
        { id: '22301', name: '남해465', type: 'B', lat: 31.50, lon: 127.00 }
    ],

    // === 동해 (East Sea) ===

    '울산앞바다': [
        { id: '22189', name: '울산', type: 'B', lat: 35.35, lon: 129.84 },
        { id: '22483', name: '간절곶', type: 'C', lat: 35.37, lon: 129.38 },
        { id: '22518', name: '당사', type: 'C', lat: 35.58, lon: 129.50 },
        { id: '963', name: '이덕서', type: 'L', lat: 35.57, lon: 129.48 }
    ],
    '경북남부앞바다': [
        { id: '22490', name: '월포', type: 'C', lat: 36.22, lon: 129.40 },
        { id: '22524', name: '구룡포', type: 'C', lat: 35.97, lon: 129.60 }
    ],
    '경북북부앞바다': [
        { id: '22465', name: '후포', type: 'C', lat: 36.72, lon: 129.49 }
    ],
    '강원남부앞바다': [
        { id: '22311', name: '삼척', type: 'B', lat: 37.46, lon: 129.32 },
        { id: '22479', name: '맹방', type: 'C', lat: 37.40, lon: 129.23 },
        { id: '22523', name: '죽변', type: 'B', lat: 37.10, lon: 129.46 }
    ],
    '강원중부앞바다': [
        { id: '22520', name: '강릉', type: 'B', lat: 37.80, lon: 129.06 },
        { id: '22451', name: '연곡', type: 'C', lat: 37.87, lon: 128.89 }
    ],
    '강원북부앞바다': [
        { id: '22310', name: '고성', type: 'B', lat: 38.32, lon: 128.64 },
        { id: '22471', name: '토성', type: 'C', lat: 38.28, lon: 128.58 }
    ],

    // 동해 먼바다
    '동해남부북쪽안쪽먼바다': [
        { id: '22106', name: '포항', type: 'B', lat: 36.35, lon: 129.78 },
        { id: '22190', name: '울진', type: 'B', lat: 36.91, lon: 129.87 },
        { id: '22302', name: '동해78', type: 'B', lat: 37.00, lon: 130.00 }
    ],
    '동해중부안쪽먼바다': [
        { id: '21229', name: '울릉도', type: 'B', lat: 37.46, lon: 131.11 },
        { id: '22105', name: '동해', type: 'B', lat: 37.54, lon: 130.00 },
        { id: '22464', name: '울릉읍', type: 'C', lat: 37.47, lon: 130.90 },
        { id: '22305', name: '동해57', type: 'B', lat: 38.37, lon: 129.60 },
        { id: '22442', name: '혈암', type: 'C', lat: 37.54, lon: 130.85 }
    ],
    '동해중부바깥먼바다': [
        { id: '22441', name: '독도', type: 'C', lat: 37.24, lon: 131.87 }
    ]
};


// 부이 타입 설명
const BUOY_TYPES = {
    'B': { name: '기상부이', measures: ['풍속', '기온', '파고'], icon: '🌊' },
    'C': { name: '파고부이', measures: ['파고'], icon: '📊' },
    'L': { name: '등표', measures: ['풍속', '기온'], icon: '🗼' },
    'F': { name: '연안방재', measures: ['풍속', '기온', '파고'], icon: '🏠' },
    'J': { name: '기상1호', measures: ['풍속', '기온', '파고', '기압'], icon: '🚢' }
};

// Global State
let appState = {
    alerts: [],
    coastalAlerts: {}, // 연안바다 특보 저장
    buoyData: {},      // 부이 데이터 저장
    lastUpdated: null,
    isLoading: false,
    apiStatus: { hub: 'pending', buoy: 'pending', coastal: 'pending' },
    hasApiError: false // API 호출 실패 여부
};

// ----------------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------------

function getSeaArea(zoneName) {
    if (!zoneName) return '기타';
    for (const [sea, keywords] of Object.entries(ZONE_CLASSIFICATION)) {
        if (keywords.some(k => zoneName.includes(k))) return sea;
    }
    return '기타';
}

function formatDate(dateStr) {
    return formatWarningTime(dateStr, false);
}

// 시간 포맷 변환 (발효/해제 시간대 처리)
function formatWarningTime(tmEf, isEndTime = false) {
    // null이거나 빈 문자열이면 "정보 없음" 반환
    if (!tmEf || tmEf.trim() === '' || tmEf === '0' || tmEf === '000000000000') {
        return '정보 없음';
    }

    // "00일"로 시작하거나 유효하지 않은 날짜 처리
    if (tmEf.startsWith('00일') || tmEf === '00일') {
        return '정보 없음';
    }

    // 이미 한글로 포맷된 경우 그대로 반환
    if (tmEf.includes('새벽') || tmEf.includes('아침') || tmEf.includes('오전') ||
        tmEf.includes('낮') || tmEf.includes('오후') || tmEf.includes('저녁') || tmEf.includes('밤')) {
        return tmEf;
    }

    const cleanStr = String(tmEf).replace(/[^0-9]/g, '');

    // 숫자 형식이 아니거나 길이가 부족한 경우
    if (cleanStr.length < 12) {
        return '정보 없음';
    }

    try {
        const month = cleanStr.substring(4, 6);
        const day = cleanStr.substring(6, 8);
        const hour = cleanStr.substring(8, 10);
        const minute = cleanStr.substring(10, 12);

        // 시간대 범위 확인 (분이 58 또는 59인 경우 = 시간대 범위)
        if (minute === '58' || minute === '59') {
            let timeRange = '';

            if (hour === '02') {
                timeRange = '새벽(00시~03시)';
            } else if (hour === '05') {
                timeRange = minute === '59' ? '새벽(03시~06시)' : '새벽(00시~06시)';
            } else if (hour === '08') {
                timeRange = '아침(06시~09시)';
            } else if (hour === '11') {
                timeRange = minute === '59' ? '오전(09시~12시)' : '오전(06시~12시)';
            } else if (hour === '14') {
                timeRange = minute === '58' ? '오후(12시~18시)' : '낮(12시~15시)';
            } else if (hour === '17') {
                timeRange = minute === '59' ? '늦은오후(15시~18시)' : '오후(12시~18시)';
            } else if (hour === '20') {
                timeRange = '저녁(18시~21시)';
            } else if (hour === '23') {
                timeRange = minute === '59' ? '밤(21시~24시)' : '밤(18시~24시)';
            } else {
                // 매핑되지 않은 경우 정확한 시간 표시
                return `${month}/${day} ${hour}:${minute}`;
            }

            return `${month}/${day} ${timeRange}`;
        } else {
            // 정확한 시간인 경우
            const hourNum = parseInt(hour, 10);
            let timeText = '';

            if (hourNum < 12) {
                timeText = `오전 ${hourNum === 0 ? '12' : hourNum}시`;
            } else {
                timeText = `오후 ${hourNum === 12 ? '12' : hourNum - 12}시`;
            }

            // 분이 00이 아닌 경우 분도 표시
            if (minute !== '00') {
                timeText += ` ${parseInt(minute, 10)}분`;
            }

            return `${month}/${day} ${timeText}`;
        }

    } catch (e) {
        console.error('시간 포맷 변환 오류:', e, 'tmEf:', tmEf);
        return '정보 없음';
    }
}


function getKfTime() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${y}${m}${d}${h}${min}`;
}

function getProxiedUrl(url) {
    if (CONFIG.USE_CORS_PROXY) {
        return CONFIG.CORS_PROXY + encodeURIComponent(url);
    }
    return url;
}

// ----------------------------------------------------------------------------
// API Fetching
// ----------------------------------------------------------------------------

async function fetchAllData() {
    if (appState.isLoading) return;
    updateLoading(true);

    appState.apiStatus = { hub: 'loading', buoy: 'loading', coastal: 'loading' };
    updateApiStatusDisplay();

    // 초기화: 연안바다 관련 상태 리셋
    appState.coastalAlerts = {};
    appState.releasedCoastalZones = {};

    // 테스트 모드: Mock 특보 데이터 사용 + 실제 부이 API 호출
    if (CONFIG.USE_MOCK_DATA) {
        console.log('🧪 테스트 모드: Mock 특보 데이터 + 실제 부이 API');
        appState.alerts = getMockAlerts();
        appState.apiStatus = { hub: 'success', buoy: 'loading' };
        updateApiStatusDisplay();

        // 부이 데이터는 실제 API에서 가져오기
        try {
            const buoyData = await fetchBuoyData();
            appState.buoyData = buoyData;
            appState.apiStatus.buoy = Object.keys(buoyData).length > 0 ? 'success' : 'error';
            console.log('✅ 부이 API 성공:', Object.keys(buoyData).length, '개 부이 데이터');
        } catch (e) {
            console.error('❌ 부이 API 실패:', e.message);
            appState.buoyData = getMockBuoyData();
            appState.apiStatus.buoy = 'error';
        }

        appState.lastUpdated = new Date();
        updateApiStatusDisplay();
        renderApp();
        updateLoading(false);
        return;
    }

    try {
        // 1단계: Hub API, Buoy API, AFSO Coastal API 병렬 호출
        const [hubResult, buoyResult, coastalResult] = await Promise.allSettled([
            fetchKmaHubData(),
            fetchBuoyData(),
            fetchAfsoCoastalData()
        ]);

        const hubAlerts = hubResult.status === 'fulfilled' ? hubResult.value : [];
        const buoyData = buoyResult.status === 'fulfilled' ? buoyResult.value : {};
        const coastalAlerts = coastalResult.status === 'fulfilled' ? coastalResult.value : {};
        const hubSuccess = hubResult.status === 'fulfilled' && hubAlerts.length >= 0;
        const coastalSuccess = coastalResult.status === 'fulfilled' && Object.keys(coastalAlerts).length >= 0;

        // API 상태 업데이트
        appState.apiStatus.hub = hubSuccess ? 'success' : 'error';
        appState.apiStatus.buoy = buoyResult.status === 'fulfilled' ? 'success' : 'error';
        appState.apiStatus.coastal = coastalSuccess ? 'success' : 'error';

        // 치명적 API 오류 확인 (메인 데이터 소스 모두 실패 시)
        appState.hasApiError = !hubSuccess && !coastalSuccess;

        console.log('=== API Results ===');
        console.log('Hub API:', hubSuccess ? 'SUCCESS' : 'FAILED');
        console.log('Hub Alerts:', hubAlerts.length, 'items');
        console.log('Coastal Alerts from Hub:', Object.keys(appState.coastalAlerts).length, 'items');
        console.log('Released Coastal Zones:', appState.releasedCoastalZones);
        console.log('Buoy Data:', Object.keys(buoyData).length, 'stations');

        // Hub 데이터를 기본으로 사용
        appState.alerts = hubAlerts;
        appState.buoyData = buoyData;

        // AFSO API에서 가져온 연안바다/평수구역 데이터 저장
        appState.coastalAlerts = coastalAlerts;

        // 연안바다 특보 현황 로그 (AFSO API에서 수집된 데이터)
        console.log('=== 연안/평수구역 특보 현황 (AFSO API) ===');
        console.log('총', Object.keys(appState.coastalAlerts).length, '개 구역');
        for (const [zone, alert] of Object.entries(appState.coastalAlerts)) {
            console.log(`  - ${zone}: ${alert.warnType} ${alert.level}`);
        }

        appState.lastUpdated = new Date();

        updateApiStatusDisplay();
        renderApp();
    } catch (error) {
        console.error('Critical Error in fetchAllData:', error);
        appState.apiStatus = { hub: 'error', buoy: 'error', coastal: 'error' };
        appState.hasApiError = true;
        updateApiStatusDisplay();
        renderApp(); // 에러 화면 렌더링을 위해 호출
    } finally {
        updateLoading(false);
    }
}

// --- KMA HUB API (wrn_now_data.php) ---
async function fetchKmaHubData() {
    // 서버리스 함수 사용 (API 키가 서버에 안전하게 저장됨)
    if (CONFIG.USE_SERVERLESS) {
        try {
            console.log('Fetching KMA Hub via Serverless Function...');
            const response = await fetch(`${CONFIG.SERVERLESS_BASE_URL}/get-alerts`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('Serverless Response:', result);

            if (result.success && result.data) {
                // 서버리스 함수에서 이미 파싱된 데이터 반환
                // 하지만 현재 서버리스 함수는 raw 데이터를 반환하므로 parseHubText 필요
                if (Array.isArray(result.data)) {
                    // 이미 파싱된 형태라면 변환
                    return result.data.map(alert => ({
                        zone: alert.zone || '',
                        warnType: alert.warnType || '',
                        level: alert.warnLevel || alert.level || '',
                        startTime: alert.startTime || '',
                        endTime: '',
                        isCurrentlyActive: true
                    }));
                }
            }

            throw new Error('Invalid serverless response');
        } catch (e) {
            console.error('Serverless function error:', e.message);
            console.log('Falling back to direct API call...');
            // fallthrough to direct API call
        }
    }

    // 기존 직접 API 호출 (fallback) - 주의: API 키가 노출됨
    console.log('⚠️ Direct API call (API key exposed in client)');
    const tm2 = getKfTime();
    // API 키가 없으므로 Mock 데이터 반환
    console.log('API key not available in client, using mock data...');
    return getMockAlerts();
}


function parseHubText(text) {
    const lines = text.trim().split('\n');
    const alerts = [];
    const seenZones = new Set(); // 중복 방지

    // 해제된 연안바다/평수구역 수집 (제외 처리용)
    appState.releasedCoastalZones = appState.releasedCoastalZones || {};

    console.log('Parsing', lines.length, 'lines');

    lines.forEach((line, idx) => {
        // 헤더/주석 라인 건너뛰기
        if (line.startsWith('#') || line.trim() === '') return;

        // 쉼표로 분리
        const parts = line.split(',').map(p => p.trim());

        // wrn_now_data.php 응답 포맷:
        // 0: regUp (상위구역코드)
        // 1: regUpName (상위구역명)
        // 2: regId (특보구역코드)
        // 3: regName (특보구역명) - 한글!
        // 4: tmFc (발표시각)
        // 5: tmEf (발효시각)
        // 6: wrnType (특보종류) - 풍랑, 태풍, 강풍, 해일 등 한글!
        // 7: level (특보수준) - 주의, 경보, 예비
        // 8: cmd (명령) - 발표, 해제 등
        // 9: edTm (해제예정시각)

        if (parts.length < 10) {
            console.log(`Line ${idx} skipped (not enough parts):`, parts.length);
            return;
        }

        const regId = parts[2];
        const regName = parts[3];
        const tmFc = parts[4];
        const tmEf = parts[5];
        const wrnType = parts[6];
        const level = parts[7];
        const cmd = parts[8];
        const edTm = parts[9];

        // 해상 특보만 필터링 (풍랑, 태풍, 해일, 지진해일) - 강풍 제외
        const marineTypes = ['풍랑', '태풍', '해일', '지진해일'];
        if (!marineTypes.includes(wrnType)) {
            return;
        }

        // 해일 특보 명확화: API에서 '해일'로 오면 '폭풍해일'로 변환
        let displayWarnType = wrnType;
        if (wrnType === '해일') {
            displayWarnType = '폭풍해일';
        }

        // 연안바다 여부 확인
        const isCoastal = regName.includes('연안바다') || regName.includes('평수구역');

        // ⭐ 해제 명령 처리: 연안바다/평수구역의 해제는 따로 기록
        if (cmd === '해제') {
            if (isCoastal) {
                // 상위 해역 찾기 (예: "제주도서부앞바다중남서연안바다" → "제주도서부앞바다")
                let parentZone = null;
                for (const [mainZone, subZones] of Object.entries(COASTAL_MAPPING)) {
                    for (const sub of subZones) {
                        if (sub.fullName === regName) {
                            parentZone = mainZone;
                            break;
                        }
                    }
                    if (parentZone) break;
                }

                // 또는 "중" 앞부분 추출
                if (!parentZone) {
                    const match = regName.match(/^(.+)중(.+)(연안바다|평수구역)$/);
                    if (match) {
                        parentZone = match[1];
                    }
                }

                if (parentZone) {
                    if (!appState.releasedCoastalZones[parentZone]) {
                        appState.releasedCoastalZones[parentZone] = [];
                    }
                    // 연안바다 이름 추출 (예: "제주도서부앞바다중남서연안바다" → "남서연안바다")
                    const shortName = regName.replace(parentZone + '중', '');
                    if (!appState.releasedCoastalZones[parentZone].includes(shortName)) {
                        appState.releasedCoastalZones[parentZone].push(shortName);
                        console.log(`🔓 연안바다 해제 감지: ${regName} (상위: ${parentZone})`);
                    }
                }
            }
            return; // 해제 명령은 alerts에 추가하지 않음
        }

        // 중복 체크 (같은 구역 + 같은 특보 종류)
        const key = `${regId}_${wrnType}`;
        if (seenZones.has(key)) {
            return;
        }
        seenZones.add(key);

        // 특보 수준 변환
        let levelText = level;
        if (level === '주의') levelText = '주의보';
        else if (level === '경보') levelText = '경보';
        else if (level === '예비') levelText = '예비';

        const isPreliminary = level === '예비';

        const alertData = {
            id: `${regId}_${wrnType}_${tmFc}`,
            zoneCode: regId,
            zoneName: regName,
            warnType: displayWarnType,  // 원본 wrnType 대신 변환된 표시명 사용
            level: levelText,
            command: cmd,
            tmFc: tmFc,
            tmEf: tmEf,
            tmEd: edTm,
            isPreliminary: isPreliminary,
            isCoastal: isCoastal,
            source: 'HUB'
        };

        // 1. 제외 정보 파싱 (예: "제주도서부앞바다(남서연안바다 제외)")
        const exclusionParsed = parseExclusionFromZoneName(regName);
        if (exclusionParsed.excluded.length > 0) {
            alertData.zoneName = exclusionParsed.cleanZoneName;
            alertData.tempExclusions = exclusionParsed.excluded; // fetchAllData에서 사용
        } else {
            // 2. 제외 정보가 없다면, 일반 괄호(해제예고 등) 제거
            const cleanNameMatch = regName.match(/^(.+?)\s*\(.*?\)$/);
            if (cleanNameMatch) {
                alertData.originalZoneName = regName;
                alertData.zoneName = cleanNameMatch[1].trim();
            }
        }

        // 연안바다는 별도 저장
        if (isCoastal) {
            appState.coastalAlerts[alertData.zoneName] = alertData;
        } else {
            alerts.push(alertData);
        }

        console.log(`Added: ${alertData.zoneName} - ${wrnType}${levelText} ${isCoastal ? '(연안)' : ''}`);
    });

    console.log('Total main alerts:', alerts.length);
    console.log('Total coastal alerts:', Object.keys(appState.coastalAlerts).length);
    console.log('Released coastal zones:', appState.releasedCoastalZones);
    return alerts;
}

// --- MOCK DATA 비활성화 (API 실패 시 빈 데이터 반환) ---
function getMockAlerts() {
    console.log('⚠️ API 연결 실패 - 특보 데이터 없음');
    // 더미 데이터 제거됨 - 실제 API 데이터만 표시
    appState.coastalAlerts = {};
    return [];
}

// --- AFSO 연안바다/평수구역 API (웹페이지 내부 API) ---
async function fetchAfsoCoastalData() {
    // 현재 시간을 YYYYMMDDHHMI 형식으로 생성
    const now = new Date();
    const tmFc = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0');

    const apiUrl = `https://afso.kma.go.kr/afsOut/mmr/warning/retMmrWarningSeaNow.kajx?tmFc=${tmFc}&stnId=108&fe=f&mmr=mmr&tmFe=`;

    console.log('Fetching AFSO Coastal Data:', apiUrl);

    try {
        const proxiedUrl = getProxiedUrl(apiUrl);
        console.log('AFSO Proxied URL:', proxiedUrl);

        const response = await fetch(proxiedUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // 먼저 텍스트로 받아서 확인
        const text = await response.text();
        console.log('AFSO Response (first 500 chars):', text.substring(0, 500));

        // JSON 파싱 시도
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('AFSO API: JSON 파싱 실패:', parseError.message);
            console.error('응답 내용:', text.substring(0, 200));
            return {};
        }

        // 응답 구조: { meta: {...}, data: { input: {...}, metData: [...] } }
        const metData = data.data?.metData || data.metData;

        if (!metData || metData.length === 0) {
            console.warn('AFSO API: metData가 없습니다. data:', data);
            return {};
        }

        console.log('AFSO API: 총', metData.length, '개 항목 수신');

        // 연안바다/평수구역만 필터링하여 coastalAlerts 구성
        const coastalAlerts = {};

        for (const item of metData) {
            const regKo = item.regKo || '';

            // "연안바다" 또는 "평수구"(역이 잘린 경우) 포함 여부 확인
            if (!regKo.includes('연안바다') && !regKo.includes('평수구')) {
                continue;
            }

            // 평수구역 텍스트 잘림 보정 ("평수구" → "평수구역")
            let zoneName = regKo.replace(/\s+/g, ''); // 공백 제거
            if (zoneName.endsWith('평수구') && !zoneName.endsWith('평수구역')) {
                zoneName = zoneName + '역';
            }

            // 특보가 없는 경우 (wrnTp가 비어있음) 건너뛰기
            if (!item.wrnTp || item.wrnTp.trim() === '') {
                continue;
            }

            // 수준 변환
            let level = item.wrnLvlName || '';
            if (level === '주의') level = '주의보';
            else if (level === '경보') level = '경보';

            const isPreliminary = item.wrnLvl === '1';

            // coastalAlerts에 저장
            const key = zoneName;
            if (!coastalAlerts[key]) {
                // 디버그: 첫 번째 항목의 시간 형식 확인
                if (Object.keys(coastalAlerts).length === 0) {
                    console.log('=== AFSO API 시간 형식 디버그 ===');
                    console.log('tmFc 원본:', item.tmFc, '타입:', typeof item.tmFc);
                    console.log('tmEf 원본:', item.tmEf, '타입:', typeof item.tmEf);
                    console.log('tmEd 원본:', item.tmEd, '타입:', typeof item.tmEd);
                    console.log('전체 item:', item);
                }

                coastalAlerts[key] = {
                    id: `afso_${item.regId}_${item.wrnTp}`,
                    zoneName: zoneName,
                    warnType: item.wrnTp === '해일' ? '폭풍해일' : item.wrnTp,  // 해일→폭풍해일 변환
                    level: level,
                    command: '발표',
                    tmFc: item.tmFc || '',
                    tmEf: item.tmEf || '',
                    tmEd: item.tmEd || '',
                    isPreliminary: isPreliminary,
                    isCoastal: true,
                    source: 'AFSO'
                };
                const displayType = item.wrnTp === '해일' ? '폭풍해일' : item.wrnTp;
                console.log(`🌊 연안/평수구역 추가: ${zoneName} - ${displayType} ${level}`);
            }
        }

        console.log('AFSO API: 연안/평수구역', Object.keys(coastalAlerts).length, '개 추출');
        return coastalAlerts;

    } catch (e) {
        console.error('AFSO Coastal API Error:', e.message);
        return {};
    }
}

// --- BUOY API (해양관측 데이터) ---
async function fetchBuoyData() {
    // 전체 부이 데이터 조회 (stn=0 또는 생략)
    const url = `${CONFIG.BUOY_API_URL}?stn=0&help=0&authKey=${CONFIG.KMA_HUB_KEY}`;

    console.log('Fetching Buoy Data:', url);

    try {
        const response = await fetch(getProxiedUrl(url));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // EUC-KR 인코딩 처리
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('euc-kr');
        const text = decoder.decode(buffer);

        console.log('Buoy Raw Response (first 500 chars):', text.substring(0, 500));

        const parsed = parseBuoyData(text);
        console.log('Buoy Parsed:', Object.keys(parsed).length, 'stations');

        return parsed;
    } catch (e) {
        console.error('Buoy API Error:', e.message);
        return getMockBuoyData();
    }
}

function parseBuoyData(text) {
    const lines = text.trim().split('\n');
    const buoyData = {};

    console.log('Parsing buoy data, total lines:', lines.length);

    lines.forEach((line, idx) => {
        // 헤더/주석 라인 건너뛰기
        if (line.startsWith('#') || line.trim() === '') return;

        // 첫 몇 줄 디버깅
        if (idx < 3) {
            console.log('Line', idx, ':', line.substring(0, 100));
        }

        // 공백으로 분리 (KMA API는 주로 공백 구분)
        const parts = line.split(/\s+/).map(p => p.trim()).filter(p => p);

        // sea_obs.php 응답 포맷:
        // TP, STN_ID, STN_KO, TM, WH, WD, WS, WS_GST, TW, TA, PA, HM
        if (parts.length < 6) return;

        try {
            // 실제 API 응답 형식 (콘솔에서 확인):
            // TP(0), TM(1), STN_ID(2), STN_KO(3), LON(4), LAT(5), WH(6), WD(7), WS(8), WS_GST(9), TW(10), TA(11), PA(12), HM(13)
            const tp = parts[0];
            const tm = parts[1];
            let stnId = parts[2].replace(/,/g, '').trim();  // 쉼표 제거!
            const stnName = parts[3] ? parts[3].replace(/,/g, '').trim() : stnId;

            // stnId 유효성 검사
            if (!stnId || stnId.length > 8 || stnId.length < 3) return;

            // -99는 결측값(관측 불가)이므로 null로 처리
            const parseValue = (val) => {
                const num = parseFloat(val);
                return (isNaN(num) || num <= -99) ? null : num;
            };

            // 올바른 인덱스 (LON=4, LAT=5 건너뛰고 WH=6부터)
            const wh = parseValue(parts[6]);      // 유의파고
            const wd = parseValue(parts[7]);      // 풍향
            const ws = parseValue(parts[8]);      // 풍속
            const wsGust = parseValue(parts[9]);  // 돌풍
            const tw = parseValue(parts[10]);     // 수온
            const ta = parseValue(parts[11]);     // 기온
            const pa = parseValue(parts[12]);     // 기압
            const hm = parseValue(parts[13]);     // 습도

            buoyData[stnId] = {
                id: stnId,
                name: stnName,
                tm: tm,
                waveHeight: wh,
                windDirection: wd,
                windSpeed: ws,
                windGust: wsGust,
                waterTemp: tw,
                airTemp: ta,
                pressure: pa,
                humidity: hm
            };

            // 처음 3개 파싱 결과 출력
            if (Object.keys(buoyData).length <= 3) {
                console.log('✓ Parsed:', stnId, stnName, '파고:', wh, '풍속:', ws);
            }
        } catch (e) {
            console.warn('Buoy parse error at line', idx, e);
        }
    });

    console.log('Parsed buoy station IDs:', Object.keys(buoyData).slice(0, 10));

    return buoyData;
}

// Mock 부이 데이터 (API 실패 시)
function getMockBuoyData() {
    console.log('Using mock buoy data');
    return {
        // 제주도서부앞바다 부이
        '22107': { id: '22107', name: '마라도', waveHeight: 2.1, windSpeed: 12.3, windDirection: 315, airTemp: 14.5, waterTemp: 18.2, windGust: 15.8, pressure: 1015.2, humidity: 72 },
        '22514': { id: '22514', name: '구엄', waveHeight: 1.8, windSpeed: 10.5, windDirection: 290, airTemp: 13.8, waterTemp: 17.5, windGust: 14.2, pressure: 1014.8, humidity: 75 },
        '22486': { id: '22486', name: '협재', waveHeight: 1.5, windSpeed: 9.2, windDirection: 280, airTemp: 14.2, waterTemp: 17.8, windGust: 12.5 },
        '22516': { id: '22516', name: '신창', waveHeight: 1.6, windSpeed: 9.8, windDirection: 285, airTemp: 13.5, waterTemp: 17.2, windGust: 13.1 },
        '33011': { id: '33011', name: '판포', waveHeight: 1.4, windSpeed: 8.5, windDirection: 275, airTemp: 14.0, waterTemp: 17.6, windGust: 11.8, pressure: 1015.0, humidity: 74 },
        // 울산앞바다 부이
        '22189': { id: '22189', name: '울산', waveHeight: 1.2, windSpeed: 8.5, windDirection: 225, airTemp: 12.3, waterTemp: 15.8, windGust: 11.2, pressure: 1016.5, humidity: 68 },
        // 강원남부앞바다 부이
        '22105': { id: '22105', name: '동해', waveHeight: 1.8, windSpeed: 10.2, windDirection: 45, airTemp: 8.7, waterTemp: 13.5, windGust: 14.5, pressure: 1018.2, humidity: 65 },
        '22311': { id: '22311', name: '삼척', waveHeight: 1.5, windSpeed: 9.0, windDirection: 50, airTemp: 8.2, waterTemp: 13.0, windGust: 12.8 },
        // 인천경기남부앞바다 부이
        '22101': { id: '22101', name: '덕적도', waveHeight: 0.8, windSpeed: 6.3, windDirection: 180, airTemp: 10.2, waterTemp: 12.8, windGust: 9.5, pressure: 1017.0, humidity: 70 },
        '22185': { id: '22185', name: '인천', waveHeight: 0.6, windSpeed: 5.5, windDirection: 175, airTemp: 9.8, waterTemp: 12.2, windGust: 8.2 },
        // 제주도동부앞바다 부이
        '22469': { id: '22469', name: '우도', waveHeight: 1.9, windSpeed: 11.0, windDirection: 95, airTemp: 15.0, waterTemp: 18.5, windGust: 15.2 },
        '22491': { id: '22491', name: '김녕', waveHeight: 1.7, windSpeed: 10.0, windDirection: 90, airTemp: 14.8, waterTemp: 18.2, windGust: 13.8 },
        // 거제/서귀포 부이
        '22104': { id: '22104', name: '거제도', waveHeight: 1.5, windSpeed: 9.1, windDirection: 270, airTemp: 13.1, waterTemp: 16.5, windGust: 12.3 },
        '22187': { id: '22187', name: '서귀포', waveHeight: 1.9, windSpeed: 11.5, windDirection: 200, airTemp: 15.2, waterTemp: 19.0, windGust: 14.8 }
    };
}

// 풍향을 방위로 변환
function getWindDirectionText(degree) {
    if (degree === null || degree === undefined) return '-';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
}

// --- PUBLIC DATA PORTAL API (연안바다/평수구역 특보 조회) ---
async function fetchPortalData() {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);

    const fromDate = threeDaysAgo.toISOString().slice(0, 10).replace(/-/g, '');
    const toDate = today.toISOString().slice(0, 10).replace(/-/g, '');

    const params = new URLSearchParams({
        ServiceKey: decodeURIComponent(CONFIG.DATA_PORTAL_KEY),
        pageNo: '1',
        numOfRows: '100',  // 더 많은 결과 조회
        dataType: 'JSON',
        fromTmFc: fromDate,
        toTmFc: toDate
    });

    const url = `${CONFIG.PORTAL_API_URL}?${params.toString()}`;
    console.log('📡 Fetching Portal API for coastal/Pyeongsu zones:', url);

    try {
        const response = await fetch(getProxiedUrl(url));

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        console.log('📡 Portal Raw Response:', data);

        if (data.response?.header?.resultCode !== '00') {
            console.error('Portal API Error:', data.response?.header?.resultMsg);
            throw new Error(data.response?.header?.resultMsg || 'API Error');
        }

        const items = data.response?.body?.items?.item || [];
        const itemArray = Array.isArray(items) ? items : [items];

        console.log('📡 Portal Items count:', itemArray.length);

        // title 필드에서 특보 정보 파싱
        const parsedAlerts = [];

        itemArray.forEach(item => {
            if (item.title) {
                console.log('📡 Parsing title:', item.title.substring(0, 100));
                const alerts = parsePortalTitle(item.title, item.tmFc);
                parsedAlerts.push(...alerts);
            }
        });

        console.log('📡 Total parsed alerts from Portal:', parsedAlerts.length);
        return parsedAlerts;

    } catch (e) {
        console.error('❌ Portal API Error:', e.message);
        throw e;
    }
}

/**
 * 공공데이터포털 getWthrInfo API 호출
 * 현재 발효 중인 특보의 상세 텍스트(t1 필드)를 가져옴
 * 이 API는 Hub API보다 빠르게 갱신될 수 있음
 */
async function fetchWthrInfo() {
    // 전국 특보를 위해 여러 지점 코드 사용
    // 각 지역별 주요 관측소를 포함하여 연안바다/평수구역 정보도 수집
    const stnIds = [
        '108',  // 서울
        '105',  // 강릉 (동해중부)
        '106',  // 동해 (동해중부)  
        '130',  // 울진 (동해)
        '138',  // 포항 (동해남부)
        '152',  // 울산 (동해남부)
        '159',  // 부산 (남해동부)
        '156',  // 광주 (남해서부/서해남부)
        '168',  // 여수 (남해서부)
        '112',  // 인천 (서해중부)
        '129',  // 서산 (서해중부)
        '184'   // 제주
    ];
    const allAlerts = [];
    const allRawTexts = [];  // 원본 텍스트 저장 (제외 정보 파싱용)

    for (const stnId of stnIds) {
        try {
            const params = new URLSearchParams({
                ServiceKey: decodeURIComponent(CONFIG.DATA_PORTAL_KEY),
                pageNo: '1',
                numOfRows: '1',
                dataType: 'JSON',
                stnId: stnId
            });

            const url = `https://apis.data.go.kr/1360000/WthrWrnInfoService/getWthrInfo?${params.toString()}`;
            console.log(`🔍 Fetching WthrInfo for stnId ${stnId}`);

            const response = await fetch(getProxiedUrl(url));
            if (!response.ok) continue;

            const data = await response.json();

            if (data.response?.header?.resultCode !== '00') continue;

            const items = data.response?.body?.items?.item || [];
            const itemArray = Array.isArray(items) ? items : [items];

            for (const item of itemArray) {
                if (item.t1) {
                    console.log(`📋 WthrInfo t1 (stnId ${stnId}):`, item.t1.substring(0, 200));
                    allRawTexts.push(item.t1);  // 원본 텍스트 저장
                    const alerts = parseWthrInfoText(item.t1);
                    allAlerts.push(...alerts);
                }
            }
        } catch (e) {
            console.error(`WthrInfo Error (stnId ${stnId}):`, e.message);
        }
    }

    // 중복 제거
    const uniqueAlerts = [];
    const seen = new Set();
    for (const alert of allAlerts) {
        const key = `${alert.zoneName}_${alert.warnType}_${alert.level}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueAlerts.push(alert);
        }
    }

    console.log('🔍 Total unique WthrInfo alerts:', uniqueAlerts.length);

    // alerts와 rawText 모두 반환 (제외 정보 파싱용)
    return {
        alerts: uniqueAlerts,
        rawText: allRawTexts.join('\n')
    };
}

/**
 * getWthrInfo의 t1 필드 텍스트에서 해상 특보 파싱
 * 형식 예: "o 풍랑주의보 : 경북북부앞바다중연안바다"
 */
function parseWthrInfoText(text) {
    const alerts = [];
    if (!text) return alerts;

    const lines = text.split(/[\r\n]+/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // 해상 특보 패턴 매칭
        const patterns = [
            /o\s*([풍랑태풍해일]+)\s*(경보|주의보|예비특보|예비)\s*[:：]\s*(.+)/i,
            /([풍랑태풍해일]+)\s*(경보|주의보|예비특보|예비)\s*[:：]\s*(.+)/
        ];

        for (const pattern of patterns) {
            const match = trimmedLine.match(pattern);
            if (match) {
                const warnType = match[1];
                let levelRaw = match[2];
                const zonesText = match[3];

                // 해상 특보만 필터링
                if (!['풍랑', '태풍', '해일'].includes(warnType)) continue;

                const isPreliminary = levelRaw.includes('예비');
                let level = isPreliminary ? '예비' : (levelRaw === '주의보' ? '주의보' : '경보');

                // 구역 파싱 (쉼표로 분리)
                const zones = zonesText.split(/[,，、]/);

                for (const zone of zones) {
                    // 공백 제거한 구역명
                    let cleanZone = zone.trim().replace(/\s+/g, '');

                    if (cleanZone && cleanZone.length > 2) {
                        const isCoastal = cleanZone.includes('연안바다') || cleanZone.includes('평수구역');

                        const alertData = {
                            zoneName: cleanZone,
                            warnType: warnType,
                            level: level,
                            isPreliminary: isPreliminary,
                            isCoastal: isCoastal,
                            source: 'WTHR_INFO'
                        };

                        // 1. 제외 정보 파싱 (예: "제주도서부앞바다(남서연안바다 제외)")
                        const exclusionParsed = parseExclusionFromZoneName(cleanZone);
                        if (exclusionParsed.excluded.length > 0) {
                            alertData.zoneName = exclusionParsed.cleanZoneName;
                            alertData.tempExclusions = exclusionParsed.excluded;
                        } else {
                            // 2. 제외 정보가 없다면, 일반 괄호(해제예고 등) 제거
                            const cleanNameMatch = cleanZone.match(/^(.+?)\s*\(.*?\)$/);
                            if (cleanNameMatch) {
                                alertData.originalZoneName = cleanZone;
                                alertData.zoneName = cleanNameMatch[1].trim();
                            }
                        }

                        alerts.push(alertData);

                        console.log(`  🎯 WthrInfo 파싱: ${alertData.zoneName} - ${warnType}${level} ${isCoastal ? '(연안/평수)' : ''}`);
                    }
                }
                break;
            }
        }
    }

    return alerts;
}

/**
 * 공공데이터포털 특보 제목(title)에서 구역별 특보 정보 파싱
 * 예: "o 풍랑주의보 : 서해남부남쪽안쪽먼바다중조도부근평수구역"
 * 예: "o 풍랑예비특보 : 경기북부앞바다, 경기북부앞바다중연안바다"
 */
function parsePortalTitle(title, tmFc) {
    const alerts = [];

    if (!title) return alerts;

    const lines = title.split(/[\r\n]+/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // 특보 패턴 매칭 - 다양한 형식 지원
        // "o 풍랑주의보 : 구역명", "풍랑예비특보 : 구역명" 등
        const patterns = [
            /o\s*([풍랑태풍해일강풍]+)\s*(경보|주의보|예비특보|예비)\s*[:：]\s*(.+)/i,
            /([풍랑태풍해일강풍]+)\s*(경보|주의보|예비특보|예비)\s*[:：]\s*(.+)/,
            /([풍랑태풍해일강풍]+)(경보|주의보|예비특보|예비)\s*[:：]?\s*(.+)/
        ];

        for (const pattern of patterns) {
            const match = trimmedLine.match(pattern);
            if (match) {
                const warnType = match[1]; // 풍랑, 태풍, 해일
                let levelRaw = match[2];   // 경보, 주의보, 예비특보, 예비
                const zones = match[3];    // 구역 목록

                // 해상 특보만 필터링
                if (!['풍랑', '태풍', '해일'].includes(warnType)) continue;

                // 수준 정규화
                const isPreliminary = levelRaw.includes('예비');
                let level;
                if (isPreliminary) {
                    level = '예비';  // UI 표시용
                } else if (levelRaw === '주의보') {
                    level = '주의보';
                } else {
                    level = '경보';
                }

                // 구역 파싱 (쉼표로 분리)
                const zoneList = zones.split(/[,，、]/);

                for (const zoneName of zoneList) {
                    let cleanZone = zoneName.trim()
                        .replace(/\s+/g, '')      // 공백 제거
                        .trim();

                    if (cleanZone && cleanZone.length > 2) {
                        const isCoastal = cleanZone.includes('연안바다') || cleanZone.includes('평수구역');

                        const alertData = {
                            zoneName: cleanZone,
                            warnType: warnType,
                            level: level,
                            tmFc: tmFc,
                            isPreliminary: isPreliminary,
                            isCoastal: isCoastal,
                            source: 'PORTAL'
                        };

                        // 1. 제외 정보 파싱 (예: "제주도서부앞바다(남서연안바다 제외)")
                        const exclusionParsed = parseExclusionFromZoneName(cleanZone);
                        if (exclusionParsed.excluded.length > 0) {
                            alertData.zoneName = exclusionParsed.cleanZoneName;
                            alertData.tempExclusions = exclusionParsed.excluded;
                        } else {
                            // 2. 제외 정보가 없다면, 일반 괄호(해제예고 등) 제거
                            const cleanNameMatch = cleanZone.match(/^(.+?)\s*\(.*?\)$/);
                            if (cleanNameMatch) {
                                alertData.originalZoneName = cleanZone;
                                alertData.zoneName = cleanNameMatch[1].trim();
                            }
                        }

                        alerts.push(alertData);

                        console.log(`  📍 파싱됨: ${alertData.zoneName} - ${warnType}${level} ${isCoastal ? '(연안/평수)' : ''}`);
                    }
                }
                break; // 첫 번째 매칭 패턴만 처리
            }
        }
    }

    return alerts;
}

/**
 * Portal API에서 파싱한 특보 데이터를 appState에 병합
 * - 연안바다/평수구역: coastalAlerts에 추가 + 상위 구역도 alerts에 추가
 * - 일반 해역: alerts에 추가 (중복 제외)
 */
function mergePortalAlerts(portalAlerts) {
    if (!portalAlerts || portalAlerts.length === 0) return;

    const existingMainZones = new Set(appState.alerts.map(a => `${a.zoneName}_${a.warnType}`));

    // 연안/평수구역의 상위 구역 찾기 함수 (공백 무관 매칭)
    function findParentZone(coastalZoneName) {
        // 공백 제거된 버전으로 비교
        const normalizedName = coastalZoneName.replace(/\s+/g, '');

        // COASTAL_MAPPING에서 상위 구역 찾기
        for (const [parentZone, subZones] of Object.entries(COASTAL_MAPPING)) {
            for (const sub of subZones) {
                const normalizedFullName = sub.fullName.replace(/\s+/g, '');
                if (normalizedFullName === normalizedName) {
                    return parentZone;
                }
            }
        }

        // 구역명에서 '중' 앞부분 추출 (예: "서해남부남쪽안쪽먼바다중조도부근평수구역" → "서해남부남쪽안쪽먼바다")
        const match = normalizedName.match(/^(.+)중(.+)(연안바다|평수구역)$/);
        if (match) {
            return match[1];
        }

        return null;
    }

    for (const alert of portalAlerts) {
        const key = `${alert.zoneName}_${alert.warnType}`;

        if (alert.isCoastal) {
            // 연안바다/평수구역 특보
            if (!appState.coastalAlerts[alert.zoneName]) {
                appState.coastalAlerts[alert.zoneName] = {
                    id: `portal_${alert.zoneName}_${alert.warnType}`,
                    zoneName: alert.zoneName,
                    warnType: alert.warnType,
                    level: alert.level,
                    command: '발표',
                    tmFc: alert.tmFc,
                    tmEf: '',
                    tmEd: '',
                    isPreliminary: alert.isPreliminary,
                    isCoastal: true,
                    source: 'PORTAL'
                };
                console.log(`✅ 연안/평수구역 특보 추가: ${alert.zoneName}`);

                // 상위 구역 찾아서 alerts에 없으면 추가
                const parentZone = findParentZone(alert.zoneName);
                if (parentZone) {
                    const parentKey = `${parentZone}_${alert.warnType}`;
                    if (!existingMainZones.has(parentKey)) {
                        appState.alerts.push({
                            id: `portal_parent_${parentZone}_${alert.warnType}`,
                            zoneCode: '',
                            zoneName: parentZone,
                            warnType: alert.warnType,
                            level: alert.level,
                            command: '발표',
                            tmFc: alert.tmFc,
                            tmEf: '',
                            tmEd: '',
                            isPreliminary: alert.isPreliminary,
                            isCoastal: false,
                            source: 'PORTAL_PARENT'
                        });
                        existingMainZones.add(parentKey);
                        console.log(`✅ 상위 구역 자동 추가: ${parentZone} (연안/평수 특보 발견으로)`);
                    }
                }
            }
        } else {
            // 일반 해역 특보 (Hub에 없는 경우만 추가)
            if (!existingMainZones.has(key)) {
                appState.alerts.push({
                    id: `portal_${alert.zoneName}_${alert.warnType}`,
                    zoneCode: '',
                    zoneName: alert.zoneName,
                    warnType: alert.warnType,
                    level: alert.level,
                    command: '발표',
                    tmFc: alert.tmFc,
                    tmEf: '',
                    tmEd: '',
                    isPreliminary: alert.isPreliminary,
                    isCoastal: false,
                    source: 'PORTAL'
                });
                existingMainZones.add(key);
                console.log(`✅ 일반 해역 특보 추가: ${alert.zoneName}`);
            }
        }
    }
}

// ============================================================================
// 연안바다 제외 로직 (Coastal Exclusion Logic)
// ============================================================================
// 
// 핵심 원리:
// 1. 메인 해역(예: "제주도서부앞바다")에 특보가 발효되면
//    → 해당 해역에 속한 모든 연안바다/평수구역도 자동으로 특보 적용
// 2. 단, "제외" 문구가 있으면 해당 연안바다/평수구역은 특보에서 제외
//    예: "제주도서부앞바다(남서연안바다 제외)" 
//    → 남서연안바다만 제외, 나머지(북서연안바다, 가파도연안바다)는 특보 발효
// ============================================================================

/**
 * 메인 해역 특보를 기반으로 연안바다/평수구역 특보 상태를 자동 생성
 * 
 * @param {Object} exclusionInfo - 제외 정보 객체 (해역명 → 제외된 연안바다 목록)
 *   예: { '제주도서부앞바다': ['남서연안바다'], '제주도동부앞바다': ['우도연안바다', '남동연안바다'] }
 */
function processCoastalWarningStatus(exclusionInfo = {}) {
    console.log('=== 연안바다 특보 상태 처리 시작 ===');
    console.log('제외 정보:', exclusionInfo);

    // 각 메인 해역 특보에 대해 처리
    for (const mainAlert of appState.alerts) {
        const mainZoneName = mainAlert.zoneName;
        const warnType = mainAlert.warnType;
        const level = mainAlert.level;

        // COASTAL_MAPPING에서 해당 메인 해역의 연안바다/평수구역 찾기
        const subZones = COASTAL_MAPPING[mainZoneName];
        if (!subZones || subZones.length === 0) {
            continue; // 연안바다가 없는 해역은 무시
        }

        // 제외된 연안바다 목록 가져오기
        const excludedNames = exclusionInfo[mainZoneName] || [];

        console.log(`📍 ${mainZoneName} (${warnType} ${level}):`);
        console.log(`   - 하위 구역: ${subZones.map(s => s.name).join(', ')}`);
        console.log(`   - 제외 구역: ${excludedNames.length > 0 ? excludedNames.join(', ') : '없음'}`);

        // 각 연안바다/평수구역에 대해 특보 상태 결정
        for (const subZone of subZones) {
            const fullName = subZone.fullName;
            const shortName = subZone.name;

            // 제외 여부 확인 (다양한 패턴 매칭)
            const isExcluded = excludedNames.some(excluded => {
                const normalizedExcluded = excluded.replace(/\s+/g, '').replace(/연안바다$/, '').replace(/평수구역$/, '');
                const normalizedShort = shortName.replace(/\s+/g, '').replace(/연안바다$/, '').replace(/평수구역$/, '');
                const normalizedFull = fullName.replace(/\s+/g, '');

                return normalizedExcluded === normalizedShort ||
                    normalizedExcluded === normalizedFull ||
                    fullName.includes(excluded) ||
                    shortName.includes(excluded);
            });

            if (isExcluded) {
                // 제외된 경우: coastalAlerts에서 제거 (이미 있다면)
                if (appState.coastalAlerts[fullName]) {
                    delete appState.coastalAlerts[fullName];
                    console.log(`   ❌ 제외: ${fullName}`);
                }
            } else {
                // 제외되지 않은 경우: coastalAlerts에 추가 (없다면)
                const alertKey = `${fullName}_${warnType}`;
                if (!appState.coastalAlerts[fullName] ||
                    appState.coastalAlerts[fullName].warnType !== warnType) {
                    appState.coastalAlerts[fullName] = {
                        id: `auto_${fullName}_${warnType}`,
                        zoneName: fullName,
                        warnType: warnType,
                        level: level,
                        command: mainAlert.command || '발표',
                        tmFc: mainAlert.tmFc,
                        tmEf: mainAlert.tmEf,
                        tmEd: mainAlert.tmEd,
                        isPreliminary: mainAlert.isPreliminary,
                        isCoastal: true,
                        source: 'AUTO_FROM_MAIN',
                        parentZone: mainZoneName
                    };
                    console.log(`   ✅ 적용: ${fullName}`);
                }
            }
        }
    }

    console.log('=== 연안바다 특보 상태 처리 완료 ===');
    console.log('최종 연안바다 특보 수:', Object.keys(appState.coastalAlerts).length);
}

/**
 * 구역명에서 "제외" 정보 파싱
 * 예: "제주도서부앞바다(남서연안바다 제외)" → { '제주도서부앞바다': ['남서연안바다'] }
 * 예: "제주도동부앞바다(북동·남동연안바다 제외)" → { '제주도동부앞바다': ['북동연안바다', '남동연안바다'] }
 * 
 * @param {string} zoneName - 특보 구역명 (제외 정보 포함 가능)
 * @returns {Object} - { cleanZoneName: '정제된 구역명', excluded: ['제외된 연안바다 목록'] }
 */
function parseExclusionFromZoneName(zoneName) {
    if (!zoneName) return { cleanZoneName: '', excluded: [] };

    // 괄호 안의 제외 정보 추출
    // 패턴: "구역명(제외 정보)"
    const match = zoneName.match(/^(.+?)\((.+?제외)\)$/);

    if (!match) {
        return { cleanZoneName: zoneName.trim(), excluded: [] };
    }

    const cleanZoneName = match[1].trim();
    const exclusionText = match[2].trim();

    // "제외" 앞의 연안바다 이름 추출
    // 예: "남서연안바다 제외", "북동·남동연안바다 제외", "북서연안바다, 가파도연안바다 제외"
    const excludedPart = exclusionText.replace(/\s*제외\s*$/, '');

    // 구분자로 분리 (·, ,, 、)
    const excludedNames = excludedPart
        .split(/[·,、]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);

    console.log(`🔍 제외 정보 파싱: "${zoneName}" → 구역: "${cleanZoneName}", 제외: [${excludedNames.join(', ')}]`);

    return { cleanZoneName, excluded: excludedNames };
}

/**
 * WthrInfo t1 필드 또는 Portal 텍스트에서 전체 제외 정보 추출
 * 
 * @param {string} text - 특보 현황 텍스트
 * @returns {Object} - 해역별 제외 정보 { '해역명': ['제외된 연안바다/평수구역 목록'] }
 */
function parseAllExclusionInfo(text) {
    const exclusionInfo = {};

    if (!text) return exclusionInfo;

    // "구역명(연안바다 제외)" 또는 "구역명(평수구역 제외)" 패턴 찾기
    // 예: "제주도서부앞바다(북서연안바다 제외)", "인천·경기남부앞바다(먼평수구역 제외)"
    // 예: "충남북부앞바다(천수만평수구역·당진평수구역 제외)"
    const pattern = /([가-힣·]+(?:앞바다|먼바다))\(([^)]+(?:연안바다|평수구역)[^)]*제외)\)/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        const zoneName = match[1];
        const exclusionText = match[2];

        // "제외" 앞의 연안바다/평수구역 이름 추출
        const excludedPart = exclusionText.replace(/\s*제외\s*$/g, '');

        // 구분자로 분리 (·, ,, 、)
        const excludedNames = excludedPart
            .split(/[·,、]/)
            .map(name => {
                let cleaned = name.trim();
                // "연안바다" 또는 "평수구역" 접미사가 없으면 추가
                if (cleaned && !cleaned.endsWith('연안바다') && !cleaned.endsWith('평수구역')) {
                    // 원본 텍스트에서 어떤 타입인지 확인
                    if (exclusionText.includes('평수구역') && !exclusionText.includes('연안바다')) {
                        cleaned += '평수구역';
                    } else if (exclusionText.includes('연안바다') && !exclusionText.includes('평수구역')) {
                        cleaned += '연안바다';
                    }
                    // 둘 다 있거나 없으면 원본 그대로 유지
                }
                return cleaned;
            })
            .filter(name => name.length > 0);

        if (excludedNames.length > 0) {
            // 기존 항목에 추가 (같은 해역에 여러 제외 정보가 있을 수 있음)
            if (exclusionInfo[zoneName]) {
                exclusionInfo[zoneName].push(...excludedNames);
            } else {
                exclusionInfo[zoneName] = excludedNames;
            }
            console.log(`📋 제외 정보 추출: ${zoneName} → [${excludedNames.join(', ')}]`);
        }
    }

    return exclusionInfo;
}

/**
 * 메인 해역에 특보가 있을 때, 해당 연안바다의 특보 상태 확인
 * 
 * @param {string} coastalZoneName - 연안바다 전체 이름 (예: "제주도서부앞바다중남서연안바다")
 * @param {string} warnType - 특보 종류 (풍랑, 태풍, 해일)
 * @returns {Object|null} - 특보 정보 또는 null (특보 없음)
 */
function getCoastalWarningStatus(coastalZoneName, warnType) {
    // 1. coastalAlerts에 직접 있는지 확인
    const directAlert = appState.coastalAlerts[coastalZoneName];
    if (directAlert && directAlert.warnType === warnType) {
        return directAlert;
    }

    // 2. 상위 해역 찾기
    let parentZoneName = null;
    for (const [mainZone, subZones] of Object.entries(COASTAL_MAPPING)) {
        for (const sub of subZones) {
            if (sub.fullName === coastalZoneName) {
                parentZoneName = mainZone;
                break;
            }
        }
        if (parentZoneName) break;
    }

    if (!parentZoneName) return null;

    // 3. 상위 해역에 특보가 있는지 확인
    const parentAlert = appState.alerts.find(a =>
        a.zoneName === parentZoneName && a.warnType === warnType
    );

    if (!parentAlert) return null;

    // 4. 상위 해역에 특보가 있으면 연안바다도 특보 발효
    // (processCoastalWarningStatus에서 제외 처리가 이미 되어 있어야 함)
    return {
        ...parentAlert,
        zoneName: coastalZoneName,
        isCoastal: true,
        source: 'INHERITED_FROM_MAIN',
        parentZone: parentZoneName
    };
}

// ----------------------------------------------------------------------------
// UI Rendering
// ----------------------------------------------------------------------------

// API 상태 표시 관리자 (롤링 대신 정적 표시)
const ApiStatusManager = {
    _injectStyles() {
        if (document.getElementById('api-status-styles')) return;
        const style = document.createElement('style');
        style.id = 'api-status-styles';
        style.textContent = `
            .api-status-wrapper {
                height: 24px;
                overflow: hidden;
                position: relative;
                margin-top: 5px;
                background: transparent;
                padding: 0;
                display: flex;
                align-items: center;
                border: none;
            }
            #api-rolling-list {
                list-style: none;
                padding: 0;
                margin: 0;
                width: 100%;
                height: 100%;
            }
            #api-rolling-list li {
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 6px;
                font-size: 0.85rem;
                color: #aaa;
                white-space: nowrap;
            }
            .status-update-time {
                color: #8ecfff;
            }
            .status-error {
                color: #ff5252;
                font-weight: 600;
            }
            .status-error i {
                margin-right: 4px;
            }
        `;
        document.head.appendChild(style);
    },

    update() {
        this._injectStyles();

        const list = document.getElementById('api-rolling-list');
        if (!list) return;

        // 오류 API 확인
        const errors = [];
        if (appState.apiStatus.hub === 'error') errors.push('특보 API');
        if (appState.apiStatus.buoy === 'error') errors.push('부이 API');
        if (appState.apiStatus.coastal === 'error') errors.push('연안 API');

        let html = '';

        if (errors.length > 0) {
            // 오류가 있을 때: 오류 API 표시
            html = `<li><span class="status-error"><i class="fa-solid fa-triangle-exclamation"></i> ${errors.join(', ')} 오류</span></li>`;
        } else if (appState.lastUpdated) {
            // 정상: 최근 업데이트 시간 표시
            const time = appState.lastUpdated;
            const hours = time.getHours();
            const minutes = String(time.getMinutes()).padStart(2, '0');
            const ampm = hours < 12 ? '오전' : '오후';
            const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);

            html = `<li><span class="status-update-time">최근 업데이트: ${ampm} ${displayHour}:${minutes}</span></li>`;
        } else {
            // 로딩 중
            html = `<li><span style="color: #ffd740;">데이터 로딩 중...</span></li>`;
        }

        list.innerHTML = html;
    }
};

function updateApiStatusDisplay() {
    ApiStatusManager.update();
}

// --- Accordion Logic ---
window.toggleMainAccordion = function () {
    const body = document.getElementById('main-accordion-body');
    const header = document.getElementById('main-accordion-header');
    if (body) body.classList.toggle('collapsed');
    if (header) header.classList.toggle('collapsed-state');
};

// --- 특보 정렬 함수 ---
// 정렬 우선순위: 1) 경보 > 주의보, 2) 앞바다 > 먼바다
// 3) 앞바다: 북부→남부→서부→동부, 4) 먼바다: 안쪽→바깥쪽
function sortAlertItems(items) {
    const DIRECTION_ORDER = { '북부': 1, '남부': 2, '서부': 3, '동부': 4 };
    const FAR_SEA_ORDER = { '안쪽': 1, '바깥': 2 };

    // 구역명에서 정렬 가중치 계산
    const getZoneSortWeight = (zoneName) => {
        // 앞바다 vs 먼바다 (앞바다 우선)
        const isNearSea = zoneName.includes('앞바다');
        const isFarSea = zoneName.includes('먼바다');

        let seaTypeWeight = isNearSea ? 0 : (isFarSea ? 1000 : 500);

        // 방향 순서 (북부→남부→서부→동부)
        let directionWeight = 99;
        for (const [dir, order] of Object.entries(DIRECTION_ORDER)) {
            if (zoneName.includes(dir)) {
                directionWeight = order;
                break;
            }
        }

        // 먼바다의 경우: 안쪽→바깥쪽
        let farSeaWeight = 0;
        if (isFarSea) {
            if (zoneName.includes('안쪽')) farSeaWeight = 1;
            else if (zoneName.includes('바깥')) farSeaWeight = 2;
        }

        return seaTypeWeight + directionWeight * 10 + farSeaWeight;
    };

    // 경보 여부 확인
    const isWarning = (item) => item.level === '경보';

    return [...items].sort((a, b) => {
        // 1. 경보가 최상단
        const aIsWarning = isWarning(a);
        const bIsWarning = isWarning(b);
        if (aIsWarning && !bIsWarning) return -1;
        if (!aIsWarning && bIsWarning) return 1;

        // 2. 구역 정렬 (앞바다→먼바다, 방향순서)
        const aWeight = getZoneSortWeight(a.zoneName);
        const bWeight = getZoneSortWeight(b.zoneName);

        return aWeight - bWeight;
    });
}

function renderApp() {
    const seaSections = {
        '동해': document.getElementById('east-sea-list'),
        '서해': document.getElementById('west-sea-list'),
        '남해': document.getElementById('south-sea-list'),
        '제주': document.getElementById('jeju-sea-list')
    };

    const seaCounts = {
        '동해': document.getElementById('east-count'),
        '서해': document.getElementById('west-count'),
        '남해': document.getElementById('south-count'),
        '제주': document.getElementById('jeju-count')
    };

    // Clear content
    Object.values(seaSections).forEach(el => {
        if (el) el.innerHTML = '';
    });

    let counts = { '동해': 0, '서해': 0, '남해': 0, '제주': 0 };

    // Group by Sea (대분류) and SubRegion (중분류)
    const groups = {};        // 대분류별 그룹: { '동해': [...], '서해': [...] }
    const subGroups = {};     // 중분류별 그룹: { '동해남부해상': [...], '동해중부해상': [...] }

    appState.alerts.forEach(item => {
        // 연안바다/평수구역은 메인 목록에서 제외 (상세 팝업에서만 표시)
        if (item.isCoastal) return;

        const subRegion = getSubRegion(item.zoneName) || '기타';
        const mainRegion = getMainRegion(subRegion);

        // 대분류 그룹
        if (!groups[mainRegion]) groups[mainRegion] = [];
        groups[mainRegion].push(item);

        // 중분류 그룹
        if (!subGroups[subRegion]) subGroups[subRegion] = [];
        subGroups[subRegion].push(item);
    });

    console.log('Grouped by sea (대분류):', groups);
    console.log('Grouped by subRegion (중분류):', subGroups);

    // Render with 2-level structure
    for (const [mainRegion, mainItems] of Object.entries(groups)) {
        if (!seaSections[mainRegion]) continue;

        const container = seaSections[mainRegion];

        // 해당 대분류의 중분류 목록
        const subRegionList = SEA_REGIONS[mainRegion]?.subRegions || [];

        // 제주는 중분류가 하나뿐이므로 서브헤더 없이 바로 렌더링
        if (mainRegion === '제주' || subRegionList.length <= 1) {
            // 정렬하여 렌더링
            const sortedItems = sortAlertItems(mainItems);
            sortedItems.forEach(item => {
                counts[mainRegion]++;
                container.appendChild(createAlertElement(item));
            });
        } else {
            // 중분류별로 서브 섹션 생성
            subRegionList.forEach(subRegion => {
                const subItems = subGroups[subRegion];
                if (!subItems || subItems.length === 0) return;

                // 서브 섹션 컨테이너
                const subSection = document.createElement('div');
                subSection.className = 'sub-region-section';
                subSection.style.marginBottom = '14px';

                // 서브 헤더 (중분류명) - 해역보다 작고, 특보구역보다 크게
                const subHeader = document.createElement('div');
                subHeader.className = 'sub-region-header';
                subHeader.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    background: linear-gradient(135deg, rgba(30, 60, 114, 0.8), rgba(42, 82, 152, 0.6));
                    border-radius: 10px;
                    margin-bottom: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-left: 4px solid #4fc3f7;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                `;
                subHeader.innerHTML = `
                    <i class="fa-solid fa-chevron-right" style="font-size: 0.85rem; color: #4fc3f7; transition: transform 0.3s;"></i>
                    <span style="font-size: 1.0rem; font-weight: 700; color: #fff;">${subRegion}</span>
                    <span style="background: rgba(255, 152, 0, 0.4); padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; color: #ffd54f; margin-left: auto;">${subItems.length}건</span>
                `;

                // 호버 효과 (그라디언트만 변경, 이동 없음)
                subHeader.onmouseenter = () => {
                    subHeader.style.background = 'linear-gradient(135deg, rgba(40, 80, 140, 0.9), rgba(52, 102, 180, 0.7))';
                };
                subHeader.onmouseleave = () => {
                    subHeader.style.background = 'linear-gradient(135deg, rgba(30, 60, 114, 0.8), rgba(42, 82, 152, 0.6))';
                };

                // 목록 컨테이너 (기본: 숨김)
                const listContainer = document.createElement('div');
                listContainer.className = 'sub-region-list hidden';
                listContainer.style.paddingLeft = '12px';

                // 토글 기능
                subHeader.onclick = () => {
                    listContainer.classList.toggle('hidden');
                    const icon = subHeader.querySelector('.fa-chevron-right');
                    if (listContainer.classList.contains('hidden')) {
                        // 닫힘
                        icon.style.transform = 'rotate(0deg)';
                        subHeader.style.marginLeft = '0';
                    } else {
                        // 열림
                        icon.style.transform = 'rotate(90deg)';
                        subHeader.style.marginLeft = '4px';
                    }
                };

                // 아이템 추가 (정렬 적용)
                const sortedSubItems = sortAlertItems(subItems);
                sortedSubItems.forEach(item => {
                    counts[mainRegion]++;
                    listContainer.appendChild(createAlertElement(item));
                });

                subSection.appendChild(subHeader);
                subSection.appendChild(listContainer);
                container.appendChild(subSection);
            });
        }
    }

    const totalAlerts = appState.alerts.length;

    // --- Disable/Enable Sea Sections & Sort Order ---
    const alertContent = document.getElementById('alert-content');
    const errorMsg = document.getElementById('alert-error-message');
    const sections = []; // To store section elements with their counts logic

    // API 에러 처리
    if (appState.hasApiError) {
        if (errorMsg) errorMsg.classList.remove('hidden');

        // 모든 해역 섹션 숨기기 (count-badge 등은 무시됨)
        for (const [sea, section] of Object.entries(seaSections)) {
            if (section && section.parentElement) {
                section.parentElement.style.display = 'none';
            }
        }
        return; // 에러 상태에서는 여기서 렌더링 종료
    } else {
        // 정상 상태: 에러 메시지 숨기고 섹션 표시 복구
        if (errorMsg) errorMsg.classList.add('hidden');

        for (const [sea, section] of Object.entries(seaSections)) {
            if (section && section.parentElement) {
                section.parentElement.style.display = '';
            }
        }
    }

    for (const [sea, count] of Object.entries(counts)) {
        if (seaSections[sea]) {
            const sectionContainer = seaSections[sea].parentElement; // .sea-section

            if (sectionContainer) {
                // Store for sorting
                sections.push({ el: sectionContainer, count: count, id: sectionContainer.id });

                // Remove previous disabled state
                sectionContainer.classList.remove('disabled');
                const header = sectionContainer.querySelector('.sea-header');
                if (header) header.style.cursor = 'pointer';

                // Update count badge
                if (seaCounts[sea]) {
                    seaCounts[sea].textContent = `${count}건`;

                    if (count === 0) {
                        // Empty: Disable Interaction & Show "No Alerts"
                        seaCounts[sea].classList.add('zero');
                        seaCounts[sea].textContent = '특보 없음';

                        // Disable interaction
                        sectionContainer.classList.add('disabled');
                        if (header) header.style.cursor = 'default';

                        // Ensure sub-section is collapsed
                        sectionContainer.classList.remove('open');
                    } else {
                        // Has alerts: Enable
                        seaCounts[sea].classList.remove('zero');
                        // Start collapsed (as requested)
                        sectionContainer.classList.remove('open');
                    }
                }
            }
        }
    }

    // Sort sections: Alerts (count > 0) first, No Alerts last
    // Keep original order relative to each group (e.g., East, West, South, Jeju)
    const originalOrder = ['east-sea-section', 'west-sea-section', 'south-sea-section', 'jeju-sea-section'];

    sections.sort((a, b) => {
        const hasAlertA = a.count > 0;
        const hasAlertB = b.count > 0;

        if (hasAlertA && !hasAlertB) return -1; // A comes first
        if (!hasAlertA && hasAlertB) return 1;  // B comes first

        // If same status, keep original relative order
        return originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id);
    });

    // Re-append in new order
    if (alertContent) {
        sections.forEach(item => {
            alertContent.appendChild(item.el);
        });
    }

    // --- Global Badge & Accordion State Logic ---
    const globalStatusContainer = document.querySelector('.header-status'); // Use container to clear/add multiple badges
    const mainHeader = document.getElementById('main-accordion-header');
    const mainBody = document.getElementById('main-accordion-body');

    // Count Active vs Preliminary
    const activeCount = appState.alerts.filter(a => !a.isPreliminary).length;
    const prelimCount = appState.alerts.filter(a => a.isPreliminary).length;
    const totalCount = activeCount + prelimCount;

    if (globalStatusContainer) {
        // Clear existing badges (except icon)
        // We need to keep the icon
        const icon = document.getElementById('main-accordion-icon');
        globalStatusContainer.innerHTML = ''; // Clear all
        globalStatusContainer.style.gap = '5px'; // Override CSS gap (12px)

        if (totalCount > 0) {
            // Add Active Badge (Red) - "발효"
            if (activeCount > 0) {
                const activeBadge = document.createElement('span');
                activeBadge.className = 'status-badge warning';
                activeBadge.textContent = `발효 ${activeCount}건`;
                globalStatusContainer.appendChild(activeBadge);
            }

            // Add Preliminary Badge (Orange) - "발표"
            if (prelimCount > 0) {
                const prelimBadge = document.createElement('span');
                prelimBadge.className = 'status-badge orange'; // Custom orange class
                prelimBadge.textContent = `발표 ${prelimCount}건`;
                globalStatusContainer.appendChild(prelimBadge);
            }

            // Start Expanded
            if (mainBody && mainBody.classList.contains('collapsed')) {
                mainBody.classList.remove('collapsed');
                if (mainHeader) mainHeader.classList.remove('collapsed-state');
            }
        } else {
            // No Alerts (Green)
            const safeBadge = document.createElement('span');
            safeBadge.className = 'status-badge safe';
            safeBadge.textContent = '전 해역 특보없음';
            safeBadge.style.marginRight = '6px';
            globalStatusContainer.appendChild(safeBadge);

            // Start Collapsed
            if (mainBody && !mainBody.classList.contains('collapsed')) {
                mainBody.classList.add('collapsed');
                if (mainHeader) mainHeader.classList.add('collapsed-state');
            }
        }

        // Re-append icon
        if (icon) {
            globalStatusContainer.appendChild(icon);
        } else {
            // Create if missing (shouldn't happen usually)
            const newIcon = document.createElement('i');
            newIcon.id = 'main-accordion-icon';
            newIcon.className = 'fa-solid fa-chevron-down';
            globalStatusContainer.appendChild(newIcon);
        }
    }

    // 전체 현황 업데이트 로그
    console.log('Total alerts displayed:', totalAlerts);
}

function createAlertElement(data) {
    const template = document.getElementById('alert-item-template');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.alert-card');

    // 카드 스타일 (컴팩트하게 - 중분류보다 작게)
    card.style.cssText = `
        padding: 10px 12px;
        margin-bottom: 6px;
        border-radius: 8px;
        background: rgba(30, 40, 60, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.2s ease;
    `;

    // 구역명 (컴팩트하게)
    const zoneName = clone.querySelector('.zone-name');
    zoneName.innerHTML = ''; // 초기화

    const nameSpan = document.createElement('span');
    nameSpan.textContent = data.zoneName;
    zoneName.appendChild(nameSpan);

    // 원본 이름에 추가 정보(해제예고 등)가 있다면 함께 표시
    if (data.originalZoneName && data.originalZoneName !== data.zoneName) {
        // 원본에서 구역명을 뺀 나머지 부분 추출 (괄호 포함)
        let extraText = data.originalZoneName.replace(data.zoneName, '').trim();

        if (extraText) {
            const extraSpan = document.createElement('span');
            extraSpan.style.fontSize = '0.75rem';
            extraSpan.style.color = '#aaa'; // 흐린 색상
            extraSpan.style.marginLeft = '6px';
            extraSpan.style.fontWeight = '400';
            extraSpan.textContent = extraText;
            zoneName.appendChild(extraSpan);
        }
    }

    zoneName.style.cssText = `
        font-size: 0.9rem;
        font-weight: 600;
        color: #e0e0e0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
    `;

    // 뱃지
    const badgeContainer = clone.querySelector('.alert-badges');
    if (data.warnType && data.level) {
        const badge = document.createElement('span');
        badge.className = `status-badge ${data.isPreliminary ? 'preliminary' : 'warning'}`;
        badge.textContent = `${data.warnType} ${data.level}`;
        badgeContainer.appendChild(badge);

        // 명령 뱃지 (발표, 대치 등)
        if (data.command && data.command !== '발표') {
            const cmdBadge = document.createElement('span');
            cmdBadge.className = 'status-badge safe';
            cmdBadge.textContent = data.command;
            badgeContainer.appendChild(cmdBadge);
        }
    }

    // 시간 정보
    const details = clone.querySelector('.alert-details');
    details.querySelector('.tmFc').textContent = formatDate(data.tmFc) || '정보 없음';
    details.querySelector('.tmEf').textContent = formatDate(data.tmEf) || '정보 없음';

    // 해제 예정 시간 - 빈 값이면 "정보 없음" 표시, 있으면 초록색으로 강조
    const releaseTimeEl = details.querySelector('.release-time');
    const releaseTime = data.tmEd && data.tmEd.trim() !== '' ? formatDate(data.tmEd) : '정보 없음';
    releaseTimeEl.textContent = releaseTime;

    // 해제 예정 시간이 있으면 초록색으로 표시 (정보 없음도 초록색)
    releaseTimeEl.style.color = '#69f0ae';

    // 연안바다/평수구역 표시 (먼저)
    const coastalZones = COASTAL_MAPPING[data.zoneName];
    if (coastalZones && coastalZones.length > 0) {
        const coastalContainer = document.createElement('div');
        coastalContainer.className = 'coastal-zones';
        coastalContainer.style.marginTop = '12px';
        coastalContainer.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        coastalContainer.style.paddingTop = '12px';

        const coastalTitle = document.createElement('div');
        coastalTitle.style.fontSize = '0.85rem';
        coastalTitle.style.color = '#8b949e';
        coastalTitle.style.marginBottom = '8px';
        coastalTitle.textContent = '연안바다/평수구역';
        coastalContainer.appendChild(coastalTitle);

        // 공백 무관 매칭 함수
        const findCoastalAlert = (fullName) => {
            const normalizedTarget = fullName.replace(/\s+/g, '');
            for (const [key, alert] of Object.entries(appState.coastalAlerts)) {
                const normalizedKey = key.replace(/\s+/g, '');
                if (normalizedKey === normalizedTarget) {
                    return alert;
                }
            }
            return null;
        };

        const sortedCoastal = [...coastalZones].sort((a, b) => {
            const alertA = findCoastalAlert(a.fullName);
            const alertB = findCoastalAlert(b.fullName);
            if (alertA && !alertB) return -1;
            if (!alertA && alertB) return 1;
            return 0;
        });

        sortedCoastal.forEach(coastal => {
            const coastalAlert = findCoastalAlert(coastal.fullName);
            const coastalItem = createCoastalElement(coastal, coastalAlert, data.zoneName);
            coastalContainer.appendChild(coastalItem);
        });

        details.appendChild(coastalContainer);
    }

    // 부이 정보 표시 (버튼 방식) - 연안바다 아래
    const buoys = BUOY_MAPPING[data.zoneName];
    if (buoys && buoys.length > 0) {
        const buoyContainer = document.createElement('div');
        buoyContainer.className = 'buoy-section';
        buoyContainer.style.marginTop = '12px';
        buoyContainer.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        buoyContainer.style.paddingTop = '12px';

        const buoyTitle = document.createElement('div');
        buoyTitle.style.fontSize = '0.85rem';
        buoyTitle.style.color = '#8b949e';
        buoyTitle.style.marginBottom = '10px';
        buoyTitle.innerHTML = '🌊 관측부이 <span style="color:#69f0ae;font-size:0.75rem">(' + buoys.length + ')</span>';
        buoyContainer.appendChild(buoyTitle);

        // 버튼 컨테이너
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.flexWrap = 'wrap';
        btnContainer.style.gap = '8px';
        btnContainer.style.marginBottom = '10px';

        // 정보 표시 영역
        const infoArea = document.createElement('div');
        infoArea.className = 'buoy-info-area';
        infoArea.style.display = 'none';
        infoArea.style.backgroundColor = 'rgba(68, 138, 255, 0.1)';
        infoArea.style.borderRadius = '8px';
        infoArea.style.padding = '12px';
        infoArea.style.border = '1px solid rgba(68, 138, 255, 0.2)';

        buoys.forEach(buoy => {
            const btn = document.createElement('button');
            btn.className = 'buoy-btn';
            btn.textContent = buoy.name;
            btn.style.padding = '6px 14px';
            btn.style.borderRadius = '16px';
            btn.style.border = '1px solid rgba(255,255,255,0.15)';
            btn.style.backgroundColor = 'rgba(255,255,255,0.05)';
            btn.style.color = '#ccc';
            btn.style.fontSize = '0.85rem';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'all 0.2s';

            btn.addEventListener('click', (e) => {
                e.stopPropagation();

                // 이미 활성화된 버튼 클릭 시 닫기
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                    btn.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    btn.style.color = '#ccc';
                    btn.style.borderColor = 'rgba(255,255,255,0.15)';
                    infoArea.style.display = 'none';
                    return;
                }

                // 다른 버튼 비활성화
                btnContainer.querySelectorAll('.buoy-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    b.style.color = '#ccc';
                    b.style.borderColor = 'rgba(255,255,255,0.15)';
                });

                // 현재 버튼 활성화
                btn.classList.add('active');
                btn.style.backgroundColor = 'rgba(68, 138, 255, 0.3)';
                btn.style.color = '#448aff';
                btn.style.borderColor = '#448aff';

                // 부이 정보 표시
                displayBuoyInfo(buoy, infoArea);
                infoArea.style.display = 'block';
            });

            btnContainer.appendChild(btn);
        });

        buoyContainer.appendChild(btnContainer);
        buoyContainer.appendChild(infoArea);
        details.appendChild(buoyContainer);
    }

    // 펼치기/접기
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        if (e.target.closest('.coastal-item') || e.target.closest('.buoy-btn') || e.target.closest('.buoy-info-area')) return;
        e.stopPropagation();

        const isCurrentlyHidden = details.classList.contains('hidden');

        // 1. 다른 모든 알림 카드를 닫음 (전체 문서 범위에서)
        document.querySelectorAll('.alert-details').forEach(otherDetails => {
            otherDetails.classList.add('hidden');
        });
        document.querySelectorAll('.detail-arrow').forEach(otherArrow => {
            otherArrow.style.transform = 'rotate(0deg)';
        });

        // 2. 현재 카드만 토글 (이전에 닫혀있었다면 열기)
        if (isCurrentlyHidden) {
            details.classList.remove('hidden');
            const arrow = card.querySelector('.detail-arrow');
            arrow.style.transform = 'rotate(90deg)';
        }
    });

    // 🗺️ 버튼 컨테이너 (기상예보 + 해구별 예상 기상)
    if (typeof ZONE_OVERLAY_CONFIG !== 'undefined' && ZONE_OVERLAY_CONFIG[data.zoneName]) {
        // 매핑된 구역인지 확인 (먼바다 통합 구역 등 - 예보 데이터가 없는 구역)
        const isMappedZone = typeof ZONE_NAME_DISPLAY_MAP !== 'undefined' && ZONE_NAME_DISPLAY_MAP[data.zoneName];

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 15px;
            flex-wrap: nowrap;
        `;

        // 기상예보 버튼 (매핑된 구역이 아닌 경우에만 표시)
        if (!isMappedZone) {
            const forecastBtn = document.createElement('button');
            forecastBtn.className = 'forecast-btn';
            forecastBtn.innerHTML = '☀️ 기상예보';
            forecastBtn.style.cssText = `
                flex: 1;
                padding: 12px 8px;
                background: linear-gradient(135deg, #ffd54f, #ff9800, #f57c00);
                color: #1a1e2e;
                border: none;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
                white-space: nowrap;
            `;
            forecastBtn.addEventListener('mouseenter', () => {
                forecastBtn.style.transform = 'translateY(-2px)';
                forecastBtn.style.boxShadow = '0 4px 15px rgba(255, 152, 0, 0.5)';
            });
            forecastBtn.addEventListener('mouseleave', () => {
                forecastBtn.style.transform = 'translateY(0)';
                forecastBtn.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.3)';
            });
            forecastBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showSeaForecastTable(data.zoneName);
            });
            btnContainer.appendChild(forecastBtn);
        }

        // 해구별 예상 기상 버튼
        const zoneViewBtn = document.createElement('button');
        zoneViewBtn.className = 'zone-view-btn';
        zoneViewBtn.innerHTML = '🗺️ 해구별 기상전망';
        zoneViewBtn.style.cssText = `
            flex: 1;
            padding: 12px 8px;
            background: linear-gradient(135deg, #e94560, #0f3460);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            white-space: nowrap;
        `;
        zoneViewBtn.addEventListener('mouseenter', () => {
            zoneViewBtn.style.transform = 'translateY(-2px)';
            zoneViewBtn.style.boxShadow = '0 4px 15px rgba(233, 69, 96, 0.4)';
        });
        zoneViewBtn.addEventListener('mouseleave', () => {
            zoneViewBtn.style.transform = 'translateY(0)';
            zoneViewBtn.style.boxShadow = 'none';
        });
        zoneViewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof showZoneOverlay === 'function') {
                showZoneOverlay(data.zoneName);
            }
        });

        btnContainer.appendChild(zoneViewBtn);
        details.appendChild(btnContainer);
    }

    return card;
}

// 부이 정보 표시 (버튼 클릭 시 호출)
function displayBuoyInfo(buoy, container) {
    container.innerHTML = '';

    // 디버그: 부이 ID와 데이터 유무 확인
    console.log('🔍 부이 조회:', buoy.id, buoy.name, '| 데이터 존재:', !!appState.buoyData[buoy.id]);

    const buoyData = appState.buoyData[buoy.id];
    const typeInfo = BUOY_TYPES[buoy.type] || { name: '부이', icon: '📍' };

    // 헤더
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';
    header.style.paddingBottom = '8px';
    header.style.borderBottom = '1px solid rgba(255,255,255,0.1)';

    const nameSpan = document.createElement('span');
    nameSpan.style.fontWeight = '600';
    nameSpan.style.fontSize = '0.95rem';
    nameSpan.style.color = '#e6edf3';
    nameSpan.innerHTML = `${buoy.name} <span style="font-size:0.75rem;color:#8b949e;margin-left:6px">(${typeInfo.name})</span>`;
    header.appendChild(nameSpan);
    container.appendChild(header);

    if (!buoyData) {
        const noData = document.createElement('div');
        noData.style.textAlign = 'center';
        noData.style.padding = '16px 10px';
        noData.style.color = '#ff9800';
        noData.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
        noData.style.borderRadius = '6px';
        noData.style.fontSize = '0.9rem';
        noData.innerHTML = '⚠️ 해당 부이에서는 기상정보가 관측되지 않았습니다.';
        container.appendChild(noData);
        return;
    }

    // 주요 데이터 (파고, 풍속, 수온)
    const mainData = document.createElement('div');
    mainData.style.display = 'flex';
    mainData.style.gap = '20px';
    mainData.style.marginBottom = '12px';
    mainData.style.flexWrap = 'wrap';

    if (buoyData.waveHeight !== null) {
        const waveBox = createDataBox('🌊 파고', buoyData.waveHeight, 'm', '#4fc3f7');
        mainData.appendChild(waveBox);
    }

    if (buoyData.windSpeed !== null) {
        const windDir = buoyData.windDirection !== null ? getWindDirectionText(buoyData.windDirection) : '';
        const windBox = createDataBox('💨 풍속', buoyData.windSpeed, `m/s ${windDir}`, '#81c784');
        mainData.appendChild(windBox);
    }

    if (buoyData.waterTemp !== null) {
        const tempBox = createDataBox('🌡️ 수온', buoyData.waterTemp, '°C', '#ffb74d');
        mainData.appendChild(tempBox);
    }

    container.appendChild(mainData);

    // 상세 데이터
    let detailHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem;background:rgba(0,0,0,0.2);padding:10px;border-radius:6px">';

    if (buoyData.windGust !== null) {
        detailHTML += `<div><span style="color:#8b949e">돌풍</span> <span style="color:#fff">${buoyData.windGust} m/s</span></div>`;
    }
    if (buoyData.airTemp !== null) {
        detailHTML += `<div><span style="color:#8b949e">기온</span> <span style="color:#fff">${buoyData.airTemp}°C</span></div>`;
    }
    if (buoyData.pressure !== null) {
        detailHTML += `<div><span style="color:#8b949e">기압</span> <span style="color:#fff">${buoyData.pressure} hPa</span></div>`;
    }
    if (buoyData.humidity !== null) {
        detailHTML += `<div><span style="color:#8b949e">습도</span> <span style="color:#fff">${buoyData.humidity}%</span></div>`;
    }
    if (buoyData.tm) {
        detailHTML += `<div style="grid-column:1/-1;margin-top:4px;padding-top:4px;border-top:1px dashed rgba(255,255,255,0.1)"><span style="color:#8b949e">관측시간</span> <span style="color:#fff">${formatBuoyTime(buoyData.tm)}</span></div>`;
    }

    detailHTML += '</div>';

    const detailContainer = document.createElement('div');
    detailContainer.innerHTML = detailHTML;
    container.appendChild(detailContainer);
    detailContainer.innerHTML = detailHTML;
    container.appendChild(detailContainer);
}

// 연안바다 이미지 매핑
const COASTAL_ZONES_IMAGES = {
    "제주도북부앞바다": { "연안바다": "북부앞바다(연안바다).png" },
    "제주도남부앞바다": { "연안바다": "남부앞바다(연안바다).png" },
    "제주도동부앞바다": {
        "북동연안바다": "동부앞바다(북동연안바다).png",
        "남동연안바다": "동부앞바다(남동연안바다).png"
    },
    "제주도서부앞바다": {
        "북서연안바다": "서부앞바다(북서연안바다).png",
        "남서연안바다": "서부앞바다(남서연안바다).png"
    }
};

// 이미지 모달 표시 함수
function showImageModal(imageName, title) {
    // 기존 모달 제거
    const existing = document.getElementById('image-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'image-modal-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(5px);
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        position: relative; max-width: 95%; max-height: 90%;
        background: #222; border-radius: 8px; overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #444;
        display: flex; flex-direction: column;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        padding: 12px 16px; background: #333; color: #fff; font-weight: bold;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #444; font-size: 1rem;
    `;
    header.innerHTML = `<span>🗺️ ${title}</span>`;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;
    `;
    closeBtn.onclick = () => overlay.remove();
    header.appendChild(closeBtn);

    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = 'padding: 0; overflow: auto; display: flex; align-items: center; justify-content: center; background: #000;';

    const img = document.createElement('img');
    img.src = `연안바다_이미지/${imageName}`;
    img.style.cssText = 'max-width: 100%; max-height: 80vh; display: block;';
    img.onerror = () => { img.alt = '이미지를 불러올 수 없습니다.'; img.src = ''; img.style.color = '#fff'; img.style.padding = '20px'; };

    imgContainer.appendChild(img);
    content.appendChild(header);
    content.appendChild(imgContainer);
    overlay.appendChild(content);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
}

// 데이터 박스 생성 헬퍼
function createDataBox(label, value, unit, color) {
    const box = document.createElement('div');
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '2px';

    const labelSpan = document.createElement('span');
    labelSpan.style.fontSize = '0.7rem';
    labelSpan.style.color = '#8b949e';
    labelSpan.textContent = label;

    const valueSpan = document.createElement('span');
    valueSpan.style.fontSize = '1.1rem';
    valueSpan.style.fontWeight = '700';
    valueSpan.style.color = color;
    valueSpan.innerHTML = `${value} <span style="font-size:0.75rem;font-weight:400;color:#8b949e">${unit}</span>`;

    box.appendChild(labelSpan);
    box.appendChild(valueSpan);

    return box;
}

// 부이 관측시간 포맷
function formatBuoyTime(tm) {
    if (!tm || tm.length < 12) return '-';
    const month = tm.substring(4, 6);
    const day = tm.substring(6, 8);
    const hour = tm.substring(8, 10);
    const minute = tm.substring(10, 12);
    return `${month}/${day} ${hour}:${minute}`;
}

// 연안바다/평수구역 요소 생성
function createCoastalElement(coastal, alertData, parentZoneName) {
    const item = document.createElement('div');
    item.className = 'coastal-item';
    item.style.padding = '8px 12px';
    item.style.marginBottom = '4px';
    item.style.borderRadius = '6px';
    item.style.backgroundColor = 'rgba(255,255,255,0.05)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = coastal.name;
    nameSpan.style.fontSize = '0.9rem';
    header.appendChild(nameSpan);

    // [New] 지도 아이콘 버튼 추가 (가파도/우도 제외)
    // coastal.name 예: "북서연안바다", "연안바다" 등
    // parentZoneName 예: "제주도서부앞바다"
    if (parentZoneName && COASTAL_ZONES_IMAGES[parentZoneName]) {
        // 정확한 매칭을 위해 coastal.name 사용. 
        // 예: 제주도서부앞바다 -> 북서연안바다

        let imageName = null;
        // coastal.name이 정확히 키와 일치하는지 확인
        if (COASTAL_ZONES_IMAGES[parentZoneName][coastal.name]) {
            imageName = COASTAL_ZONES_IMAGES[parentZoneName][coastal.name];
        }
        // 예외: "연안바다"라는 이름이 중복되므로 parentZoneName으로 구분된 데이터에서 찾음.
        // 데이터 구조상 parentZoneName 키 아래에 "연안바다" 키가 있으면 매칭됨.

        if (imageName) {
            const mapBtn = document.createElement('button');
            mapBtn.innerHTML = '🗺️'; // 지도 아이콘
            mapBtn.title = '구역 지도 보기';
            mapBtn.style.cssText = `
                background: none; border: 1px solid #555; border-radius: 4px;
                color: #ccc; cursor: pointer; margin-left: 8px; padding: 2px 6px;
                font-size: 0.8rem; vertical-align: middle; transition: background 0.2s;
            `;
            mapBtn.onmouseover = () => mapBtn.style.background = 'rgba(255,255,255,0.1)';
            mapBtn.onmouseout = () => mapBtn.style.background = 'none';
            mapBtn.onclick = (e) => {
                e.stopPropagation(); // 카드 확장 방지
                showImageModal(imageName, `${parentZoneName} ${coastal.name}`);
            };

            // 이름 옆에 추가 (badge 앞)
            // header flex 순서: Name - (Map) - Badge
            // 현재 구조: nameSpan - badge
            // insertBefore badge if exists, else append

            // Re-ordering logic:
            // Just append to header, but we want it Next to Name.
            // Let's wrapping Name + Btn in a container or just insert after Name.
            // Header is flex -> space-between. Name is left, Badge is right.
            // We want Map btn next to Badge(right) or next to Name(left)?
            // User said "연안바다 오른쪽에 지도 아이콘을 넣고". Let's put it next to name.

            // But header uses space-between. Name is one child. Badge is another.
            // If we add mapBtn, it will be in middle.
            // Better: NameSpan includes the button? No.
            // Let's make a left-side container.

            // Override header structure for layout
            header.innerHTML = ''; // Clear and rebuild

            const leftGroup = document.createElement('div');
            leftGroup.style.display = 'flex';
            leftGroup.style.alignItems = 'center';
            leftGroup.style.gap = '6px';

            leftGroup.appendChild(nameSpan);
            leftGroup.appendChild(mapBtn);

            header.appendChild(leftGroup);
        }
    }

    // 만약 지도가 없어서 mapBtn을 안 만들었다면 name만 있어도 rebuild 필요할 수 있음
    // 혹은 위 if문 밖에서 로직 처리.
    // 기존 로직 유지를 위해:
    if (header.children.length === 0) {
        // Re-append name only
        header.appendChild(nameSpan);
    }

    if (alertData) {
        // 특보가 있는 경우
        const badge = document.createElement('span');
        badge.className = `status-badge ${alertData.isPreliminary ? 'preliminary' : 'warning'}`;
        badge.style.fontSize = '0.75rem';
        badge.style.padding = '2px 8px';
        badge.textContent = `${alertData.warnType} ${alertData.level}`;
        header.appendChild(badge);

        // 시각적 강조
        item.style.borderLeft = '3px solid var(--accent-red, #ff6b6b)';
        item.style.cursor = 'pointer';

        item.appendChild(header);

        // 상세 정보 영역 (발표/발효/해제 시각)
        const detailBox = document.createElement('div');
        detailBox.className = 'coastal-detail-box';
        detailBox.style.cssText = `
            display: none;
            margin-top: 8px;
            padding: 8px 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            font-size: 0.8rem;
            color: #aaa;
        `;

        // 시각 포맷팅 (AFSO API 형식 처리)
        const formatAfsoTime = (timeStr) => {
            if (!timeStr || timeStr.trim() === '') return '정보 없음';

            // HTML 엔티티 디코딩 (&#40; → (, &#41; → ) 등)
            let decoded = timeStr
                .replace(/&#40;/g, '(')
                .replace(/&#41;/g, ')')
                .replace(/&amp;/g, '&')
                .replace(/&nbsp;/g, ' ')
                .trim();

            // 시간을 오전/오후 형식으로 변환하는 헬퍼 함수
            const formatHourToAmPm = (hourStr, minStr = '00') => {
                const hour = parseInt(hourStr, 10);
                let text = '';
                if (hour === 0) text = '오전 12시';
                else if (hour < 12) text = `오전 ${hour}시`;
                else if (hour === 12) text = '오후 12시';
                else text = `오후 ${hour - 12}시`;

                if (minStr !== '00') text += ` ${parseInt(minStr, 10)}분`;
                return text;
            };

            // YYYY.MM.DD.HH:MM 형식 처리 (예: 2025.12.11.04:00)
            const dotMatch = decoded.match(/^(\d{4})\.(\d{2})\.(\d{2})\.(\d{2}):(\d{2})$/);
            if (dotMatch) {
                const [, , month, date, hour, min] = dotMatch;
                return `${month}/${date} ${formatHourToAmPm(hour, min)}`;
            }

            // YYYY.MM.DD. 텍스트 형식 처리 (예: 2025.12.12. 새벽(00시~06시))
            const textMatch = decoded.match(/^(\d{4})\.(\d{2})\.(\d{2})\.\s*(.+)$/);
            if (textMatch) {
                const [, , month, date, text] = textMatch;
                return `${month}/${date} ${text}`;
            }

            // 기존 MM/DD HH:MM 형식이면 그대로
            if (decoded.includes('/')) return decoded;

            // YYYYMMDDHHMM 형식 처리 (구버전 호환)
            if (/^\d{12,}$/.test(decoded)) {
                const month = decoded.substring(4, 6);
                const date = decoded.substring(6, 8);
                const hour = decoded.substring(8, 10);
                const min = decoded.substring(10, 12);
                return `${month}/${date} ${formatHourToAmPm(hour, min)}`;
            }

            // 그 외는 그대로 반환 (요일+시간 등)
            return decoded;
        };

        const tmFcFormatted = formatAfsoTime(alertData.tmFc);
        const tmEfFormatted = formatAfsoTime(alertData.tmEf);

        // 해제예고: 의미없는 짧은 값(예: '일', '월' 등 요일만)이거나 예비특보면 '정보 없음'
        let tmEdFormatted = '정보 없음';
        if (alertData.tmEd && alertData.tmEd.trim().length > 2 && !alertData.isPreliminary) {
            tmEdFormatted = formatAfsoTime(alertData.tmEd);
        }

        detailBox.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #888;">발표시각</span>
                <span style="color: #ddd;">${tmFcFormatted}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #888;">발효시각</span>
                <span style="color: #ddd;">${tmEfFormatted}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">해제예고</span>
                <span style="color: ${tmEdFormatted === '미정' ? '#888' : '#69f0ae'};">${tmEdFormatted}</span>
            </div>
        `;

        item.appendChild(detailBox);

        // 클릭 시 상세 정보 토글
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = detailBox.style.display === 'block';
            detailBox.style.display = isVisible ? 'none' : 'block';
        });

    } else {
        // 특보가 없는 경우
        const noAlertBadge = document.createElement('span');
        noAlertBadge.style.fontSize = '0.75rem';
        noAlertBadge.style.color = '#69f0ae';
        noAlertBadge.style.padding = '2px 8px';
        noAlertBadge.style.backgroundColor = 'rgba(105, 240, 174, 0.1)';
        noAlertBadge.style.borderRadius = '4px';
        noAlertBadge.textContent = '특보 없음';
        header.appendChild(noAlertBadge);

        item.appendChild(header);
        item.style.opacity = '0.7';
    }

    return item;
}


window.toggleSection = function (id) {
    const list = document.getElementById(id);
    if (!list) return;

    const parent = list.parentElement;
    const isCurrentlyOpen = parent.classList.contains('open');

    // 1. 모든 해역 섹션을 닫음 (배타적 모드)
    const allSections = document.querySelectorAll('.sea-section');
    allSections.forEach(section => {
        section.classList.remove('open');
    });

    // 2. 이전에 닫혀있었다면, 현재 섹션만 열기
    if (!isCurrentlyOpen) {
        parent.classList.add('open');
    }
};

function updateLoading(isLoading) {
    appState.isLoading = isLoading;
    const indicator = document.getElementById('loading-indicator');
    const content = document.getElementById('alert-content');
    const headerStatus = document.querySelector('.header-status');

    if (isLoading) {
        if (indicator) indicator.classList.remove('hidden');
        if (content) content.classList.add('hidden');

        // 헤더 뱃지 영역에 스피너 표시
        if (headerStatus) {
            // 아이콘 보존을 위해 새로 생성
            headerStatus.innerHTML = `
                <span style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-right: 8px;">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </span>
                <i id="main-accordion-icon" class="fa-solid fa-chevron-down"></i>
            `;
        }
    } else {
        if (indicator) indicator.classList.add('hidden');
        if (content) content.classList.remove('hidden');
        // 로딩 해제 시 뱃지는 renderApp()에서 렌더링되므로 여기서 처리 불필요
    }
}

function updateTimeDisplay() {
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');

    if (dateEl && timeEl) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        dateEl.textContent = now.toLocaleDateString('ko-KR', options);
        timeEl.textContent = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
}

// ============================================================
// 🌊 해구별 기상정보 (APIHub)
// ============================================================

/**
 * 해구 데이터 조회 및 모달 표시
 * @param {string} zoneId 해구번호
 */

// 모달 닫기
window.closeSeaZoneModal = function () {
    // 진행 중인 요청 취소 (요청 ID 무효화)
    window._marineZoneRequestId = null;

    const modal = document.getElementById('sea-zone-modal');
    if (modal) {
        // 차트 인스턴스 정리 (메모리 누수 방지)
        const chartCanvas = document.getElementById('marineChart');
        if (chartCanvas) {
            const chartInstance = Chart.getChart(chartCanvas);
            if (chartInstance) chartInstance.destroy();
        }
        // 모달 완전 제거 (다음 호출 시 새로 생성)
        modal.remove();
    }
};

// 자동 재시도 로직 적용
// [새로 작성된 함수] 병렬 요청으로 3일치 데이터 수집
window.getMarineZoneData = async function (zoneId) {
    // 요청 ID 생성 (모달 닫기 시 취소 확인용)
    const requestId = Date.now() + '_' + zoneId;
    window._marineZoneRequestId = requestId;

    showMarineZoneModal(zoneId, null, true);

    let baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_large_zone.php`;
    let isSmallZone = false;
    let lZone = zoneId;
    let sZone = null;

    // 소해구 ID 확인 (포맷: "123-5")
    if (String(zoneId).includes('-')) {
        const parts = String(zoneId).split('-');
        if (parts.length === 2) {
            isSmallZone = true;
            lZone = parts[0];
            sZone = parts[1];
            baseUrl = `https://apihub.kma.go.kr/api/typ06/url/marine_small_zone.php`;
        }
    }

    let validBaseTm = null;
    let lastError = "";

    const now = new Date();
    now.setMinutes(0, 0, 0);

    // [Step 1] 유효한 발표시각(Base Time) 찾기
    for (let i = 0; i < 72; i++) {
        const targetDate = new Date(now);
        targetDate.setHours(targetDate.getHours() - i);

        const yyyy = targetDate.getFullYear();
        const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getDate()).padStart(2, '0');
        const hh = String(targetDate.getHours()).padStart(2, '0');
        const tm = `${yyyy}${mm}${dd}${hh}`;

        let params = `?tma_fc=${tm}&tma_ef=${tm}&Lzone=${lZone}&help=1&disp=0&authKey=${CONFIG.KMA_HUB_KEY}`;
        if (isSmallZone) {
            params += `&Szone=${sZone}`;
        }

        const fetchUrl = CONFIG.USE_CORS_PROXY ? (CONFIG.CORS_PROXY + encodeURIComponent(baseUrl + params)) : (baseUrl + params);

        try {
            const response = await fetch(fetchUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const textData = new TextDecoder('euc-kr').decode(buffer);

                if (textData.length > 200 && !textData.includes('Error') && !textData.includes('확인하여') && !textData.includes('없습니다')) {
                    console.log(`[MarineInfo] Base Time Found: ${tm}`);
                    validBaseTm = tm;
                    break;
                } else {
                    lastError = textData.substring(0, 50);
                }
            }
        } catch (e) { }
    }

    if (!validBaseTm) {
        // 요청이 취소되었는지 확인
        if (requestId !== window._marineZoneRequestId) return;
        showMarineZoneModal(zoneId, null, false,
            `데이터를 찾을 수 없습니다.<br>발표된 예보 데이터를 검색했으나 실패했습니다.<br>마지막 에러: ${lastError}`);
        return;
    }

    // [Step 2] 3일치 데이터 수집 (병렬 요청)
    const requestPromises = [];

    const by = parseInt(validBaseTm.substring(0, 4));
    const bm = parseInt(validBaseTm.substring(4, 6)) - 1;
    const bd = parseInt(validBaseTm.substring(6, 8));
    const bh = parseInt(validBaseTm.substring(8, 10));
    const baseDateObj = new Date(by, bm, bd, bh);

    for (let h = 0; h <= 72; h += 3) {
        const efDate = new Date(baseDateObj);
        efDate.setHours(efDate.getHours() + h);

        const ey = efDate.getFullYear();
        const em = String(efDate.getMonth() + 1).padStart(2, '0');
        const ed = String(efDate.getDate()).padStart(2, '0');
        const eh = String(efDate.getHours()).padStart(2, '0');
        const tm_ef = `${ey}${em}${ed}${eh}`;

        let params = `?tma_fc=${validBaseTm}&tma_ef=${tm_ef}&Lzone=${lZone}&help=1&disp=0&authKey=${CONFIG.KMA_HUB_KEY}`;
        if (isSmallZone) {
            params += `&Szone=${sZone}`;
        }

        const fetchUrl = CONFIG.USE_CORS_PROXY ? (CONFIG.CORS_PROXY + encodeURIComponent(baseUrl + params)) : (baseUrl + params);

        requestPromises.push(
            fetch(fetchUrl)
                .then(res => res.arrayBuffer())
                .then(buf => new TextDecoder('euc-kr').decode(buf))
                .catch(err => null)
        );
    }

    try {
        console.log(`[MarineInfo] Fetching 3-day data (${requestPromises.length} reqs)...`);
        const results = await Promise.all(requestPromises);

        let combinedResult = [];
        let hasInvalidData = false;

        for (const textData of results) {
            if (textData && textData.length > 200 && !textData.includes('Error')) {
                // 소해구 유효성 검사 (-999 체크)
                if (isSmallZone && (textData.includes('-999') || textData.includes('-999.0'))) {
                    // 더 정교하게 파싱해서 확인해야 할 수 있지만, 
                    // API가 유효하지 않은 구역에 대해 전체적으로 -999를 리턴한다면 이 체크로 충분할 수 있음
                    // 정확히는 파싱 후 값 검증이 필요함.
                }

                const parsed = parseMarineZoneData(textData);

                // 파싱된 데이터에서 -999 값이 있는지 확인
                if (isSmallZone) {
                    const invalidItem = parsed.find(item =>
                        item.wh === -999 || item.ws === -999 || item.wp === -999 ||
                        item.ta === -999 || item.tw === -999 || item.pa === -999
                    );
                    if (invalidItem) {
                        hasInvalidData = true;
                        // 하나라도 유효하지 않은 데이터가 있으면 "정보 없음" 처리? 
                        // 보통 육지인 경우 전체가 -999일 것임.
                    }
                }

                combinedResult = combinedResult.concat(parsed);
            }
        }

        if (isSmallZone && hasInvalidData) {
            // 데이터가 없다면
            if (requestId !== window._marineZoneRequestId) return;
            showMarineZoneModal(zoneId, null, false, "해당 소해구(기상정보 없음)는 제공되는 데이터가 없습니다.<br>(육지거나 관측 데이터 없음)");
            return;
        }

        if (combinedResult.length > 0) {
            combinedResult.baseTime = validBaseTm;
            combinedResult.sort((a, b) => a.tm.localeCompare(b.tm));

            const uniqueResult = [];
            const seenTm = new Set();
            for (const item of combinedResult) {
                if (!seenTm.has(item.tm)) {
                    seenTm.add(item.tm);
                    uniqueResult.push(item);
                }
            }
            uniqueResult.baseTime = combinedResult.baseTime;

            if (uniqueResult.length > 100) uniqueResult.length = 100;

            // 요청이 취소되었는지 확인 (모달이 닫힌 경우)
            if (requestId !== window._marineZoneRequestId) {
                console.log('[MarineInfo] 요청이 취소됨 - 모달이 이미 닫힘');
                return;
            }

            showMarineZoneModal(zoneId, uniqueResult, false, null, validBaseTm);
        } else {
            // 요청이 취소되었는지 확인
            if (requestId !== window._marineZoneRequestId) {
                console.log('[MarineInfo] 요청이 취소됨 - 모달이 이미 닫힘');
                return;
            }
            showMarineZoneModal(zoneId, null, false, "3일치 데이터를 수집하는데 실패했습니다.", validBaseTm);
        }
    } catch (error) {
        console.error("Batch fetch error:", error);
        // 요청이 취소되었는지 확인
        if (requestId !== window._marineZoneRequestId) {
            console.log('[MarineInfo] 요청이 취소됨 - 모달이 이미 닫힘');
            return;
        }
        showMarineZoneModal(zoneId, null, false, "데이터 수집 중 오류: " + error.message);
    }
};

// 데이터 파싱 함수
function parseMarineZoneData(text) {
    const lines = text.trim().split('\n');
    const result = [];

    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('m/s') || lines[i].includes('sec') || lines[i].includes('deg')) {
            headerIndex = i;
            break;
        }
    }

    const startIndex = (headerIndex !== -1) ? headerIndex + 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0 || line.startsWith('#') || line.startsWith('/')) continue;

        const parts = line.split(/\s+/);
        if (parts.length < 10) continue;

        const len = parts.length;
        const tm = parts[1];
        const wh = parseFloat(parts[len - 5]);
        const wp = parseFloat(parts[len - 4]);
        const waveDir = parseFloat(parts[len - 3]);
        const ws = parseFloat(parts[len - 2]);
        const windDir = parseFloat(parts[len - 1]);

        if (!isNaN(wh)) {
            result.push({
                tm: tm,
                displayTime: formatMarineTime(tm),
                wh: wh,
                wp: wp,
                waveDir: waveDir,
                ws: ws,
                windDir: windDir
            });
        }
    }
    return result;
}

// 시간 포맷팅 (YYYYMMDDHH -> MM.DD HH시)
function formatMarineTime(tm) {
    if (!tm || tm.length < 10) return tm;
    const mm = tm.substring(4, 6);
    const dd = tm.substring(6, 8);
    const hh = tm.substring(8, 10);
    return `${mm}.${dd} ${hh}시`;
}

// 데이터 표시 및 차트/테이블 렌더링
function showMarineZoneModal(zoneId, data, isLoading, errorMessage, baseTime = null) {
    let modal = document.getElementById('sea-zone-modal');
    const isMobile = window.innerWidth <= 768;

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sea-zone-modal';
        modal.className = 'modal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:10000; padding:20px; box-sizing:border-box; backdrop-filter:blur(5px); opacity:0; transition:opacity 0.3s ease;';

        const modalWidth = isMobile ? '100%' : 'auto';
        const modalHeight = 'auto';
        const modalRadius = '16px';
        const modalMaxWidth = isMobile ? '100%' : '1400px';

        modal.innerHTML = `
        <div class="modal-content" style="background:#1e1e1e; width:${modalWidth}; min-width:${isMobile ? '0' : '600px'}; max-width:${modalMaxWidth}; max-height:90vh; height:${isMobile ? 'auto' : 'auto'}; border-radius:${modalRadius}; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 10px 40px rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); transform:translateY(20px); transition:transform 0.3s ease;">
            <div class="modal-header" style="background:#2c3e50; color:white; padding:12px 15px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; flex-shrink:0;">
                <div>
                    <h3 style="margin:0; font-size:${isMobile ? '16px' : '18px'}; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-water"></i> <span id="zone-modal-title"></span>
                    </h3>
                </div>
                <button onclick="closeSeaZoneModal()" style="background:none; border:none; color:#aaa; font-size:28px; cursor:pointer; padding:5px 10px; touch-action:manipulation;" title="닫기"><i class="fas fa-times"></i></button>
            </div>
            <div id="zone-modal-body" style="flex:1; padding:${isMobile ? '10px' : '15px'}; overflow:auto; color:#eee; font-family:'NotosansKR', sans-serif; -webkit-overflow-scrolling:touch;">
            </div>
        </div>`;
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // 열기 애니메이션
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        const content = modal.querySelector('.modal-content');
        if (content) content.style.transform = 'translateY(0)';
    });

    const titleSpan = document.getElementById('zone-modal-title');
    if (titleSpan) titleSpan.textContent = `${zoneId} 해구 예측 기상정보`;

    let baseTimeFormatted = '';
    if (baseTime) {
        const bt = String(baseTime);
        if (bt.length >= 10) {
            const y = bt.substring(0, 4);
            const m = bt.substring(4, 6);
            const d = bt.substring(6, 8);
            const h = bt.substring(8, 10);
            baseTimeFormatted = `${y}.${m}.${d} ${h}:00 발표`;
        } else {
            baseTimeFormatted = `발표시각: ${bt}`;
        }
    }

    const body = document.getElementById('zone-modal-body');
    if (!body) return;

    if (isLoading) {
        body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color:#3498db; margin-bottom:20px;"></i>
            <div style="font-size:16px; color:#aaa;">기상청 데이터를 분석 중입니다...</div>
        </div>`;
        return;
    }

    if (errorMessage) {
        body.innerHTML = `
        <div style="text-align:center; padding:50px; color:#e74c3c;">
            <i class="fas fa-exclamation-triangle fa-3x" style="margin-bottom:15px;"></i>
            <h3>데이터 조회 실패</h3>
            <p>${errorMessage}</p>
        </div>`;
        return;
    }

    if (!data || data.length === 0) {
        body.innerHTML = '<div style="text-align:center; padding:50px;">데이터가 없습니다.</div>';
        return;
    }

    // 날짜별 그룹화
    const dateGroups = {};
    data.forEach(row => {
        const date = row.tm.substring(0, 8);
        if (!dateGroups[date]) dateGroups[date] = [];
        dateGroups[date].push(row);
    });

    // 테이블 HTML 생성
    // 테이블 HTML 생성
    let tableHTML = '<div id="marine-table-container" style="position:relative; overflow-x:auto; overflow-y:auto; -webkit-overflow-scrolling:touch; max-height:100%; touch-action:pan-x pan-y;"><table id="marine-zone-table" style="border-collapse:collapse; table-layout:fixed; font-size:12px; margin:0 auto; background:#1a1a1a;">';

    // 헤더: 날짜 행
    tableHTML += '<thead><tr style="background:#2c3e50; color:#fff; border-bottom:2px solid #3498db;">';
    tableHTML += `<th style="padding:5px 8px; border:1px solid #333; width:45px; min-width:45px; text-align:center; position:sticky; left:0; background:#2c3e50; z-index:2;">날짜</th>`;

    Object.keys(dateGroups).forEach(date => {
        const mm = date.substring(4, 6);
        const dd = date.substring(6, 8);
        const count = dateGroups[date].length;
        tableHTML += `<th colspan="${count}" style="padding:5px; border:1px solid #333; background:#34495e;">${mm}.${dd}.</th>`;
    });
    tableHTML += '</tr>';

    // 헤더: 시간 행
    tableHTML += '<tr style="background:#34495e; color:#ddd; border-bottom:1px solid #555;">';
    tableHTML += '<th style="padding:4px 8px; border:1px solid #333; text-align:center; position:sticky; left:0; background:#34495e; z-index:2;">시간</th>';

    const cellStyle = 'width:45px; min-width:45px; max-width:45px; box-sizing:border-box; padding:3px 0; border:1px solid #333; text-align:center;';

    data.forEach((row, index) => {
        const hh = row.tm.substring(8, 10);
        tableHTML += `<td id="time-cell-${index}" data-index="${index}" style="${cellStyle} font-weight:bold;">${hh}시</td>`;
    });
    tableHTML += '</tr></thead><tbody>';

    // 행 1: 풍향
    tableHTML += '<tr style="background:#1e1e1e; border-bottom:1px solid #333;">';
    tableHTML += '<th style="padding:4px 8px; border:1px solid #333; text-align:center; position:sticky; left:0; background:#2c3e50; z-index:1; color:#4fc3f7; font-size:10px;"> 풍향<br><span style="font-size:9px; font-weight:normal; color:#888;">(deg)</span></th>';
    data.forEach(row => {
        tableHTML += `<td style="${cellStyle}"><i class="fas fa-arrow-up" style="transform:rotate(${row.windDir}deg); color:#4fc3f7; font-size:14px;"></i></td>`;
    });
    tableHTML += '</tr>';

    // 행 2: 풍속
    tableHTML += '<tr style="background:#1a1a1a; border-bottom:1px solid #333;">';
    tableHTML += '<th style="padding:4px 8px; border:1px solid #333; text-align:center; position:sticky; left:0; background:#2c3e50; z-index:1; color:#ff7043; font-size:10px;"> 풍속<br><span style="font-size:9px; font-weight:normal; color:#888;">(m/s)</span></th>';
    data.forEach(row => {
        const color = getMarineWindColor(row.ws);
        tableHTML += `<td style="${cellStyle} color:${color}; font-weight:bold; font-size:11px;">${row.ws.toFixed(1)}</td>`;
    });
    tableHTML += '</tr>';

    // 행 3: 그래프
    const CHART_OFFSET_LEFT = 0;
    const CHART_WIDTH_ADJUST = -3;
    const cellWidth = 45;
    const chartWidth = (data.length * cellWidth) + CHART_WIDTH_ADJUST;

    tableHTML += '<tr style="background:#222;">';
    tableHTML += `<th style="padding:4px 6px; border:1px solid #333; text-align:center; position:sticky; left:0; background:#2c3e50; z-index:1; vertical-align:middle;">
    <div style="display:flex; flex-direction:column; gap:2px; font-size:9px; align-items:center;">
        <span style="color:#ff7043;">풍속</span>
        <span style="display:inline-block; width:20px; height:3px; background:#ff7043; border-radius:2px;"></span>
        <span style="color:#26c6da; margin-top:4px;">유의</span>
        <span style="color:#26c6da;">파고</span>
        <span style="display:inline-block; width:10px; height:10px; background:rgba(38,198,218,0.6); border:1px solid #26c6da; border-radius:2px;"></span>
    </div>
</th>`;
    tableHTML += `<td colspan="${data.length}" style="padding:0; border:1px solid #333; overflow:hidden; box-sizing:border-box;">`;
    tableHTML += `<div style="width:${chartWidth}px; height:140px; margin:0; padding-left:${CHART_OFFSET_LEFT}px; display:block; box-sizing:border-box;"><canvas id="marineChart" width="${chartWidth}" height="140" style="display:block;"></canvas></div>`;
    tableHTML += '</td></tr>';

    // 행 4: 유의파고
    tableHTML += '<tr style="background:#1a1a1a; border-bottom:1px solid #333;">';
    tableHTML += '<th style="padding:4px 8px; border:1px solid #333; text-align:center; position:sticky; left:0; background:#2c3e50; z-index:1; color:#26c6da; font-size:10px;"> 유의<br>파고<br><span style="font-size:9px; font-weight:normal; color:#888;">(m)</span></th>';
    data.forEach(row => {
        const color = getMarineWaveColor(row.wh);
        tableHTML += `<td style="${cellStyle} color:${color}; font-weight:bold; font-size:11px;">${row.wh.toFixed(1)}</td>`;
    });
    tableHTML += '</tr>';

    // 행 5: 파향
    tableHTML += '<tr style="background:#1e1e1e; border-bottom:1px solid #333;">';
    tableHTML += '<th style="padding:4px 8px; border:1px solid #333; text-align:center; position:sticky; left:0; background:#2c3e50; z-index:1; color:#81c784; font-size:10px;"> 파향<br><span style="font-size:9px; font-weight:normal; color:#888;">(deg)</span></th>';
    data.forEach(row => {
        tableHTML += `<td style="${cellStyle}"><i class="fas fa-location-arrow" style="transform:rotate(${row.waveDir}deg); color:#81c784; font-size:14px;"></i></td>`;
    });
    tableHTML += '</tr>';

    // 행 6: 파주기
    tableHTML += '<tr style="background:#1a1a1a;">';
    tableHTML += '<th style="padding:4px 8px; border:1px solid #333; text-align:center; position:sticky; left:0; background:#2c3e50; z-index:1; color:#9575cd; font-size:10px;"> 파주기<br><span style="font-size:9px; font-weight:normal; color:#888;">(sec)</span></th>';
    data.forEach(row => {
        tableHTML += `<td style="${cellStyle} color:#ccc; font-size:12px;">${row.wp.toFixed(1)}</td>`;
    });
    tableHTML += '</tr>';

    tableHTML += '</tbody></table></div>';

    // 발표시각 우측 하단 표시
    if (baseTimeFormatted) {
        tableHTML += `<div style="text-align:right; font-size:11px; color:#8899aa; padding:8px 10px 5px; background:linear-gradient(to top, #1e1e1e 80%, rgba(30,30,30,0)); position:sticky; bottom:0; right:0;">${baseTimeFormatted}</div>`;
    }

    body.innerHTML = tableHTML;

    // 차트 그리기
    setTimeout(() => renderMarineChart(data), 100);
}

// 풍속 색상
function getMarineWindColor(ws) {
    if (ws >= 14) return '#ff5252';
    if (ws >= 9) return '#ffb74d';
    return '#4fc3f7';
}

// 파고 색상
function getMarineWaveColor(wh) {
    if (wh >= 3.0) return '#ff5252';
    if (wh >= 1.5) return '#ffb74d';
    return '#81c784';
}

// Chart.js 렌더링
function renderMarineChart(data) {
    const canvas = document.getElementById('marineChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const labels = data.map(d => d.displayTime);
    const windSpeed = data.map(d => d.ws);
    const waveHeight = data.map(d => d.wh);

    if (window.currentMarineChart) {
        window.currentMarineChart.destroy();
    }

    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    // [New] 커스텀 조정 플러그인 (오프셋 적용만 유지)
    const adjustmentPlugin = {
        id: 'adjustmentPlugin',
        beforeDatasetsDraw(chart) {
            // 오프셋 적용 Logic
            // index.html에 정의된 CHART_OFFSETS 값을 각 데이터 포인트의 X 좌표에 더함
            if (!window.CHART_OFFSETS) window.CHART_OFFSETS = [];

            chart.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);
                // bar(1)와 line(0) 모두 적용
                meta.data.forEach((element, index) => {
                    // [Fix] 오프셋 누적 문제 해결: 원래 위치 저장
                    if (typeof element.originalX === 'undefined') {
                        element.originalX = element.x;
                    }

                    const offset = window.CHART_OFFSETS[index] || 0;
                    // 항상 원래 위치 기준으로 오프셋 설정 (누적 방지)
                    element.x = element.originalX + offset;
                });
            });
        }
    };

    window.currentMarineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '풍속 (m/s)',
                    data: windSpeed,
                    type: 'line',
                    borderColor: '#ff7043',
                    backgroundColor: 'rgba(255, 112, 67, 0.2)',
                    borderWidth: 2,
                    yAxisID: 'y_wind',
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#ff7043',
                    // [Fix] 호버 시 애니메이션/스타일 변경 제거
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#ff7043',
                    pointHoverBorderColor: '#ff7043',
                    pointHoverBorderWidth: 0,
                    order: 1, // 라인이 위로 오도록
                    datalabels: {
                        display: true,
                        color: '#ff7043',
                        anchor: (context) => context.dataset.data[context.dataIndex] >= 9.0 ? 'start' : 'end',
                        align: (context) => context.dataset.data[context.dataIndex] >= 9.0 ? 'bottom' : 'top',
                        offset: 4,
                        font: { size: 9, weight: 'bold' },
                        formatter: (value) => value.toFixed(1)
                    }
                },
                {
                    label: '유의파고 (m)',
                    data: waveHeight,
                    type: 'bar',
                    backgroundColor: 'rgba(38, 198, 218, 0.6)',
                    borderColor: '#26c6da',
                    borderWidth: 1,
                    // [Fix] 호버 시 애니메이션/스타일 변경 제거
                    hoverBackgroundColor: 'rgba(38, 198, 218, 0.6)',
                    hoverBorderColor: '#26c6da',
                    hoverBorderWidth: 1,
                    yAxisID: 'y_wave',
                    borderRadius: 2,
                    categoryPercentage: 0.8, // 막대 너비 조정
                    barPercentage: 0.9,
                    maxBarThickness: 40,
                    order: 2,
                    datalabels: {
                        display: true,
                        color: '#fff',
                        anchor: 'center',
                        align: 'center',
                        font: { size: 9, weight: 'bold' },
                        formatter: (value) => value.toFixed(1)
                    }
                }
            ]
        },
        plugins: [ChartDataLabels, adjustmentPlugin],
        options: {
            animation: false,
            hover: { mode: null, animationDuration: 0 },
            responsive: false,
            maintainAspectRatio: false,
            layout: { padding: { left: 0, right: 0, top: 15, bottom: 0 } },
            interaction: {
                mode: 'index',
                intersect: false // 막대 근처만 클릭해도 인식되도록
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                x: {
                    display: false,
                    grid: { display: false },
                    offset: true // 중요: 막대가 틱 사이에 오도록
                },
                y_wind: { type: 'linear', display: false, position: 'left', beginAtZero: true },
                y_wave: { type: 'linear', display: false, position: 'right', beginAtZero: true }
            }
        }
    });
}

// ----------------------------------------------------------------------------
// [Adjustment Logic] 차트 위치 조정 기능 - 삭제됨 (오프셋 적용만 플러그인에서 처리)
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Tab Navigation
// ----------------------------------------------------------------------------

function initTabs() {
    // 탭 스타일 주입
    injectTabStyles();

    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    let seaZoneInitialized = false; // 지도 초기화 여부 플래그

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-target');

            // 모든 탭 비활성화
            tabs.forEach(t => t.classList.remove('active'));
            // 모든 컨텐츠 숨기기
            contents.forEach(c => c.classList.remove('active'));

            // 선택된 탭 활성화
            tab.classList.add('active');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');

                // 해구별 기상 탭이 처음 활성화될 때 지도 초기화
                if (targetId === 'sea-zone-section' && !seaZoneInitialized) {
                    console.log('Initializing Sea Zone Map...');
                    // 탭이 활성화되어 보이는 상태가 된 후 지도 초기화
                    setTimeout(() => {
                        if (window.initSeaZoneMap) {
                            window.initSeaZoneMap();
                            seaZoneInitialized = true;
                        }
                    }, 100); // 약간의 지연을 주어 CSS가 적용된 후 초기화
                }
            }
        });
    });
}

function injectTabStyles() {
    if (document.getElementById('tab-styles')) return;

    const style = document.createElement('style');
    style.id = 'tab-styles';
    style.textContent = `
        /* 헤더 내부 탭 배치 */
        .main-header {
            padding-bottom: 0 !important;
        }
        
        .main-tabs {
            display: flex;
            justify-content: space-around;
            background: rgba(26, 26, 26, 0.95);
            border-top: 1px solid #333;
            border-bottom: 2px solid #333;
            margin: 7.5px 0 0 0;
            padding: 0;
        }
        .tab-btn {
            flex: 1;
            background: transparent;
            border: none;
            color: #888;
            padding: 7.5px 10px;
            font-size: 0.95rem;
            font-weight: 500;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
            font-family: 'Noto Sans KR', sans-serif;
        }
        .tab-btn:hover {
            color: #fff;
            background: rgba(52, 152, 219, 0.05);
        }
        .tab-btn.active {
            color: #fff;
            border-bottom: 3px solid #3498db;
            font-weight: 700;
            background: rgba(52, 152, 219, 0.1);
        }
        .tab-content {
            display: none;
            animation: fadeIn 0.3s ease-out;
        }
        .tab-content.active {
            display: block;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* 섹션 스타일 통일 */
        .alert-status-section,
        .sea-zone-section {
            background: transparent;
            padding: 0;
            margin: 0;
            border: none;
        }
        
        /* 지도 컨테이너 스타일 */
        .sea-zone-map-container {
            background: transparent;
            padding: 0;
            margin: 20px 0;
        }
        
        /* 지도 출처 정보 */
        .map-source {
            text-align: center;
            margin-top: 10px;
            padding: 8px 0;
        }
        .map-source a {
            color: #8b949e;
            text-decoration: none;
            font-size: 0.85rem;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 0.2s;
        }
        .map-source a:hover {
            color: #3498db;
        }
        .map-source i {
            font-size: 0.75rem;
        }
        
        /* 구역 클릭 안내 메시지 애니메이션 */
        @keyframes slideUpFade {
            0% { 
                opacity: 0; 
                transform: translateY(15px);
            }
            15% { 
                opacity: 1; 
                transform: translateY(0);
            }
            85% { 
                opacity: 1; 
                transform: translateY(0);
            }
            100% { 
                opacity: 0; 
                transform: translateY(-10px);
            }
        }
    `;
    document.head.appendChild(style);
}

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
    console.log('=== Marine Weather Alert System Starting ===');
    console.log('Using wrn_now_data.php API');
    console.log('Config:', CONFIG);

    initTabs(); // 탭 초기화
    updateTimeDisplay();
    fetchAllData();

    // Auto-refresh every 5 minutes
    // Auto-refresh every 5 minutes (Disabled via user request)
    // setInterval(fetchAllData, 5 * 60 * 1000);
    setInterval(updateTimeDisplay, 60000);
});

window.toggleSection = toggleSection;
window.refreshData = fetchAllData;

// ----------------------------------------------------------------------------
// 내 주변 바다 기상전망 기능
// ----------------------------------------------------------------------------

/**
 * 내 주변 바다 기상전망 - GPS 기반
 */
async function showMyLocationWeather() {
    // 두 개의 내 위치 버튼 (기상정보 탭 + 해구별 기상정보 탭)
    const btn1 = document.getElementById('my-location-btn');
    const btn2 = document.getElementById('sea-zone-my-location-btn');

    const originalText1 = btn1 ? btn1.innerHTML : '';
    const originalText2 = btn2 ? btn2.innerHTML : '';

    // 버튼 로딩 상태
    if (btn1) {
        btn1.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>위치 확인 중...</span>';
        btn1.disabled = true;
    }
    if (btn2) {
        btn2.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 위치 확인 중';
        btn2.disabled = true;
    }

    try {
        // GPS 권한 요청 및 위치 획득
        const position = await new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('이 브라우저는 GPS를 지원하지 않습니다.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0
            });
        });

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log(`📍 GPS 위치: 위도 ${lat}, 경도 ${lon}`);

        // 해역 범위 체크 (119~140°E, 24.5~45°N)
        if (lon < 119 || lon > 140 || lat < 24.5 || lat > 45) {
            alert('현재 위치가 대한민국 해역 범위를 벗어났습니다.\n\n대한민국 해역에서 다시 시도해주세요.');
            if (btn1) { btn1.innerHTML = originalText1; btn1.disabled = false; }
            if (btn2) { btn2.innerHTML = originalText2; btn2.disabled = false; }
            return;
        }

        // GPS → 픽셀 좌표 변환
        const pixel = gpsToPixel(lon, lat);
        console.log(`📍 픽셀 좌표: X=${pixel.x}, Y=${pixel.y}`);

        // 해구별 기상 탭으로 전환
        const seaZoneTab = document.querySelector('[data-target="sea-zone-section"]');
        if (seaZoneTab) {
            seaZoneTab.click();
        }

        // 잠시 대기 (탭 전환 완료)
        await new Promise(r => setTimeout(r, 300));

        // 지도에서 내 위치로 부드럽게 이동
        if (typeof zoomToPixelWithMarker === 'function') {
            zoomToPixelWithMarker(pixel.x, pixel.y);
        } else if (typeof showLocationOnMap === 'function') {
            showLocationOnMap(pixel.x, pixel.y);
        }

        // 0.5초 후 가장 가까운 해구 기상전망 열기
        setTimeout(() => {
            openNearestZoneWeather(pixel.x, pixel.y);
        }, 500);

    } catch (error) {
        console.error('GPS 오류:', error);

        let message = '위치 정보를 가져올 수 없습니다.';
        if (error.code === 1) {
            message = '위치 정보 사용이 거부되었습니다.\n\n브라우저 설정에서 위치 권한을 허용해주세요.';
        } else if (error.code === 2) {
            message = '위치 정보를 사용할 수 없습니다.';
        } else if (error.code === 3) {
            message = '위치 정보 요청 시간이 초과되었습니다.';
        }

        alert(message);
    } finally {
        if (btn1) { btn1.innerHTML = originalText1; btn1.disabled = false; }
        if (btn2) { btn2.innerHTML = originalText2; btn2.disabled = false; }
    }
}

/**
 * 가장 가까운 해구의 기상전망 열기
 */
function openNearestZoneWeather(pixelX, pixelY) {
    // GRID_DATA와 SEA_ZONES_DATA로 해당 픽셀의 해구 찾기
    if (typeof GRID_DATA === 'undefined' || typeof SEA_ZONES_DATA === 'undefined') {
        console.warn('GRID_DATA 또는 SEA_ZONES_DATA가 없습니다.');
        return;
    }

    // 경도 범위 찾기
    const lonKeys = Object.keys(GRID_DATA.lon).map(Number).sort((a, b) => a - b);
    let lonStart = null, lonEnd = null;
    for (let i = 0; i < lonKeys.length - 1; i++) {
        const x1 = GRID_DATA.lon[lonKeys[i]].val;
        const x2 = GRID_DATA.lon[lonKeys[i + 1]].val;
        if (pixelX >= x1 && pixelX < x2) {
            lonStart = lonKeys[i];
            lonEnd = lonKeys[i + 1];
            break;
        }
    }

    // 위도 범위 찾기
    const latKeys = Object.keys(GRID_DATA.lat).map(Number).sort((a, b) => a - b);
    let latStart = null, latEnd = null;
    for (let i = 0; i < latKeys.length - 1; i++) {
        const y1 = GRID_DATA.lat[latKeys[i]].val;
        const y2 = GRID_DATA.lat[latKeys[i + 1]].val;
        if (pixelY >= y1 && pixelY < y2) {
            latStart = latKeys[i];
            latEnd = latKeys[i + 1];
            break;
        }
    }

    if (lonStart && latStart) {
        const gridKey = `${lonStart}-${lonEnd}_${latStart}-${latEnd}`;
        const zoneNum = SEA_ZONES_DATA[gridKey];

        if (zoneNum && zoneNum !== "0") {
            console.log(`📍 해구 번호: ${zoneNum}`);

            // 해구 기상전망 모달 열기
            if (typeof showMarineZoneModal === 'function') {
                showMarineZoneModal(zoneNum);
            }
        } else {
            console.log('📍 해당 위치에 해구 정보가 없습니다.');
            alert('현재 위치에 해당하는 해구 정보가 없습니다.\n\n육지 또는 해역 경계 밖일 수 있습니다.');
        }
    }
}

window.showMyLocationWeather = showMyLocationWeather;

// ==================== 해상예보 테이블 표시 ====================

// 해상예보 API 키는 서버(Netlify 환경변수)에 안전하게 저장됨
// const SEA_FORECAST_API_KEY = '서버에서 관리';

// 날씨 코드
const SEA_WEATHER_CODES = {
    'DB01': '☀️', 'DB02': '🌤️', 'DB03': '⛅', 'DB04': '☁️'
};

// 풍향 한글 변환
const SEA_WIND_DIRS = {
    'N': '북', 'NNE': '북북동', 'NE': '북동', 'ENE': '동북동',
    'E': '동', 'ESE': '동남동', 'SE': '남동', 'SSE': '남남동',
    'S': '남', 'SSW': '남남서', 'SW': '남서', 'WSW': '서남서',
    'W': '서', 'WNW': '서북서', 'NW': '북서', 'NNW': '북북서'
};

// 특보 구역명 → 예보 표시명 매핑 (UI에 표시할 이름)
const ZONE_NAME_DISPLAY_MAP = {
    // 제주 먼바다 통합
    '제주도남서쪽안쪽먼바다': '제주도남쪽먼바다',
    '제주도남동쪽안쪽먼바다': '제주도남쪽먼바다',
    '제주도남쪽바깥먼바다': '제주도남쪽먼바다',

    // 서해중부
    '인천·경기북부앞바다': '경기북부앞바다',
    '서해중부안쪽먼바다': '서해중부먼바다',
    '서해중부바깥먼바다': '서해중부먼바다',

    // 서해남부 먼바다 통합
    '서해남부북쪽바깥먼바다': '서해남부먼바다',
    '서해남부북쪽안쪽먼바다': '서해남부먼바다',
    '서해남부남쪽바깥먼바다': '서해남부먼바다',
    '서해남부남쪽안쪽먼바다': '서해남부먼바다',

    // 남해서부 먼바다 통합
    '남해서부서쪽먼바다': '남해서부먼바다',
    '남해서부동쪽먼바다': '남해서부먼바다',

    // 남해동부 먼바다 통합
    '남해동부안쪽먼바다': '남해동부먼바다',
    '남해동부바깥먼바다': '남해동부먼바다',

    // 동해남부 먼바다 통합
    '동해남부남쪽안쪽먼바다': '동해남부먼바다',
    '동해남부남쪽바깥먼바다': '동해남부먼바다',
    '동해남부북쪽안쪽먼바다': '동해남부먼바다',
    '동해남부북쪽바깥먼바다': '동해남부먼바다',

    // 동해중부 먼바다 통합
    '동해중부안쪽먼바다': '동해중부먼바다',
    '동해중부바깥먼바다': '동해중부먼바다'
};

// 특보 구역명 → 예보 API 구역코드 매핑
const ZONE_NAME_TO_CODE = {
    // === 제주 ===
    '제주도서부앞바다': '12B10304',
    '제주도북부앞바다': '12B10302',
    '제주도동부앞바다': '12B10301',
    '제주도남부앞바다': '12B10303',
    '제주도앞바다': '12B10300',
    '제주도남쪽먼바다': '12B10400',
    '제주도남서쪽안쪽먼바다': '12B10400',
    '제주도남동쪽안쪽먼바다': '12B10400',
    '제주도남쪽바깥먼바다': '12B10400',

    // === 서해중부 ===
    '인천·경기북부앞바다': '12A20101',
    '경기북부앞바다': '12A20101',
    '인천·경기남부앞바다': '12A20102',
    '충남북부앞바다': '12A20103',
    '충남남부앞바다': '12A20104',
    '서해중부앞바다': '12A20100',
    '서해중부먼바다': '12A20200',
    '서해중부안쪽먼바다': '12A20200',
    '서해중부바깥먼바다': '12A20200',

    // === 서해남부 ===
    '전북북부앞바다': '22A30101',
    '전북남부앞바다': '22A30102',
    '전남북부서해앞바다': '22A30103',
    '전남중부서해앞바다': '22A30104',
    '전남남부서해앞바다': '22A30105',
    '서해남부앞바다': '12A30100',
    '서해남부먼바다': '12A30200',
    '서해남부북쪽바깥먼바다': '12A30200',
    '서해남부북쪽안쪽먼바다': '12A30200',
    '서해남부남쪽바깥먼바다': '12A30200',
    '서해남부남쪽안쪽먼바다': '12A30200',

    // === 서해북부 ===
    '서해북부앞바다': '12A10100',
    '서해북부먼바다': '12A10200',

    // === 남해서부 ===
    '전남서부남해앞바다': '12B10101',
    '전남동부남해앞바다': '12B10102',
    '남해서부앞바다': '12B10100',
    '남해서부먼바다': '12B10200',
    '남해서부서쪽먼바다': '12B10200',
    '남해서부동쪽먼바다': '12B10200',

    // === 남해동부 ===
    '경남서부남해앞바다': '12B20101',
    '경남중부남해앞바다': '12B20102',
    '부산앞바다': '12B20103',
    '거제시동부앞바다': '12B20104',
    '남해동부앞바다': '12B20100',
    '남해동부먼바다': '12B20200',
    '남해동부안쪽먼바다': '12B20200',
    '남해동부바깥먼바다': '12B20200',

    // === 동해남부 ===
    '울산앞바다': '12C10101',
    '경북남부앞바다': '12C10102',
    '경북북부앞바다': '12C10103',
    '동해남부앞바다': '12C10100',
    '동해남부먼바다': '12C10200',
    '동해남부남쪽안쪽먼바다': '12C10200',
    '동해남부남쪽바깥먼바다': '12C10200',
    '동해남부북쪽안쪽먼바다': '12C10200',
    '동해남부북쪽바깥먼바다': '12C10200',

    // === 동해중부 ===
    '강원남부앞바다': '12C20101',
    '강원중부앞바다': '12C20102',
    '강원북부앞바다': '12C20103',
    '동해중부앞바다': '12C20100',
    '동해중부먼바다': '12C20200',
    '동해중부안쪽먼바다': '12C20200',
    '동해중부바깥먼바다': '12C20200',

    // === 동해북부 ===
    '동해북부앞바다': '12C30100',
    '동해북부먼바다': '12C30200'
};

// 구역명으로 API 코드 찾기 (개선된 버전)
function getZoneCodeByName(zoneName) {
    // 0. 매핑 테이블에서 먼저 찾기
    if (ZONE_NAME_TO_CODE[zoneName]) {
        return ZONE_NAME_TO_CODE[zoneName];
    }

    if (typeof SEA_ZONE_COORDINATES === 'undefined') return null;

    // 정규화 함수 (공백 제거, 특수문자 제거)
    const normalize = (str) => str.replace(/\s+/g, '').replace(/[·]/g, '');
    const normalizedInput = normalize(zoneName);

    // 1. 정확한 일치
    for (const [code, zone] of Object.entries(SEA_ZONE_COORDINATES)) {
        if (zone.name === zoneName) {
            return code;
        }
    }

    // 2. 정규화 후 일치
    for (const [code, zone] of Object.entries(SEA_ZONE_COORDINATES)) {
        if (normalize(zone.name) === normalizedInput) {
            return code;
        }
    }

    // 3. 부분 일치 (입력이 API 이름을 포함하거나, API 이름이 입력을 포함)
    for (const [code, zone] of Object.entries(SEA_ZONE_COORDINATES)) {
        const normalizedZone = normalize(zone.name);
        if (normalizedInput.includes(normalizedZone) || normalizedZone.includes(normalizedInput)) {
            return code;
        }
    }

    // 4. 해상 → 바다 변환 후 재시도
    const converted = zoneName.replace('해상', '바다');
    if (converted !== zoneName) {
        if (ZONE_NAME_TO_CODE[converted]) {
            return ZONE_NAME_TO_CODE[converted];
        }
        for (const [code, zone] of Object.entries(SEA_ZONE_COORDINATES)) {
            if (zone.name === converted || normalize(zone.name) === normalize(converted)) {
                return code;
            }
        }
    }

    console.warn('구역 코드를 찾을 수 없음:', zoneName);
    return null;
}

// 해상예보 팝업 모달 표시
async function showSeaForecastTable(zoneName) {
    // 매핑된 표시 이름 가져오기
    const displayName = ZONE_NAME_DISPLAY_MAP[zoneName] || zoneName;

    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('sea-forecast-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'sea-forecast-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
        box-sizing: border-box;
        transition: background 0.3s ease;
    `;

    // 모달 컨텐츠
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(145deg, #1a1e2e, #232a3c);
        border-radius: 16px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        transform: scale(0.9) translateY(20px);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
    `;

    // 헤더
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        background: linear-gradient(135deg, #ffd54f, #ff9800);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    header.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:1.5rem;">☀️</span>
            <div>
                <div style="font-size:1.1rem;font-weight:700;color:#1a1e2e;">${displayName}</div>
                <div style="font-size:0.85rem;color:rgba(0,0,0,0.6);">기상예보</div>
            </div>
        </div>
        <button id="close-forecast-modal" style="
            background: rgba(0,0,0,0.2);
            border: none;
            color: #1a1e2e;
            font-size: 1.5rem;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        ">×</button>
    `;

    // 컨텐츠 영역
    const contentArea = document.createElement('div');
    contentArea.id = 'forecast-content-area';
    contentArea.style.cssText = `
        padding: 20px;
        overflow-x: auto;
    `;
    contentArea.innerHTML = `
        <div style="text-align:center;padding:40px;color:#8899aa;">
            <div style="width:40px;height:40px;border:3px solid #3a4459;border-top-color:#ffd54f;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 15px;"></div>
            <p>예보 데이터를 조회하고 있습니다...</p>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;

    modalContent.appendChild(header);
    modalContent.appendChild(contentArea);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 열기 애니메이션
    requestAnimationFrame(() => {
        modal.style.background = 'rgba(0, 0, 0, 0.8)';
        modalContent.style.transform = 'scale(1) translateY(0)';
        modalContent.style.opacity = '1';
    });

    // 모달 닫기 함수
    const closeModal = () => {
        modal.style.background = 'rgba(0, 0, 0, 0)';
        modalContent.style.transform = 'scale(0.9) translateY(20px)';
        modalContent.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        document.removeEventListener('keydown', escHandler);
    };

    // 닫기 버튼 이벤트
    document.getElementById('close-forecast-modal').onclick = closeModal;

    // 배경 클릭 시 닫기
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };

    // ESC 키로 닫기
    const escHandler = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', escHandler);

    // API 코드 찾기
    const regId = getZoneCodeByName(zoneName);
    if (!regId) {
        contentArea.innerHTML = `<div style="text-align:center;padding:30px;color:#ff9800;">⚠️ 해당 구역의 예보 코드를 찾을 수 없습니다.<br><small style="color:#666;">(${zoneName})</small></div>`;
        return;
    }

    try {
        // 서버리스 함수를 통해 API 호출 (API 키가 서버에서 관리됨)
        let data;
        if (CONFIG.USE_SERVERLESS) {
            console.log('Fetching sea forecast via Serverless Function...');
            const response = await fetch(`${CONFIG.SERVERLESS_BASE_URL}/get-sea-zone?code=${regId}`);
            const result = await response.json();

            if (result.success && result.data) {
                // 서버리스 함수에서 반환된 데이터
                data = { response: { body: { items: { item: result.data } } } };
            } else {
                throw new Error('No data from serverless function');
            }
        } else {
            // Fallback: 직접 호출 불가 (API 키 없음)
            throw new Error('API key not available');
        }

        if (data.response?.body?.items?.item) {
            let items = data.response.body.items.item;
            if (!Array.isArray(items)) items = [items];

            // 발표시각 추출 (첫 번째 항목에서)
            const tmFc = items[0]?.tmFc || null;

            renderSeaForecastTableInModal(contentArea, items, displayName, tmFc);
        } else {
            contentArea.innerHTML = `<div style="text-align:center;padding:30px;color:#ff9800;">⚠️ 조회된 예보 데이터가 없습니다.</div>`;
        }
    } catch (error) {
        console.error('해상예보 조회 오류:', error);
        contentArea.innerHTML = `<div style="text-align:center;padding:30px;color:#ef5350;">❌ 데이터 조회 중 오류가 발생했습니다.</div>`;
    }
}

// 해상예보 테이블 렌더링 (모달용)
function renderSeaForecastTableInModal(container, items, zoneName, tmFc = null) {
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // numEf를 날짜/시간으로 변환
    const forecasts = items.map(item => {
        const numEf = parseInt(item.numEf) || 0;
        const dayOffset = Math.floor(numEf / 2);
        const isAM = numEf % 2 === 1;

        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);

        return {
            ...item,
            date: date,
            dayOffset: dayOffset,
            period: isAM ? 'am' : 'pm'
        };
    });

    // 날짜별 그룹화
    const dateGroups = {};
    forecasts.forEach(f => {
        if (!dateGroups[f.dayOffset]) {
            dateGroups[f.dayOffset] = {
                date: f.date,
                am: null,
                pm: null
            };
        }
        dateGroups[f.dayOffset][f.period] = f;
    });

    const sortedDays = Object.keys(dateGroups).sort((a, b) => a - b).slice(0, 4);

    // 테이블 스타일
    const tableStyle = `
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
        min-width: 600px;
    `;

    const thStyle = `
        padding: 10px 6px;
        text-align: center;
        background: #2a3347;
        color: #fff;
        font-weight: 600;
        border-bottom: 2px solid #4fc3f7;
    `;

    const tdStyle = `
        padding: 8px 6px;
        text-align: center;
        border-bottom: 1px solid #3a4459;
        color: #e0e6ed;
    `;

    const labelStyle = `
        background: #1e2433;
        text-align: left;
        padding-left: 12px;
        color: #4fc3f7;
        font-weight: 500;
        border-right: 1px solid #3a4459;
        width: 60px;
    `;

    let html = `<table style="${tableStyle}">`;

    // 날짜 헤더 행
    html += `<tr>
        <th style="${thStyle}; ${labelStyle}">날짜</th>`;
    sortedDays.forEach((dayKey, idx) => {
        const d = dateGroups[dayKey].date;
        const dayLabels = ['오늘', '내일', '모레', ''];
        const label = dayLabels[idx] || '';
        const dateStr = `${d.getDate()}일(${dayNames[d.getDay()]})`;
        html += `<th colspan="2" style="${thStyle}">${dateStr}<br><small style="opacity:0.7">${label}</small></th>`;
    });
    html += `</tr>`;

    // 시간 헤더 행
    html += `<tr>
        <th style="${thStyle}; ${labelStyle}">시각</th>`;
    sortedDays.forEach(() => {
        html += `<th style="${thStyle}; font-size:0.8rem;">오전</th><th style="${thStyle}; font-size:0.8rem;">오후</th>`;
    });
    html += `</tr>`;

    // 날씨 행
    html += `<tr>
        <th style="${tdStyle}; ${labelStyle}">날씨</th>`;
    sortedDays.forEach(dayKey => {
        const group = dateGroups[dayKey];
        ['am', 'pm'].forEach(period => {
            const f = group[period];
            if (f) {
                const icon = SEA_WEATHER_CODES[f.wfCd] || '❓';
                html += `<td style="${tdStyle}"><span style="font-size:1.3rem">${icon}</span></td>`;
            } else {
                html += `<td style="${tdStyle}">-</td>`;
            }
        });
    });
    html += `</tr>`;

    // 파고 행
    html += `<tr>
        <th style="${tdStyle}; ${labelStyle}">파고<small style="display:block;font-size:0.7rem;color:#8899aa">(m)</small></th>`;
    sortedDays.forEach(dayKey => {
        const group = dateGroups[dayKey];
        ['am', 'pm'].forEach(period => {
            const f = group[period];
            if (f && f.wh1 !== undefined) {
                html += `<td style="${tdStyle}; color:#4db6ac; font-weight:600;">${f.wh1}~${f.wh2}m</td>`;
            } else {
                html += `<td style="${tdStyle}">-</td>`;
            }
        });
    });
    html += `</tr>`;

    // 풍속 행
    html += `<tr>
        <th style="${tdStyle}; ${labelStyle}">풍속<small style="display:block;font-size:0.7rem;color:#8899aa">(m/s)</small></th>`;
    sortedDays.forEach(dayKey => {
        const group = dateGroups[dayKey];
        ['am', 'pm'].forEach(period => {
            const f = group[period];
            if (f && f.ws1 !== undefined) {
                html += `<td style="${tdStyle}; color:#ff9800; font-weight:600;">${f.ws1}~${f.ws2}m/s</td>`;
            } else {
                html += `<td style="${tdStyle}">-</td>`;
            }
        });
    });
    html += `</tr>`;

    // 풍향 행
    html += `<tr>
        <th style="${tdStyle}; ${labelStyle}">풍향</th>`;
    sortedDays.forEach(dayKey => {
        const group = dateGroups[dayKey];
        ['am', 'pm'].forEach(period => {
            const f = group[period];
            if (f && f.wd1) {
                const wd1 = SEA_WIND_DIRS[f.wd1] || f.wd1;
                const wd2 = SEA_WIND_DIRS[f.wd2] || f.wd2;
                html += `<td style="${tdStyle}">${wd1}→${wd2}</td>`;
            } else {
                html += `<td style="${tdStyle}">-</td>`;
            }
        });
    });
    html += `</tr>`;

    // 예보 행
    html += `<tr>
        <th style="${tdStyle}; ${labelStyle}">예보</th>`;
    sortedDays.forEach(dayKey => {
        const group = dateGroups[dayKey];
        ['am', 'pm'].forEach(period => {
            const f = group[period];
            if (f && f.wf) {
                html += `<td style="${tdStyle}; font-size:0.75rem; color:#8899aa; white-space:normal; max-width:80px; line-height:1.3;">${f.wf}</td>`;
            } else {
                html += `<td style="${tdStyle}">-</td>`;
            }
        });
    });
    html += `</tr>`;

    html += `</table>`;

    // 발표시각 포맷팅
    let tmFcText = '';
    if (tmFc) {
        const tmFcStr = String(tmFc);
        const year = tmFcStr.substring(0, 4);
        const month = tmFcStr.substring(4, 6);
        const day = tmFcStr.substring(6, 8);
        const hour = tmFcStr.substring(8, 10);
        const minute = tmFcStr.substring(10, 12);
        tmFcText = `${year}.${month}.${day} ${hour}:${minute} 발표`;
    }

    // 테이블과 발표시각 표시
    container.innerHTML = `
        <div style="position:relative;">
            <div style="overflow-x:auto;">${html}</div>
            ${tmFcText ? `
                <div style="
                    text-align: right;
                    padding: 10px 5px 5px 5px;
                    font-size: 0.75rem;
                    color: #8899aa;
                    position: sticky;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to right, transparent, #1a1e2e 30%);
                ">${tmFcText}</div>
            ` : ''}
        </div>
    `;
}

// 전역 함수로 등록
window.showSeaForecastTable = showSeaForecastTable;

// ===== 해구별 기상정보 이용안내 팝업 =====

/**
 * 해구별 기상정보 이용안내 팝업 표시
 */
function showSeaZoneInfoPopup() {
    // 기존 모달 있으면 제거
    const existing = document.getElementById('sea-zone-info-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'sea-zone-info-modal';
    modal.className = 'sea-zone-info-modal';
    modal.innerHTML = `
        <div class="sea-zone-info-overlay" onclick="closeSeaZoneInfoPopup()"></div>
        <div class="sea-zone-info-content">
            <div class="sea-zone-info-header">
                <h3><i class="fa-solid fa-circle-info"></i> 이용안내</h3>
                <button class="sea-zone-info-close" onclick="closeSeaZoneInfoPopup()" title="닫기">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="sea-zone-info-body">
                <div class="info-section">
                    <div class="info-section-title">
                        <i class="fa-solid fa-database"></i> 제공정보 (기상청 API)
                    </div>
                    <ul class="info-list">
                        <li>각 대해구･소해구별 기상전망 (매일 00시, 12시 발표)</li>
                        <li>각 부이별 관측 데이터 (매시간 발표)</li>
                    </ul>
                </div>
                <div class="info-section">
                    <div class="info-section-title">
                        <i class="fa-solid fa-triangle-exclamation"></i> 유의사항
                    </div>
                    <ul class="info-list">
                        <li>경위도 오차 가능성 고려 항해용도 사용불가</li>
                        <li>각 특보구역 및 부이는 대략적 위치로 표출</li>
                        <li>연안바다 및 평수구역의 위치정보 미표출</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 애니메이션을 위해 약간의 딜레이 후 show 클래스 추가
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

/**
 * 해구별 기상정보 이용안내 팝업 닫기
 */
function closeSeaZoneInfoPopup() {
    const modal = document.getElementById('sea-zone-info-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// 전역 함수로 등록
window.showSeaZoneInfoPopup = showSeaZoneInfoPopup;
window.closeSeaZoneInfoPopup = closeSeaZoneInfoPopup;

// ===== 해역별 특보 현황 이용안내 팝업 =====

/**
 * 해역별 특보 현황 이용안내 팝업 표시
 */
function showWeatherAlertInfoPopup() {
    // 기존 모달 있으면 제거
    const existing = document.getElementById('weather-alert-info-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'weather-alert-info-modal';
    modal.className = 'sea-zone-info-modal';
    modal.innerHTML = `
        <div class="sea-zone-info-overlay" onclick="closeWeatherAlertInfoPopup()"></div>
        <div class="sea-zone-info-content">
            <div class="sea-zone-info-header">
                <h3><i class="fa-solid fa-circle-info"></i> 이용안내</h3>
                <button class="sea-zone-info-close" onclick="closeWeatherAlertInfoPopup()" title="닫기">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="sea-zone-info-body">
                <div class="info-section">
                    <div class="info-section-title">
                        <i class="fa-solid fa-database"></i> 제공정보 (기상청 API 등)
                    </div>
                    <ul class="info-list">
                        <li>각 해역 특보구역별 특보(태풍, 풍랑, 폭풍해일, 지진해일) 현황 및 변경사항</li>
                        <li>특보구역 내 위치 중인 부이의 관측 데이터 (매시간 발표)</li>
                        <li>앞바다의 기상예보 (05시, 17시 발표)</li>
                        <li>해구별 기상전망</li>
                    </ul>
                </div>
                <div class="info-section">
                    <div class="info-section-title">
                        <i class="fa-solid fa-triangle-exclamation"></i> 유의사항
                    </div>
                    <ul class="info-list">
                        <li>기상특보 : 기상청에서 발표하는 정보를 기반으로 제공하나, 기상청 홈페이지 기상정보 수시 확인 요망</li>
                        <li>출항 가능여부 등 판단 시 반드시 신고기관(파출소, 출장소 등)에 확인 요망</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 애니메이션을 위해 약간의 딜레이 후 show 클래스 추가
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

/**
 * 해역별 특보 현황 이용안내 팝업 닫기
 */
function closeWeatherAlertInfoPopup() {
    const modal = document.getElementById('weather-alert-info-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// 전역 함수로 등록
window.showWeatherAlertInfoPopup = showWeatherAlertInfoPopup;
window.closeWeatherAlertInfoPopup = closeWeatherAlertInfoPopup;

// ===== 물 때 정보 이용안내 팝업 =====

/**
 * 물 때 정보 이용안내 팝업 표시
 */
function showTideInfoPopup() {
    // 기존 모달 있으면 제거
    const existing = document.getElementById('tide-info-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'tide-info-modal';
    modal.className = 'sea-zone-info-modal';
    modal.innerHTML = `
        <div class="sea-zone-info-overlay" onclick="closeTideInfoPopup()"></div>
        <div class="sea-zone-info-content">
            <div class="sea-zone-info-header">
                <h3><i class="fa-solid fa-circle-info"></i> 이용안내</h3>
                <button class="sea-zone-info-close" onclick="closeTideInfoPopup()" title="닫기">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="sea-zone-info-body">
                <div class="info-section">
                    <div class="info-section-title">
                        <i class="fa-solid fa-database"></i> 제공정보 (국립해양조사원 조석예보 API 기반)
                    </div>
                    <ul class="info-list">
                        <li>조석정보, 일출･몰, 월출･몰, 월령 및 밝기, 달 모양 정보</li>
                    </ul>
                </div>
                <div class="info-section">
                    <div class="info-section-title">
                        <i class="fa-solid fa-triangle-exclamation"></i> 유의사항
                    </div>
                    <ul class="info-list">
                        <li>국립해양조사원은 공식적으로 166개 <strong>"표준항 외 위치의 조석정보를 제공하지 않음"</strong></li>
                        <li>선택한 위치의 정보는 <strong>"표준항의 조석 관측･예측정보를 기준"</strong>으로 환경, 거리 등 요소를 <strong style="color: #448aff;">"자체 계산 로직에 반영"</strong>하여 산출한 결과임.</li>
                        <li>산출된 결과는 자체 계산 로직에 따라 계산된 값이므로 <strong style="color: #ff5252;">"실제와 오차가 있으므로 이 정보 이용에 따른 책임을 지지 않음."</strong></li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 애니메이션을 위해 약간의 딜레이 후 show 클래스 추가
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

/**
 * 물 때 정보 이용안내 팝업 닫기
 */
function closeTideInfoPopup() {
    const modal = document.getElementById('tide-info-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// 전역 함수로 등록
window.showTideInfoPopup = showTideInfoPopup;
window.closeTideInfoPopup = closeTideInfoPopup;

// 헤더 클릭 시 전체 데이터 새로고침
async function handleHeaderRefresh() {
    // 이미 로딩 중이면 무시
    if (appState.isLoading) return;

    try {
        await fetchAllData();
    } catch (e) {
        console.error('Refresh failed:', e);
    }
}
window.handleHeaderRefresh = handleHeaderRefresh;
