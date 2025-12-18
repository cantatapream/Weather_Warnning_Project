// ===========================
// 조석 예측 지도 (tide.js)
// index.html 스타일에 맞춘 통합 버전
// ===========================

// 전역 변수
let tideMap = null;
let tidePopupOverlay = null;
let tideStationLayer = null;
let tideData = typeof TIDE_DATA !== 'undefined' ? TIDE_DATA : [];

// 마지막 클릭 위치 저장 (날짜 변경 시 팝업 업데이트용)
let lastClickedCoordinate = null;
let lastClickedLonLat = null;

// 표준항 목록 (tide_map_fixed.html에서 복사)
const TIDE_REFERENCE_STATIONS = [
    { code: "SO_0732", name: "남애항", lat: 37.944, lon: 128.788 },
    { code: "SO_0733", name: "강릉항", lat: 37.772, lon: 128.951 },
    { code: "SO_0734", name: "궁촌항", lat: 37.327, lon: 129.27 },
    { code: "SO_0735", name: "죽변항", lat: 37.054, lon: 129.423 },
    { code: "SO_0736", name: "축산항", lat: 36.509, lon: 129.448 },
    { code: "SO_0737", name: "강구항", lat: 36.358, lon: 129.391 },
    { code: "SO_0555", name: "서망항", lat: 34.366, lon: 126.134 },
    { code: "SO_0559", name: "완도항", lat: 34.261, lon: 126.759 },
    { code: "SO_0558", name: "법성포", lat: 35.569, lon: 126.427 },
    { code: "SO_0557", name: "오도항", lat: 35.035, lon: 126.433 },
    { code: "SO_0560", name: "나포항", lat: 35.464, lon: 126.324 },
    { code: "SO_0562", name: "승봉도", lat: 37.169, lon: 126.29 },
    { code: "SO_0573", name: "양포항", lat: 35.881, lon: 129.527 },
    { code: "SO_0581", name: "강양항", lat: 35.39, lon: 129.344 },
    { code: "SO_0571", name: "거제외포", lat: 34.939, lon: 128.718 },
    { code: "SO_0578", name: "소매물도", lat: 34.621, lon: 128.548 },
    { code: "SO_0567", name: "쉬미항", lat: 34.504, lon: 126.183 },
    { code: "SO_0576", name: "화봉리", lat: 34.661, lon: 126.256 },
    { code: "SO_0564", name: "국화도", lat: 37.06, lon: 126.56 },
    { code: "SO_0563", name: "울도", lat: 37.035, lon: 125.995 },
    { code: "SO_0706", name: "청산도", lat: 34.18, lon: 126.856 },
    { code: "SO_0708", name: "안도항", lat: 34.479, lon: 127.797 },
    { code: "SO_0712", name: "능양항", lat: 34.812, lon: 128.245 },
    { code: "SO_0701", name: "홍도항", lat: 34.681, lon: 125.195 },
    { code: "SO_0702", name: "진도옥도", lat: 34.35, lon: 126.018 },
    { code: "SO_0703", name: "제주한림", lat: 33.412, lon: 126.265 },
    { code: "SO_0704", name: "보령항", lat: 36.329, lon: 126.335 },
    { code: "DT_0002", name: "평택", lat: 36.966, lon: 126.822 },
    { code: "DT_0003", name: "영광", lat: 35.426, lon: 126.42 },
    { code: "DT_0004", name: "제주", lat: 33.527, lon: 126.543 },
    { code: "DT_0005", name: "부산", lat: 35.096, lon: 129.035 },
    { code: "DT_0006", name: "묵호", lat: 37.55, lon: 129.116 },
    { code: "DT_0007", name: "목포", lat: 34.779, lon: 126.375 },
    { code: "DT_0008", name: "안산", lat: 37.192, lon: 126.647 },
    { code: "DT_0010", name: "서귀포", lat: 33.24, lon: 126.561 },
    { code: "DT_0011", name: "후포", lat: 36.677, lon: 129.453 },
    { code: "DT_0012", name: "속초", lat: 38.207, lon: 128.594 },
    { code: "DT_0013", name: "울릉도", lat: 37.491, lon: 130.913 },
    { code: "DT_0016", name: "여수", lat: 34.747, lon: 127.765 },
    { code: "DT_0017", name: "대산", lat: 37.007, lon: 126.352 },
    { code: "DT_0018", name: "군산", lat: 35.975, lon: 126.563 },
    { code: "DT_0021", name: "추자도", lat: 33.961, lon: 126.3 },
    { code: "DT_0023", name: "모슬포", lat: 33.214, lon: 126.251 },
    { code: "DT_0028", name: "진도", lat: 34.377, lon: 126.308 },
    { code: "SO_0553", name: "해운대", lat: 35.16, lon: 129.191 },
    { code: "SO_0540", name: "호산항", lat: 37.176, lon: 129.342 },
    { code: "DT_0020", name: "울산", lat: 35.501, lon: 129.387 },
    { code: "DT_0022", name: "성산포", lat: 33.474, lon: 126.927 },
    { code: "DT_0024", name: "장항", lat: 36.006, lon: 126.687 },
    { code: "DT_0026", name: "고흥발포", lat: 34.481, lon: 127.342 },
    { code: "DT_0027", name: "완도", lat: 34.315, lon: 126.759 },
    { code: "DT_0029", name: "거제도", lat: 34.801, lon: 128.699 },
    { code: "DT_0025", name: "보령", lat: 36.406, lon: 126.486 },
    { code: "DT_0001", name: "인천", lat: 37.451, lon: 126.592 },
    { code: "DT_0052", name: "인천송도", lat: 37.338, lon: 126.586 },
    { code: "DT_0014", name: "통영", lat: 34.827, lon: 128.434 },
    { code: "DT_0037", name: "어청도", lat: 36.117, lon: 125.984 },
    { code: "DT_0046", name: "쌍정초", lat: 37.556, lon: 130.939 },
    { code: "DT_0039", name: "왕돌초", lat: 36.719, lon: 129.732 },
    { code: "DT_0041", name: "복사초", lat: 34.098, lon: 126.168 },
    { code: "DT_0047", name: "도농탄", lat: 33.287, lon: 126.104 },
    { code: "SO_0537", name: "벽파진", lat: 34.539, lon: 126.346 },
    { code: "SO_0547", name: "말도", lat: 35.855, lon: 126.318 },
    { code: "SO_0550", name: "나로도", lat: 34.463, lon: 127.453 },
    { code: "SO_0705", name: "마량항", lat: 34.448, lon: 126.821 },
    { code: "SO_0707", name: "시산항", lat: 34.394, lon: 127.261 },
    { code: "SO_0709", name: "두문포", lat: 34.643, lon: 127.797 },
    { code: "SO_0710", name: "봉우항", lat: 34.932, lon: 127.927 },
    { code: "SO_0711", name: "창선도", lat: 34.84, lon: 128.019 },
    { code: "SO_0700", name: "호도", lat: 36.303, lon: 126.264 },
    { code: "DT_0059", name: "백령도", lat: 37.955, lon: 124.736 },
    { code: "DT_0060", name: "연평도", lat: 37.657, lon: 125.714 },
    { code: "SO_0551", name: "여서도", lat: 33.988, lon: 126.923 },
    { code: "SO_0552", name: "고현항", lat: 34.901, lon: 128.622 },
    { code: "IE_0062", name: "옹진소청초", lat: 37.423, lon: 124.738 },
    { code: "SO_0572", name: "갈두", lat: 34.549, lon: 127.589 },
    { code: "SO_0575", name: "하태도", lat: 34.403, lon: 127.122 },
    { code: "SO_0561", name: "거문도", lat: 34.027, lon: 127.308 },
    { code: "SO_0570", name: "광암항", lat: 35.102, lon: 128.498 },
    { code: "SO_0568", name: "백야도", lat: 34.624, lon: 127.632 },
    { code: "SO_0577", name: "가거도", lat: 34.05, lon: 125.128 },
    { code: "SO_0566", name: "송공항", lat: 34.848, lon: 126.225 },
    { code: "SO_0565", name: "향화도항", lat: 35.167, lon: 126.359 },
    { code: "SO_0574", name: "백사장항", lat: 36.586, lon: 126.315 },
    { code: "SO_0731", name: "대진항", lat: 38.501, lon: 128.426 },
    { code: "SO_1251", name: "낙월도", lat: 35.2, lon: 126.145 },
    { code: "SO_1252", name: "외연도항", lat: 36.225, lon: 126.081 },
    { code: "SO_0757", name: "안남리", lat: 34.73, lon: 127.264 },
    { code: "SO_0755", name: "원동항", lat: 34.393, lon: 126.648 },
    { code: "SO_0754", name: "평호리", lat: 34.448, lon: 126.455 },
    { code: "SO_1256", name: "어류정항", lat: 37.643, lon: 126.342 },
    { code: "DT_0064", name: "교동대교", lat: 37.789, lon: 126.339 },
    { code: "SO_1249", name: "오도항", lat: 35.035, lon: 126.433 },
    { code: "SO_1247", name: "여자만", lat: 34.762, lon: 127.403 },
    { code: "SO_1246", name: "법성포", lat: 35.569, lon: 126.427 },
    { code: "SO_1248", name: "신안옥도", lat: 34.683, lon: 126.064 },
    { code: "SO_0759", name: "장문리", lat: 34.873, lon: 128.424 },
    { code: "DT_0068", name: "위도", lat: 35.618, lon: 126.301 },
    { code: "SO_0760", name: "오산항", lat: 36.888, lon: 129.416 },
    { code: "SO_0753", name: "하의도웅곡", lat: 34.608, lon: 126.038 },
    { code: "SO_0631", name: "암태도", lat: 34.853, lon: 126.071 },
    { code: "SO_0752", name: "검산항", lat: 35.0, lon: 126.107 },
    { code: "SO_1265", name: "송이도", lat: 35.271, lon: 126.15 },
    { code: "SO_1266", name: "남열항", lat: 34.576, lon: 127.48 },
    { code: "SO_1267", name: "구룡포항", lat: 35.99, lon: 129.555 },
    { code: "DT_0093", name: "소무의도", lat: 37.373, lon: 126.44 },
    { code: "DT_0094", name: "서거차도", lat: 34.251, lon: 125.915 },
    { code: "SO_1268", name: "궁평항", lat: 37.117, lon: 126.68 },
    { code: "SO_1270", name: "삼길포항", lat: 37.004, lon: 126.452 },
    { code: "SO_1271", name: "풍도", lat: 37.072, lon: 126.436 },
    { code: "SO_1272", name: "초산리", lat: 35.023, lon: 126.262 },
    { code: "SO_1277", name: "화순항", lat: 33.215, lon: 126.315 },
    { code: "SO_1274", name: "거진항", lat: 38.446, lon: 128.456 },
    { code: "SO_1275", name: "공현진항", lat: 38.355, lon: 128.513 },
    { code: "SO_1276", name: "아야진항", lat: 38.27, lon: 128.557 },
    { code: "SO_1273", name: "장호항", lat: 37.288, lon: 129.317 },
    { code: "SO_1283", name: "사천진항", lat: 37.875, lon: 128.875 },
    { code: "SO_1279", name: "어란진항", lat: 34.348, lon: 126.475 },
    { code: "SO_1280", name: "덕산항", lat: 37.377, lon: 129.253 },
    { code: "SO_1281", name: "임원항", lat: 37.228, lon: 129.343 },
    { code: "SO_1282", name: "선재도", lat: 37.253, lon: 126.509 },
    { code: "SO_1278", name: "원평항", lat: 34.781, lon: 125.908 },
    { code: "SO_1284", name: "월포리", lat: 36.209, lon: 129.381 },
    { code: "SO_1285", name: "구계항", lat: 36.318, lon: 129.379 },
    { code: "SO_1286", name: "영덕대진항", lat: 36.557, lon: 129.431 },
    { code: "SO_1287", name: "구산항", lat: 36.76, lon: 129.472 },
    { code: "SO_1288", name: "기사문항", lat: 38.007, lon: 128.73 }
];

let stationData = TIDE_REFERENCE_STATIONS;

// ===== 조석 지도 초기화 =====
function initTideMap() {
    if (tideMap) {
        tideMap.updateSize();
        return;
    }

    try {
        // 팝업 요소 생성 (지도 컨테이너에 직접 추가)
        const popupElement = document.createElement('div');
        popupElement.id = 'tide-popup-container';
        popupElement.style.display = 'none';
        document.getElementById('tide-map').appendChild(popupElement);

        // OpenLayers 오버레이 (위치 추적용으로만 사용)
        tidePopupOverlay = {
            element: popupElement,
            getElement: () => popupElement,
            setPosition: (pos) => {
                if (pos) {
                    popupElement.style.display = 'block';
                } else {
                    popupElement.style.display = 'none';
                }
            },
            getPosition: () => popupElement.style.display === 'block' ? true : undefined
        };

        // OpenStreetMap 레이어
        const baseLayer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        // 지도 생성
        tideMap = new ol.Map({
            target: 'tide-map',
            layers: [baseLayer],
            view: new ol.View({
                center: ol.proj.fromLonLat([127.5, 36.5]),
                zoom: 7,
                minZoom: 5,
                maxZoom: 18
            })
        });

        // 클릭 이벤트
        tideMap.on('click', handleTideMapClick);

        // 표준항 마커 추가
        addTideStationMarkers();

        // 커스텀 컨트롤 추가
        addTideMapControls();

        console.log('✅ 조석 지도 초기화 완료');
    } catch (error) {
        console.error('조석 지도 초기화 오류:', error);
    }
}

// ===== 표준항 마커 추가 =====
function addTideStationMarkers() {
    if (!tideMap || stationData.length === 0) return;

    // 기존 마커 레이어 제거
    if (tideStationLayer) {
        tideMap.removeLayer(tideStationLayer);
    }

    // 마커 피처 생성
    const features = stationData.map(station => {
        const feature = new ol.Feature({
            geometry: new ol.geom.Point(ol.proj.fromLonLat([station.lon, station.lat])),
            name: station.name,
            code: station.code
        });
        return feature;
    });

    // 벡터 소스 및 레이어 생성
    tideStationLayer = new ol.layer.Vector({
        source: new ol.source.Vector({ features }),
        style: function (feature) {
            return new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 6,
                    fill: new ol.style.Fill({ color: '#ff5252' }), // index.html accent-red
                    stroke: new ol.style.Stroke({ color: 'white', width: 2 })
                }),
                text: new ol.style.Text({
                    text: feature.get('name'),
                    offsetY: -15,
                    fill: new ol.style.Fill({ color: '#ffffff' }),
                    stroke: new ol.style.Stroke({ color: '#000000', width: 3 }),
                    font: 'bold 12px Inter, sans-serif'
                })
            });
        }
    });

    tideMap.addLayer(tideStationLayer);
}

// ===== 지도 클릭 처리 =====
function handleTideMapClick(event) {
    // 팝업이 열려있으면 닫기
    if (tidePopupOverlay && tidePopupOverlay.getPosition()) {
        tidePopupOverlay.setPosition(undefined);
        lastClickedCoordinate = null;
        lastClickedLonLat = null;
        return;
    }

    if (tideData.length === 0) {
        alert('조석 데이터가 로드되지 않았습니다.\ntide_data.js 파일을 확인해주세요.');
        return;
    }

    const coordinate = event.coordinate;
    const lonLat = ol.proj.toLonLat(coordinate);
    const [longitude, latitude] = lonLat;

    // 클릭 위치 저장 (날짜 변경 시 팝업 업데이트용)
    lastClickedCoordinate = coordinate; // 클릭한 위치에 팝업 표시
    lastClickedLonLat = { lat: latitude, lon: longitude };

    // 선택한 날짜
    const selectedDate = getSelectedTideDate();

    // 가장 가까운 3개 표준항 찾기
    const nearest3Stations = findNearestStations(latitude, longitude, 3);

    // 각 표준항의 조석 데이터 조회
    let stationsWithData = nearest3Stations.map(station => ({
        ...station,
        tideInfo: getTideDataForDate(station.name, selectedDate)
    })).filter(s => s.tideInfo);

    // 2차 시도: 가까운 표준항에 데이터가 없으면 모든 표준항에서 검색
    if (stationsWithData.length === 0) {
        console.warn('⚠️ 가까운 표준항에 데이터 없음. 모든 표준항 재검색...');
        stationsWithData = findNearestStationsWithData(latitude, longitude, selectedDate, 3);
    }

    if (stationsWithData.length === 0) {
        showTidePopup(coordinate, {
            clickedLat: latitude.toFixed(6),
            clickedLon: longitude.toFixed(6),
            error: `해당 날짜의 조석 데이터가 없습니다.\n\n📅 선택 날짜: ${selectedDate}`
        });
        return;
    }

    // 역거리 가중 보간법으로 조석 계산
    const interpolatedTide = interpolateTideByIDW(stationsWithData);

    // 팝업 표시 (클릭한 위치에)
    showTidePopup(coordinate, {
        clickedLat: latitude.toFixed(6),
        clickedLon: longitude.toFixed(6),
        stations: stationsWithData,
        tideInfo: interpolatedTide,
        method: stationsWithData.length > 1 ? 'idw' : 'single'
    });
}

// ===== 조석 팝업 표시 (간결한 디자인) =====
function showTidePopup(coordinate, data) {
    const element = tidePopupOverlay.getElement();
    element.className = 'tide-popup';

    // 천문정보 계산
    const lat = parseFloat(data.clickedLat);
    const lon = parseFloat(data.clickedLon);
    const astroInfo = getAstronomyInfo(lat, lon, currentTideDate);

    let html = `
        <button class="tide-popup-close-x" onclick="tidePopupOverlay.setPosition(undefined)" title="닫기">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="tide-popup-body">
            <div class="tide-location">
                <i class="fa-solid fa-location-dot"></i>
                <span>${data.clickedLat}°N, ${data.clickedLon}°E</span>
            </div>
    `;

    if (data.error) {
        html += `
            <div class="tide-error">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>${data.error}</p>
            </div>
        `;
        // 에러 시에도 천문정보 표시
        html += getAstronomyInfoHTML(astroInfo);
    } else if (data.tideInfo) {
        // 모든 조석 데이터를 시간순으로 수집
        let allTides = [];
        let lastHighTime = 0;
        let lastLowTime = 0;

        for (let i = 1; i <= 4; i++) {
            const highTime = data.tideInfo[`highTide${i}Time`];
            const highLevel = data.tideInfo[`highTide${i}Level`];
            const lowTime = data.tideInfo[`lowTide${i}Time`];
            const lowLevel = data.tideInfo[`lowTide${i}Level`];

            // 고조
            if (highTime && !isNaN(highLevel)) {
                const isNextDay = (i > 1 && highTime < lastHighTime);
                if (!isNextDay) {
                    allTides.push({
                        type: 'high',
                        timeRaw: highTime,
                        time: formatTime(highTime),
                        level: highLevel
                    });
                    lastHighTime = highTime;
                }
            }

            // 저조
            if (lowTime && !isNaN(lowLevel)) {
                const isNextDay = (i > 1 && lowTime < lastLowTime);
                if (!isNextDay) {
                    allTides.push({
                        type: 'low',
                        timeRaw: lowTime,
                        time: formatTime(lowTime),
                        level: lowLevel
                    });
                    lastLowTime = lowTime;
                }
            }
        }

        // 시간순 정렬
        allTides.sort((a, b) => a.timeRaw - b.timeRaw);

        // 전날의 마지막 반대 조석 가져오기 (조차 계산용)
        let prevDayLastHigh = null;
        let prevDayLastLow = null;

        // 전날 날짜 계산
        const prevDate = new Date(currentTideDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateNum = parseInt(
            `${prevDate.getFullYear()}${String(prevDate.getMonth() + 1).padStart(2, '0')}${String(prevDate.getDate()).padStart(2, '0')}`
        );

        // 가장 가까운 표준항의 전날 데이터 조회
        // data.stations가 있으면 사용, 없으면 sourceStations에서 추출
        let stationName = null;
        if (data.stations && data.stations.length > 0) {
            stationName = data.stations[0].name;
        } else if (data.tideInfo && data.tideInfo.sourceStations && data.tideInfo.sourceStations.length > 0) {
            stationName = data.tideInfo.sourceStations[0];
        }

        if (stationName) {
            const prevDayData = getTideDataForDate(stationName, prevDateNum);

            if (prevDayData) {
                // 전날의 마지막 고조/저조 찾기 (시간 역순으로)
                for (let i = 4; i >= 1; i--) {
                    if (prevDayLastHigh === null && prevDayData[`highTide${i}Level`] !== undefined) {
                        prevDayLastHigh = prevDayData[`highTide${i}Level`];
                    }
                    if (prevDayLastLow === null && prevDayData[`lowTide${i}Level`] !== undefined) {
                        prevDayLastLow = prevDayData[`lowTide${i}Level`];
                    }
                    if (prevDayLastHigh !== null && prevDayLastLow !== null) break;
                }
            }

            // 디버그 로그
            console.log('전날 조석 데이터:', { stationName, prevDateNum, prevDayLastHigh, prevDayLastLow });
        }

        // 조차 계산 (직전 반대 조석과의 차이)
        for (let i = 0; i < allTides.length; i++) {
            let tidalRange = null;

            // 이전 조석들 중 반대 타입 찾기
            for (let j = i - 1; j >= 0; j--) {
                if (allTides[j].type !== allTides[i].type) {
                    tidalRange = allTides[i].level - allTides[j].level;
                    break;
                }
            }

            // 당일에 이전 반대 조석이 없으면 전날 데이터 사용
            if (tidalRange === null) {
                if (allTides[i].type === 'high' && prevDayLastLow !== null) {
                    tidalRange = allTides[i].level - prevDayLastLow;
                } else if (allTides[i].type === 'low' && prevDayLastHigh !== null) {
                    tidalRange = allTides[i].level - prevDayLastHigh;
                }
            }

            allTides[i].tidalRange = tidalRange;
        }

        // 고조/저조 분리
        const highTides = allTides.filter(t => t.type === 'high');
        const lowTides = allTides.filter(t => t.type === 'low');

        // 고조 표시
        html += `<div class="tide-group">`;
        html += `<div class="tide-group-label high">고<br>조</div>`;
        html += `<div class="tide-group-items">`;
        if (highTides.length > 0) {
            highTides.forEach(t => {
                // 조차가 있으면 표시, 없으면 '-'
                const rangeText = t.tidalRange !== null ? `+${t.tidalRange}` : '-';
                html += `<div class="tide-row high">
                    <span class="tide-time">${t.time}</span>
                    <span class="tide-level">(${t.level}cm)</span>
                    <span class="tide-arrow">▲</span>
                    <span class="tide-value-signed">${rangeText}</span>
                </div>`;
            });
        } else {
            html += `<div class="tide-row empty">--:-- (--cm)</div>`;
        }
        html += `</div></div>`;

        // 구분선
        html += `<div class="tide-divider"></div>`;

        // 저조 표시
        html += `<div class="tide-group">`;
        html += `<div class="tide-group-label low">저<br>조</div>`;
        html += `<div class="tide-group-items">`;
        if (lowTides.length > 0) {
            lowTides.forEach(t => {
                // 조차가 있으면 표시, 없으면 '-'
                const rangeText = t.tidalRange !== null ? `${t.tidalRange}` : '-';
                html += `<div class="tide-row low">
                    <span class="tide-time">${t.time}</span>
                    <span class="tide-level">(${t.level}cm)</span>
                    <span class="tide-arrow">▼</span>
                    <span class="tide-value-signed">${rangeText}</span>
                </div>`;
            });
        } else {
            html += `<div class="tide-row empty">--:-- (--cm)</div>`;
        }
        html += `</div></div>`;

        // 천문정보를 조석정보 아래에 추가
        html += getAstronomyInfoHTML(astroInfo);
    }

    html += `</div>`;

    element.innerHTML = html;
    tidePopupOverlay.setPosition(coordinate);
}

// ===== 유틸리티 함수들 =====

function getSelectedTideDate() {
    const dateStr = document.getElementById('tide-date-picker').value;
    return parseInt(dateStr.replace(/-/g, ''));
}

function findNearestStations(lat, lon, count = 3) {
    const stationsWithDist = stationData.map(station => ({
        ...station,
        distance: calculateDistance(lat, lon, station.lat, station.lon)
    }));

    stationsWithDist.sort((a, b) => a.distance - b.distance);
    return stationsWithDist.slice(0, count);
}

function findNearestStationsWithData(lat, lon, selectedDate, count = 3) {
    const stationsWithDataAndDist = stationData.map(station => ({
        ...station,
        distance: calculateDistance(lat, lon, station.lat, station.lon),
        tideInfo: getTideDataForDate(station.name, selectedDate)
    }))
        .filter(s => s.tideInfo)
        .sort((a, b) => a.distance - b.distance);

    return stationsWithDataAndDist.slice(0, count);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

function getTideDataForDate(stationName, dateNum) {
    const station = stationData.find(s => s.name === stationName);

    if (station && station.code) {
        const byCode = tideData.find(row =>
            row.stationCode === station.code && row.date === dateNum
        );
        if (byCode) return byCode;
    }

    const byName = tideData.find(row =>
        row.stationName === stationName && row.date === dateNum
    );
    if (byName) return byName;

    const partialMatch = tideData.find(row =>
        row.date === dateNum && (
            row.stationName?.includes(stationName) ||
            stationName?.includes(row.stationName)
        )
    );

    return partialMatch || null;
}

function interpolateTideByIDW(stationsWithData) {
    if (stationsWithData.length === 1) {
        return { ...stationsWithData[0].tideInfo, method: 'single', sourceStations: [stationsWithData[0].name] };
    }

    // 가장 가까운 표준항 (시간 데이터 소스)
    const nearestStation = stationsWithData[0];

    const weights = stationsWithData.map(s => {
        if (s.distance < 0.1) return 1000000;
        return 1 / Math.pow(s.distance, 2);
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    const result = {
        method: 'idw',
        sourceStations: stationsWithData.map(s => s.name),
        weights: normalizedWeights
    };

    // 고조: 시간은 가장 가까운 표준항에서, 레벨만 IDW 보간
    for (let i = 1; i <= 4; i++) {
        const timeKey = `highTide${i}Time`;
        const levelKey = `highTide${i}Level`;

        // 시간은 가장 가까운 표준항에서 가져옴
        if (nearestStation.tideInfo[timeKey]) {
            result[timeKey] = nearestStation.tideInfo[timeKey];
        }

        // 레벨은 IDW 보간 (모든 표준항에 데이터가 있을 때만)
        const stationsWithLevel = stationsWithData.filter(s => s.tideInfo[levelKey] !== undefined);
        if (stationsWithLevel.length > 0) {
            const levelWeights = stationsWithLevel.map(s => {
                if (s.distance < 0.1) return 1000000;
                return 1 / Math.pow(s.distance, 2);
            });
            const totalLevelWeight = levelWeights.reduce((sum, w) => sum + w, 0);

            const avgLevel = stationsWithLevel.reduce((sum, station, idx) => {
                return sum + station.tideInfo[levelKey] * (levelWeights[idx] / totalLevelWeight);
            }, 0);
            result[levelKey] = Math.round(avgLevel);
        }
    }

    // 저조: 시간은 가장 가까운 표준항에서, 레벨만 IDW 보간
    for (let i = 1; i <= 4; i++) {
        const timeKey = `lowTide${i}Time`;
        const levelKey = `lowTide${i}Level`;

        // 시간은 가장 가까운 표준항에서 가져옴
        if (nearestStation.tideInfo[timeKey]) {
            result[timeKey] = nearestStation.tideInfo[timeKey];
        }

        // 레벨은 IDW 보간
        const stationsWithLevel = stationsWithData.filter(s => s.tideInfo[levelKey] !== undefined);
        if (stationsWithLevel.length > 0) {
            const levelWeights = stationsWithLevel.map(s => {
                if (s.distance < 0.1) return 1000000;
                return 1 / Math.pow(s.distance, 2);
            });
            const totalLevelWeight = levelWeights.reduce((sum, w) => sum + w, 0);

            const avgLevel = stationsWithLevel.reduce((sum, station, idx) => {
                return sum + station.tideInfo[levelKey] * (levelWeights[idx] / totalLevelWeight);
            }, 0);
            result[levelKey] = Math.round(avgLevel);
        }
    }

    return result;
}

function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const str = String(timeStr).padStart(4, '0');
    const hours = parseInt(str.substring(0, 2));
    const minutes = parseInt(str.substring(2, 4));
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.round(totalMinutes % 60);
    return parseInt(String(hours).padStart(2, '0') + String(minutes).padStart(2, '0'));
}

function formatTime(timeInt) {
    if (!timeInt) return '--:--';
    const str = String(timeInt).padStart(4, '0');
    return `${str.substring(0, 2)}:${str.substring(2, 4)}`;
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', function () {
    // 날짜 선택기 초기화
    const datePicker = document.getElementById('tide-date-picker');
    if (datePicker) {
        datePicker.valueAsDate = new Date();
    }

    // 물때정보 탭 클릭 시 지도 초기화
    const tideTabs = document.querySelectorAll('.tab-btn[data-target="tide-section"]');
    tideTabs.forEach(btn => {
        btn.addEventListener('click', function () {
            setTimeout(() => {
                initTideMap();
            }, 100);
        });
    });

    console.log('✅ 조석 지도 스크립트 로드 완료');
});

// ===== 날짜 네비게이션 =====
let currentTideDate = new Date();

function updateTideDateDisplay() {
    const year = currentTideDate.getFullYear();
    const month = currentTideDate.getMonth() + 1;
    const date = currentTideDate.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayNames[currentTideDate.getDay()];

    // 양력 표시
    const solarText = `${year}년 ${month}월 ${date}일(${dayOfWeek})`;
    document.getElementById('tide-solar-date').textContent = solarText;

    // 음력 표시 (정확한 변환)
    const lunarText = getLunarDate(year, month, date);
    document.getElementById('tide-lunar-date').textContent = `(음력 ${lunarText})`;

    // 숨겨진 date picker 업데이트
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const hiddenPicker = document.getElementById('tide-date-picker-hidden');
    if (hiddenPicker) {
        hiddenPicker.value = dateStr;
    }
}

function prevTideDate() {
    currentTideDate.setDate(currentTideDate.getDate() - 1);
    updateTideDateDisplay();
    refreshPopupIfOpen();
}

function nextTideDate() {
    currentTideDate.setDate(currentTideDate.getDate() + 1);
    updateTideDateDisplay();
    refreshPopupIfOpen();
}

function showTideDatePicker() {
    const hiddenPicker = document.getElementById('tide-date-picker-hidden');
    if (hiddenPicker) {
        hiddenPicker.showPicker();
    }
}

function onTideDatePickerChange() {
    const hiddenPicker = document.getElementById('tide-date-picker-hidden');
    if (hiddenPicker && hiddenPicker.value) {
        const parts = hiddenPicker.value.split('-');
        currentTideDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        updateTideDateDisplay();
        refreshPopupIfOpen();
    }
}

// 팝업이 열려있으면 현재 위치의 새 날짜 정보로 갱신
function refreshPopupIfOpen() {
    if (lastClickedCoordinate && lastClickedLonLat && tidePopupOverlay && tidePopupOverlay.getPosition()) {
        // 저장된 위치로 다시 조석 정보 조회
        const latitude = lastClickedLonLat.lat;
        const longitude = lastClickedLonLat.lon;
        const selectedDate = getSelectedTideDate();

        // 가장 가까운 3개 표준항 찾기
        const nearest3Stations = findNearestStations(latitude, longitude, 3);

        // 각 표준항의 조석 데이터 조회
        let stationsWithData = nearest3Stations.map(station => ({
            ...station,
            tideInfo: getTideDataForDate(station.name, selectedDate)
        })).filter(s => s.tideInfo);

        // 2차 시도
        if (stationsWithData.length === 0) {
            stationsWithData = findNearestStationsWithData(latitude, longitude, selectedDate, 3);
        }

        if (stationsWithData.length === 0) {
            showTidePopup(lastClickedCoordinate, {
                clickedLat: latitude.toFixed(6),
                clickedLon: longitude.toFixed(6),
                error: `해당 날짜의 조석 데이터가 없습니다.\n\n📅 선택 날짜: ${selectedDate}`
            });
            return;
        }

        // 역거리 가중 보간법으로 조석 계산
        const interpolatedTide = interpolateTideByIDW(stationsWithData);

        // 팝업 업데이트
        showTidePopup(lastClickedCoordinate, {
            clickedLat: latitude.toFixed(6),
            clickedLon: longitude.toFixed(6),
            stations: stationsWithData,
            tideInfo: interpolatedTide,
            method: stationsWithData.length > 1 ? 'idw' : 'single'
        });
    }
}

// 정확한 음력 변환 (내장 데이터 사용)
function getLunarDate(year, month, date) {
    // 설날(음력 1월 1일) 기준 데이터 (양력 날짜)
    // 출처: 한국천문연구원
    const lunarNewYears = {
        2024: { solar: new Date(2024, 1, 10), lunarYear: 2024 },  // 2024년 2월 10일
        2025: { solar: new Date(2025, 0, 29), lunarYear: 2025 },  // 2025년 1월 29일
        2026: { solar: new Date(2026, 1, 17), lunarYear: 2026 },  // 2026년 2월 17일
        2027: { solar: new Date(2027, 1, 6), lunarYear: 2027 },   // 2027년 2월 6일
        2028: { solar: new Date(2028, 0, 26), lunarYear: 2028 },  // 2028년 1월 26일
    };

    // 음력 월별 일수 (대월 30일, 소월 29일) - 2025-2027년
    // 윤달 정보: 2025년 윤6월, 2028년 윤5월
    const lunarMonthDays = {
        2024: [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29], // 354일
        2025: [30, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29], // 윤6월 (13개월) 384일
        2026: [30, 29, 30, 30, 29, 30, 29, 29, 30, 29, 30, 29], // 354일
        2027: [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30], // 355일
    };

    // 윤달 정보 (몇 번째 월 뒤에 윤달이 있는지)
    const leapMonths = {
        2025: 6, // 6월 뒤에 윤6월
    };

    const targetDate = new Date(year, month - 1, date);
    targetDate.setHours(0, 0, 0, 0);

    // 해당 연도 또는 이전 연도의 설날 찾기
    let baseYear = year;
    let baseInfo = lunarNewYears[baseYear];

    // 만약 타겟 날짜가 해당 연도 설날보다 이전이면 전년도 설날 사용
    if (!baseInfo || targetDate < baseInfo.solar) {
        baseYear = year - 1;
        baseInfo = lunarNewYears[baseYear];
    }

    if (!baseInfo) {
        // 데이터가 없으면 fallback
        return getLunarDateApprox(year, month, date);
    }

    // 설날로부터의 일수 차이
    const diffDays = Math.floor((targetDate - baseInfo.solar) / (1000 * 60 * 60 * 24));

    // 음력 날짜 계산
    let lunarYear = baseInfo.lunarYear;
    let lunarMonth = 1;
    let lunarDay = 1 + diffDays;
    let isLeapMonth = false;

    const monthDays = lunarMonthDays[lunarYear] || [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 30];
    const leapMonth = leapMonths[lunarYear];

    let monthIndex = 0;
    let realMonth = 1;

    while (lunarDay > monthDays[monthIndex]) {
        lunarDay -= monthDays[monthIndex];
        monthIndex++;

        // 윤달 체크
        if (leapMonth && realMonth === leapMonth && !isLeapMonth) {
            isLeapMonth = true;
        } else {
            isLeapMonth = false;
            realMonth++;
        }

        // 월이 12를 넘으면 다음 해
        if (realMonth > 12) {
            lunarYear++;
            realMonth = 1;
            monthIndex = 0;
            const newMonthDays = lunarMonthDays[lunarYear];
            if (newMonthDays) {
                // 계속 진행
            } else {
                break; // 데이터 없음
            }
        }

        if (monthIndex >= monthDays.length) break;
    }

    lunarMonth = realMonth;

    const leapText = isLeapMonth ? '(윤)' : '';
    return `${lunarYear}년 ${leapText}${lunarMonth}월 ${Math.floor(lunarDay)}일`;
}

// Fallback: 간단한 음력 근사 계산
function getLunarDateApprox(year, month, date) {
    // 2024년 1월 1일 기준 음력 2023년 11월 20일
    const baseDate = new Date(2024, 0, 1);
    const baseLunarYear = 2023;
    const baseLunarMonth = 11;
    const baseLunarDay = 20;

    const currentDate = new Date(year, month - 1, date);
    const diffDays = Math.floor((currentDate - baseDate) / (1000 * 60 * 60 * 24));

    let lunarYear = baseLunarYear;
    let lunarMonth = baseLunarMonth;
    let lunarDay = baseLunarDay + diffDays;

    while (lunarDay > 29) {
        lunarDay -= 29;
        lunarMonth++;
        if (lunarMonth > 12) {
            lunarMonth = 1;
            lunarYear++;
        }
    }

    while (lunarDay < 1) {
        lunarDay += 29;
        lunarMonth--;
        if (lunarMonth < 1) {
            lunarMonth = 12;
            lunarYear--;
        }
    }

    return `${lunarYear}년 ${lunarMonth}월 ${Math.floor(lunarDay)}일`;
}

function getSelectedTideDate() {
    const year = currentTideDate.getFullYear();
    const month = String(currentTideDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentTideDate.getDate()).padStart(2, '0');
    return parseInt(`${year}${month}${date}`);
}


// ===========================
// 내 위치 물때 조회
// ===========================

function getTideAtMyLocation() {
    const btn = document.querySelector('.tide-inline-location-btn');

    if (!navigator.geolocation) {
        alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
        return;
    }

    // 버튼 로딩 상태
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>위치 확인 중...</span>';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            console.log('현재 위치:', lat, lon);

            // 지도 중심 이동
            if (tideMap) {
                const view = tideMap.getView();
                view.animate({
                    center: ol.proj.fromLonLat([lon, lat]),
                    zoom: 10,
                    duration: 1000
                });
            }

            // 마커 표시 (내 위치)
            showMyLocationMarker(lat, lon);

            // 조석 정보 자동 조회
            setTimeout(() => {
                const coordinate = ol.proj.fromLonLat([lon, lat]);
                const event = { coordinate };
                handleTideMapClick(event);
            }, 1200);

            // 버튼 복원
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        },
        (error) => {
            console.error('위치 정보 오류:', error);

            let errorMsg = '위치 정보를 가져올 수 없습니다.';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = '위치 정보 권한이 거부되었습니다.\n브라우저 설정에서 위치 정보 권한을 허용해주세요.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = '위치 정보를 사용할 수 없습니다.';
                    break;
                case error.TIMEOUT:
                    errorMsg = '위치 정보 요청 시간이 초과되었습니다.\nGPS 신호가 약하거나 응답이 지연되고 있습니다.';
                    break;
            }

            alert(errorMsg);

            // 버튼 복원
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20000 // 20초 대기
        }
    );

}

// 내 위치 마커 표시
let myLocationLayer = null;

function showMyLocationMarker(lat, lon) {
    // 기존 마커 제거
    if (myLocationLayer) {
        tideMap.removeLayer(myLocationLayer);
    }

    // 내 위치 마커 생성
    const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
    });

    myLocationLayer = new ol.layer.Vector({
        source: new ol.source.Vector({ features: [feature] }),
        style: new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                fill: new ol.style.Fill({ color: '#4285f4' }),
                stroke: new ol.style.Stroke({
                    color: 'white',
                    width: 3
                })
            }),
            text: new ol.style.Text({
                text: '📍',
                offsetY: -25,
                font: '20px sans-serif'
            })
        }),
        zIndex: 1000
    });

    tideMap.addLayer(myLocationLayer);
}


// ===========================
// 지도 커스텀 컨트롤 (지도 위에 표시)
// ===========================

function addTideMapControls() {
    if (!tideMap) return;

    // 안내 문구 + 내 위치 버튼 (상단 전체 폭)
    const instructionControl = document.createElement('div');
    instructionControl.className = 'tide-map-control-instruction';
    instructionControl.innerHTML = `
        <span class="tide-instruction-text">물 때를 확인할 위치를 클릭하세요</span>
        <button class="tide-inline-location-btn" onclick="getTideAtMyLocation()" title="내 위치 조석 조회">내 위치</button>
    `;

    const instructionOverlay = new ol.control.Control({
        element: instructionControl
    });
    tideMap.addControl(instructionOverlay);
}


// ===========================
// 천문정보 계산 (SunCalc 라이브러리 사용)
// ===========================

/**
 * 주어진 경위도와 날짜에 대한 천문정보를 계산합니다.
 * @param {number} lat - 위도
 * @param {number} lon - 경도
 * @param {Date} date - 날짜
 * @returns {Object} 천문정보 객체
 */
function getAstronomyInfo(lat, lon, date) {
    // SunCalc 라이브러리가 로드되어 있는지 확인
    if (typeof SunCalc === 'undefined') {
        console.warn('SunCalc 라이브러리가 로드되지 않았습니다.');
        return null;
    }

    try {
        // 태양 정보
        const sunTimes = SunCalc.getTimes(date, lat, lon);

        // 달 정보
        const moonTimes = SunCalc.getMoonTimes(date, lat, lon);
        const moonIllumination = SunCalc.getMoonIllumination(date);

        // 시간 포맷팅 함수
        const formatTimeHHMM = (d) => {
            if (!d || isNaN(d.getTime())) return '--:--';
            return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        // 월령 계산 (삭망월 = 약 29.53일)
        // phase: 0=신월, 0.25=상현, 0.5=보름, 0.75=하현
        const lunarAge = moonIllumination.phase * 29.53;

        // 월상 이름
        let moonPhaseName = '';
        let moonPhaseIcon = '';
        const phase = moonIllumination.phase;
        if (phase < 0.03 || phase >= 0.97) {
            moonPhaseName = '삭(신월)';
            moonPhaseIcon = '🌑';
        } else if (phase < 0.22) {
            moonPhaseName = '초승달';
            moonPhaseIcon = '🌒';
        } else if (phase < 0.28) {
            moonPhaseName = '상현달';
            moonPhaseIcon = '🌓';
        } else if (phase < 0.47) {
            moonPhaseName = '상현망간';
            moonPhaseIcon = '🌔';
        } else if (phase < 0.53) {
            moonPhaseName = '보름달';
            moonPhaseIcon = '🌕';
        } else if (phase < 0.72) {
            moonPhaseName = '망하현간';
            moonPhaseIcon = '🌖';
        } else if (phase < 0.78) {
            moonPhaseName = '하현달';
            moonPhaseIcon = '🌗';
        } else {
            moonPhaseName = '그믐달';
            moonPhaseIcon = '🌘';
        }

        return {
            // 태양
            sunrise: formatTimeHHMM(sunTimes.sunrise),
            sunset: formatTimeHHMM(sunTimes.sunset),
            solarNoon: formatTimeHHMM(sunTimes.solarNoon),

            // 박명
            civilDawn: formatTimeHHMM(sunTimes.dawn),        // 시민박명 시작
            civilDusk: formatTimeHHMM(sunTimes.dusk),        // 시민박명 종료
            nauticalDawn: formatTimeHHMM(sunTimes.nauticalDawn),  // 항해박명 시작
            nauticalDusk: formatTimeHHMM(sunTimes.nauticalDusk),  // 항해박명 종료
            astronomicalDawn: formatTimeHHMM(sunTimes.nightEnd),  // 천문박명 시작
            astronomicalDusk: formatTimeHHMM(sunTimes.night),     // 천문박명 종료

            // 달
            moonrise: formatTimeHHMM(moonTimes.rise),
            moonset: formatTimeHHMM(moonTimes.set),

            // 월령
            lunarAge: lunarAge.toFixed(1),
            moonPhaseName: moonPhaseName,
            moonPhaseIcon: moonPhaseIcon,
            moonIllumination: Math.round(moonIllumination.fraction * 100) // 달 밝기 %
        };
    } catch (error) {
        console.error('천문정보 계산 오류:', error);
        return null;
    }
}

/**
 * 천문정보 HTML을 생성합니다.
 * @param {Object} astro - getAstronomyInfo() 반환값
 * @returns {string} HTML 문자열
 */
function getAstronomyInfoHTML(astro) {
    if (!astro) return '';

    return `
        <div class="astronomy-info">
            <div class="astronomy-section-title">
                <i class="fa-solid fa-sun"></i> 태양 / <i class="fa-solid fa-moon"></i> 달 정보
            </div>
            
            <div class="astronomy-row">
                <div class="astronomy-item">
                    <span class="astro-label">🌅 일출</span>
                    <span class="astro-value">${astro.sunrise}</span>
                </div>
                <div class="astronomy-item">
                    <span class="astro-label">🌇 일몰</span>
                    <span class="astro-value">${astro.sunset}</span>
                </div>
            </div>
            
            <div class="astronomy-row">
                <div class="astronomy-item">
                    <span class="astro-label">🌙 월출</span>
                    <span class="astro-value">${astro.moonrise}</span>
                </div>
                <div class="astronomy-item">
                    <span class="astro-label">🌑 월몰</span>
                    <span class="astro-value">${astro.moonset}</span>
                </div>
            </div>
            
            <div class="astronomy-row moon-phase-row">
                <div class="astronomy-item moon-phase">
                    <span class="moon-phase-icon">${astro.moonPhaseIcon}</span>
                </div>
                <div class="astronomy-item">
                    <span class="astro-label">월령</span>
                    <span class="astro-value">${astro.lunarAge}일</span>
                </div>
                <div class="astronomy-item">
                    <span class="astro-label">밝기</span>
                    <span class="astro-value">${astro.moonIllumination}%</span>
                </div>
            </div>
        </div>
    `;
}