/**
 * ==============================================================================
 * [state.js] 3D 데이터 시각화 웹 플랫폼 - 전역 상태 및 공유 유틸리티
 * ==============================================================================
 */

// DOM 셀렉터 헬퍼
export const $ = id => document.getElementById(id);

// 시스템 정보 수집 (CPU 모델/제조사, GPU 렌더러, 벤더 등)
export function getSystemInfo() {
    const platform = navigator.platform || 'Win32';
    const cpuCores = navigator.hardwareConcurrency || 4;
    let rawGpuRenderer = '감지 중...';
    let rawGpuVendor = '감지 중...';
    let cpuBrand = '감지 중...';
    let gpuBrand = '감지 중...';
    let cleanGpuModel = '감지 중...';

    // 1. WebGL 렌더러 정보를 통해 GPU 및 보조 CPU 정보 추출
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const rendererParam = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                const vendorParam = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                if (rendererParam) rawGpuRenderer = rendererParam;
                if (vendorParam) rawGpuVendor = vendorParam;
            }
        }
    } catch (e) {
        // ignore
    }

    const rLower = rawGpuRenderer.toLowerCase();
    const vLower = rawGpuVendor.toLowerCase();

    // 2. GPU 브랜드/제조사 및 정제된 모델명 판별
    try {
        if (/nvidia|geforce|quadro|rtx|gtx|titan/.test(rLower) || /nvidia/.test(vLower)) {
            gpuBrand = 'NVIDIA';
            if (/rtx\s*\d{3,4}/i.test(rawGpuRenderer)) {
                gpuBrand = 'NVIDIA (GeForce RTX)';
            } else if (/gtx\s*\d{3,4}/i.test(rawGpuRenderer)) {
                gpuBrand = 'NVIDIA (GeForce GTX)';
            }
        } else if (/amd|radeon|rx\s*\d{3,4}|vega/.test(rLower) || /amd|ati/.test(vLower)) {
            gpuBrand = 'AMD (Radeon Graphics)';
        } else if (/intel|iris|uhd graphics|hd graphics|arc/.test(rLower) || /intel/.test(vLower)) {
            if (/arc/i.test(rawGpuRenderer)) {
                gpuBrand = 'Intel (Intel Arc 외장 그래픽)';
            } else {
                gpuBrand = 'Intel (Intel Iris / UHD 내장 그래픽)';
            }
        } else if (/apple|m1|m2|m3|m4/.test(rLower) || /apple/.test(vLower)) {
            gpuBrand = 'Apple (Apple Silicon GPU)';
        } else if (/adreno|qualcomm/.test(rLower) || /qualcomm/.test(vLower)) {
            gpuBrand = 'Qualcomm (Adreno GPU)';
        } else if (/mali|arm/.test(rLower) || /arm/.test(vLower)) {
            gpuBrand = 'ARM (Mali GPU)';
        } else if (/powervr|imagination/.test(rLower)) {
            gpuBrand = 'Imagination (PowerVR GPU)';
        } else if (/xclipse|samsung/.test(rLower)) {
            gpuBrand = 'Samsung (Xclipse AMD RDNA GPU)';
        } else if (rawGpuVendor && rawGpuVendor !== '감지 중...') {
            gpuBrand = rawGpuVendor;
        } else {
            gpuBrand = 'Standard GPU Device';
        }

        // 보기 편한 정제된 GPU 명칭 추출 (ANGLE D3D11 등의 래퍼 접두어 정리)
        cleanGpuModel = rawGpuRenderer
            .replace(/^ANGLE\s*\([^,]+,\s*/i, '')
            .replace(/\s*Direct3D[^\)]*\)/i, '')
            .replace(/\s*vs_[^\)]*\)/i, '')
            .trim();
        if (!cleanGpuModel) cleanGpuModel = rawGpuRenderer;
    } catch (e) {
        gpuBrand = 'Generic GPU';
        cleanGpuModel = rawGpuRenderer;
    }

    // 3. CPU 브랜드/제조사 추론 및 판별
    try {
        const ua = (navigator.userAgent || '').toLowerCase();

        // (1) Apple Silicon 감지
        if (/macintosh|mac os x/.test(ua) && (navigator.maxTouchPoints > 0 || /apple/.test(vLower) || /apple/.test(rLower))) {
            cpuBrand = 'Apple (Apple Silicon)';
        }
        // (2) 내장 그래픽/렌더러 기반 CPU 칩셋 식별
        else if (/intel/.test(rLower) || /intel/.test(vLower)) {
            cpuBrand = 'Intel (Intel Core / Xeon)';
        } else if (/amd|radeon/.test(rLower) || /amd|ati/.test(vLower)) {
            if (/ryzen|radeon graphics/.test(rLower)) {
                cpuBrand = 'AMD (Ryzen Processor)';
            } else {
                cpuBrand = 'AMD / Intel x86_64 Compatible';
            }
        } else if (/snapdragon|adreno|qualcomm/.test(rLower) || /qualcomm/.test(ua)) {
            cpuBrand = 'Qualcomm (Snapdragon ARM)';
        } else if (/mediatek|mali/.test(rLower) || /mediatek/.test(ua)) {
            cpuBrand = 'MediaTek / ARM Cortex';
        } else if (/samsung|exynos|xclipse/.test(rLower)) {
            cpuBrand = 'Samsung (Exynos ARM)';
        }
    // 4. 상세 기기 및 시스템 환경 스펙 감지
    let deviceMemory = '기본 지원';
    if (navigator.deviceMemory) {
        deviceMemory = `약 ${navigator.deviceMemory}GB RAM`;
    }

    const screenRes = `${window.screen.width} × ${window.screen.height} (DPR: ${window.devicePixelRatio || 1})`;
    const colorDepth = `${window.screen.colorDepth || 24}비트 트루컬러`;

    let maxTextureSize = '감지 중...';
    let maxViewportDims = '감지 중...';
    try {
        const c = document.createElement('canvas');
        const g = c.getContext('webgl');
        if (g) {
            maxTextureSize = `${g.getParameter(g.MAX_TEXTURE_SIZE)}px`;
            const vp = g.getParameter(g.MAX_VIEWPORT_DIMS);
            if (vp) maxViewportDims = `${vp[0]} × ${vp[1]}`;
        }
    } catch(e) {}

    let networkType = '안정적 초고속 연결';
    if (navigator.connection) {
        const conn = navigator.connection;
        networkType = `${conn.effectiveType ? conn.effectiveType.toUpperCase() : ''} (${conn.downlink ? conn.downlink + 'Mbps' : '온라인'})`.trim();
    }

    let osName = 'Windows';
    const ua = (navigator.userAgent || '').toLowerCase();
    if (/windows nt 10\.0/.test(ua)) osName = 'Windows 10 / Windows 11';
    else if (/windows nt 6\.3/.test(ua)) osName = 'Windows 8.1';
    else if (/windows nt 6\.1/.test(ua)) osName = 'Windows 7';
    else if (/macintosh|mac os x/.test(ua)) osName = 'macOS';
    else if (/android/.test(ua)) osName = 'Android OS';
    else if (/iphone|ipad|ipod/.test(ua)) osName = 'iOS';
    else if (/linux/.test(ua)) osName = 'Linux';

    return { 
        platform, 
        osName,
        cpuCores, 
        cpuBrand, 
        gpuRenderer: rawGpuRenderer, 
        cleanGpuModel, 
        gpuVendor: rawGpuVendor, 
        gpuBrand,
        deviceMemory,
        screenRes,
        colorDepth,
        maxTextureSize,
        maxViewportDims,
        networkType
    };
}

// 전역 공유 상태 컨테이너
export const appState = {
    // 파싱된 데이터 및 분석 결과
    parsedData: null,
    analysisResult: null,
    currentUploadedFile: null,
    selectedFilter: 'all',
    filterKeyword: '',
    dataLimit: 30, // 기본 상위 30개 표시 (대용량 최적화)

    // Three.js 씬 및 3D 렌더링 객체
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    gridHelper: null,
    dirLight: null,
    ambientLight: null,
    pointLight: null,
    dataObjects: [],
    domLabels: [],
    dataBounds: { minX: -10, maxX: 10, maxH: 10 },
    activeMeshIndex: -1,
    showLabels: true,
    current3DStyle: 'box', // 현재 적용된 3D 시각화 지오메트리 스타일

    // 2D Chart.js 인스턴스
    chart2d: null,
    miniChart: null,

    // GPU 하드웨어 정보 및 실시간 실측 엔진 상태
    gpuEngineState: {
        isWebGPU: true,
        backendName: 'WebGPU (Vulkan / Direct3D 12 Low-level)',
        gpuName: '하드웨어 감지 중...',
        vendor: '감지 중...',
        architecture: '감지 중...',
        featuresCount: 0,
        fps: 0,
        frameTimeMs: '0.0',
        minFps: 999,
        maxFps: 0,
        avgFps: 0,
        fpsHistory: [] // 최근 실측 프레임레이트 기록 (스파크라인 그래프용)
    },

    // AI 보고서 상태
    isReportEditMode: false,
    currentReportDataCache: null,

    // 시계열 타임라인 플레이어 상태
    timePlayerState: {
        numericCols: [],
        currentIndex: 0,
        isPlaying: false,
        timerId: null,
        speed: 900
    }
};

// 알림 토스트 팝업 헬퍼
let toastTimer = null;
export function showToast(msg, duration = 3000) {
    const toast = $('toast-notification');
    if (!toast) return;
    toast.innerHTML = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, duration);
}

// 비동기 지연 헬퍼
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
