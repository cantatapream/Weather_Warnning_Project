// ============================================================
// 🌊 전국 해상 기상정보 (조회 모드)
// ============================================================

// 해구도 이미지 정보
const IMAGE_MAP = {
    width: 2225,
    height: 2659
};

// 📍 격자선 데이터 (사용자 보정 완료)
const GRID_DATA = {
    "lon": {
        "100": { "val": -9.547728685385032, "start": 0, "end": 2659 },
        "101": { "val": 72.46073477724069, "start": 0, "end": 2659 },
        "102": { "val": 122.1731514632554, "start": 0, "end": 2659 },
        "103": { "val": 171.4667947646622, "start": 0, "end": 2659 },
        "104": { "val": 221.14735834316016, "start": 0, "end": 2659 },
        "105": { "val": 270.36361758914876, "start": 0, "end": 2659 },
        "106": { "val": 370.4212012449087, "start": 0, "end": 2659 },
        "107": { "val": 320.5084855001561, "start": 0, "end": 2659 },
        "108": { "val": 419.9469967125702, "start": 0, "end": 2659 },
        "109": { "val": 469.8597124573228, "start": 0, "end": 2659 },
        "110": { "val": 519.3855079249843, "start": 0, "end": 2659 },
        "111": { "val": 569.1434555589004, "start": 0, "end": 2659 },
        "112": { "val": 618.5144829157255, "start": 0, "end": 2659 },
        "113": { "val": 916.9847846638042, "start": 0, "end": 2659 },
        "114": { "val": 668.5819667713146, "start": 0, "end": 2659 },
        "115": { "val": 718.3399144052307, "start": 0, "end": 2659 },
        "116": { "val": 767.9430939283104, "start": 0, "end": 2659 },
        "117": { "val": 966.6653482423022, "start": 0, "end": 2659 },
        "118": { "val": 817.3469387755102, "start": 0, "end": 2659 },
        "119": { "val": 867.4589891961427, "start": 0, "end": 2659 },
        "120": { "val": 1016.4232958762184, "start": 0, "end": 2659 },
        "121": { "val": 1115.707038977796, "start": 0, "end": 2659 },
        "122": { "val": 1165.4649866117122, "start": 0, "end": 2659 },
        "123": { "val": 1066.336011620971, "start": 0, "end": 2659 },
        "124": { "val": 1215.6872385781378, "start": 0, "end": 2659 },
        "125": { "val": 1264.9034978241264, "start": 0, "end": 2659 },
        "126": { "val": 1414.0225726150386, "start": 0, "end": 2659 },
        "127": { "val": 1960.5087719785158, "start": 0, "end": 2659 },
        "128": { "val": 1662.657542673783, "start": 0, "end": 2659 },
        "129": { "val": 1314.6614454580426, "start": 0, "end": 2659 },
        "130": { "val": 1364.4193930919587, "start": 0, "end": 2659 },
        "131": { "val": 1463.7031361935365, "start": 0, "end": 2659 },
        "132": { "val": 1513.6932359937073, "start": 0, "end": 2659 },
        "133": { "val": 1563.1416474059506, "start": 0, "end": 2659 },
        "134": { "val": 1612.5126747627755, "start": 0, "end": 2659 },
        "135": { "val": 1761.9412857753605, "start": 0, "end": 2659 },
        "137": { "val": 1712.415490307699, "start": 0, "end": 2659 },
        "138": { "val": 1910.9055924554361, "start": 0, "end": 2659 },
        "139": { "val": 1811.467081243022, "start": 0, "end": 2659 },
        "140": { "val": 2010.8084080003596, "start": 0, "end": 2659 },
        "141": { "val": 1861.734693877551, "start": 0, "end": 2659 },
        "142": { "val": 2059.9472831909297, "start": 0, "end": 2659 },
        "144": { "val": 2159.1650070935657, "start": 0, "end": 2659 },
        "145": { "val": 2109.874264063025, "start": 0, "end": 2659 },
        "149": { "val": 2225, "start": 0, "end": 2659 }
    },
    "lat": {
        "22": { "val": 2567.9622740056197, "start": 0, "end": 2225 },
        "24": { "val": 2514.2719746972, "start": 0, "end": 2225 },
        "26": { "val": 2349.675956110277, "start": 0, "end": 2225 },
        "27": { "val": 2404.7220710577985, "start": 0, "end": 2225 },
        "28": { "val": 2238.770236831774, "start": 0, "end": 2225 },
        "29": { "val": 2459.7681860053194, "start": 0, "end": 2225 },
        "30": { "val": 2127.0510281698103, "start": 0, "end": 2225 },
        "32": { "val": 2013.4336776131042, "start": 0, "end": 2225 },
        "33": { "val": 1957.0317470264815, "start": 0, "end": 2225 },
        "34": { "val": 1899.2857142857142, "start": 0, "end": 2225 },
        "35": { "val": 2294.358678034936, "start": 0, "end": 2225 },
        "36": { "val": 2070.3779344553673, "start": 0, "end": 2225 },
        "37": { "val": 1784.8431608605904, "start": 0, "end": 2225 },
        "38": { "val": 1842.058580830674, "start": 0, "end": 2225 },
        "39": { "val": 2182.9106325007924, "start": 0, "end": 2225 },
        "40": { "val": 1726.000762123585, "start": 0, "end": 2225 },
        "42": { "val": 1667.7006896422204, "start": 0, "end": 2225 },
        "43": { "val": 1549.7447290403893, "start": 0, "end": 2225 },
        "44": { "val": 1490.3600040477434, "start": 0, "end": 2225 },
        "45": { "val": 1430.7041159272771, "start": 0, "end": 2225 },
        "46": { "val": 1248.1020408163265, "start": 0, "end": 2225 },
        "47": { "val": 1608.32526072036, "start": 0, "end": 2225 },
        "48": { "val": 1309.2230346637823, "start": 0, "end": 2225 },
        "49": { "val": 1370.5059015511704, "start": 0, "end": 2225 },
        "50": { "val": 1063.1510527531655, "start": 0, "end": 2225 },
        "51": { "val": 1187.621312290717, "start": 0, "end": 2225 },
        "52": { "val": 1000.5064813411741, "start": 0, "end": 2225 },
        "55": { "val": 874.39845523076, "start": 0, "end": 2225 },
        "56": { "val": 937.6571891075748, "start": 0, "end": 2225 },
        "57": { "val": 1125.3861825219412, "start": 0, "end": 2225 },
        "58": { "val": 680.8657442382844, "start": 0, "end": 2225 },
        "59": { "val": 549.5332427604387, "start": 0, "end": 2225 },
        "60": { "val": 615.6472179362179, "start": 0, "end": 2225 },
        "61": { "val": 745.3380631455904, "start": 0, "end": 2225 },
        "62": { "val": 483.2700261057076, "start": 0, "end": 2225 },
        "63": { "val": 810.5255588891216, "start": 0, "end": 2225 },
        "64": { "val": 349.2596474606548, "start": 0, "end": 2225 },
        "65": { "val": 416.7083264930722, "start": 0, "end": 2225 },
        "66": { "val": 212.69459465336823, "start": 0, "end": 2225 },
        "67": { "val": 143.52213856754454, "start": 0, "end": 2225 },
        "68": { "val": 281.44282701003226, "start": 0, "end": 2225 },
        "69": { "val": 73.70721384934478, "start": -3.1442060295868974, "end": 2225 }
    }
};

// 📍 격자선 데이터 (사용자 보정 완료) - GRID_DATA는 파일 상단에 이미 정의됨


// ...

let mapContainer, canvas, mapImage;
// [New] 소해구 관련 변수
let smallGridCanvas, smallGridCtx;
const MIN_SMALL_GRID_SCALE = 2.5; // 소해구 표시 시작 배율

let scale = 1, translateX = 0, translateY = 0;
let isDraggingMap = false, startDragX, startDragY;

// 📱 모바일 터치 관련 변수
let isTouching = false;
let touchStartX = 0, touchStartY = 0;
let touchStartTime = 0;
let lastTouchDistance = 0;
let isPinching = false;
let hasMoved = false;  // 드래그 여부 판단
const TAP_THRESHOLD = 15;  // 탭으로 인정할 최대 이동 거리 (px)
const TAP_TIME_THRESHOLD = 300;  // 탭으로 인정할 최대 시간 (ms)

// 🎯 선택 상태 관리 (1차: 선택, 2차: 조회)
let selectedZoneKey = null; // 현재 선택된 격자 키 (대해구)
let selectedSmallZoneKey = null; // 현재 선택된 소해구 ID (예: "123-5")
let ctx = null; // 캔버스 컨텍스트

function initSeaZoneMap() {
    // index.html의 실제 ID는 'sea-zone-map' 임
    mapContainer = document.getElementById('sea-zone-map');
    if (!mapContainer) {
        console.error("Map container 'sea-zone-map' not found!");
        return;
    }

    mapContainer.style.background = '#101010';
    mapContainer.style.overflow = 'hidden';
    mapContainer.style.position = 'relative'; // 중요: 래퍼 위치 기준
    mapContainer.innerHTML = '';

    // 래퍼
    const wrapper = document.createElement('div');
    wrapper.id = 'map-wrapper';
    wrapper.style.cssText = 'width:100%; height:100%; position:absolute; transform-origin:0 0;';
    mapContainer.appendChild(wrapper);

    // 이미지
    mapImage = new Image();
    mapImage.src = 'images/haegudo.gif';
    mapImage.style.cssText = 'position:absolute; left:0; top:0; pointer-events:none; z-index:1;';
    wrapper.appendChild(mapImage);

    // 캔버스 (클릭 감지용 - 투명)
    canvas = document.createElement('canvas');
    canvas.id = 'calibration-canvas';
    canvas.style.cssText = 'position:absolute; left:0; top:0; z-index:10; cursor:pointer; touch-action:none;';
    wrapper.appendChild(canvas);

    // [New] 소해구 그리드용 캔버스 (클릭 감지 캔버스 아래, 이미지 위)
    smallGridCanvas = document.createElement('canvas');
    smallGridCanvas.id = 'small-grid-canvas';
    smallGridCanvas.style.cssText = 'position:absolute; left:0; top:0; z-index:5; pointer-events:none;';
    wrapper.appendChild(smallGridCanvas);

    mapImage.onload = function () {
        console.log('이미지 로드 완료:', mapImage.naturalWidth, 'x', mapImage.naturalHeight);
        canvas.width = mapImage.naturalWidth;
        canvas.height = mapImage.naturalHeight;

        // 소해구 캔버스 크기 동기화
        smallGridCanvas.width = mapImage.naturalWidth;
        smallGridCanvas.height = mapImage.naturalHeight;

        ctx = canvas.getContext('2d'); // 컨텍스트 획득
        smallGridCtx = smallGridCanvas.getContext('2d'); // 소해구 컨텍스트

        resetViewAndCenter();
    };

    mapImage.onerror = function () {
        console.error("이미지 로드 실패: images/haegudo.gif");
        mapContainer.innerHTML = '<div style="color:white; text-align:center; padding-top:20px;">지도 이미지를 찾을 수 없습니다.<br>(images/haegudo.gif)</div>';
    };

    // 🖱️ 마우스 이벤트 바인딩 (PC)
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mapContainer.addEventListener('wheel', onWheel, { passive: false });

    // 📱 터치 이벤트 바인딩 (모바일)
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
}

// ------------------------------------------------------------
// 외부 컨트롤 (index.html 버튼 연결)
// ------------------------------------------------------------
window.zoomMap = function (factor) {
    if (!mapContainer) return;
    const rect = mapContainer.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 화면 중심 기준 줌
    const newScale = scale * factor;
    // 줌 제한 (0.1 ~ 20.0) - 소해구 보기를 위해 확대 제한 해제
    if (newScale < 0.1 || newScale > 20.0) return;

    // 중심 유지 공식
    translateX -= (centerX - translateX) * (factor - 1);
    translateY -= (centerY - translateY) * (factor - 1);

    scale = newScale;
    applyTransform();
};

window.resetMap = function () {
    resetViewAndCenter();
};



// 뷰 리셋
function resetViewAndCenter() {
    if (!mapImage || !mapContainer) return;

    scale = getFitScale(); // 화면에 꽉 차는 배율 계산

    // 중앙 정렬
    translateX = (mapContainer.clientWidth - mapImage.naturalWidth * scale) / 2;
    translateY = (mapContainer.clientHeight - mapImage.naturalHeight * scale) / 2;
    applyTransform();
}

// 화면에 딱 맞는 배율 계산 (초기 상태 기준)
function getFitScale() {
    if (!mapContainer || !mapImage) return 0.1;
    const scaleX = mapContainer.clientWidth / mapImage.naturalWidth;
    const scaleY = mapContainer.clientHeight / mapImage.naturalHeight;
    // 초기 로딩 시와 동일하게 0.95 여백 적용 (사용자가 말한 '처음 상태')
    return Math.min(scaleX, scaleY) * 0.95;
}

function applyTransform() {
    // 경계 제한 적용
    clampTranslation();

    const wrapper = document.getElementById('map-wrapper');
    if (wrapper) wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// 📍 경계 제한: 지도가 컨테이너 바깥으로 나가지 않도록
function clampTranslation() {
    if (!mapContainer || !mapImage) return;

    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;
    const imgWidth = mapImage.naturalWidth * scale;
    const imgHeight = mapImage.naturalHeight * scale;

    // 이미지가 컨테이너보다 작은 경우: 중앙 정렬
    // 이미지가 컨테이너보다 큰 경우: 가장자리가 컨테이너 안에 유지되도록

    if (imgWidth <= containerWidth) {
        // 이미지가 컨테이너보다 작으면 중앙 정렬
        translateX = (containerWidth - imgWidth) / 2;
    } else {
        // 이미지가 컨테이너보다 크면 경계 제한
        const minX = containerWidth - imgWidth;  // 오른쪽 끝
        const maxX = 0;  // 왼쪽 끝
        translateX = Math.max(minX, Math.min(maxX, translateX));
    }

    if (imgHeight <= containerHeight) {
        // 이미지가 컨테이너보다 작으면 중앙 정렬
        translateY = (containerHeight - imgHeight) / 2;
    } else {
        // 이미지가 컨테이너보다 크면 경계 제한
        const minY = containerHeight - imgHeight;  // 아래쪽 끝
        const maxY = 0;  // 위쪽 끝
        translateY = Math.max(minY, Math.min(maxY, translateY));
    }
}

// 마우스 이벤트: 클릭 시 해역 정보 조회
function onMouseDown(e) {
    // 캔버스 기준으로 좌표 변환
    const rect = mapContainer.getBoundingClientRect();
    const imgX = (e.clientX - rect.left - translateX) / scale;
    const imgY = (e.clientY - rect.top - translateY) / scale;

    const cellKey = findCellAtPosition(imgX, imgY);

    if (cellKey) {
        // 유효한 해역인지 확인
        const zoneNum = SEA_ZONES_DATA[cellKey];
        if (!zoneNum || zoneNum === "0") {
            // 유효하지 않은 해역 클릭 시 선택 해제
            console.log("유효하지 않은 해역");
            clearHighlight();
            return;
        }

        // 🎯 2단계 클릭 로직

        // [New] 소해구 모드인지 확인
        if (scale >= MIN_SMALL_GRID_SCALE) {
            const smallZoneId = getSmallZoneId(imgX, imgY, cellKey, zoneNum);
            // 유효하지 않은 소해구 체크
            if (typeof INVALID_SMALL_ZONES !== 'undefined' && INVALID_SMALL_ZONES.includes(smallZoneId)) {
                console.log(`유효하지 않은 소해구 클릭 무시: ${smallZoneId}`);
                selectedSmallZoneKey = null;
                renderSmallGrids(); // Redraw to clear highlight
                return;
            }

            console.log(`소해구 클릭: ${smallZoneId}`);

            // [New] 2-Step Selection for Small Zone
            if (selectedSmallZoneKey === smallZoneId) {
                // Step 2: Open Info
                if (typeof getMarineZoneData === 'function') {
                    // [New] Cancel Loading check is in app.js UI logic usually.
                    // Ideally we ensure any previous token is cancelled.
                    // But for now, just call it.
                    getMarineZoneData(smallZoneId);
                } else {
                    alert(`소해구번호: ${smallZoneId}`);
                }
            } else {
                // Step 1: Select & Highlight
                selectedSmallZoneKey = smallZoneId;
                renderSmallGrids(); // Trigger redraw to show highlight
                showClickHintMessage();
            }
            return;
        }

        if (selectedZoneKey === cellKey) {
            // Step 2: 이미 선택된 구역을 다시 클릭 -> 정보 조회
            if (typeof getMarineZoneData === 'function') {
                getMarineZoneData(zoneNum);
            } else {
                alert(`해역번호: ${zoneNum} (API 연결 안됨)`);
            }
            // 조회 후 선택 상태 유지할지 해제할지 결정 (일단 유지)
        } else {
            // Step 1: 새로운 구역 클릭 -> 테두리 표시 (Highlight)
            selectedZoneKey = cellKey;
            drawZoneHighlight(cellKey);
            console.log(`구역 선택됨: ${zoneNum} (${cellKey})`);

            // 📢 안내 메시지 표시
            showClickHintMessage();
        }
    } else {
        // 해역이 아니면 선택 해제 및 드래그 시작
        clearHighlight();

        isDraggingMap = true;
        startDragX = e.clientX - translateX;
        startDragY = e.clientY - translateY;

        // 빈 공간 드래그 시작 시에는 선택 해제 하지 않음 (실수 방지)
    }
}

// 📢 구역 클릭 안내 메시지 표시
function showClickHintMessage() {
    // 상단 안내 바 텍스트만 변경 (토스트 팝업 삭제됨)
    updateGuideMessage('한번 더 클릭하면 기상정보를 제공합니다.');
}


function onMouseMove(e) {
    if (isDraggingMap) {
        translateX = e.clientX - startDragX;
        translateY = e.clientY - startDragY;
        applyTransform();
    }
}

function onMouseUp() {
    isDraggingMap = false;
}

function onWheel(e) {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;
    const newScale = scale * (1 + delta);

    // 줌 제한
    if (newScale > 0.1 && newScale < 20.0) {
        const rect = mapContainer.getBoundingClientRect();
        // 마우스 포인터 기준 줌
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 줌 중심점 보정 공식
        translateX -= (mouseX - translateX) * delta;
        translateY -= (mouseY - translateY) * delta;

        scale = newScale;
        applyTransform();
    }
}

// 특정 위치의 셀 찾기
function findCellAtPosition(imgX, imgY) {
    if (typeof GRID_DATA === 'undefined') return null;

    const lonKeys = Object.keys(GRID_DATA.lon).sort((a, b) => GRID_DATA.lon[a].val - GRID_DATA.lon[b].val);
    const latKeys = Object.keys(GRID_DATA.lat).sort((a, b) => GRID_DATA.lat[a].val - GRID_DATA.lat[b].val);

    for (let latIdx = 0; latIdx < latKeys.length - 1; latIdx++) {
        for (let lonIdx = 0; lonIdx < lonKeys.length - 1; lonIdx++) {
            const lonStart = lonKeys[lonIdx];
            const lonEnd = lonKeys[lonIdx + 1];
            const latStart = latKeys[latIdx];
            const latEnd = latKeys[latIdx + 1];

            const x1 = GRID_DATA.lon[lonStart].val;
            const x2 = GRID_DATA.lon[lonEnd].val;
            const y1 = GRID_DATA.lat[latStart].val;
            const y2 = GRID_DATA.lat[latEnd].val;

            if (imgX >= x1 && imgX <= x2 && imgY >= y1 && imgY <= y2) {
                return `${lonStart}-${lonEnd}_${latStart}-${latEnd}`;
            }
        }
    }
    return null;
}

// 🖊️ 선택된 구역 테두리 그리기
function drawZoneHighlight(key) {
    if (!ctx || !key) return;

    // 1. 기존 그림 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 키 파싱 (예: "100-101_43-47")
    const [lonPart, latPart] = key.split('_');
    const [lonStart, lonEnd] = lonPart.split('-');
    const [latStart, latEnd] = latPart.split('-');

    // 3. 좌표 데이터 조회
    const x1 = GRID_DATA.lon[lonStart].val;
    const x2 = GRID_DATA.lon[lonEnd].val;
    const y1 = GRID_DATA.lat[latStart].val;
    const y2 = GRID_DATA.lat[latEnd].val;

    const width = x2 - x1;
    const height = y2 - y1;

    // 4. 테두리 그리기 (점선, 반 두께)
    ctx.beginPath();
    ctx.lineWidth = 5; // 더 얇게
    ctx.strokeStyle = '#FF3333'; // 밝은 빨간색
    ctx.setLineDash([10, 6]); // 점선 패턴
    ctx.shadowBlur = 8; // 블러도 줄임
    ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
    ctx.lineJoin = 'round'; // 모서리 둥글게
    ctx.rect(x1, y1, width, height);
    ctx.stroke();
    ctx.setLineDash([]); // 점선 패턴 초기화

    // 내부 살짝 채우기 (선택 느낌 강화)
    ctx.fillStyle = 'rgba(255, 51, 51, 0.15)';
    ctx.fill();

    // 5. 해구 번호 그리기
    const zoneNum = SEA_ZONES_DATA[key];
    if (zoneNum && zoneNum !== "0") {
        const centerX = x1 + width / 2;
        const centerY = y1 + height / 2;

        // 폰트 크기 동적 계산 (사각형 안에 꽉 차도록)
        // 높이의 50% 또는 너비/글자수 의 90% 중 작은 값 선택
        const textLen = String(zoneNum).length;
        const fontSize = Math.floor(Math.min(height * 0.5, width / (textLen * 0.7)));

        ctx.font = `bold ${fontSize}px "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 가독성을 위한 흰색 외곽선
        ctx.lineWidth = fontSize * 0.15;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeText(zoneNum, centerX, centerY);

        // 검정색 글씨 (요청사항: 검정색 숫자)
        ctx.fillStyle = '#000000';
        ctx.fillText(zoneNum, centerX, centerY);
    }
}

function clearHighlight() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    selectedZoneKey = null;
    selectedSmallZoneKey = null; // 소해구 선택도 해제

    // [New] 안내 메시지 초기화
    resetGuideMessage();
}

// [New] 상단 안내 메시지 업데이트
function updateGuideMessage(text) {
    const guideTextEl = document.getElementById('sea-zone-guide-text');
    if (guideTextEl) {
        guideTextEl.textContent = text;
    }
}

// [New] 상단 안내 메시지 초기화
function resetGuideMessage() {
    updateGuideMessage('기상을 확인할 해구를 선택해주세요');
}

// 함수를 전역에 노출 (탭 클릭 시 호출용)
window.initSeaZoneMap = initSeaZoneMap;

// ============================================================
// 📱 모바일 터치 이벤트 핸들러
// ============================================================

// 두 터치 포인트 간 거리 계산 (핀치 줌용)
function getTouchDistance(touches) {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// 두 터치 포인트의 중심 좌표 (핀치 줌 중심점)
function getTouchCenter(touches) {
    if (touches.length < 2) {
        return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
    };
}

// 터치 시작
function onTouchStart(e) {
    e.preventDefault();
    e.stopPropagation();

    const touches = e.touches;
    touchStartTime = Date.now();
    hasMoved = false;

    if (touches.length === 1) {
        // 📍 한 손가락: 드래그 또는 탭 준비
        isTouching = true;
        isPinching = false;
        touchStartX = touches[0].clientX;
        touchStartY = touches[0].clientY;
        startDragX = touches[0].clientX - translateX;
        startDragY = touches[0].clientY - translateY;
        lastTouchDistance = 0;
    } else if (touches.length >= 2) {
        // 🔍 두 손가락: 핀치 줌 시작
        isPinching = true;
        isTouching = false;
        hasMoved = true;  // 핀치는 탭이 아님
        lastTouchDistance = getTouchDistance(touches);
        console.log('📱 핀치 시작, 거리:', lastTouchDistance);
    }
}

// 터치 이동
function onTouchMove(e) {
    e.preventDefault();
    e.stopPropagation();

    const touches = e.touches;

    // 🔍 두 손가락 이상: 핀치 줌 처리
    if (touches.length >= 2) {
        // 한 손가락에서 두 손가락으로 전환된 경우
        if (!isPinching) {
            isPinching = true;
            isTouching = false;
            lastTouchDistance = getTouchDistance(touches);
            hasMoved = true;
            console.log('📱 핀치로 전환, 거리:', lastTouchDistance);
            return;
        }

        const currentDistance = getTouchDistance(touches);

        if (lastTouchDistance > 0 && currentDistance > 0) {
            const scaleFactor = currentDistance / lastTouchDistance;

            // 급격한 변화 방지 (0.8 ~ 1.2 범위로 제한)
            const clampedFactor = Math.max(0.9, Math.min(1.1, scaleFactor));
            const newScale = scale * clampedFactor;

            // 🛑 최소/최대 스케일 제한
            const minScale = getFitScale();
            const maxScale = 20.0;

            // 스케일 클램핑 (범위를 벗어나지 않도록 강제)
            let finalScale = Math.max(minScale, Math.min(maxScale, newScale));

            // 실제 적용된 배율 변화 계산
            const effectiveFactor = finalScale / scale;

            // 변화가 있을 때만 적용 (부드러운 제한)
            if (effectiveFactor !== 1) {
                // 핀치 중심점 기준으로 줌
                const rect = mapContainer.getBoundingClientRect();
                const center = getTouchCenter(touches);
                const centerX = center.x - rect.left;
                const centerY = center.y - rect.top;

                // 줌 중심점 보정 (실제 적용된 변동폭만큼만 이동)
                translateX -= (centerX - translateX) * (effectiveFactor - 1);
                translateY -= (centerY - translateY) * (effectiveFactor - 1);

                scale = finalScale;
                applyTransform();
            }
        }
        lastTouchDistance = currentDistance;
        hasMoved = true;

    } else if (isTouching && touches.length === 1 && !isPinching) {
        // 📍 한 손가락 드래그 (핀치 중이 아닐 때만)
        const dx = Math.abs(touches[0].clientX - touchStartX);
        const dy = Math.abs(touches[0].clientY - touchStartY);

        // 일정 거리 이상 이동하면 드래그로 인식
        if (dx > TAP_THRESHOLD || dy > TAP_THRESHOLD) {
            hasMoved = true;
        }

        if (hasMoved) {
            translateX = touches[0].clientX - startDragX;
            translateY = touches[0].clientY - startDragY;
            applyTransform();
        }
    }
}

// 터치 종료
function onTouchEnd(e) {
    e.preventDefault();

    const touchDuration = Date.now() - touchStartTime;

    // 📍 탭 판정: 이동하지 않았고, 짧은 시간 안에 손을 뗐을 때
    if (isTouching && !hasMoved && !isPinching && touchDuration < TAP_TIME_THRESHOLD) {
        // 탭 위치에서 해구 정보 조회
        const rect = mapContainer.getBoundingClientRect();
        const imgX = (touchStartX - rect.left - translateX) / scale;
        const imgY = (touchStartY - rect.top - translateY) / scale;

        const cellKey = findCellAtPosition(imgX, imgY);

        if (cellKey) {
            const zoneNum = SEA_ZONES_DATA[cellKey];

            if (!zoneNum || zoneNum === "0") {
                clearHighlight();
                return;
            }

            // [New] 소해구 모드인지 확인
            if (scale >= MIN_SMALL_GRID_SCALE) {
                const smallZoneId = getSmallZoneId(imgX, imgY, cellKey, zoneNum);
                // 유효하지 않은 소해구 체크
                if (typeof INVALID_SMALL_ZONES !== 'undefined' && INVALID_SMALL_ZONES.includes(smallZoneId)) {
                    console.log(`유효하지 않은 소해구 탭 무시: ${smallZoneId}`);
                    selectedSmallZoneKey = null;
                    renderSmallGrids(); // Redraw to clear highlight
                    return;
                }

                console.log(`소해구 탭: ${smallZoneId}`);

                // [New] 2-Step Selection for Small Zone (Mobile)
                if (selectedSmallZoneKey === smallZoneId) {
                    // Step 2: Open Info
                    if (typeof getMarineZoneData === 'function') {
                        getMarineZoneData(smallZoneId);
                    } else {
                        alert(`소해구번호: ${smallZoneId}`);
                    }
                } else {
                    // Step 1: Select & Highlight
                    selectedSmallZoneKey = smallZoneId;
                    renderSmallGrids(); // Trigger redraw to show highlight
                    showClickHintMessage();
                }
                return;
            }

            // 🎯 2단계 탭 로직 (PC와 동일)
            if (selectedZoneKey === cellKey) {
                // 이미 선택된 곳 탭 -> 조회
                if (typeof getMarineZoneData === 'function') {
                    getMarineZoneData(zoneNum);
                } else {
                    alert(`해역번호: ${zoneNum}`);
                }
            } else {
                // 새로운 곳 탭 -> 선택 & 테두리
                selectedZoneKey = cellKey;
                drawZoneHighlight(cellKey);

                // 📢 안내 메시지 표시 (모바일)
                showClickHintMessage();
            }
        } else {
            // 빈 공간 탭 -> 선택 해제
            clearHighlight();
        }
    }

    // 상태 초기화
    isTouching = false;
    isPinching = false;
    hasMoved = false;
    lastTouchDistance = 0;
}

// ============================================================
// 🗺️ 특보구역 오버레이 표시 기능 (Path 기반 벡터 렌더링)
// ============================================================

let currentOverlayZone = null; // 현재 오버레이 구역명
let overlayCanvas = null; // 오버레이용 캔버스
let glowAnimationId = null;
let overlayFadeoutTimeoutId = null; // 페이드아웃 타이머 ID
let overlayFadeIntervalId = null; // 페이드 인터벌 ID

/**
 * 특보구역 경계선을 지도 위에 표시하고 해당 구역으로 확대/이동
 * @param {string} zoneName - 특보구역 이름 (예: "제주도북부앞바다")
 */
window.showZoneOverlay = function (zoneName) {
    // 1. 해구별 기상 탭으로 전환
    const seaZoneTab = document.querySelector('[data-target="sea-zone-section"]');
    if (seaZoneTab) {
        seaZoneTab.click();
    }

    // 잠시 후 지도 초기화 확인 후 실행
    setTimeout(() => {
        if (!mapContainer || !mapImage || !mapImage.complete) {
            console.log('지도 초기화 중...');
            if (!mapContainer) {
                initSeaZoneMap();
            }
            // 지도 로드 완료까지 재시도
            let retryCount = 0;
            const retryInterval = setInterval(() => {
                retryCount++;
                if (mapImage && mapImage.complete && mapContainer) {
                    clearInterval(retryInterval);
                    applyZoneOverlay(zoneName);
                } else if (retryCount > 20) {
                    clearInterval(retryInterval);
                    console.error('지도 로드 시간 초과');
                }
            }, 100);
            return;
        }
        applyZoneOverlay(zoneName);
    }, 200);
};

function applyZoneOverlay(zoneName) {
    // 설정 확인
    if (typeof ZONE_OVERLAY_CONFIG === 'undefined') {
        console.error('ZONE_OVERLAY_CONFIG not found');
        alert('오버레이 설정 파일(zoneOverlayConfig.js)을 찾을 수 없습니다.');
        return;
    }

    const config = ZONE_OVERLAY_CONFIG[zoneName];
    if (!config) {
        console.warn(`오버레이 설정 없음: ${zoneName}`);
        alert(`"${zoneName}"에 대한 경계선 데이터가 아직 없습니다.`);
        return;
    }

    console.log(`🗺️ 오버레이 표시: ${zoneName}`, config);

    // 2. 기존 오버레이 제거 (먼저 제거 후 설정)
    removeZoneOverlay();
    currentOverlayZone = zoneName;

    const wrapper = document.getElementById('map-wrapper');
    if (!wrapper) return;

    // 3. Path 기반 렌더링 (좌표 배열 사용)
    if (config.paths && config.paths.length > 0) {
        renderPathOverlay(config, wrapper, zoneName);
    }
    // 하위 호환: 이전 PNG 기반 (image 속성이 있는 경우)
    else if (config.image) {
        renderImageOverlay(config, wrapper);
    }
    else {
        console.warn('경로 데이터(paths)나 이미지(image)가 없습니다.');
        alert('경계선 데이터가 올바르지 않습니다.');
        return;
    }

    // 4. 해당 구역 중심으로 확대 및 이동
    zoomToZoneCenter(config);
}

/**
 * Path 좌표 배열을 사용하여 깔끔한 벡터 선 렌더링
 * @param {Object} config - 구역 설정
 * @param {HTMLElement} wrapper - 맵 래퍼 요소
 * @param {string} zoneName - 해역 이름
 */
function renderPathOverlay(config, wrapper, zoneName) {
    // 전체 지도 크기의 캔버스 생성 (경로가 어디에 있든 그릴 수 있도록)
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'zone-overlay-canvas';
    overlayCanvas.width = mapImage.naturalWidth;
    overlayCanvas.height = mapImage.naturalHeight;
    overlayCanvas.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: ${mapImage.naturalWidth}px;
        height: ${mapImage.naturalHeight}px;
        pointer-events: none;
        z-index: 5;
    `;

    const ctx = overlayCanvas.getContext('2d');

    // 각 경로(열린 폴리라인) 그리기 - 점선 스타일
    config.paths.forEach(path => {
        if (!path || path.length < 2) return;

        // 1. 외곽 Glow (가장 바깥 - 넓고 흐린)
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 100, 180, 0.25)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([4, 4]); // 점선 패턴
        ctx.shadowColor = 'rgba(30, 120, 200, 0.3)';
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // 2. 중간 Glow
        ctx.save();
        ctx.strokeStyle = 'rgba(50, 130, 220, 0.5)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([3, 3]); // 점선 패턴
        ctx.shadowColor = 'rgba(60, 150, 230, 0.4)';
        ctx.shadowBlur = 3;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // 3. 메인 라인 (가장 선명) - 짙은 파란색 점선
        ctx.save();
        ctx.strokeStyle = 'rgba(70, 160, 255, 1)';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([2, 2]); // 점선 패턴
        ctx.shadowColor = 'rgba(100, 180, 255, 0.5)';
        ctx.shadowBlur = 2;

        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
        }
        ctx.stroke();
        ctx.restore();
    });

    wrapper.appendChild(overlayCanvas);
    console.log('✅ Path 기반 벡터 오버레이 완료 (점선, 깜빡임, 10초 후 사라짐)');

    // 깜빡임 애니메이션 시작
    startGlowAnimation();

    // 해역 이름 표시 (5초간 깜빡임)
    showZoneNameLabel(zoneName, config, wrapper);

    // 이전 타이머 취소 (중복 호출 시 조기 제거 방지)
    if (overlayFadeoutTimeoutId) {
        clearTimeout(overlayFadeoutTimeoutId);
        overlayFadeoutTimeoutId = null;
    }
    if (overlayFadeIntervalId) {
        clearInterval(overlayFadeIntervalId);
        overlayFadeIntervalId = null;
    }

    // 10초 후 페이드아웃 시작 (기존 5초에서 연장)
    overlayFadeoutTimeoutId = setTimeout(() => {
        stopGlowAnimation();
        fadeOutOverlay();
    }, 10000);
}

// 페이드아웃 애니메이션
function fadeOutOverlay() {
    if (!overlayCanvas) return;

    let opacity = 1;
    overlayFadeIntervalId = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
            clearInterval(overlayFadeIntervalId);
            overlayFadeIntervalId = null;
            removeZoneOverlay();
        } else if (overlayCanvas) {
            overlayCanvas.style.opacity = opacity;
        }
    }, 30);
}

/**
 * 하위 호환용: PNG 이미지 기반 렌더링
 */
function renderImageOverlay(config, wrapper) {
    const img = new Image();
    img.src = config.image;
    img.id = 'zone-overlay-img';
    img.style.cssText = `
        position: absolute;
        left: ${config.x}px;
        top: ${config.y}px;
        width: ${config.width}px;
        height: ${config.height}px;
        pointer-events: none;
        z-index: 5;
        filter: hue-rotate(200deg) saturate(2) brightness(1.3) blur(0.5px)
            drop-shadow(0 0 5px rgba(0, 180, 255, 0.9))
            drop-shadow(0 0 10px rgba(0, 200, 255, 0.6));
    `;

    img.onload = () => {
        wrapper.appendChild(img);
        console.log('✅ 이미지 오버레이 완료 (하위 호환)');
    };

    img.onerror = () => {
        console.error('이미지 로드 실패:', config.image);
    };
}

// Glow 애니메이션
let zoneNameAnimationId = null;

/**
 * 해역 설정에 따른 target scale 계산 (줄 애니메이션 전 미리 계산용)
 */
function calculateTargetScale(config) {
    if (!mapContainer) return 1;

    const containerW = mapContainer.clientWidth;
    const containerH = mapContainer.clientHeight;

    let viewWidth = 300, viewHeight = 300;

    if (config.paths && config.paths.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        config.paths.forEach(path => {
            path.forEach(pt => {
                minX = Math.min(minX, pt.x);
                maxX = Math.max(maxX, pt.x);
                minY = Math.min(minY, pt.y);
                maxY = Math.max(maxY, pt.y);
            });
        });
        viewWidth = maxX - minX;
        viewHeight = maxY - minY;
    } else if (config.width && config.height) {
        viewWidth = config.width;
        viewHeight = config.height;
    }

    const padding = 2.5;
    const scaleX = containerW / (viewWidth * padding);
    const scaleY = containerH / (viewHeight * padding);

    return Math.max(1.0, Math.min(scaleX, scaleY, 3.0));
}

function startGlowAnimation() {
    if (!overlayCanvas) return;

    let phase = 0;
    const animate = () => {
        if (!overlayCanvas) return;

        phase += 0.08; // 적당한 깜빡임 속도
        const intensity = 0.7 + 0.3 * Math.sin(phase);
        overlayCanvas.style.opacity = intensity;

        glowAnimationId = requestAnimationFrame(animate);
    };
    animate();
}

function stopGlowAnimation() {
    if (glowAnimationId) {
        cancelAnimationFrame(glowAnimationId);
        glowAnimationId = null;
    }
    // 해역 이름 라벨도 제거
    const label = document.getElementById('zone-name-label');
    if (label) label.remove();
    if (zoneNameAnimationId) {
        cancelAnimationFrame(zoneNameAnimationId);
        zoneNameAnimationId = null;
    }
}

/**
 * 해역 이름을 깜빡이는 구역 위에 표시 (5초간)
 */
function showZoneNameLabel(zoneName, config, wrapper) {
    console.log('📝 showZoneNameLabel 호출:', zoneName, config);

    if (!zoneName || !config || !wrapper) {
        console.warn('showZoneNameLabel: 파라미터 부족', { zoneName, config: !!config, wrapper: !!wrapper });
        return;
    }

    // center 좌표 가져오기 (없으면 paths에서 계산)
    let centerX, centerY;
    if (config.center && config.center.x && config.center.y) {
        centerX = config.center.x;
        centerY = config.center.y;
    } else if (config.paths && config.paths.length > 0) {
        // paths에서 바운딩 박스 중심 계산
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        config.paths.forEach(path => {
            path.forEach(pt => {
                minX = Math.min(minX, pt.x);
                maxX = Math.max(maxX, pt.x);
                minY = Math.min(minY, pt.y);
                maxY = Math.max(maxY, pt.y);
            });
        });
        centerX = (minX + maxX) / 2;
        centerY = (minY + maxY) / 2;
        console.log('📍 paths에서 중심 계산:', centerX, centerY);
    } else {
        console.warn('showZoneNameLabel: center 좌표 없음');
        return;
    }

    // 기존 라벨 제거
    const existingLabel = document.getElementById('zone-name-label');
    if (existingLabel) existingLabel.remove();

    // 폰트 크기 계산 (화면의 1/8을 넘지 않도록)
    // 줌 애니메이션 후 표시될 target scale 사용
    const containerWidth = mapContainer ? mapContainer.clientWidth : 800;
    const maxLabelWidth = containerWidth / 8;  // 화면 너비의 1/8

    // 텍스트 길이에 따른 폰트 크기 계산
    const textLength = zoneName.length;
    const charWidthRatio = 1.0;  // 한글 글자당 폰트 크기 대비 너비 비율

    // target scale 계산 (줌 애니메이션 후 적용될 배율)
    const targetScaleValue = calculateTargetScale(config);

    // 최대 폰트 크기: (화면 1/8) / (글자수 * 비율) / targetScale
    let fontSize = Math.floor(maxLabelWidth / (textLength * charWidthRatio) / targetScaleValue);

    // 최소/최대 제한
    fontSize = Math.max(12, Math.min(fontSize, 50));  // 12px ~ 50px

    console.log(`📐 폰트 크기 계산: 화면=${containerWidth}px, 1/8=${maxLabelWidth}px, 텍스트=${textLength}자, targetScale=${targetScaleValue.toFixed(2)}, 결과=${fontSize}px`);

    // 라벨 생성
    const label = document.createElement('div');
    label.id = 'zone-name-label';
    label.textContent = zoneName;
    label.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${centerY}px;
        transform: translate(-50%, -50%);
        font-size: ${fontSize}px;
        font-weight: bold;
        color: #fff;
        text-shadow: 
            0 0 ${Math.ceil(fontSize * 0.3)}px rgba(70, 160, 255, 1),
            0 0 ${Math.ceil(fontSize * 0.6)}px rgba(70, 160, 255, 0.8),
            0 0 ${Math.ceil(fontSize * 0.9)}px rgba(70, 160, 255, 0.6),
            2px 2px 4px rgba(0, 0, 0, 0.8);
        pointer-events: none;
        z-index: 15;
        white-space: nowrap;
    `;
    wrapper.appendChild(label);
    console.log('✅ 해역 이름 라벨 추가됨:', zoneName, 'at', centerX, centerY, `size=${fontSize}px`);

    // 깜빡임 애니메이션 (오버레이와 동일한 속도)
    let phase = 0;
    const animateLabel = () => {
        if (!label || !label.parentNode) return;

        phase += 0.08; // overlayCanvas와 동일한 속도
        const intensity = 0.7 + 0.3 * Math.sin(phase);
        label.style.opacity = intensity;

        zoneNameAnimationId = requestAnimationFrame(animateLabel);
    };
    animateLabel();

    // 5초 후 라벨만 페이드아웃 (오버레이는 10초까지 유지)
    setTimeout(() => {
        if (!label || !label.parentNode) return;

        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.1;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                if (label.parentNode) label.remove();
                if (zoneNameAnimationId) {
                    cancelAnimationFrame(zoneNameAnimationId);
                    zoneNameAnimationId = null;
                }
            } else {
                label.style.opacity = opacity * (0.7 + 0.3 * Math.sin(phase));
            }
        }, 50);
    }, 5000);
}

/**
 * 지정된 구역 중심점으로 부드럽게 확대/이동 (애니메이션)
 */
function zoomToZoneCenter(config) {
    if (!mapContainer) return;

    const containerW = mapContainer.clientWidth;
    const containerH = mapContainer.clientHeight;

    // 중심점 좌표 (이미지 좌표계)
    const centerX = config.center.x;
    const centerY = config.center.y;

    // Path가 있으면 바운딩 박스 계산, 없으면 기존 width/height 사용
    let viewWidth = 300, viewHeight = 300; // 기본값

    if (config.paths && config.paths.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        config.paths.forEach(path => {
            path.forEach(pt => {
                minX = Math.min(minX, pt.x);
                maxX = Math.max(maxX, pt.x);
                minY = Math.min(minY, pt.y);
                maxY = Math.max(maxY, pt.y);
            });
        });
        viewWidth = maxX - minX;
        viewHeight = maxY - minY;
    } else if (config.width && config.height) {
        viewWidth = config.width;
        viewHeight = config.height;
    }

    // 적절한 확대 배율 계산 (구역이 화면의 60% 정도 차지하도록)
    const padding = 2.5;
    const scaleX = containerW / (viewWidth * padding);
    const scaleY = containerH / (viewHeight * padding);

    // 최소 1.0배, 최대 3배로 제한
    const targetScale = Math.max(1.0, Math.min(scaleX, scaleY, 3.0));

    // 📍 목표: 중심점이 화면 정중앙에 오도록
    const targetTranslateX = (containerW / 2) - (centerX * targetScale);
    const targetTranslateY = (containerH / 2) - (centerY * targetScale);

    // 현재 상태 저장
    const startScale = scale;
    const startTranslateX = translateX;
    const startTranslateY = translateY;

    // 애니메이션
    const duration = 1000; // 1초 (부드럽게)
    const startTime = performance.now();

    function animateZoom(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // easeOutCubic 이징 함수 (부드럽게 감속)
        const eased = 1 - Math.pow(1 - progress, 3);

        // 현재 값 계산
        scale = startScale + (targetScale - startScale) * eased;
        translateX = startTranslateX + (targetTranslateX - startTranslateX) * eased;
        translateY = startTranslateY + (targetTranslateY - startTranslateY) * eased;

        applyTransform();

        if (progress < 1) {
            requestAnimationFrame(animateZoom);
        } else {
            console.log(`📍 줌 완료: scale=${scale.toFixed(2)}, 중심점=(${centerX}, ${centerY})`);
        }
    }

    requestAnimationFrame(animateZoom);
}

/**
 * 오버레이 제거
 */
window.removeZoneOverlay = function () {
    // 모든 타이머/인터벌 취소
    if (overlayFadeoutTimeoutId) {
        clearTimeout(overlayFadeoutTimeoutId);
        overlayFadeoutTimeoutId = null;
    }
    if (overlayFadeIntervalId) {
        clearInterval(overlayFadeIntervalId);
        overlayFadeIntervalId = null;
    }

    stopGlowAnimation();

    const existing = document.getElementById('zone-overlay-canvas');
    if (existing) existing.remove();

    const existingImg = document.getElementById('zone-overlay-img');
    if (existingImg) existingImg.remove();

    overlayCanvas = null;
    currentOverlayZone = null;
};

/**
 * 지도 리셋 함수 확장 - 오버레이도 제거
 */
const originalResetMap = window.resetMap;
window.resetMap = function () {
    removeZoneOverlay();
    removeLocationMarker();
    if (originalResetMap) originalResetMap();
    else resetViewAndCenter();
};

// ----------------------------------------------------------------------------
// 내 위치 표시 기능
// ----------------------------------------------------------------------------

let locationMarker = null;

/**
 * 픽셀 좌표로 지도 이동 + 마커 표시
 */
window.zoomToPixelWithMarker = function (pixelX, pixelY) {
    console.log('📍 zoomToPixelWithMarker 호출:', pixelX, pixelY);

    // mapContainer가 아직 없으면 잠시 대기 후 재시도
    if (!mapContainer) {
        mapContainer = document.getElementById('sea-zone-map');
        console.log('📍 mapContainer 재탐색:', mapContainer);
    }

    if (!mapContainer) {
        console.warn('📍 mapContainer를 찾을 수 없음 - 마커만 표시');
        // 컨테이너 없어도 마커는 표시 시도
        setTimeout(() => {
            showLocationMarker(pixelX, pixelY);
        }, 500);
        return;
    }

    // 기존 마커 제거
    removeLocationMarker();

    const containerW = mapContainer.clientWidth;
    const containerH = mapContainer.clientHeight;

    // 목표 스케일 (1.5배 확대)
    const targetScale = 1.5;
    const targetTranslateX = (containerW / 2) - (pixelX * targetScale);
    const targetTranslateY = (containerH / 2) - (pixelY * targetScale);

    // 현재 상태
    const startScale = scale || 1;
    const startTranslateX = translateX || 0;
    const startTranslateY = translateY || 0;

    // 애니메이션
    const duration = 1000;
    const startTime = performance.now();

    function animateZoom(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        scale = startScale + (targetScale - startScale) * eased;
        translateX = startTranslateX + (targetTranslateX - startTranslateX) * eased;
        translateY = startTranslateY + (targetTranslateY - startTranslateY) * eased;

        applyTransform();

        if (progress < 1) {
            requestAnimationFrame(animateZoom);
        } else {
            // 애니메이션 완료 후 마커 표시
            console.log('📍 줌 애니메이션 완료 - 마커 표시');
            showLocationMarker(pixelX, pixelY);
        }
    }

    requestAnimationFrame(animateZoom);
};

/**
 * 내 위치 마커 표시 (남색 + 밝은 블러)
 */
let locationMarkerTimeout = null;

function showLocationMarker(pixelX, pixelY) {
    const container = document.getElementById('sea-zone-map');
    if (!container) {
        console.warn('📍 sea-zone-map 컨테이너 없음');
        return;
    }

    // wrapper는 container 안에 있는 transform이 적용되는 요소
    const wrapper = container.querySelector('div');
    if (!wrapper) {
        console.warn('📍 wrapper 없음');
        return;
    }

    // 기존 타이머 취소
    if (locationMarkerTimeout) {
        clearTimeout(locationMarkerTimeout);
        locationMarkerTimeout = null;
    }

    // 기존 마커 제거
    removeLocationMarker();

    // 마커 생성
    locationMarker = document.createElement('div');
    locationMarker.id = 'location-marker';
    locationMarker.innerHTML = `
        <div class="location-marker-glow"></div>
        <div class="location-marker-dot"></div>
    `;
    locationMarker.style.cssText = `
        position: absolute;
        left: ${pixelX}px;
        top: ${pixelY}px;
        transform: translate(-50%, -50%);
        z-index: 100;
        pointer-events: none;
    `;

    // wrapper에 추가 (transform이 적용되는 요소)
    wrapper.appendChild(locationMarker);
    console.log('📍 마커 추가됨 - 위치:', pixelX, pixelY);

    // 마커 스타일 추가
    if (!document.getElementById('location-marker-style')) {
        const style = document.createElement('style');
        style.id = 'location-marker-style';
        style.textContent = `
            #location-marker {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .location-marker-dot {
                width: 8px;
                height: 8px;
                background: radial-gradient(circle, #1a237e 0%, #3949ab 60%, #7986cb 100%);
                border: 0.6px solid rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                position: relative;
                z-index: 2;
                box-shadow: 0 0 3px rgba(26, 35, 126, 0.5);
            }
            .location-marker-glow {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 24px;
                height: 24px;
                background: radial-gradient(circle, rgba(100, 181, 246, 0.7) 0%, rgba(100, 181, 246, 0.3) 50%, rgba(100, 181, 246, 0) 70%);
                border-radius: 50%;
                animation: locationGlow 2s ease-in-out infinite;
                z-index: 1;
            }
            @keyframes locationGlow {
                0%, 100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0.7;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.4);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 1분(60초) 후 마커 제거
    locationMarkerTimeout = setTimeout(() => {
        removeLocationMarker();
    }, 60000);

    console.log('📍 위치 마커 표시 (1분간 유효)');
}

/**
 * 위치 마커 제거
 */
function removeLocationMarker() {
    if (locationMarkerTimeout) {
        clearTimeout(locationMarkerTimeout);
        locationMarkerTimeout = null;
    }
    if (locationMarker) {
        locationMarker.remove();
        locationMarker = null;
    }
    const existing = document.getElementById('location-marker');
    if (existing) existing.remove();
}

// ============================================================
// 🔴 부이(BUOY) 표시 기능
// ============================================================

// 부이 SVG 아이콘 (검정 테두리 + 노란색, 투명 배경)
const BUOY_SVG = `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g>
        <path d="M20 70 Q 50 85 80 70 L 80 60 L 20 60 Z" fill="#FDD835" stroke="#000" stroke-width="3"/>
        <ellipse cx="50" cy="60" rx="30" ry="10" fill="#FFEB3B" stroke="#000" stroke-width="2"/>
        <rect x="45" y="30" width="10" height="30" fill="#FBC02D" stroke="#000" stroke-width="2"/>
        <rect x="40" y="30" width="20" height="5" fill="#F57F17" stroke="#000" stroke-width="2"/>
        <circle cx="50" cy="25" r="5" fill="#F44336" stroke="#000" stroke-width="2"/>
        <path d="M50 25 L 60 15 M 50 25 L 40 15" stroke="#000" stroke-width="2"/>
        <rect x="25" y="50" width="12" height="8" fill="#1E88E5" stroke="#000" stroke-width="1" transform="rotate(-10 25 50)"/>
        <rect x="63" y="50" width="12" height="8" fill="#1E88E5" stroke="#000" stroke-width="1" transform="rotate(10 63 50)"/>
    </g>
</svg>
`;

const BUOY_VISIBLE_SCALE = 1.4;  // 1.4배 이상 확대 시 부이 표시
const BUOY_VISUAL_SIZE = 36;    // 화면상 고정 크기 (px)
let buoyContainer = null;

/**
 * 부이 컨테이너 생성
 */
function createBuoyContainer() {
    const mapContainer = document.getElementById('sea-zone-map');
    if (!mapContainer) return null;

    const wrapper = mapContainer.querySelector('#map-wrapper');
    if (!wrapper) return null;

    const existing = document.getElementById('buoy-container');
    if (existing) existing.remove();

    buoyContainer = document.createElement('div');
    buoyContainer.id = 'buoy-container';
    buoyContainer.style.cssText = `
        position: absolute;
        left: 0; top: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 50;
    `;

    wrapper.appendChild(buoyContainer);
    return buoyContainer;
}

/**
 * 부이 표시/숨김 업데이트
 */
function updateBuoyVisibility() {
    if (!buoyContainer) {
        buoyContainer = createBuoyContainer();
    }
    if (!buoyContainer) return;

    // 확대율 체크
    if (scale < BUOY_VISIBLE_SCALE) {
        buoyContainer.style.display = 'none';
        return;
    }

    buoyContainer.style.display = 'block';

    // 화면상 고정 크기 유지를 위한 역보정
    const buoySize = BUOY_VISUAL_SIZE / scale;

    buoyContainer.innerHTML = '';

    if (typeof BUOY_LOCATIONS === 'undefined') return;

    Object.entries(BUOY_LOCATIONS).forEach(([buoyId, buoyData]) => {
        if (typeof gpsToPixel !== 'function') return;

        const pixel = gpsToPixel(buoyData.lon, buoyData.lat);

        if (pixel.x < 0 || pixel.x > IMAGE_MAP.width ||
            pixel.y < 0 || pixel.y > IMAGE_MAP.height) {
            return;
        }

        const buoyEl = document.createElement('div');
        buoyEl.className = 'buoy-marker';
        buoyEl.dataset.buoyId = buoyId;
        buoyEl.dataset.buoyName = buoyData.name;
        buoyEl.style.cssText = `
            position: absolute;
            left: ${pixel.x}px;
            top: ${pixel.y}px;
            width: ${buoySize}px;
            height: ${buoySize}px;
            transform: translate(-50%, -100%);
            cursor: pointer;
            pointer-events: auto;
            background-image: url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(BUOY_SVG.trim())}");
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center bottom;
        `;

        // 호버 시 이름 표시
        buoyEl.title = buoyData.name;

        // 클릭 이벤트
        buoyEl.addEventListener('click', (e) => {
            e.stopPropagation();
            showBuoyModal(buoyId, buoyData);
        });

        buoyContainer.appendChild(buoyEl);
    });

    console.log(`🔴 부이 ${Object.keys(BUOY_LOCATIONS).length}개 표시됨`);
}

/**
 * 부이 정보 모달 표시
 */
function showBuoyModal(buoyId, buoyData) {
    console.log(`🔴 부이 클릭: ${buoyId} (${buoyData.name})`);

    const existing = document.getElementById('buoy-info-modal');
    if (existing) existing.remove();
    const existingBackdrop = document.getElementById('buoy-modal-backdrop');
    if (existingBackdrop) existingBackdrop.remove();

    const cleanName = buoyData.name.replace(/부이$/, '').trim();
    const typeName = (typeof BUOY_TYPE_NAMES !== 'undefined' && BUOY_TYPE_NAMES[buoyData.type])
        ? BUOY_TYPE_NAMES[buoyData.type] : '해양기상부이';

    const modal = document.createElement('div');
    modal.id = 'buoy-info-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        color: white;
        padding: 25px 30px;
        border-radius: 16px;
        z-index: 10000;
        min-width: 250px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.1);
    `;

    modal.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
            <div style="display:flex; align-items:center; gap:8px;">
                <h3 style="margin:0; font-size:1.3rem;">${cleanName}</h3>
                <span style="background:#e94560; color:white; padding:2px 8px; border-radius:10px; font-size:0.75rem;">${typeName}</span>
            </div>
            <button onclick="this.closest('#buoy-info-modal').remove(); document.getElementById('buoy-modal-backdrop')?.remove();" 
                    style="background:none; border:none; color:#888; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>
        <div id="buoy-weather-data" style="min-height:80px;">
            <div style="text-align:center; color:#888; margin-top:20px;">데이터 로딩 중...</div>
        </div>
    `;

    const backdrop = document.createElement('div');
    backdrop.id = 'buoy-modal-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    backdrop.onclick = () => {
        modal.remove();
        backdrop.remove();
    };

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    fetchBuoyDataForModal(buoyId);
}

/**
 * 부이 기상 데이터 가져오기
 */
async function fetchBuoyDataForModal(buoyId) {
    const container = document.getElementById('buoy-weather-data');
    if (!container) return;

    // Netlify 환경에서는 서비스 준비 중 메시지 표시
    if (typeof CONFIG !== 'undefined' && CONFIG.IS_NETLIFY) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <p style="font-size:1.1em; color:#ff9800;">⚠️ 서비스 준비 중</p>
                <p style="color:#888; font-size:0.9em; margin-top:10px;">
                    부이 상세 정보 기능은<br>보안 업데이트 작업 중입니다.
                </p>
            </div>
        `;
        return;
    }

    try {
        if (typeof CONFIG !== 'undefined' && CONFIG.BUOY_API_URL) {
            const now = new Date();
            const tm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}00`;

            let url = `${CONFIG.BUOY_API_URL}?tm=${tm}&stn=${buoyId}&help=1&authKey=${CONFIG.KMA_HUB_KEY}`;
            if (CONFIG.USE_CORS_PROXY) {
                url = CONFIG.CORS_PROXY + encodeURIComponent(url);
            }

            const response = await fetch(url);
            const buffer = await response.arrayBuffer();
            const text = new TextDecoder('euc-kr').decode(buffer);

            const data = parseBuoyDataForModal(text, buoyId);
            if (data) {
                displayBuoyDataInModal(container, data);
            } else {
                container.innerHTML = '<div style="text-align:center; color:#888;">데이터가 없습니다.</div>';
            }
        } else {
            container.innerHTML = '<div style="text-align:center; color:#888;">API 설정 필요</div>';
        }
    } catch (error) {
        console.error('부이 데이터 로드 실패:', error);
        container.innerHTML = '<div style="text-align:center; color:#ff6b6b;">데이터 로드 실패</div>';
    }
}

/**
 * 부이 데이터 파싱
 */
function parseBuoyDataForModal(text, buoyId) {
    const lines = text.trim().split('\n');

    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;

        const parts = line.split(/\s+/).filter(p => p);
        if (parts.length < 10) continue;

        const stnId = parts[2].replace(/,/g, '');
        if (stnId === buoyId) {
            const parseVal = (v) => {
                const n = parseFloat(v);
                return (isNaN(n) || n <= -99) ? null : n;
            };

            return {
                time: parts[1],
                wh: parseVal(parts[6]),
                wd: parseVal(parts[7]),
                ws: parseVal(parts[8]),
                ta: parseVal(parts[11]),
                tw: parseVal(parts[10]),
                pa: parseVal(parts[12])
            };
        }
    }
    return null;
}

/**
 * 부이 데이터 모달에 표시
 */
function displayBuoyDataInModal(container, data) {
    const metrics = [
        { label: '🌊 파고', key: 'wh', unit: 'm', color: '#4fc3f7' },
        { label: '💨 풍속', key: 'ws', unit: 'm/s', color: '#81c784' },
        { label: '🧭 풍향', key: 'wd', unit: '°', color: 'white' },
        { label: '🌡 기온', key: 'ta', unit: '°C', color: 'white' },
        { label: '🌊 수온', key: 'tw', unit: '°C', color: '#64b5f6' },
        { label: '📊 기압', key: 'pa', unit: 'hPa', color: 'white' }
    ];

    let html = '<div style="display:grid; gap:8px; font-size:0.9rem;">';
    let hasData = false;

    metrics.forEach(m => {
        if (data[m.key] !== null) {
            html += `<div style="display:flex; justify-content:space-between;">
                <span style="color:#888;">${m.label}</span>
                <span style="color:${m.color}; font-weight:500;">${data[m.key]}${m.unit}</span>
            </div>`;
            hasData = true;
        }
    });

    if (!hasData) {
        html += '<div style="text-align:center; color:#888; padding:20px;">표시할 데이터가 없습니다.</div>';
    }

    html += '</div>';

    // 관측 시간 포맷
    let timeStr = data.time || '';
    if (timeStr.length === 12) {
        timeStr = `${timeStr.substring(4, 6)}. ${timeStr.substring(6, 8)}. ${timeStr.substring(8, 10)}:${timeStr.substring(10, 12)}`;
    }

    html += `<div style="margin-top:15px; font-size:0.75rem; color:#666; text-align:right;">관측 시간: ${timeStr}</div>`;

    container.innerHTML = html;
}

// applyTransform 확장 - 부이 표시 및 소해구 그리드 업데이트
function applyTransform() {
    clampTranslation();
    const wrapper = document.getElementById('map-wrapper');
    if (wrapper) wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    // 부이 표시 업데이트
    if (typeof updateBuoyVisibility === 'function') {
        updateBuoyVisibility();
    }

    // [New] 소해구 그리드 렌더링
    if (scale >= MIN_SMALL_GRID_SCALE) {
        if (!window._isRenderingGrid) {
            window._isRenderingGrid = true;
            requestAnimationFrame(() => {
                renderSmallGrids();
                window._isRenderingGrid = false;
            });
        }
    } else {
        if (smallGridCtx) smallGridCtx.clearRect(0, 0, smallGridCanvas.width, smallGridCanvas.height);
    }

    // --- Map Mode Indicator Logic (Global) ---
    const mapContainer = document.getElementById('sea-zone-map');
    let badge = document.getElementById('zone-mode-badge');

    // Create badge if missing
    if (!badge && mapContainer) {
        badge = document.createElement('div');
        badge.id = 'zone-mode-badge';
        badge.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.65);
            color: #fff;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            pointer-events: none;
            z-index: 1000;
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        mapContainer.appendChild(badge);
    }

    // Update Text based on current scale
    if (badge) {
        if (scale >= MIN_SMALL_GRID_SCALE) {
            badge.textContent = '소해구 모드';
            badge.style.borderColor = 'rgba(100, 200, 255, 0.5)';
            badge.style.color = '#e1f5fe';

            // [New] Clear Large Zone selection when entering Small Zone mode
            if (selectedZoneKey) {
                selectedZoneKey = null;
                // We rely on redraw logic. renderSmallGrids clears the canvas.
                // But large zone highlight is on 'calibration-canvas' (ctx).
                // We need to clear it.
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

        } else {
            badge.textContent = '대해구 모드';
            badge.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            badge.style.color = '#fff';

            // [New] Clear Small Zone selection when leaving Small Zone mode
            if (selectedSmallZoneKey) {
                selectedSmallZoneKey = null;
                // No need to clear small ctx here as renderSmallGrids handles it or clearRect above
            }
        }
    }
}

// ============================================================
// 📏 소해구 (Small Zone) 관련 로직
// ============================================================

/**
 * 현재 보이는 영역의 소해구 그리드를 그립니다.
 */
function renderSmallGrids() {
    if (!smallGridCtx || !mapContainer || !mapImage) return;

    // 캔버스 초기화
    smallGridCtx.clearRect(0, 0, smallGridCanvas.width, smallGridCanvas.height);

    // 캔버스 스타일 설정 (옅은 파란선)
    smallGridCtx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
    smallGridCtx.lineWidth = 1;
    smallGridCtx.textAlign = 'center';
    smallGridCtx.textBaseline = 'middle';

    // 뷰포트 계산
    const rect = mapContainer.getBoundingClientRect();
    const viewLeft = -translateX / scale;
    const viewTop = -translateY / scale;
    const viewRight = viewLeft + rect.width / scale;
    const viewBottom = viewTop + rect.height / scale;

    const getCoords = (key) => {
        const [lonPart, latPart] = key.split('_');
        const [lonStart, lonEnd] = lonPart.split('-');
        const [latStart, latEnd] = latPart.split('-');

        if (!GRID_DATA.lon[lonStart] || !GRID_DATA.lon[lonEnd] || !GRID_DATA.lat[latStart] || !GRID_DATA.lat[latEnd]) return null;

        const x1 = GRID_DATA.lon[lonStart].val;
        const x2 = GRID_DATA.lon[lonEnd].val;
        const y1 = GRID_DATA.lat[latStart].val;
        const y2 = GRID_DATA.lat[latEnd].val;
        return { x1, x2, y1, y2 };
    };

    for (const [key, zoneNum] of Object.entries(SEA_ZONES_DATA)) {
        if (!zoneNum || zoneNum === "0") continue;

        const coords = getCoords(key);
        if (!coords) continue;

        // 뷰포트 교차 확인
        if (coords.x2 < viewLeft || coords.x1 > viewRight || coords.y2 < viewTop || coords.y1 > viewBottom) {
            continue;
        }

        const width = coords.x2 - coords.x1;
        const height = coords.y2 - coords.y1;
        const cellW = width / 3;
        const cellH = height / 3;

        // 기본 파란색 격자 그리기
        smallGridCtx.beginPath();
        smallGridCtx.lineWidth = 1;
        smallGridCtx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
        smallGridCtx.setLineDash([]); // 실선

        // 가로선 (1/3, 2/3 지점)
        smallGridCtx.moveTo(coords.x1, coords.y1 + cellH);
        smallGridCtx.lineTo(coords.x2, coords.y1 + cellH);
        smallGridCtx.moveTo(coords.x1, coords.y1 + cellH * 2);
        smallGridCtx.lineTo(coords.x2, coords.y1 + cellH * 2);

        // 세로선 (1/3, 2/3 지점)
        smallGridCtx.moveTo(coords.x1 + cellW, coords.y1);
        smallGridCtx.lineTo(coords.x1 + cellW, coords.y2);
        smallGridCtx.moveTo(coords.x1 + cellW * 2, coords.y1);
        smallGridCtx.lineTo(coords.x1 + cellW * 2, coords.y2);
        smallGridCtx.stroke();

        // 번호 그리기
        /*
        const fontSize = Math.max(10, Math.floor(Math.min(cellW, cellH) * 0.4));
        smallGridCtx.font = `${fontSize}px "Noto Sans KR", Arial`;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const num = row * 3 + col + 1;
                // ... logic ...
            }
        }
        */
    }

    // [New] Highlight Selected Small Zone (Draw LAST to be on top and single)
    if (selectedSmallZoneKey) {
        const [zoneNumStr, idxStr] = selectedSmallZoneKey.split('-');
        const targetZoneNum = zoneNumStr;
        const targetIdx = parseInt(idxStr);

        // Find key for this zoneNum (Reverse lookup efficiency is low but safe)
        // Optimization: We could store map Key -> Num, but loop is fine for <200 items.
        let targetKey = null;
        for (const [key, zNum] of Object.entries(SEA_ZONES_DATA)) {
            if (zNum == targetZoneNum) {
                targetKey = key;
                break;
            }
        }

        if (targetKey) {
            const coords = getCoords(targetKey);
            if (coords) {
                const width = coords.x2 - coords.x1;
                const height = coords.y2 - coords.y1;
                const cellW = width / 3;
                const cellH = height / 3;

                const row = Math.floor((targetIdx - 1) / 3);
                const col = (targetIdx - 1) % 3;

                const sx = coords.x1 + col * cellW;
                const sy = coords.y1 + row * cellH;

                // Draw Highlight Box
                smallGridCtx.save();

                // Style: Red Dashed Line, 3x width (approx 3px), Shadow/Glow
                smallGridCtx.lineWidth = 3;
                smallGridCtx.strokeStyle = '#ff3333';
                smallGridCtx.setLineDash([8, 4]); // 점선 패턴
                smallGridCtx.lineCap = 'round';

                // Glow Effect
                smallGridCtx.shadowBlur = 10;
                smallGridCtx.shadowColor = 'rgba(255, 50, 50, 0.8)';

                smallGridCtx.strokeRect(sx, sy, cellW, cellH);

                // Semi-transparent fill
                smallGridCtx.fillStyle = 'rgba(255, 0, 0, 0.15)';
                smallGridCtx.fillRect(sx, sy, cellW, cellH);

                smallGridCtx.restore();
            }
        }
    }
}

function getSmallZoneId(imgX, imgY, key, zoneNum) {
    const [lonPart, latPart] = key.split('_');
    const [lonStart, lonEnd] = lonPart.split('-');
    const [latStart, latEnd] = latPart.split('-');

    const x1 = GRID_DATA.lon[lonStart].val;
    const x2 = GRID_DATA.lon[lonEnd].val;
    const y1 = GRID_DATA.lat[latStart].val;
    const y2 = GRID_DATA.lat[latEnd].val;

    const width = x2 - x1;
    const height = y2 - y1;

    const localX = imgX - x1;
    const localY = imgY - y1;

    const col = Math.floor(localX / (width / 3));
    const row = Math.floor(localY / (height / 3));

    const safeCol = Math.max(0, Math.min(2, col));
    const safeRow = Math.max(0, Math.min(2, row));

    const smallZoneIndex = safeRow * 3 + safeCol + 1;

    return `${zoneNum}-${smallZoneIndex}`;
}
