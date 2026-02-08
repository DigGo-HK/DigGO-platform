// app.js - DigGO 平台主要邏輯

// 全局變量
let currentUser = null;
let otpTimer = null;
let otpTimeLeft = 60;

// DOM 加載完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DigGO 平台已加載');
    
    // 初始化時間顯示
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000); // 每分鐘更新
    
    // 設置事件監聽器
    setupEventListeners();
    
    // 檢查登入狀態
    checkLoginStatus();
});

// 更新時間顯示
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-HK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const timeElement = document.querySelector('.time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// 設置所有事件監聽器
function setupEventListeners() {
    // 登入按鈕
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    // 註冊按鈕
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterModal);
    }
    
    // 關閉按鈕
    const closeBtns = document.querySelectorAll('.close-btn');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', hideAllModals);
    });
    
    // 點擊模態框外部關閉
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideAllModals();
            }
        });
    });
    
    // 語言切換按鈕
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按鈕的 active 類
            langBtns.forEach(b => b.classList.remove('active'));
            // 添加當前按鈕的 active 類
            this.classList.add('active');
            
            // 獲取語言代碼
            const lang = this.textContent;
            changeLanguage(lang);
        });
    });
}

// 顯示登入模態框
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滾動
        
        // 重置表單
        resetLoginForm();
    }
}

// 顯示註冊模態框
function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        // 動態加載註冊表單
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>立即登記</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="registerForm" class="register-form">
                        <div class="form-group">
                            <label class="form-label">手機號碼</label>
                            <input type="tel" class="form-input" placeholder="輸入手機號碼" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">姓名</label>
                            <input type="text" class="form-input" placeholder="輸入中文姓名" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">出生日期</label>
                            <input type="date" class="form-input" required>
                        </div>
                        <button type="submit" class="btn-primary">發送驗證碼</button>
                    </form>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 重新綁定關閉事件
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideAllModals);
        }
        
        // 註冊表單提交
        const registerForm = modal.querySelector('#registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // 註冊邏輯
                alert('註冊功能開發中');
            });
        }
    }
}

// 隱藏所有模態框
function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto'; // 恢復滾動
    
    // 清除定時器
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }
}

// 重置登入表單
function resetLoginForm() {
    const phoneInput = document.getElementById('phoneNumber');
    const otpInput = document.getElementById('otpCode');
    const otpSection = document.getElementById('otpSection');
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    
    if (phoneInput) phoneInput.value = '';
    if (otpInput) otpInput.value = '';
    if (otpSection) otpSection.style.display = 'none';
    if (sendOtpBtn) {
        sendOtpBtn.textContent = '發送驗證碼';
        sendOtpBtn.disabled = false;
    }
    
    // 重新綁定發送OTP事件
    if (sendOtpBtn) {
        sendOtpBtn.onclick = sendOTP;
    }
    
    // 重新綁定驗證OTP事件
    const verifyBtn = document.getElementById('verifyOtpBtn');
    if (verifyBtn) {
        verifyBtn.onclick = verifyOTP;
    }
}

// 發送 OTP
function sendOTP() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpSection = document.getElementById('otpSection');
    
    // 驗證手機號碼
    if (!phoneNumber || !/^[0-9]{8}$/.test(phoneNumber)) {
        alert('請輸入有效的8位數字香港手機號碼');
        return;
    }
    
    // 顯示發送中狀態
    sendOtpBtn.textContent = '發送中...';
    sendOtpBtn.disabled = true;
    
    // 模擬發送延遲
    setTimeout(() => {
        // 顯示 OTP 輸入區
        otpSection.style.display = 'flex';
        
        // 更新按鈕文字
        sendOtpBtn.textContent = '重新發送';
        sendOtpBtn.disabled = false;
        
        // 啟動倒計時
        startOTPTimer();
        
        // 開發模式下，顯示測試 OTP
        console.log('📱 測試 OTP 已發送至: +852 ' + phoneNumber);
        console.log('🔑 測試驗證碼: 123456');
        
        alert('驗證碼已發送至 +852 ' + phoneNumber + '\n測試驗證碼: 123456');
        
    }, 1500);
}

// 啟動 OTP 計時器
function startOTPTimer() {
    otpTimeLeft = 60;
    const timerElement = document.getElementById('timer');
    
    if (otpTimer) {
        clearInterval(otpTimer);
    }
    
    otpTimer = setInterval(() => {
        otpTimeLeft--;
        
        if (timerElement) {
            timerElement.textContent = otpTimeLeft;
        }
        
        if (otpTimeLeft <= 0) {
            clearInterval(otpTimer);
            if (timerElement) {
                timerElement.textContent = '已過期';
            }
        }
    }, 1000);
}

// 驗證 OTP
function verifyOTP() {
    const otpInput = document.getElementById('otpCode');
    const otpCode = otpInput.value.trim();
    const verifyBtn = document.getElementById('verifyOtpBtn');
    
    // 驗證 OTP
    if (!otpCode || !/^[0-9]{6}$/.test(otpCode)) {
        alert('請輸入6位數字驗證碼');
        return;
    }
    
    // 顯示驗證中狀態
    const originalText = verifyBtn.innerHTML;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 驗證中...';
    verifyBtn.disabled = true;
    
    // 模擬驗證延遲
    setTimeout(() => {
        // 測試模式：接受 123456 作為有效 OTP
        if (otpCode === '123456') {
            // 登入成功
            handleLoginSuccess();
        } else {
            alert('驗證碼錯誤，請重新輸入');
            verifyBtn.innerHTML = originalText;
            verifyBtn.disabled = false;
        }
    }, 2000);
}

// 處理登入成功
function handleLoginSuccess() {
    // 模擬用戶數據
    currentUser = {
        phone: '+852' + document.getElementById('phoneNumber').value,
        name: '謝嘉惠',
        memberType: '正式會員',
        nextAppointment: '2月20日上午10:00',
        hospital: '門診（伊利沙伯醫院）'
    };
    
    // 保存到 localStorage
    localStorage.setItem('diggo_user', JSON.stringify(currentUser));
    
    // 關閉模態框
    hideAllModals();
    
    // 顯示成功消息
    alert('登入成功！歡迎 ' + currentUser.name);
    
    // 跳轉到儀表板（實際項目中會導航到新頁面）
    // window.location.href = 'dashboard.html';
}

// 檢查登入狀態
function checkLoginStatus() {
    const savedUser = localStorage.getItem('diggo_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        console.log('用戶已登入:', currentUser.name);
        
        // 可以在此處更新 UI 顯示已登入狀態
        updateUIForLoggedInUser();
    }
}

// 更新 UI 為已登入狀態
function updateUIForLoggedInUser() {
    // 修改登入按鈕顯示用戶名
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && currentUser) {
        loginBtn.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>${currentUser.name}</span>
        `;
        loginBtn.classList.add('logged-in');
    }
}

// 語言切換
function changeLanguage(lang) {
    let languageCode = 'zh-HK';
    
    switch(lang) {
        case '繁':
            languageCode = 'zh-HK';
            break;
        case '简':
            languageCode = 'zh-CN';
            break;
        case 'EN':
            languageCode = 'en';
            break;
    }
    
    console.log('切換語言至:', languageCode);
    
    // 保存語言設置
    localStorage.setItem('diggo_language', languageCode);
    
    // 在這裡可以添加多語言文本切換邏輯
    updateUIText(languageCode);
}

// 更新 UI 文本（簡化版）
function updateUIText(lang) {
    // 實際項目中，這裡會根據語言更新所有文本
    const texts = {
        'zh-HK': {
            welcome: '歡迎來到',
            login: '登入',
            register: '立即登記',
            iWant: '我要',
            viewAll: '查看全部'
        },
        'zh-CN': {
            welcome: '欢迎来到',
            login: '登录',
            register: '立即登记',
            iWant: '我要',
            viewAll: '查看全部'
        },
        'en': {
            welcome: 'Welcome to',
            login: 'Login',
            register: 'Register Now',
            iWant: 'I Want',
            viewAll: 'View All'
        }
    };
    
    const textSet = texts[lang] || texts['zh-HK'];
    
    // 更新歡迎文本
    const welcomeH2 = document.querySelector('.welcome-message h2');
    if (welcomeH2) welcomeH2.textContent = textSet.welcome;
    
    // 更新按鈕文本
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        const span = loginBtn.querySelector('span');
        if (span) span.textContent = textSet.login;
    }
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        const span = registerBtn.querySelector('span');
        if (span) span.textContent = textSet.register;
    }
    
    // 更新「我要」標題
    const iWantTitle = document.querySelector('.section-title h3');
    if (iWantTitle) iWantTitle.textContent = textSet.iWant;
    
    const viewAllLink = document.querySelector('.view-all');
    if (viewAllLink) {
        const text = viewAllLink.textContent.split('<')[0];
        viewAllLink.innerHTML = textSet.viewAll + ' <i class="fas fa-chevron-right"></i>';
    }
}

// 導出函數（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendOTP,
        verifyOTP,
        changeLanguage
    };
}
