// server/test-fortune-execution.js - 운세 실행 로직 직접 테스트
import { getRandomFortune, formatFortuneMessage } from './fortune.js';

async function testFortuneExecution() {
  console.log('🔮 운세 실행 로직을 테스트합니다...');
  
  try {
    // 스케줄러에서 사용하는 것과 동일한 로직
    console.log(`🔔 알림 실행: "테스트 운세"`);

    // 메시지 구성 - 운세 알림인 경우 랜덤 운세 가져오기
    let message;
    
    try {
      const fortune = await getRandomFortune();
      message = formatFortuneMessage(fortune);
      console.log(`🔮 운세 메시지 생성 완료: ID ${fortune.id}`);
      
      console.log('\n📱 생성된 운세 메시지:');
      console.log('=' .repeat(50));
      console.log(message);
      console.log('=' .repeat(50));
      
    } catch (error) {
      console.error('❌ 운세 가져오기 실패:', error.message);
      message = `🔮 **오늘의 운세**\n\n💫 오늘은 새로운 시작의 날입니다! 긍정적인 마음으로 하루를 보내세요.\n\n🍀 **행운의 아이템**: 행운의 열쇠\n🎨 **행운의 색상**: 파란색\n\n✨ 오늘 하루도 행운이 함께하길 바랍니다!`;
      
      console.log('\n📱 기본 운세 메시지:');
      console.log('=' .repeat(50));
      console.log(message);
      console.log('=' .repeat(50));
    }
    
    console.log('\n✅ 운세 실행 로직 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testFortuneExecution();