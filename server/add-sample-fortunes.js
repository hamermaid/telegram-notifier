// server/add-sample-fortunes.js - 샘플 운세 데이터 추가 스크립트
import { addFortune } from './fortune.js';

const sampleFortunes = [
  {
    message: "오늘은 새로운 기회가 찾아올 날입니다. 열린 마음으로 변화를 받아들이세요.",
    luckyItem: "은색 펜",
    luckyColorName: "하늘색",
    luckyColorCode: "#87CEEB"
  },
  {
    message: "작은 친절이 큰 행복을 가져다줄 것입니다. 주변 사람들에게 따뜻함을 전하세요.",
    luckyItem: "노란 수첩",
    luckyColorName: "노란색",
    luckyColorCode: "#FFD700"
  },
  {
    message: "꾸준함이 성공의 열쇠입니다. 포기하지 말고 한 걸음씩 앞으로 나아가세요.",
    luckyItem: "초록 식물",
    luckyColorName: "초록색",
    luckyColorCode: "#32CD32"
  },
  {
    message: "직감을 믿고 행동하는 날입니다. 마음의 소리에 귀 기울이세요.",
    luckyItem: "보라색 돌",
    luckyColorName: "보라색",
    luckyColorCode: "#9370DB"
  },
  {
    message: "소통이 해결책을 가져다줄 것입니다. 솔직한 대화를 나눠보세요.",
    luckyItem: "빨간 핸드폰 케이스",
    luckyColorName: "빨간색",
    luckyColorCode: "#DC143C"
  },
  {
    message: "평온함 속에서 지혜를 찾을 수 있는 날입니다. 잠시 멈춰서 생각해보세요.",
    luckyItem: "하얀 양초",
    luckyColorName: "흰색",
    luckyColorCode: "#FFFFFF"
  },
  {
    message: "창의력이 빛나는 하루입니다. 새로운 아이디어에 도전해보세요.",
    luckyItem: "오렌지색 마커",
    luckyColorName: "주황색",
    luckyColorCode: "#FF8C00"
  },
  {
    message: "감사하는 마음이 더 많은 복을 불러올 것입니다. 주변의 소중함을 느껴보세요.",
    luckyItem: "분홍 스티커",
    luckyColorName: "분홍색",
    luckyColorCode: "#FFB6C1"
  },
  {
    message: "균형잡힌 하루를 보내세요. 일과 휴식의 조화를 맞춰보세요.",
    luckyItem: "갈색 가방",
    luckyColorName: "갈색",
    luckyColorCode: "#8B4513"
  },
  {
    message: "용기를 내어 첫걸음을 내딛으세요. 시작이 반이라는 말을 기억하세요.",
    luckyItem: "금색 열쇠고리",
    luckyColorName: "금색",
    luckyColorCode: "#FFD700"
  }
];

async function addSampleFortunes() {
  console.log('📊 샘플 운세 데이터 추가를 시작합니다...');
  
  try {
    for (let i = 0; i < sampleFortunes.length; i++) {
      const fortune = sampleFortunes[i];
      await addFortune(
        fortune.message,
        fortune.luckyItem,
        fortune.luckyColorName,
        fortune.luckyColorCode
      );
      console.log(`✅ 운세 ${i + 1}/${sampleFortunes.length} 추가 완료`);
    }
    
    console.log('🎉 모든 샘플 운세 데이터가 성공적으로 추가되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 샘플 데이터 추가 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행시
addSampleFortunes();