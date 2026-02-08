// ocr-appointment.js - DigGO OCR掃描器核心邏輯
// 這個文件包含從文件上傳到表格自動填寫的所有JavaScript功能

// ===== 全局變量和配置 =====
let currentStep = 1;
let selectedFile = null;
let ocrResult = null;
let extractedData = {};
let tesseractWorker = null;
let currentImage = null;
let currentRotation = 0;

// 支持的醫療文件類型
const SUPPORTED_FILE_TYPES = {
    '醫管局轉介信': ['referral', '醫院管理局'],
    '醫生轉介信': ['referral', '醫生轉介'],
    '化驗報告': ['report', '化驗', '檢驗'],
    '醫療記錄': ['record', '病歷', '記錄'],
    '收據單據': ['receipt', '收據', '單據']
};

// ===== 主初始化函數 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DigGO OCR掃描器初始化完成');
    
    // 初始化時間顯示
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 60000); // 每分鐘更新
    
    // 設置事件監聽器
    setupEventListeners();
    
    // 初始化表單自動完成
    setupAutoComplete();
    
    // 初始化步驟指示器
    updateStepIndicator();
    
    // 檢查是否有草稿保存
    checkForSavedDraft();
});

// ===== 工具函數 =====

// 更新時間顯示
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-HK', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// 顯示Toast通知
function showToast(message, type = 'info') {
    // 創建或獲取Toast容器
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // 創建Toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // 設置圖標
    const icons = {
        'success': '✓',
        'error': '✗',
        'warning': '!',
        'info': 'i'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // 添加到容器
    toastContainer.appendChild(toast);
    
    // 自動移除
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 4000);
}

// 顯示加載動畫
function showLoading(message = '處理中...') {
    let loadingOverlay = document.getElementById('loading-overlay');
    
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        loadingOverlay.style.display = 'flex';
        const loadingText = loadingOverlay.querySelector('.loading-text');
        if (loadingText) loadingText.textContent = message;
    }
}

// 隱藏加載動畫
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

// ===== 步驟控制 =====

// 更新步驟指示器
function updateStepIndicator() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
    
    // 顯示對應的步驟內容
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const currentSection = document.getElementById(`step${currentStep}`);
    if (currentSection) {
        currentSection.classList.add('active');
    }
}

// 跳轉到指定步驟
function goToStep(stepNumber) {
    if (stepNumber >= 1 && stepNumber <= 4) {
        currentStep = stepNumber;
        updateStepIndicator();
        
        // 滾動到頂部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 下一步
function nextStep() {
    if (currentStep < 4) {
        goToStep(currentStep + 1);
    }
}

// 上一步
function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1);
    }
}

// ===== 文件處理函數 =====

// 觸發文件選擇
function triggerFileInput() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.click();
    }
}

// 處理文件選擇
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 檢查文件類型
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
        showToast('請選擇圖片或PDF文件', 'error');
        return;
    }
    
    // 檢查文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
        showToast('文件太大，請選擇小於10MB的文件', 'error');
        return;
    }
    
    selectedFile = file;
    showFilePreview(file);
    showToast('文件已選擇，請預覽確認', 'success');
}

// 顯示文件預覽
function showFilePreview(file) {
    const previewArea = document.getElementById('previewArea');
    const imagePreview = document.getElementById('imagePreview');
    const pdfPreview = document.getElementById('pdfPreview');
    
    if (!previewArea || !imagePreview || !pdfPreview) return;
    
    // 顯示預覽區域
    previewArea.style.display = 'block';
    
    if (file.type.startsWith('image/')) {
        // 處理圖片文件
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            currentImage = new Image();
            currentImage.src = e.target.result;
            
            currentImage.onload = function() {
                // 調整預覽大小
                const maxWidth = 400;
                const maxHeight = 400;
                let width = currentImage.width;
                let height = currentImage.height;
                
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (maxHeight / height) * width;
                    height = maxHeight;
                }
                
                imagePreview.style.width = `${width}px`;
                imagePreview.style.height = `${height}px`;
            };
            
            imagePreview.style.display = 'block';
            pdfPreview.style.display = 'none';
        };
        
        reader.readAsDataURL(file);
        
    } else if (file.type === 'application/pdf') {
        // 處理PDF文件（簡化處理）
        imagePreview.style.display = 'none';
        pdfPreview.style.display = 'block';
        showToast('PDF文件已加載，開始識別時會提取第一頁內容', 'info');
    }
    
    // 滾動到預覽區域
    previewArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 移除文件
function removeFile() {
    selectedFile = null;
    currentImage = null;
    currentRotation = 0;
    
    const previewArea = document.getElementById('previewArea');
    const imagePreview = document.getElementById('imagePreview');
    const fileInput = document.getElementById('fileInput');
    
    if (previewArea) previewArea.style.display = 'none';
    if (imagePreview) {
        imagePreview.src = '';
        imagePreview.style.transform = 'rotate(0deg)';
    }
    if (fileInput) fileInput.value = '';
    
    showToast('文件已移除', 'info');
}

// 旋轉圖片
function rotateImage() {
    if (!currentImage) {
        showToast('請先上傳圖片', 'warning');
        return;
    }
    
    currentRotation = (currentRotation + 90) % 360;
    const imagePreview = document.getElementById('imagePreview');
    
    if (imagePreview) {
        imagePreview.style.transform = `rotate(${currentRotation}deg)`;
    }
    
    showToast(`圖片已旋轉 ${currentRotation}度`, 'info');
}

// ===== OCR處理函數 =====

// 開始OCR處理
async function processOCR() {
    if (!selectedFile) {
        showToast('請先選擇文件', 'error');
        return;
    }
    
    if (!selectedFile.type.startsWith('image/')) {
        showToast('目前僅支持圖片格式的OCR識別', 'error');
        return;
    }
    
    showLoading('正在進行OCR文字識別...');
    
    try {
        // 初始化Tesseract.js
        if (!tesseractWorker) {
            tesseractWorker = await Tesseract.createWorker('chi_sim+eng', 1, {
                logger: m => updateOCRProgress(m),
                errorHandler: err => {
                    console.error('Tesseract錯誤:', err);
                    showToast('OCR引擎初始化失敗', 'error');
                }
            });
        }
        
        // 準備圖片數據
        const imageData = await prepareImageForOCR();
        
        // 執行OCR識別
        const result = await tesseractWorker.recognize(imageData);
        
        // 處理結果
        ocrResult = result;
        displayOCRResults(result);
        
        // 提取關鍵信息
        extractKeyInformation(result.data.text);
        
        // 更新信心指數
        updateConfidenceScore(result.data.confidence);
        
        hideLoading();
        showToast('OCR識別完成！', 'success');
        
        // 自動跳到下一步
        setTimeout(() => {
            nextStep();
        }, 1000);
        
    } catch (error) {
        console.error('OCR處理失敗:', error);
        hideLoading();
        showToast(`OCR識別失敗: ${error.message}`, 'error');
        
        // 使用模擬數據作為備用方案
        useMockOCRData();
    }
}

// 準備圖片用於OCR
function prepareImageForOCR() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!currentImage) {
            resolve('');
            return;
        }
        
        // 根據旋轉角度調整畫布大小
        let width = currentImage.width;
        let height = currentImage.height;
        
        if (currentRotation === 90 || currentRotation === 270) {
            [width, height] = [height, width];
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 應用旋轉和繪製
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        
        // 移動到中心點
        ctx.translate(canvas.width / 2, canvas.height / 2);
        
        // 應用旋轉
        const radians = (currentRotation * Math.PI) / 180;
        ctx.rotate(radians);
        
        // 繪製圖片
        ctx.drawImage(
            currentImage,
            -currentImage.width / 2,
            -currentImage.height / 2
        );
        
        ctx.restore();
        
        // 應用圖像增強（提高OCR準確度）
        enhanceImageForOCR(ctx, canvas);
        
        // 轉換為數據URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
    });
}

// 增強圖像對比度（提高OCR準確度）
function enhanceImageForOCR(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 簡單對比度增強
    const contrast = 1.5; // 對比度系數
    const brightness = 10; // 亮度調整
    
    for (let i = 0; i < data.length; i += 4) {
        // 紅色通道
        data[i] = contrast * (data[i] - 128) + 128 + brightness;
        // 綠色通道
        data[i + 1] = contrast * (data[i + 1] - 128) + 128 + brightness;
        // 藍色通道
        data[i + 2] = contrast * (data[i + 2] - 128) + 128 + brightness;
        
        // 限制值在0-255之間
        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// 更新OCR進度
function updateOCRProgress(message) {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    if (!progressText || !progressFill) return;
    
    if (message.status === 'recognizing text') {
        const progress = Math.min(95, message.progress * 100);
        progressText.textContent = `${Math.round(progress)}%`;
        progressFill.style.width = `${progress}%`;
    } else if (message.status === 'done') {
        progressText.textContent = '100%';
        progressFill.style.width = '100%';
    }
}

// 顯示OCR結果
function displayOCRResults(result) {
    const rawTextElement = document.getElementById('rawText');
    if (rawTextElement && result.data.text) {
        rawTextElement.value = result.data.text;
    }
}

// 更新信心指數
function updateConfidenceScore(confidence) {
    const confidenceElement = document.getElementById('confidenceValue');
    if (confidenceElement && confidence) {
        // 將信心值轉換為百分比（70-95%範圍）
        const confidencePercent = Math.min(95, Math.max(70, confidence));
        confidenceElement.textContent = `${Math.round(confidencePercent)}%`;
    }
}

// 提取關鍵信息
function extractKeyInformation(text) {
    extractedData = {};
    const infoGrid = document.getElementById('extractedInfo');
    
    if (!infoGrid || !text) return;
    
    infoGrid.innerHTML = '';
    
    // 定義要提取的信息模式和正則表達式
    const patterns = [
        {
            label: '姓名',
            regex: /(姓名|病人姓名|患者姓名)[：:\s]*([^\n\r]+)/i,
            key: 'patientName'
        },
        {
            label: '身份證',
            regex: /(身份證|身份證號碼|ID)[：:\s]*([A-Z][0-9]{6}\([0-9A-Z]\)|[0-9]{8})/i,
            key: 'patientID'
        },
        {
            label: '電話',
            regex: /(電話|聯絡電話|手機)[：:\s]*([0-9\s\-]{8,})/i,
            key: 'phoneNumber'
        },
        {
            label: '日期',
            regex: /(日期|轉介日期|報告日期)[：:\s]*([0-9]{4}[年/\-][0-9]{1,2}[月/\-][0-9]{1,2}日?)/i,
            key: 'documentDate'
        },
        {
            label: '醫生',
            regex: /(醫生|轉介醫生|主診醫生)[：:\s]*([^\n\r]+)/i,
            key: 'referringDoctor'
        },
        {
            label: '診斷',
            regex: /(診斷|初步診斷|臨床診斷)[：:\s]*([^\n\r]+)/i,
            key: 'diagnosis'
        },
        {
            label: '醫院',
            regex: /(醫院|醫療機構|診所)[：:\s]*([^\n\r]+)/i,
            key: 'hospitalClinic'
        }
    ];
    
    // 執行匹配
    let extractedCount = 0;
    
    patterns.forEach(pattern => {
        const match = text.match(pattern.regex);
        if (match && match[2]) {
            const value = match[2].trim();
            extractedData[pattern.key] = value;
            extractedCount++;
            
            // 添加到顯示網格
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';
            infoItem.innerHTML = `
                <div class="info-label">${pattern.label}</div>
                <div class="info-value">${value}</div>
            `;
            infoGrid.appendChild(infoItem);
        }
    });
    
    // 如果沒有提取到信息，顯示提示
    if (extractedCount === 0) {
        infoGrid.innerHTML = `
            <div class="no-info-message">
                <i class="fas fa-info-circle"></i>
                <p>未自動識別到關鍵信息，請手動填寫表格或檢查圖片質量</p>
            </div>
        `;
    }
}

// 使用模擬OCR數據（開發和測試用）
function useMockOCRData() {
    const mockText = `醫管局專科門診轉介信

轉介醫院：瑪麗醫院
轉介日期：2024年1月15日

病人資料：
姓名：陳大文
性別：男
出生日期：1980年5月15日
身份證號碼：A123456(7)
聯絡電話：9123-4567
地址：香港中環皇后大道中100號

臨床資料：
主診醫生：李國強醫生
專科：內科
診斷：原發性高血壓
病歷號碼：MH-2024-00123

建議檢查：
1. 24小時血壓監測
2. 血液檢查（全血圖、腎功能、肝功能、血脂、血糖）
3. 心電圖（ECG）
4. 心臟超聲波檢查

轉介原因：
病人血壓控制不理想，需進一步評估心血管風險及靶器官損害。

注意事項：
請於14天內安排檢查，結果請送回本院內科門診。

醫生簽署：李國強醫生
醫生編號：HKMC12345
日期：2024年1月15日`;
    
    // 顯示模擬文本
    const rawTextElement = document.getElementById('rawText');
    if (rawTextElement) {
        rawTextElement.value = mockText;
    }
    
    // 模擬提取的信息
    const mockData = {
        patientName: '陳大文',
        patientID: 'A123456(7)',
        phoneNumber: '91234567',
        documentDate: '2024年1月15日',
        referringDoctor: '李國強醫生',
        diagnosis: '原發性高血壓',
        hospitalClinic: '瑪麗醫院'
    };
    
    extractedData = mockData;
    
    // 顯示提取的信息
    const infoGrid = document.getElementById('extractedInfo');
    if (infoGrid) {
        infoGrid.innerHTML = '';
        
        Object.entries(mockData).forEach(([key, value]) => {
            const labelMap = {
                patientName: '姓名',
                patientID: '身份證',
                phoneNumber: '電話',
                documentDate: '日期',
                referringDoctor: '醫生',
                diagnosis: '診斷',
                hospitalClinic: '醫院'
            };
            
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';
            infoItem.innerHTML = `
                <div class="info-label">${labelMap[key] || key}</div>
                <div class="info-value">${value}</div>
            `;
            infoGrid.appendChild(infoItem);
        });
    }
    
    // 更新信心指數
    updateConfidenceScore(85);
    
    showToast('使用模擬數據進行演示', 'info');
}

// ===== 表格處理函數 =====

// 設置表單自動完成
function setupAutoComplete() {
    // 為表格字段添加自動完成建議
    const fieldsWithSuggestions = {
        'diagnosis': ['高血壓', '糖尿病', '高血脂', '冠心病', '哮喘'],
        'recommendedTests': [
            '血液檢查', '尿液檢查', '心電圖', 'X光檢查',
            '超聲波掃描', '磁力共振', '電腦斷層掃描'
        ]
    };
    
    Object.entries(fieldsWithSuggestions).forEach(([fieldId, suggestions]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                showAutoSuggestions(fieldId, suggestions);
            });
        }
    });
}

// 顯示自動完成建議
function showAutoSuggestions(fieldId, suggestions) {
    // 實現自動完成下拉框
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    // 移除現有的建議框
    const existingSuggestions = document.getElementById(`suggestions-${fieldId}`);
    if (existingSuggestions) {
        existingSuggestions.remove();
    }
    
    // 如果字段為空，不顯示建議
    if (!field.value.trim()) return;
    
    // 過濾匹配的建議
    const input = field.value.toLowerCase();
    const matched = suggestions.filter(s => 
        s.toLowerCase().includes(input)
    );
    
    if (matched.length === 0) return;
    
    // 創建建議框
    const suggestionsBox = document.createElement('div');
    suggestionsBox.id = `suggestions-${fieldId}`;
    suggestionsBox.className = 'autocomplete-suggestions';
    
    // 添加建議項目
    matched.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        item.addEventListener('click', function() {
            field.value = suggestion;
            suggestionsBox.remove();
        });
        suggestionsBox.appendChild(item);
    });
    
    // 定位並添加建議框
    const rect = field.getBoundingClientRect();
    suggestionsBox.style.position = 'absolute';
    suggestionsBox.style.top = `${rect.bottom + window.scrollY}px`;
    suggestionsBox.style.left = `${rect.left + window.scrollX}px`;
    suggestionsBox.style.width = `${rect.width}px`;
    
    document.body.appendChild(suggestionsBox);
    
    // 點擊外部時移除建議框
    document.addEventListener('click', function removeSuggestions(e) {
        if (!field.contains(e.target) && !suggestionsBox.contains(e.target)) {
            suggestionsBox.remove();
            document.removeEventListener('click', removeSuggestions);
        }
    });
}

// 提取到表格
function extractToForm() {
    if (!ocrResult && Object.keys(extractedData).length === 0) {
        showToast('請先進行OCR識別', 'warning');
        return;
    }
    
    showLoading('正在自動填充表格...');
    
    // 使用提取的數據填充表格
    const formData = prepareFormData();
    populateFormWithData(formData);
    
    setTimeout(() => {
        hideLoading();
        showToast('表格已自動填充', 'success');
        
        // 跳轉到表格步驟
        nextStep();
    }, 1500);
}

// 準備表單數據
function prepareFormData() {
    const formData = {};
    
    // 從提取的數據映射到表單字段
    const fieldMapping = {
        'patientName': 'patientName',
        'patientID': 'patientID',
        'phoneNumber': 'phoneNumber',
        'documentDate': 'referralDate',
        'referringDoctor': 'referringDoctor',
        'diagnosis': 'diagnosis',
        'hospitalClinic': 'hospitalClinic'
    };
    
    // 複製提取的數據
    Object.entries(extractedData).forEach(([key, value]) => {
        const formField = fieldMapping[key];
        if (formField) {
            formData[formField] = value;
        }
    });
    
    // 設置默認值
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    formData.preferredDate = formatDateForInput(tomorrow);
    formData.urgencyLevel = 'routine';
    
    return formData;
}

// 格式化日期為YYYY-MM-DD
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 用數據填充表單
function populateFormWithData(formData) {
    Object.entries(formData).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            
            // 為自動填充的字段添加視覺反饋
            if (value && !field.dataset.userEdited) {
                highlightAutoFilledField(field);
            }
        }
    });
    
    // 特殊處理：從OCR文本提取建議檢查項目
    extractRecommendedTests();
}

// 高亮自動填充的字段
function highlightAutoFilledField(field) {
    field.classList.add('auto-filled');
    
    // 添加自動填充標記
    const container = field.closest('.form-group');
    if (container && !container.querySelector('.auto-fill-badge')) {
        const badge = document.createElement('div');
        badge.className = 'auto-fill-badge';
        badge.innerHTML = '<i class="fas fa-robot"></i> 自動識別';
        container.appendChild(badge);
        
        // 3秒後淡出
        setTimeout(() => {
            badge.style.opacity = '0.5';
        }, 3000);
    }
    
    // 標記字段已被用戶編輯
    field.addEventListener('input', function onFieldEdit() {
        field.classList.remove('auto-filled');
        field.dataset.userEdited = 'true';
        field.removeEventListener('input', onFieldEdit);
    }, { once: true });
}

// 從OCR文本提取建議檢查項目
function extractRecommendedTests() {
    if (!ocrResult) return;
    
    const text = ocrResult.data.text;
    const testsField = document.getElementById('recommendedTests');
    
    if (!testsField) return;
    
    // 查找常見的檢查項目
    const testPatterns = [
        /(血液檢查|驗血|blood test)/i,
        /(尿液檢查|驗尿|urine test)/i,
        /(心電圖|ECG|EKG)/i,
        /(X光|X-ray|X光檢查)/i,
        /(超聲波|ultrasound|超聲波掃描)/i,
        /(磁力共振|MRI)/i,
        /(電腦斷層|CT scan|CT掃描)/i,
        /(內窺鏡|胃鏡|腸鏡)/i
    ];
    
    const foundTests = [];
    
    testPatterns.forEach(pattern => {
        const match = text.match(pattern);
        if (match) {
            foundTests.push(match[1] || match[0]);
        }
    });
    
    // 如果有找到檢查項目，填充到字段
    if (foundTests.length > 0) {
        testsField.value = foundTests.join('、');
        highlightAutoFilledField(testsField);
    }
}

// 重置表格
function resetForm() {
    if (confirm('確定要重置表格嗎？所有已填寫的內容將會丟失。')) {
        document.getElementById('appointmentForm').reset();
        
        // 移除所有自動填充標記
        document.querySelectorAll('.auto-fill-badge').forEach(badge => {
            badge.remove();
        });
        
        // 移除自動填充高亮
        document.querySelectorAll('.auto-filled').forEach(field => {
            field.classList.remove('auto-filled');
        });
        
        showToast('表格已重置', 'info');
    }
}

// 檢查是否有保存的草稿
function checkForSavedDraft() {
    const savedDraft = localStorage.getItem('diggoOcrDraft');
    if (savedDraft) {
        const loadDraftBtn = document.getElementById('loadDraftBtn');
        if (loadDraftBtn) {
            loadDraftBtn.style.display = 'block';
            loadDraftBtn.addEventListener('click', loadSavedDraft);
        }
    }
}

// 加載保存的草稿
function loadSavedDraft() {
    const savedDraft = localStorage.getItem('diggoOcrDraft');
    if (savedDraft) {
        try {
            const draftData = JSON.parse(savedDraft);
            populateFormWithData(draftData);
            showToast('草稿已加載', 'success');
        } catch (error) {
            console.error('加載草稿失敗:', error);
            showToast('加載草稿失敗', 'error');
        }
    }
}

// 保存為草稿
function saveAsDraft() {
    const formData = collectFormData();
    localStorage.setItem('diggoOcrDraft', JSON.stringify(formData));
    showToast('草稿已保存', 'success');
}

// 收集表單數據
function collectFormData() {
    const form = document.getElementById('appointmentForm');
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

// ===== 事件監聽器設置 =====
function setupEventListeners() {
    // 文件輸入事件
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // 底部導航按鈕
    document.querySelectorAll('.bottom-nav .nav-item').forEach((item, index) => {
        item.addEventListener('click', function() {
            goToStep(index + 1);
        });
    });
    
    // 表單字段編輯事件
    document.querySelectorAll('#appointmentForm input, #appointmentForm textarea').forEach(field => {
        field.addEventListener('input', function() {
            this.dataset.userEdited = 'true';
            this.classList.remove('auto-filled');
        });
    });
    
    // 複製文本按鈕
    const copyBtn = document.getElementById('copyTextBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyRawText);
    }
    
    // 清空文本按鈕
    const clearBtn = document.getElementById('clearTextBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearText);
    }
    
    // 編輯文本按鈕
    const editBtn = document.getElementById('editTextBtn');
    if (editBtn) {
        editBtn.addEventListener('click', toggleTextEdit);
    }
    
    // 幫助按鈕
    const helpBtn = document.querySelector('.help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showHelp);
    }
}

// 複製原始文本
function copyRawText() {
    const rawText = document.getElementById('rawText');
    if (rawText && rawText.value) {
        rawText.select();
        document.execCommand('copy');
        showToast('文本已複製到剪貼板', 'success');
    } else {
        showToast('沒有文本可複製', 'warning');
    }
}

// 清空文本
function clearText() {
    const rawText = document.getElementById('rawText');
    if (rawText && confirm('確定要清空識別結果嗎？')) {
        rawText.value = '';
        showToast('文本已清空', 'info');
    }
}

// 切換文本編輯模式
function toggleTextEdit() {
    const rawText = document.getElementById('rawText');
    if (rawText) {
        rawText.readOnly = !rawText.readOnly;
        
        if (!rawText.readOnly) {
            rawText.focus();
            showToast('現在可以編輯文本，編輯完成後請點擊保存', 'info');
        } else {
            showToast('文本已鎖定', 'info');
        }
    }
}

// 顯示幫助信息
function showHelp() {
    const helpText = `智能OCR掃描器使用指南：

1. 上傳文件
   • 點擊「拍攝照片」或「選擇文件」
   • 支持JPG、PNG、PDF格式
   • 確保文件清晰、光線充足

2. OCR識別
   • 點擊「開始識別」
   • 系統自動識別中英文文本
   • 提取關鍵醫療信息

3. 表格填寫
   • 自動填充識別的信息
   • 可手動編輯修正
   • 點擊「自動填表」快速填充

4. 發送預約
   • 選擇診所/化驗中心
   • 選擇發送方式
   • 確認並發送預約

提示：轉介信越清晰，識別準確度越高！`;
    
    alert(helpText);
}

// ===== 頁面導航助手 =====
function goToHome() {
    if (confirm('返回首頁？未保存的更改將會丟失。')) {
        window.location.href = 'index.html';
    }
}

function goToHistory() {
    showToast('歷史記錄功能開發中', 'info');
}

// ===== 頁面卸載前提示保存 =====
window.addEventListener('beforeunload', function(event) {
    const form = document.getElementById('appointmentForm');
    if (form) {
        const hasData = Array.from(form.elements).some(element => 
            (element.type !== 'submit' && element.value.trim())
        );
        
        if (hasData && !confirm('頁面有未保存的更改，確定要離開嗎？')) {
            event.preventDefault();
            event.returnValue = '';
        }
    }
});

// ===== 初始化完成 =====
console.log('OCR Appointment JS loaded successfully');

// 導出主要函數供HTML調用
window.processOCR = processOCR;
window.extractToForm = extractToForm;
window.resetForm = resetForm;
window.saveAsDraft = saveAsDraft;
window.rotateImage = rotateImage;
window.removeFile = removeFile;
window.triggerFileInput = triggerFileInput;
window.goToStep = goToStep;
window.nextStep = nextStep;
window.prevStep = prevStep;
