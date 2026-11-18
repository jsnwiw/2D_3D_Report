// device.js – 휴대폰·태블릿·컴퓨터 구분 및 UI 조정 헬퍼
// Returns one of: "mobile", "tablet", "desktop"
export function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const width = Math.max(window.innerWidth, window.screen.width);

  // 기본 모바일 판단 (스마트폰) : 화면 폭 <= 480px
  if (isTouch && width <= 480) return 'mobile';

  // 태블릿 판단 : 터치 가능 && 481~1024px 사이
  if (isTouch && width <= 1024) return 'tablet';

  // 그 외는 데스크톱
  return 'desktop';
}

// Optional: expose a convenient global for debugging
window.getDeviceType = getDeviceType;
