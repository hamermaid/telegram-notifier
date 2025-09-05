// client/src/main.js
console.log('🤖 텔레알림 클라이언트가 시작되었습니다!');

// DOM 요소들
let telegramForm, statusAlert, testBtn, botTokenInput, chatIdInput, telegramStatus;
let notificationForm, notificationsList, scheduleTypeSelect, weeklyDaysContainer, weatherConditionContainer, datePickerContainer;
let toggleTelegramBtn, telegramCardBody;
let weatherForm, weatherTestBtn, weatherApiKeyInput, weatherCityInput, weatherStatus;
let toggleWeatherBtn, weatherCardBody, currentWeatherDiv, weatherInfoDiv;

// 페이지 로드 후 초기화
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM 로드 완료, 초기화 시작...');

  // DOM 요소 가져오기
  initializeElements();

  // 이벤트 리스너 등록
  setupEventListeners();

  // 초기 데이터 로드
  await testServerConnection();
  await loadTelegramSettings();
  await loadWeatherSettings();
  await loadNotifications();
  await updateSchedulerStatus();
});

// DOM 요소 초기화
function initializeElements() {
  console.log('DOM 요소 초기화 중...');

  // 텔레그램 설정 관련
  telegramForm = document.getElementById('telegram-form');
  statusAlert = document.getElementById('status-alert');
  testBtn = document.getElementById('test-btn');
  botTokenInput = document.getElementById('bot-token');
  chatIdInput = document.getElementById('chat-id');
  telegramStatus = document.getElementById('telegram-status');
  toggleTelegramBtn = document.getElementById('toggle-telegram-btn');
  telegramCardBody = document.getElementById('telegram-card-body');

  // 날씨 설정 관련
  weatherForm = document.getElementById('weather-form');
  weatherTestBtn = document.getElementById('weather-test-btn');
  weatherApiKeyInput = document.getElementById('weather-api-key');
  weatherCityInput = document.getElementById('weather-city');
  weatherStatus = document.getElementById('weather-status');
  toggleWeatherBtn = document.getElementById('toggle-weather-btn');
  weatherCardBody = document.getElementById('weather-card-body');
  currentWeatherDiv = document.getElementById('current-weather');
  weatherInfoDiv = document.getElementById('weather-info');

  // 알림 관리 관련
  notificationForm = document.getElementById('notification-form');
  notificationsList = document.getElementById('notifications-list');
  scheduleTypeSelect = document.getElementById('schedule-type');
  weeklyDaysContainer = document.getElementById('weekly-days-container');
  weatherConditionContainer = document.getElementById('weather-condition-container');
  datePickerContainer = document.getElementById('date-picker-container');
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 텔레그램 설정
  if (telegramForm) telegramForm.addEventListener('submit', handleTelegramSubmit);
  if (testBtn) testBtn.addEventListener('click', handleTestMessage);
  if (toggleTelegramBtn) toggleTelegramBtn.addEventListener('click', toggleTelegramCard);

  // 날씨 설정
  if (weatherForm) weatherForm.addEventListener('submit', handleWeatherSubmit);
  if (weatherTestBtn) weatherTestBtn.addEventListener('click', handleWeatherTest);
  if (toggleWeatherBtn) toggleWeatherBtn.addEventListener('click', toggleWeatherCard);

  // 알림 관리
  if (notificationForm) notificationForm.addEventListener('submit', handleNotificationSubmit);
  if (scheduleTypeSelect) scheduleTypeSelect.addEventListener('change', handleScheduleTypeChange);

  const refreshBtn = document.getElementById('refresh-notifications');
  if (refreshBtn) refreshBtn.addEventListener('click', loadNotifications);
}

// 카드 토글 함수들
function toggleTelegramCard() {
  const isVisible = telegramCardBody.style.display !== 'none';
  telegramCardBody.style.display = isVisible ? 'none' : 'block';
  const icon = toggleTelegramBtn.querySelector('i');
  icon.className = isVisible ? 'bi bi-chevron-down' : 'bi bi-chevron-up';
}

function toggleWeatherCard() {
  const isVisible = weatherCardBody.style.display !== 'none';
  weatherCardBody.style.display = isVisible ? 'none' : 'block';
  const icon = toggleWeatherBtn?.querySelector('i');
  if (icon) {
    icon.className = isVisible ? 'bi bi-chevron-down' : 'bi bi-chevron-up';
  }
}

// 서버 연결 테스트
async function testServerConnection() {
  try {
    const response = await fetch('/api/test');
    const data = await response.json();
    console.log('✅ 서버 연결 성공:', data);
  } catch (error) {
    console.log('❌ 서버 연결 실패:', error);
    showAlert('danger', '❌ 서버 연결에 실패했습니다.');
  }
}

// 설정 불러오기 함수들
async function loadTelegramSettings() {
  try {
    const response = await fetch('/api/telegram/settings');
    const data = await response.json();

    if (data.is_configured) {
      telegramStatus.innerHTML = `
                <div class="alert alert-success">
                    <strong>✅ 텔레그램 봇이 연결되어 있습니다!</strong><br>
                    봇 토큰: ${data.bot_token}<br>
                    채팅 ID: ${data.chat_id}
                </div>
            `;
      testBtn.disabled = false;
    } else {
      telegramStatus.innerHTML = `
                <div class="alert alert-warning">
                    <strong>⚠️ 텔레그램 봇이 설정되지 않았습니다.</strong>
                </div>
            `;
      telegramCardBody.style.display = 'block';
    }

    if (data.chat_id) {
      chatIdInput.value = data.chat_id;
    }
  } catch (error) {
    console.error('설정 불러오기 실패:', error);
  }
}

async function loadWeatherSettings() {
  try {
    const response = await fetch('/api/weather/settings');
    const data = await response.json();

    if (data.is_configured) {
      weatherStatus.innerHTML = `
                <div class="alert alert-success">
                    <strong>✅ 날씨 API가 연결되어 있습니다!</strong><br>
                    API 키: ${data.api_key}<br>
                    도시: ${data.city}
                </div>
            `;
      weatherTestBtn.disabled = false;
      await loadCurrentWeather();
    } else {
      weatherStatus.innerHTML = `
                <div class="alert alert-warning">
                    <strong>⚠️ 날씨 API가 설정되지 않았습니다.</strong>
                </div>
            `;
      weatherCardBody.style.display = 'block';
    }

    if (data.city) {
      weatherCityInput.value = data.city;
    }
  } catch (error) {
    console.error('날씨 설정 불러오기 실패:', error);
  }
}

// 설정 저장 함수들
async function handleTelegramSubmit(event) {
  event.preventDefault();

  const botToken = botTokenInput.value.trim();
  const chatId = chatIdInput.value.trim();

  if (!botToken || !chatId) {
    showAlert('warning', '⚠️ 봇 토큰과 채팅 ID를 모두 입력해주세요.');
    return;
  }

  try {
    showAlert('info', '⏳ 텔레그램 봇 설정을 저장하는 중...');

    const response = await fetch('/api/telegram/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_token: botToken, chat_id: chatId })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + data.message);
      testBtn.disabled = false;
      await loadTelegramSettings();
    } else {
      showAlert('danger', '❌ 설정 저장에 실패했습니다: ' + data.message);
    }
  } catch (error) {
    console.error('설정 저장 실패:', error);
    showAlert('danger', '❌ 서버 오류로 설정을 저장할 수 없습니다.');
  }
}

async function handleWeatherSubmit(event) {
  event.preventDefault();

  const apiKey = weatherApiKeyInput.value.trim();
  const city = weatherCityInput.value.trim() || 'Seoul';

  if (!apiKey) {
    showAlert('warning', '⚠️ OpenWeatherMap API 키를 입력해주세요.');
    return;
  }

  try {
    showAlert('info', '⏳ 날씨 설정을 저장하는 중...');

    const response = await fetch('/api/weather/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, city: city })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + data.message);
      weatherTestBtn.disabled = false;
      await loadWeatherSettings();
    } else {
      showAlert('danger', '❌ 설정 저장에 실패했습니다.');
    }
  } catch (error) {
    showAlert('danger', '❌ 서버 오류로 설정을 저장할 수 없습니다.');
  }
}

// 테스트 함수들
async function handleTestMessage() {
  try {
    testBtn.disabled = true;
    testBtn.innerHTML = '⏳ 전송 중...';

    const response = await fetch('/api/telegram/test', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + data.message + ' 텔레그램을 확인해보세요!');
    } else {
      showAlert('danger', '❌ ' + data.message);
    }
  } catch (error) {
    showAlert('danger', '❌ 테스트 메시지 전송에 실패했습니다.');
  } finally {
    testBtn.disabled = false;
    testBtn.innerHTML = '📤 테스트 메시지 전송';
  }
}

async function handleWeatherTest() {
  try {
    weatherTestBtn.disabled = true;
    weatherTestBtn.innerHTML = '⏳ 테스트 중...';

    const response = await fetch('/api/weather/test', { method: 'POST' });
    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + data.message);
      displayWeatherInfo(data.current_weather, data.rain_forecast);
    } else {
      showAlert('danger', '❌ ' + data.message);
    }
  } catch (error) {
    showAlert('danger', '❌ 날씨 API 테스트에 실패했습니다.');
  } finally {
    weatherTestBtn.disabled = false;
    weatherTestBtn.innerHTML = '🌤️ 날씨 테스트';
  }
}

async function loadCurrentWeather() {
  try {
    const response = await fetch('/api/weather/current');
    const weather = await response.json();

    const rainResponse = await fetch('/api/weather/rain-check');
    const rainForecast = await rainResponse.json();

    displayWeatherInfo(weather, rainForecast);
  } catch (error) {
    console.error('현재 날씨 불러오기 실패:', error);
  }
}

function displayWeatherInfo(weather, rainForecast) {
  const umbrellaIcon = rainForecast.should_bring_umbrella ? '☔' : '☀️';
  const umbrellaText = rainForecast.should_bring_umbrella ? '우산을 챙기세요!' : '맑은 하루예요!';

  weatherInfoDiv.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title">🌡️ 현재 기온</h6>
                        <p class="card-text h4">${weather.temperature}°C</p>
                        <small class="text-muted">체감 ${weather.feels_like}°C</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 bg-light">
                    <div class="card-body">
                        <h6 class="card-title">${umbrellaIcon} 비 예보</h6>
                        <p class="card-text">${umbrellaText}</p>
                        <small class="text-muted">강수확률: ${rainForecast.max_rain_probability}%</small>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3">
            <small class="text-muted">
                📍 ${weather.city} | ☁️ ${weather.weather} | 💧 습도 ${weather.humidity}%
            </small>
        </div>
    `;

  currentWeatherDiv.style.display = 'block';
}

// 스케줄 타입 변경 처리
function handleScheduleTypeChange() {
  const scheduleType = scheduleTypeSelect.value;

  weeklyDaysContainer.style.display = 'none';
  weatherConditionContainer.style.display = 'none';
  datePickerContainer.style.display = 'none';

  if (scheduleType === 'weekly') {
    weeklyDaysContainer.style.display = 'block';
  } else if (scheduleType === 'weather') {
    weatherConditionContainer.style.display = 'block';
  } else if (scheduleType === 'date_once' || scheduleType === 'date_yearly') {
    datePickerContainer.style.display = 'block';

    const dateHelpText = document.getElementById('date-help-text');
    const scheduleDateInput = document.getElementById('schedule-date');

    if (scheduleType === 'date_once') {
      dateHelpText.textContent = '한 번만 알림을 받을 날짜를 선택하세요.';
      const today = new Date().toISOString().split('T')[0];
      scheduleDateInput.min = today;
    } else {
      dateHelpText.textContent = '매년 반복할 날짜를 선택하세요 (생일, 기념일 등).';
      scheduleDateInput.removeAttribute('min');
    }
  }
}

// 알림 추가
async function handleNotificationSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('notification-title').value.trim();
  const message = document.getElementById('notification-message').value.trim();
  const scheduleType = scheduleTypeSelect.value;
  const scheduleTime = document.getElementById('notification-time').value;

  if (!title || !scheduleType || !scheduleTime) {
    showAlert('warning', '⚠️ 제목, 반복 설정, 시간은 필수입니다.');
    return;
  }

  let scheduleDays = null;
  let scheduleDate = null;

  if (scheduleType === 'weekly') {
    const checkedDays = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(cb => cb.value);

    if (checkedDays.length === 0) {
      showAlert('warning', '⚠️ 주간 반복을 선택한 경우 요일을 하나 이상 선택해주세요.');
      return;
    }

    scheduleDays = checkedDays.join(',');
  } else if (scheduleType === 'weather') {
    const weatherCondition = document.getElementById('weather-condition').value;
    scheduleDays = weatherCondition;
  } else if (scheduleType === 'date_once' || scheduleType === 'date_yearly') {
    const selectedDate = document.getElementById('schedule-date').value;

    if (!selectedDate) {
      showAlert('warning', '⚠️ 날짜를 선택해주세요.');
      return;
    }

    if (scheduleType === 'date_once') {
      const today = new Date();
      const targetDate = new Date(selectedDate);
      today.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);

      if (targetDate < today) {
        showAlert('warning', '⚠️ 일회성 알림은 과거 날짜를 선택할 수 없습니다.');
        return;
      }
    }

    scheduleDate = selectedDate;
  }
  try {
    showAlert('info', '⏳ 알림을 추가하는 중...');

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message,
        schedule_type: scheduleType,
        schedule_time: scheduleTime,
        schedule_days: scheduleDays,
        schedule_date: scheduleDate
      })
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + data.message);
      notificationForm.reset();
      weeklyDaysContainer.style.display = 'none';
      weatherConditionContainer.style.display = 'none';
      datePickerContainer.style.display = 'none';
      await loadNotifications();
      await updateSchedulerStatus();
    } else {
      showAlert('danger', '❌ 알림 추가에 실패했습니다: ' + data.error);
    }
  } catch (error) {
    showAlert('danger', '❌ 서버 오류로 알림을 추가할 수 없습니다.');
  }
}

// 알림 목록 관련
async function loadNotifications() {
  try {
    const response = await fetch('/api/notifications');
    const notifications = await response.json();
    renderNotificationsList(notifications);
  } catch (error) {
    notificationsList.innerHTML = `<div class="alert alert-danger">❌ 알림 목록을 불러올 수 없습니다.</div>`;
  }
}

function renderNotificationsList(notifications) {
  if (notifications.length === 0) {
    notificationsList.innerHTML = `
            <div class="text-center text-muted">
                <i class="bi bi-bell-slash" style="font-size: 3rem;"></i>
                <p class="mt-3">아직 등록된 알림이 없습니다.<br>위에서 새 알림을 추가해보세요!</p>
            </div>
        `;
    return;
  }

  const html = notifications.map(notification => `
        <div class="card mb-3 ${notification.is_active ? '' : 'opacity-50'}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title">
                            ${notification.is_active ? '🔔' : '🔕'} ${notification.title}
                            ${getScheduleIcon(notification.schedule_type)}
                        </h6>
                        ${notification.message ? `<p class="card-text text-muted small">${notification.message}</p>` : ''}
                        <div class="small text-muted">
                            <i class="bi bi-clock"></i> ${notification.schedule_time} 
                            <span class="badge bg-secondary ms-2">${getScheduleText(notification)}</span>
                            ${getNextOccurrence(notification)}
                        </div>
                    </div>
                    <div class="btn-group btn-group-sm">
                        <button class="btn ${notification.is_active ? 'btn-warning' : 'btn-success'}" 
                                onclick="toggleNotification(${notification.id})"
                                title="${notification.is_active ? '비활성화' : '활성화'}">
                            <i class="bi ${notification.is_active ? 'bi-pause' : 'bi-play'}"></i>
                        </button>
                        <button class="btn btn-danger" 
                                onclick="deleteNotification(${notification.id})"
                                title="삭제">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

  notificationsList.innerHTML = html;
}

function getScheduleIcon(scheduleType) {
  switch (scheduleType) {
    case 'daily': return '📅';
    case 'weekly': return '🗓️';
    case 'weather': return '🌤️';
    case 'fortune': return '🔮';
    case 'date_once': return '📌';
    case 'date_yearly': return '🎂';
    default: return '⏰';
  }
}

// 스케줄 텍스트 생성
function getScheduleText(notification) {
  switch (notification.schedule_type) {
    case 'daily':
      return '매일';
    case 'weekly':
      const days = notification.schedule_days.split(',');
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      return days.map(d => dayNames[parseInt(d)]).join(', ');
    case 'weather':
      const condition = notification.schedule_days;
      const conditions = {
        'rain': '비 올 때',
        'cold': '추울 때',
        'hot': '더울 때',
        'humid': '습할 때'
      };
      return conditions[condition] || '날씨 조건';
    case 'fortune':
      return '매일 운세';
    case 'date_once':
      // 🔧 수정된 부분
      if (notification.schedule_date) {
        return `${formatDate(notification.schedule_date)} (1회)`;
      } else {
        return '날짜 미설정 (1회)';
      }
    case 'date_yearly':
      // 🔧 수정된 부분
      if (notification.schedule_date) {
        const [year, month, day] = notification.schedule_date.split('-');
        return `매년 ${month}월 ${day}일`;
      } else {
        return '날짜 미설정 (연간)';
      }
    default:
      return '사용자 정의';
  }
}

function getNextOccurrence(notification) {
  if (notification.schedule_type === 'date_once') {
    const targetDate = new Date(notification.schedule_date);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `<br><small class="text-primary">📍 ${diffDays}일 후</small>`;
    } else if (diffDays === 0) {
      return `<br><small class="text-warning">📍 오늘</small>`;
    } else {
      return `<br><small class="text-muted">📍 완료됨</small>`;
    }
  } else if (notification.schedule_type === 'date_yearly') {
    const [, month, day] = notification.schedule_date.split('-');
    const currentYear = new Date().getFullYear();
    const thisYear = new Date(currentYear, month - 1, day);
    const nextYear = new Date(currentYear + 1, month - 1, day);
    const today = new Date();

    const targetDate = thisYear >= today ? thisYear : nextYear;
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `<br><small class="text-warning">🎉 오늘!</small>`;
    } else {
      return `<br><small class="text-info">🎂 ${diffDays}일 후</small>`;
    }
  }
  return '';
}

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) {
    return '날짜 없음';
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '잘못된 날짜';
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '날짜 오류';
  }
}

async function toggleNotification(id) {
  try {
    const response = await fetch(`/api/notifications/${id}/toggle`, {
      method: 'PATCH'
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + data.message);
      await loadNotifications();
      await updateSchedulerStatus();
    } else {
      showAlert('danger', '❌ 상태 변경에 실패했습니다.');
    }
  } catch (error) {
    showAlert('danger', '❌ 서버 오류가 발생했습니다.');
  }
}

async function deleteNotification(id) {
  if (!confirm('정말로 이 알림을 삭제하시겠습니까?')) {
    return;
  }

  try {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      showAlert('success', '✅ ' + data.message);
      await loadNotifications();
      await updateSchedulerStatus();
    } else {
      showAlert('danger', '❌ 삭제에 실패했습니다.');
    }
  } catch (error) {
    showAlert('danger', '❌ 서버 오류가 발생했습니다.');
  }
}

async function updateSchedulerStatus() {
  try {
    const response = await fetch('/api/scheduler/status');
    const status = await response.json();

    const statusElement = document.getElementById('scheduler-status');
    statusElement.textContent = `활성 작업: ${status.active_tasks}개`;
    statusElement.className = status.active_tasks > 0 ? 'badge bg-success ms-2' : 'badge bg-secondary ms-2';
  } catch (error) {
    document.getElementById('scheduler-status').textContent = '상태 불명';
  }
}

function showAlert(type, message) {
  statusAlert.className = `alert alert-${type}`;
  statusAlert.innerHTML = message;
  statusAlert.style.display = 'block';

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusAlert.style.display = 'none';
    }, 3000);
  }
}

// 전역 함수로 노출
window.toggleNotification = toggleNotification;
window.deleteNotification = deleteNotification;