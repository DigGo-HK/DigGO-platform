// app.js - DigGO 平台主要邏輯（完整更新版）

// 全局變量
let currentUser = null;
let otpTimer = null;
let otpTimeLeft = 60;
let currentLanguage = 'zh-HK';

// 多語言文本
const languageTexts = {
    'zh-HK': {
        // 主頁面
        welcome: '歡迎來到',
        login: '登入',
        register: '立即登記',
        iWant: '我要',
        viewAll: '查看全部',
        service1: '預約通',
        service2: '繳費服務',
        service3: '日程',
        service4: 'DigGO Wi-Fi',
        service5: '醫院探訪',
        service6: '院內導航',
        support: '請支持',
        launchDate: '2025年10月推出',
        clinicService: '專科門診服務',
        fromDate: 'From Oct 2025',
        surveyTitle: 'DigGO推送問卷',
        surveyTopic: '簡短調查',
        surveyDesc: 'Short Survey on Specialist Outpatient Service',
        surveyDetail: '8條問題 • Your valuable feedback will help us enhance our services!',
        surveyHelp: '你的寶貴意見將有助我們提升服務質素！',
        surveyBtn: '參與調查',
        nav1: '最新消息',
        nav2: '所有服務',
        nav3: '支援',
        nav4: '更多',
        
        // 登入模態框
        modalTitle: '登入 DigGO',
        phoneLabel: '手機號碼',
        phoneHint: '請輸入8位數字的香港手機號碼',
        sendOtp: '發送驗證碼',
        otpLabel: '驗證碼',
        seconds: '秒',
        otpHint: '測試模式：驗證碼是',
        verifyOtp: '驗證並登入',
        or: '或',
        ehealth: '以醫健通 eHealth 繼續',
        smartid: '以智方便繼續',
        learnMore: '了解更多「智方便」',
        firstTime: '首次使用？',
        switchToRegister: '立即登記',
        agree: '登入即表示同意我們的',
        terms: '服務條款',
        and: '及',
        privacy: '私隱政策',
        
        // 註冊模態框
        registerTitle: '立即登記',
        regPhoneLabel: '手機號碼',
        regNameLabel: '姓名',
        regDobLabel: '出生日期',
        regTypeLabel: '用戶類型',
        selfUse: '本人使用',
        caregiver: '照顧者',
        family: '家庭成員',
        regSendOtp: '發送驗證碼',
        haveAccount: '已有帳戶？',
        switchToLogin: '立即登入',
        
        // Toast 消息
        loginSuccess: '登入成功！',
        welcomeUser: '歡迎回來',
        
        // 功能提示
        featureComing: '功能開發中，即將推出！',
        testOtpSent: '測試驗證碼已發送',
        testOtpCode: '測試驗證碼：123456',
        invalidPhone: '請輸入有效的8位數字香港手機號碼',
        invalidOtp: '請輸入6位數字驗證碼',
        otpError: '驗證碼錯誤，請重新輸入',
        otpSuccess: '驗證成功，正在登入...'
    },
    'zh-CN': {
        welcome: '欢迎来到',
        login: '登录',
        register: '立即注册',
        iWant: '我要',
        viewAll: '查看全部',
        service1: '预约通',
        service2: '缴费服务',
        service3: '日程',
        service4: 'DigGO Wi-Fi',
        service5: '医院探访',
        service6: '院内导航',
        support: '请支持',
        launchDate: '2025年10月推出',
        clinicService: '专科门诊服务',
        fromDate: 'From Oct 2025',
        surveyTitle: 'DigGO推送问卷',
        surveyTopic: '简短调查',
        surveyDesc: 'Short Survey on Specialist Outpatient Service',
        surveyDetail: '8条问题 • Your valuable feedback will help us enhance our services!',
        surveyHelp: '你的宝贵意见将有助我们提升服务质素！',
        surveyBtn: '参与调查',
        nav1: '最新消息',
        nav2: '所有服务',
        nav3: '支援',
        nav4: '更多',
        
        modalTitle: '登录 DigGO',
        phoneLabel: '手机号码',
        phoneHint: '请输入8位数字的香港手机号码',
        sendOtp: '发送验证码',
        otpLabel: '验证码',
        seconds: '秒',
        otpHint: '测试模式：验证码是',
        verifyOtp: '验证并登录',
        or: '或',
        ehealth: '以医健通 eHealth 继续',
        smartid: '以智方便继续',
        learnMore: '了解更多「智方便」',
        firstTime: '首次使用？',
        switchToRegister: '立即注册',
        agree: '登录即表示同意我们的',
        terms: '服务条款',
        and: '及',
        privacy: '隐私政策',
        
        registerTitle: '立即注册',
        regPhoneLabel: '手机号码',
        regNameLabel: '姓名',
        regDobLabel: '出生日期',
        regTypeLabel: '用户类型',
        selfUse: '本人使用',
        caregiver: '照顾者',
        family: '家庭成员',
        regSendOtp: '发送验证码',
        haveAccount: '已有账户？',
        switchToLogin: '立即登录',
        
        loginSuccess: '登录成功！',
        welcomeUser: '欢迎回来',
        
        featureComing: '功能开发中，即将推出！',
        testOtpSent: '测试验证码已发送',
        testOtpCode: '测试验证码：123456',
        invalidPhone: '请输入有效的8位数字香港手机号码',
        invalidOtp: '请输入6位数字验证码',
        otpError: '验证码错误，请重新输入',
        otpSuccess: '验证成功，正在登录...'
    },
    'en': {
        welcome: 'Welcome to',
        login: 'Login',
        register: 'Register Now',
        iWant: 'I Want',
        viewAll: 'View All',
        service1: 'Appointment',
        service2: 'Payment',
        service3: 'Schedule',
        service4: 'DigGO Wi-Fi',
        service5: 'Hospital Visit',
        service6: 'Navigation',
        support: 'Please Support',
        launchDate: 'Launch Oct 2025',
        clinicService: 'Specialist Outpatient Service',
        fromDate: 'From Oct 2025',
        surveyTitle: 'DigGO Push Survey',
        surveyTopic: 'Short Survey',
        surveyDesc: 'Short Survey on Specialist Outpatient Service',
        surveyDetail: '8 questions • Your valuable feedback will help us enhance our services!',
        surveyHelp: 'Your valuable feedback will help us enhance our services!',
        surveyBtn: 'Participate Survey',
        nav1: 'News',
        nav2: 'All Services',
        nav3: 'Support',
        nav4: 'More',
        
        modalTitle: 'Login to DigGO',
        phoneLabel: 'Phone Number',
        phoneHint: 'Please enter 8-digit Hong Kong phone number',
        sendOtp: 'Send Verification Code',
        otpLabel: 'Verification Code',
        seconds: 'seconds',
        otpHint: 'Test mode: verification code is',
        verifyOtp: 'Verify and Login',
        or: 'or',
        ehealth: 'Continue with eHealth',
        smartid: 'Continue with Smart ID',
        learnMore: 'Learn more about Smart ID',
        firstTime: 'First time?',
        switchToRegister: 'Register Now',
        agree: 'By logging in, you agree to our',
        terms: 'Terms of Service',
        and: 'and',
        privacy: 'Privacy Policy',
        
        registerTitle: 'Register Now',
        regPhoneLabel: 'Phone Number',
        regNameLabel: 'Full Name',
        regDobLabel: 'Date of Birth',
        regTypeLabel: 'User Type',
        selfUse: 'For Myself',
        caregiver: 'Caregiver',
        family: 'Family Member',
        regSendOtp: 'Send Verification Code',
        haveAccount: 'Already have account?',
        switchToLogin: 'Login Now',
        
        loginSuccess: 'Login Successful!',
        welcomeUser: 'Welcome back',
        
        featureComing: 'Feature coming soon!',
        testOtpSent: 'Test verification code sent',
        testOtpCode: 'Test code: 123456',
        invalidPhone: 'Please enter valid 8-digit Hong Kong phone number',
        invalidOtp: 'Please enter 6-digit verification code',
        otpError: 'Wrong verification code, please try again',
        otpSuccess: 'Verification successful, logging in...'
    }
};

// DOM 加載完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('DigGO 平台已加載');
    
    // 初始化時間顯示
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000);
    
    // 設置事件監聽器
    setupEventListeners();
    
    // 檢查登入狀態
    checkLoginStatus();
    
    // 初始化語言
    initLanguage();
});

// 更新時間顯示
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString(currentLanguage, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// 初始化語言
function initLanguage() {
    const savedLang = localStorage.getItem('diggo_language');
    if (savedLang && languageTexts[savedLang]) {
        currentLanguage = savedLang;
        updateLanguageButtons(savedLang);
    }
    updateAllTexts();
}

// 更新語言按鈕狀態
function updateLanguageButtons(lang) {
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
}

// 更新所有文本
function updateAllTexts() {
    const texts = languageTexts[currentLanguage] || languageTexts['zh-HK'];
    
    // 更新所有有ID的元素
    Object.keys(texts).forEach(key => {
        const element = document.getElementById(key + 'Text');
        if (element) {
            if (key === 'otpHint') {
                element.innerHTML = `<i class="fas fa-info-circle"></i> ${texts[key]} <strong>123456</strong>`;
            } else {
                element.textContent = texts[key];
            }
        }
    });
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
    
    // 語言切換按鈕
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            currentLanguage = lang;
            localStorage.setItem('diggo_language', lang);
            updateLanguageButtons(lang);
            updateAllTexts();
        });
    });
    
    // 關閉按鈕
    const closeBtns = document.querySelectorAll('.close-btn');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', hideAllModals);
    });
    
    // 切換到註冊
    const switchToRegister = document.getElementById('switchToRegisterText');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            hideAllModals();
            showRegisterModal();
        });
    }
    
    // 切換到登入
    const switchToLogin = document.getElementById('switchToLoginText');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            hideAllModals();
            showLoginModal();
        });
    }
}

// 顯示登入模態框
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        resetLoginForm();
        setupLoginFormEvents();
    }
}

// 設置登入表單事件
function setupLoginFormEvents() {
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    
    if (sendOtpBtn) {
        sendOtpBtn.onclick = sendOTP;
    }
    
    if (verifyOtpBtn) {
        verifyOtpBtn.onclick = verifyOTP;
    }
}

// 顯示註冊模態框
function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// 隱藏所有模態框
function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = 'auto';
    
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
        sendOtpBtn.disabled = false;
    }
}

// 發送 OTP
function sendOTP() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const texts = languageTexts[currentLanguage] || languageTexts['zh-HK'];
    
    // 驗證手機號碼
    if (!phoneNumber || !/^[0-9]{8}$/.test(phoneNumber)) {
        showToast(texts.invalidPhone, 'error');
        return;
    }
    
    // 顯示發送中狀態
    sendOtpBtn.classList.add('btn-loading');
    sendOtpBtn.disabled = true;
    
    // 模擬發送延遲
    setTimeout(() => {
        // 顯示 OTP 輸入區
        otpSection.style.display = 'flex';
        
        // 恢復按鈕狀態
        sendOtpBtn.classList.remove('btn-loading');
        sendOtpBtn.disabled = false;
        
        // 啟動倒計時
        startOTPTimer();
        
        // 顯示測試信息
        showToast(`${texts.testOtpSent}: +852 ${phoneNumber}`, 'info');
        console.log(`📱 ${texts.testOtpSent}: +852 ${phoneNumber}`);
        console.log(`🔑 ${texts.testOtpCode}`);
        
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
        }
    }, 1000);
}

// 驗證 OTP
function verifyOTP() {
    const otpInput = document.getElementById('otpCode');
    const otpCode = otpInput.value.trim();
    const verifyBtn = document.getElementById('verifyOtpBtn');
    const texts = languageTexts[currentLanguage] || languageTexts['zh-HK'];
    
    // 驗證 OTP
    if (!otpCode || !/^[0-9]{6}$/.test(otpCode)) {
        showToast(texts.invalidOtp, 'error');
        return;
    }
    
    // 顯示驗證中狀態
    verifyBtn.classList.add('btn-loading');
    verifyBtn.disabled = true;
    
    // 模擬驗證延遲
    setTimeout(() => {
        // 測試模式：接受 123456 作為有效 OTP
        if (otpCode === '123456') {
            // 登入成功
            handleLoginSuccess();
        } else {
            showToast(texts.otpError, 'error');
            verifyBtn.classList.remove('btn-loading');
            verifyBtn.disabled = false;
        }
    }, 2000);
}

// 處理登入成功
function handleLoginSuccess() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
    const texts = languageTexts[currentLanguage] || languageTexts['zh-HK'];
    
    // 模擬用戶數據
    currentUser = {
        phone: '+852' + phoneNumber,
        name: '謝嘉惠',
        memberType: '正式會員',
        nextAppointment: '2月20日上午10:00',
        hospital: '門診（伊利沙伯醫院）',
        language: currentLanguage
    };
    
    // 保存到 localStorage
    localStorage.setItem('diggo_user', JSON.stringify(currentUser));
    
    // 關閉模態框
    hideAllModals();
    
    // 顯示成功消息
    showSuccessToast(currentUser.name);
    
    // 更新 UI
    updateUIForLoggedInUser();
}

// 顯示成功 Toast
function showSuccessToast(userName) {
    const toast = document.getElementById('successToast');
    const welcomeText = document.getElementById('welcomeUserText');
    const texts = languageTexts[currentLanguage] || languageTexts['zh-HK'];
    
    if (toast && welcomeText) {
        welcomeText.textContent = `${texts.welcomeUser} ${userName}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// 顯示通用 Toast
function showToast(message, type = 'info') {
    // 創建臨時 toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // 觸發動畫
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 移除 toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 400);
    }, 3000);
}

// 更新 UI 為已登入狀態
function updateUIForLoggedInUser() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && currentUser) {
        loginBtn.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>${currentUser.name}</span>
        `;
        loginBtn.classList.add('logged-in');
    }
}

// 檢查登入狀態
function checkLoginStatus() {
    const savedUser = localStorage.getItem('diggo_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        console.log('用戶已登入:', currentUser.name);
        updateUIForLoggedInUser();
        
        // 恢復語言設置
        if (currentUser.language) {
            currentLanguage = currentUser.language;
            updateLanguageButtons(currentLanguage);
            updateAllTexts();
        }
    }
}

// 註冊用戶
function registerUser() {
    const phoneInput = document.getElementById('regPhoneNumber');
    const nameInput = document.getElementById('regName');
    const dobInput = document.getElementById('regDob');
    const userType = document.querySelector('input[name="userType"]:checked');
    const texts = languageTexts[currentLanguage] || languageTexts['zh-HK'];
    
    // 驗證輸入
    if (!phoneInput.value || !/^[0-9]{8}$/.test(phoneInput.value)) {
        showToast(texts.invalidPhone, 'error');
        return;
    }
    
    if (!nameInput.value.trim()) {
        showToast('請輸入姓名', 'error');
        return;
    }
    
    if (!dobInput.value) {
        showToast('請選擇出生日期', 'error');
        return;
    }
    
    // 顯示發送中狀態
    const registerBtn = document.getElementById('registerSubmitBtn');
    registerBtn.classList.add('btn-loading');
    registerBtn.disabled = true;
    
    // 模擬註冊延遲
    setTimeout(() => {
        showToast('註冊成功！請檢查手機驗證碼。', 'success');
        registerBtn.classList.remove('btn-loading');
        registerBtn.disabled = false;
        
        // 切換到登入
        setTimeout(() => {
            hideAllModals();
            showLoginModal();
            // 自動填寫手機號碼
            document.getElementById('phoneNumber').value = phoneInput.value;
        }, 1500);
        
    }, 2000);
}

// 參與調查
function participateSurvey() {
    showFeatureComing('問卷調查');
}

// 顯示功能開發中提示
function showFeatureComing(featureName) {
    const texts = languageTexts[currentLanguage] || languageTexts['zh-HK'];
    showToast(`${featureName} - ${texts.featureComing}`, 'info');
}

// 導出函數（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendOTP,
        verifyOTP,
        changeLanguage: (lang) => {
            currentLanguage = lang;
            updateAllTexts();
        }
    };
}
