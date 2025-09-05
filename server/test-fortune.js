// server/test-fortune.js - 운세 기능 테스트
import { getRandomFortune, formatFortuneMessage, getFortuneCount } from './fortune.js';

async function testFortune() {
  console.log('🔮 운세 기능 테스트를 시작합니다...');
  
  try {
    // 총 운세 개수 확인
    const count = await getFortuneCount();
    console.log(`📊 총 운세 데이터 개수: ${count}개`);
    
    // 랜덤 운세 5개 테스트
    for (let i = 1; i <= 5; i++) {
      console.log(`\n--- 테스트 ${i} ---`);
      const fortune = await getRandomFortune();
      console.log('🔮 선택된 운세 ID:', fortune.id);
      
      const message = formatFortuneMessage(fortune);
      console.log('📱 포맷된 메시지:');
      console.log(message);
      console.log('---');
    }
    
    console.log('\n✅ 운세 기능 테스트 완료!');
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testFortune();