// 첫 화면을 그리기 전에 조립 대기 상태 지정. 자바스크립트 실패에 대비해 6초 뒤 자동으로 대기 상태 해제
export const BUILD_PREPAINT_SCRIPT = `(function(){var h=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;h.dataset.build="pending";setTimeout(function(){if(h.dataset.build==="pending")delete h.dataset.build},6000)})()`;
