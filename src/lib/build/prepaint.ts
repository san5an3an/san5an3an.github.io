import { PLAYED_PAGES_KEY } from "./played-pages";

// 첫 화면을 그리기 전에 조립 대기 상태 지정. 이미 본 페이지로 뒤로 가거나 앞으로 갈 때만 재생을 건너뛰고, 자바스크립트 실패에 대비해 6초 뒤 대기 상태 해제
export const BUILD_PREPAINT_SCRIPT = `(function(){var h=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;var p=[];try{p=JSON.parse(sessionStorage.getItem("${PLAYED_PAGES_KEY}")||"[]")}catch(e){}var n=performance.getEntriesByType("navigation")[0];if(p.indexOf(location.pathname)>-1&&n&&n.type==="back_forward")return;h.dataset.build="pending";setTimeout(function(){if(h.dataset.build==="pending")delete h.dataset.build},6000)})()`;
