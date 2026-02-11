/* DigGO OCR 預約系統 - 主邏輯文件 */
/* 版本：2.0 | 日期：2026 | 更新：PWA支持、深色模式、打印功能 */

// ============================================
// 初始化函數
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DigGO OCR 預約系統初始化...');
    
    // 1. 註冊 Service Worker (PWA支持)
    registerServiceWorker();
    
    // 2. 初始化深色模式
    initDarkMode();
    
    // 3. 初始化步驟系統
    initStepSystem();
    
    // 4. 初始化上傳功能
    initUploadFunctionality();
    
    // 5. 初始化相機功能
    initCameraFunctionality();
    
    // 6. 初始化打印功能
    initPrintFunctionality();
    
    // 7. 初始化事件監聽器
    initEventListeners();
    
    // 8. 初始化時間顯示
    initTimeDisplay();
    
    console.log('系統初始化完成');
});

// ============================================
// 1. Service Worker 註冊 (PWA支持)
// ============================================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('ocr-service-worker.js')
                .then(function(registration) {
                    console.log('✅ Service Worker 註冊成功，範圍：', registration.scope);
                    
                    // 檢查更新
                    registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        console.log('🔄 Service Worker 更新中...');
                        
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('🆕 新版本可用，請刷新頁面');
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(function(error) {
                    console.warn('⚠️ Service Worker 註冊失敗：', error);
                });
        });
        
        // 監聽控制器變化
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            console.log('🎯 Service Worker 控制器已更新');
        });
    } else {
        console.warn('⚠️ 瀏覽器不支持 Service Worker');
    }
}

// ============================================
// 2. 深色模式功能
// ============================================
function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    
    // 檢查系統偏好
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 檢查本地存儲
    const savedTheme = localStorage.getItem('diggo-theme');
    
    // 設置初始主題
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        htmlElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    } else {
        htmlElement.setAttribute('data-theme', 'light');
        updateThemeIcon(false);
    }
    
    // 監聽系統主題變化
    prefersDarkScheme.addEventListener('change', function(e) {
        if (!localStorage.getItem('diggo-theme')) {
            const isDark = e.matches;
            htmlElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            updateThemeIcon(isDark);
        }
    });
    
    // 主題切換按鈕
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('diggo-theme', newTheme);
            updateThemeIcon(newTheme === 'dark');
            
            // 添加動畫效果
            themeToggle.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                themeToggle.style.transform = 'rotate(0deg)';
            }, 300);
            
            console.log('🎨 主題切換為：', newTheme);
        });
    }
}

function updateThemeIcon(isDark) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.title = isDark ? '切換到淺色模式' : '切換到深色模式';
        }
    }
}

// ============================================
// 3. 步驟系統
// ============================================
function initStepSystem() {
    const steps = document.querySelectorAll('.step');
    const stepSections = document.querySelectorAll('.step-section');
    
    // 初始顯示第一步
    showStep(1);
    
    // 步驟點擊事件
    steps.forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.getAttribute('data-step'));
            if (this.classList.contains('completed') || this.classList.contains('active')) {
                showStep(stepNumber);
            }
        });
    });
    
    // 下一步按鈕
    const nextButtons = document.querySelectorAll('[id^="nextStep"]');
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = getCurrentStep();
            if (validateStep(currentStep)) {
                markStepAsCompleted(currentStep);
                showStep(currentStep + 1);
            }
        });
    });
    
    // 上一步按鈕
    const backButtons = document.querySelectorAll('[id^="prevStep"]');
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStep = getCurrentStep();
            showStep(currentStep - 1);
        });
    });
}

function showStep(stepNumber) {
    // 更新步驟指示器
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active');
        if (index + 1 === stepNumber) {
            step.classList.add('active');
        } else if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else {
            step.classList.remove('completed');
        }
    });
    
    // 顯示對應步驟內容
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`step${stepNumber}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // 更新URL哈希（可選）
    window.location.hash = `step-${stepNumber}`;
    
    console.log('📋 切換到步驟：', stepNumber);
}

function getCurrentStep() {
    const activeStep = document.querySelector('.step.active');
    return activeStep ? parseInt(activeStep.getAttribute('data-step')) : 1;
}

function markStepAsCompleted(stepNumber) {
    const step = document.querySelector(`.step[data-step="${stepNumber}"]`);
    if (step) {
        step.classList.add('completed');
    }
}

function validateStep(stepNumber) {
    // 根據步驟進行驗證
    switch(stepNumber) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

function validateStep1() {
    const fileInput = document.getElementById('fileInput');
    const previewImage = document.getElementById('previewImage');
    
    if (!fileInput && !previewImage) return true;
    
    const hasFile = fileInput ? fileInput.files.length > 0 : previewImage.style.display !== 'none';
    
    if (!hasFile) {
        showNotification('請先上傳文件', 'warning');
        return false;
    }
    
    return true;
}

// ============================================
// 4. 上傳功能
// ============================================
function initUploadFunctionality() {
    const uploadMethods = document.querySelectorAll('.method-card');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,.pdf,.doc,.docx';
    fileInput.style.display = 'none';
    fileInput.id = 'fileInput';
    document.body.appendChild(fileInput);
    
    // 上傳方式選擇
    uploadMethods.forEach(method => {
        method.addEventListener('click', function() {
            const methodType = this.getAttribute('data-method');
            
            // 更新選中狀態
            uploadMethods.forEach(m => m.classList.remove('active'));
            this.classList.add('active');
            
            switch(methodType) {
                case 'camera':
                    openCamera();
                    break;
                case 'gallery':
                    fileInput.accept = 'image/*';
                    fileInput.click();
                    break;
                case 'file':
                    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                    fileInput.click();
                    break;
            }
        });
    });
    
    // 文件選擇事件
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    // 拖放上傳
    const dropZone = document.getElementById('previewArea');
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }
}

function handleFileUpload(file) {
    console.log('📤 處理文件上傳：', file.name);
    
    // 驗證文件類型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                       'application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
        showNotification('不支援的文件格式', 'error');
        return;
    }
    
    // 驗證文件大小（10MB限制）
    if (file.size > 10 * 1024 * 1024) {
        showNotification('文件大小超過10MB限制', 'error');
        return;
    }
    
    // 顯示預覽
    showFilePreview(file);
    
    // 啟用下一步按鈕
    const nextButton = document.getElementById('nextStep1');
    if (nextButton) {
        nextButton.disabled = false;
    }
    
    showNotification('文件上傳成功', 'success');
}

function showFilePreview(file) {
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const fileType = document.getElementById('fileType');
    const fileSize = document.getElementById('fileSize');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewArea = document.getElementById('previewArea');
    
    if (previewArea) {
        previewArea.classList.add('has-file');
    }
    
    if (uploadPlaceholder) {
        uploadPlaceholder.style.display = 'none';
    }
    
    if (fileName) {
        fileName.textContent = file.name;
    }
    
    if (fileType) {
        const type = file.type.split('/')[1] || file.name.split('.').pop();
        fileType.textContent = type.toUpperCase();
    }
    
    if (fileSize) {
        fileSize.textContent = formatFileSize(file.size);
    }
    
    // 如果是圖片，顯示預覽
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImage) {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        // PDF文件顯示PDF圖標
        if (previewImage) {
            previewImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><path fill="%230066cc" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path fill="white" d="M14 2v6h6m-4 5H8m8 4H8m2-8H8"/></svg>';
            previewImage.style.display = 'block';
        }
    }
}

// ============================================
// 5. 相機功能
// ============================================
function initCameraFunctionality() {
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraStream = document.getElementById('cameraStream');
    const takePhotoBtn = document.getElementById('takePhoto');
    const closeCameraBtn = document.getElementById('closeCamera');
    let stream = null;
    
    if (!cameraPreview || !cameraStream) return;
    
    // 打開相機
    window.openCamera = function() {
        cameraPreview.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
        })
        .then(function(mediaStream) {
            stream = mediaStream;
            cameraStream.srcObject = stream;
        })
        .catch(function(err) {
            console.error('相機錯誤：', err);
            showNotification('無法訪問相機', 'error');
            closeCamera();
        });
    };
    
    // 拍攝照片
    if (takePhotoBtn) {
        takePhotoBtn.addEventListener('click', function() {
            if (!stream) return;
            
            const canvas = document.createElement('canvas');
            canvas.width = cameraStream.videoWidth;
            canvas.height = cameraStream.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(cameraStream, 0, 0);
            
            canvas.toBlob(function(blob) {
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                handleFileUpload(file);
                closeCamera();
            }, 'image/jpeg', 0.9);
        });
    }
    
    // 關閉相機
    if (closeCameraBtn) {
        closeCameraBtn.addEventListener('click', closeCamera);
    }
    
    function closeCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraPreview.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// 6. 打印功能
// ============================================
function initPrintFunctionality() {
    // 創建打印按鈕（如果不存在）
    if (!document.getElementById('printBtn')) {
        const printBtn = document.createElement('button');
        printBtn.id = 'printBtn';
        printBtn.className = 'no-print';
        printBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 20px;background:#0066cc;color:white;border:none;border-radius:25px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
        printBtn.innerHTML = '<i class="fas fa-print"></i> 打印';
        document.body.appendChild(printBtn);
    }
    
    // 打印按鈕事件
    document.getElementById('printBtn').addEventListener('click', function() {
        printDocument();
    });
    
    // 添加打印快捷鍵 Ctrl+P
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            printDocument();
        }
    });
}

function printDocument() {
    console.log('🖨️ 開始打印...');
    
    // 保存當前滾動位置
    const scrollPosition = window.scrollY;
    
    // 顯示打印指示
    showNotification('準備打印中...', 'info');
    
    // 短暫延遲後打印
    setTimeout(() => {
        window.print();
        
        // 恢復滾動位置
        setTimeout(() => {
            window.scrollTo(0, scrollPosition);
            showNotification('打印完成', 'success');
        }, 100);
    }, 500);
}

// ============================================
// 7. 事件監聽器
// ============================================
function initEventListeners() {
    // 返回按鈕
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (getCurrentStep() > 1) {
                showStep(getCurrentStep() - 1);
            } else {
                window.history.back();
            }
        });
    }
    
    // 幫助按鈕
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            showHelpModal();
        });
    }
    
    // 語言按鈕
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        langBtn.addEventListener('click', function() {
            toggleLanguage();
        });
    }
    
    // 文件操作按鈕
    const rotateBtn = document.getElementById('rotateBtn');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', rotateImage);
    }
    
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteFile);
    }
}

// ============================================
// 8. 時間顯示
// ============================================
function initTimeDisplay() {
    const timeElement = document.querySelector('.diggo-status-bar .time');
    if (!timeElement) return;
    
    function updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;
    }
    
    updateTime();
    setInterval(updateTime, 60000); // 每分鐘更新
}

// ============================================
// 工具函數
// ============================================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // 移除現有通知
    const existingNotification = document.querySelector('.diggo-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 創建新通知
    const notification = document.createElement('div');
    notification.className = `diggo-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="close-notification"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 關閉按鈕
    notification.querySelector('.close-notification').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    // 自動關閉
    if (type !== 'error') {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function showUpdateNotification() {
    if (document.getElementById('updateNotification')) return;
    
    const updateNotification = document.createElement('div');
    updateNotification.id = 'updateNotification';
    updateNotification.className = 'update-notification';
    updateNotification.innerHTML = `
        <div class="update-content">
            <i class="fas fa-sync-alt"></i>
            <div>
                <h4>新版本可用</h4>
                <p>有新版本更新可用，請刷新頁面以獲取最新功能</p>
            </div>
            <button id="refreshBtn" class="btn-primary">刷新</button>
        </div>
    `;
    
    document.body.appendChild(updateNotification);
    
    document.getElementById('refreshBtn').addEventListener('click', function() {
        window.location.reload();
    });
}

function showHelpModal() {
    // 創建幫助模態框
    const modal = document.createElement('div');
    modal.className = 'help-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-question-circle"></i> 幫助中心</h3>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <h4>如何使用OCR預約系統</h4>
                <ol>
                    <li><strong>步驟1：上傳文件</strong> - 拍攝或上傳醫療文件</li>
                    <li><strong>步驟2：識別內容</strong> - 系統自動提取關鍵信息</li>
                    <li><strong>步驟3：選擇診所</strong> - 根據位置選擇合適的醫療機構</li>
                    <li><strong>步驟4：確認預約</strong> - 填寫信息並確認預約</li>
                </ol>
                <h4>支持的文件格式</h4>
                <ul>
                    <li>圖片：JPG, PNG, GIF, WebP</li>
                    <li>文檔：PDF, DOC, DOCX</li>
                    <li>最大文件大小：10MB</li>
                </ul>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary close-modal">關閉</button>
                <button class="btn-primary" onclick="window.open('mailto:support@diggo.hk')">聯繫支持</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 關閉按鈕事件
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            modal.remove();
        });
    });
    
    // 點擊背景關閉
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function toggleLanguage() {
    const currentLang = document.documentElement.lang || 'zh-HK';
    const newLang = currentLang === 'zh-HK' ? 'en' : 'zh-HK';
    
    // 更新HTML lang屬性
    document.documentElement.lang = newLang;
    
    // 保存語言偏好
    localStorage.setItem('diggo-language', newLang);
    
    // 顯示通知
    showNotification(newLang === 'zh-HK' ? '已切換到繁體中文' : 'Switched to English', 'success');
    
    // 重新加載頁面以應用語言變化
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

function rotateImage() {
    const previewImage = document.getElementById('previewImage');
    if (!previewImage || previewImage.style.display === 'none') return;
    
    const currentRotation = parseInt(previewImage.getAttribute('data-rotation') || '0');
    const newRotation = (currentRotation + 90) % 360;
    
    previewImage.style.transform = `rotate(${newRotation}deg)`;
    previewImage.setAttribute('data-rotation', newRotation);
    
    showNotification('圖片已旋轉', 'success');
}

function deleteFile() {
    const previewImage = document.getElementById('previewImage');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewArea = document.getElementById('previewArea');
    const nextButton = document.getElementById('nextStep1');
    
    if (previewImage) {
        previewImage.src = '';
        previewImage.style.display = 'none';
    }
    
    if (uploadPlaceholder) {
        uploadPlaceholder.style.display = 'block';
    }
    
    if (previewArea) {
        previewArea.classList.remove('has-file');
    }
    
    if (nextButton) {
        nextButton.disabled = true;
    }
    
    // 重置文件信息
    const fileName = document.getElementById('fileName');
    const fileType = document.getElementById('fileType');
    const fileSize = document.getElementById('fileSize');
    
    if (fileName) fileName.textContent = '尚未選擇文件';
    if (fileType) fileType.textContent = '等待上傳';
    if (fileSize) fileSize.textContent = '--';
    
    showNotification('文件已刪除', 'success');
}

// ============================================
// PWA安裝提示
// ============================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 顯示安裝按鈕
    setTimeout(() => {
        showInstallPrompt();
    }, 3000);
});

function showInstallPrompt() {
    if (!deferredPrompt || document.getElementById('installPrompt')) return;
    
    const installPrompt = document.createElement('div');
    installPrompt.id = 'installPrompt';
    installPrompt.className = 'install-prompt';
    installPrompt.innerHTML = `
        <div class="install-content">
            <i class="fas fa-download"></i>
            <div>
                <h4>安裝 DigGO OCR</h4>
                <p>安裝到主屏幕，隨時隨地使用</p>
            </div>
            <div class="install-actions">
                <button class="btn-secondary" id="cancelInstall">稍後</button>
                <button class="btn-primary" id="confirmInstall">安裝</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(installPrompt);
    
    // 安裝按鈕事件
    document.getElementById('confirmInstall').addEventListener('click', async () => {
        installPrompt.remove();
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`用戶 ${outcome} 安裝`);
        deferredPrompt = null;
    });
    
    // 取消按鈕事件
    document.getElementById('cancelInstall').addEventListener('click', () => {
        installPrompt.remove();
        localStorage.setItem('installPromptDismissed', 'true');
    });
}

// ============================================
// 離線檢測
// ============================================
window.addEventListener('online', () => {
    showNotification('網絡已恢復', 'success');
});

window.addEventListener('offline', () => {
    showNotification('網絡連接中斷，部分功能受限', 'warning');
});

// ============================================
// 導出全局函數
// ============================================
window.DigGO = {
    showStep,
    printDocument,
    openCamera,
    showNotification,
    toggleLanguage
};

console.log('🚀 DigGO OCR 預約系統已載入');
