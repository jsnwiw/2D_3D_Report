// device.js – 휴대폰·태블릿·컴퓨터 구분 및 UI 조정 헬퍼
// Returns one of: "mobile", "tablet", "desktop"
export function getDeviceType() {
  const ua = (navigator.userAgent || '').toLowerCase();
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const width = Math.min(window.innerWidth, window.screen.width);

  // 1. 태블릿 판별 (iPad, Android Tablet 등)
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua) || (isTouch && /macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'tablet';
  }

  // 2. 모바일(스마트폰) 판별 (iPhone, Android Mobile 등)
  if (/iphone|ipod|mobile/i.test(ua) || (isTouch && width <= 600)) {
    return 'mobile';
  }

  // 3. 터치 디스플레이 크기 기반 보조 감지
  if (isTouch && width <= 1180) {
    return 'tablet';
  }

  // 그 외는 데스크톱 PC
  return 'desktop';
}

// Global exposure for debugging
if (typeof window !== 'undefined') {
  window.getDeviceType = getDeviceType;
}
