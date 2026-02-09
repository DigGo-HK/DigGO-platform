// DigGO OCR 預約系統 Service Worker
// 版本: 1.0
// 功能: 離線緩存、推送通知、背景同步

const CACHE_NAME = 'diggo-ocr-v1';
const OFFLINE_URL = '/offline.html';

// 需要緩存的資源列表
const PRECACHE_RESOURCES = [
    '/',
    '/index.html',
    '/ocr-appointment.html',
    '/ocr-styles.css',
    '/ocr-appointment.js',
    '/styles.css',
    '/app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap'
];

// 安裝事件 - 預緩存重要資源
self.addEventListener('install', event => {
    console.log('[Service Worker] 安裝中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] 緩存核心資源');
                return cache.addAll(PRECACHE_RESOURCES);
            })
            .then(() => {
                console.log('[Service Worker] 安裝完成');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[Service Worker] 安裝失敗:', error);
            })
    );
});

// 激活事件 - 清理舊緩存
self.addEventListener('activate', event => {
    console.log('[Service Worker] 激活中...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] 刪除舊緩存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] 激活完成');
            return self.clients.claim();
        })
    );
});

// 擷取事件 - 網絡優先，失敗時使用緩存
self.addEventListener('fetch', event => {
    // 跳過非GET請求和非HTTP請求
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // 對於API請求，使用網絡優先策略
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // 緩存API響應
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // 網絡失敗時嘗試從緩存獲取
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 對於靜態資源，使用緩存優先策略
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // 更新緩存（後台）
                    fetch(event.request)
                        .then(response => {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, responseClone);
                            });
                        });
                    return cachedResponse;
                }
                
                // 緩存中沒有，從網絡獲取
                return fetch(event.request)
                    .then(response => {
                        // 檢查是否為有效響應
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // 緩存新的資源
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // 網絡失敗，且請求的是HTML頁面，返回離線頁面
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                        return new Response('網絡連接失敗', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// 推送通知事件
self.addEventListener('push', event => {
    console.log('[Service Worker] 收到推送通知:', event);
    
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'DigGO OCR 預約系統';
    const options = {
        body: data.body || '您有新的通知',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 通知點擊事件
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] 通知被點擊:', event.notification.tag);
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // 如果已有窗口打開，聚焦它
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // 否則打開新窗口
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
    );
});

// 背景同步事件
self.addEventListener('sync', event => {
    console.log('[Service Worker] 背景同步事件:', event.tag);
    
    if (event.tag === 'sync-appointment') {
        event.waitUntil(syncAppointmentData());
    }
});

// 背景同步函數
async function syncAppointmentData() {
    try {
        const db = await openAppointmentDB();
        const pendingAppointments = await getPendingAppointments(db);
        
        for (const appointment of pendingAppointments) {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointment)
            });
            
            if (response.ok) {
                await markAppointmentAsSynced(db, appointment.id);
            }
        }
        
        console.log('[Service Worker] 背景同步完成');
    } catch (error) {
        console.error('[Service Worker] 背景同步失敗:', error);
    }
}

// IndexedDB 相關函數
function openAppointmentDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DigGO_OCR_DB', 1);
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('appointments')) {
                const store = db.createObjectStore('appointments', { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
            }
        };
        
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

function getPendingAppointments(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['appointments'], 'readonly');
        const store = transaction.objectStore('appointments');
        const index = store.index('status');
        const request = index.getAll('pending');
        
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

function markAppointmentAsSynced(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['appointments'], 'readwrite');
        const store = transaction.objectStore('appointments');
        const request = store.get(id);
        
        request.onsuccess = function(event) {
            const appointment = event.target.result;
            if (appointment) {
                appointment.status = 'synced';
                appointment.syncedAt = new Date().toISOString();
                
                const updateRequest = store.put(appointment);
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = (e) => reject(e.target.error);
            } else {
                resolve();
            }
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// 監聽消息
self.addEventListener('message', event => {
    console.log('[Service Worker] 收到消息:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_RESOURCES') {
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(event.data.urls);
        });
    }
});
