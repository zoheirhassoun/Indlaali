// API Service for إندلالي - المعلمة الذكية
// Handles n8n webhook integration with fallback to mock responses

class ApiService {
    constructor() {
        this.retryCount = 0;
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
    }

    /**
     * Send educational query to n8n webhook
     * @param {string} query - The user's educational query
     * @returns {Promise<Object>} - Response from n8n or fallback
     */
    async sendEducationalQuery(query) {
        const startTime = Date.now();
        
        try {
            // Validate query
            if (!query || query.trim().length < 10) {
                throw new Error(CONFIG.ERROR_MESSAGES.QUERY_TOO_SHORT);
            }

            // Check for specific query about إندلالي identity first (before any network calls)
            const identityKeywords = ['إندلالي', 'اندلالي', 'من هي إندلالي', 'من هي اندلالي', 'تعريف إندلالي', 'تعريف اندلالي'];
            const isIdentityQuery = identityKeywords.some(keyword => 
                query.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (isIdentityQuery) {
                const customResponse = {
                    answer: 'إندلالي هي المعلمة ريم مشاري المطيري، تخصص مكتبات ومعلومات ومعلمة لمادة البحث ومصادر المعلومات ومشروع التخرج. تهدف إلى مساعدة الطلاب والباحثين في فهم خطوات البحث العلمي ومشاريع التخرج.',
                    recommendations: [
                        'يمكنك سؤالي عن أي موضوع في البحث العلمي ومصادر المعلومات',
                        'أقدم المساعدة في خطوات البحث العلمي ومشاريع التخرج',
                        'أهدف إلى تقديم معلومات دقيقة ومفيدة في مجال البحث العلمي'
                    ],
                    confidence: 1.0,
                    model: 'custom_identity'
                };
                
                const responseTime = Date.now() - startTime;
                return {
                    success: true,
                    data: customResponse,
                    responseTime: responseTime,
                    source: 'custom'
                };
            }

            // Check if online
            if (!this.isOnline) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            }

            // Try n8n webhook for other queries
            const response = await this.callN8nWebhook(query);
            
            // Calculate response time
            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                data: response,
                responseTime: responseTime,
                source: 'n8n'
            };

        } catch (error) {
            console.warn('n8n webhook failed:', error);
            console.log('Error details:', error.message);
            console.log('Error stack:', error.stack);
            
            // If fallback is enabled, use mock response
            if (CONFIG.ENABLE_FALLBACK) {
                console.log('Using fallback mock response');
                const fallbackResponse = this.generateFallbackResponse(query);
                const responseTime = Date.now() - startTime;
                
                return {
                    success: true,
                    data: fallbackResponse,
                    responseTime: responseTime,
                    source: 'fallback',
                    originalError: error.message
                };
            }
            
            throw error;
        }
    }

    /**
     * Call n8n webhook with retry mechanism
     * @param {string} query - The user's query
     * @returns {Promise<Object>} - Response from n8n
     */
    async callN8nWebhook(query) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

        try {
            console.log('Calling n8n webhook:', CONFIG.N8N_WEBHOOK_URL);
            console.log('Request payload:', { chatInput: query.trim() });
            console.log('Timeout set to:', CONFIG.API_TIMEOUT + 'ms');
            
            const startTime = Date.now();
            const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    chatInput: query.trim(),
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    language: navigator.language || 'ar',
                    context: 'educational'
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            const responseTime = Date.now() - startTime;
            console.log('n8n response received in:', responseTime + 'ms');

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Debug logging
            console.log('n8n response:', data);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            // Validate response format according to architecture
            if (!data) {
                console.warn('Empty response from n8n:', data);
                throw new Error(CONFIG.ERROR_MESSAGES.INVALID_RESPONSE);
            }
            
            // Handle different response formats
            let answer = '';
            if (typeof data.text === 'string') {
                answer = data.text;
            } else if (typeof data.answer === 'string') {
                answer = data.answer;
            } else if (typeof data === 'string') {
                answer = data;
            } else {
                console.warn('Invalid response format from n8n:', data);
                throw new Error(CONFIG.ERROR_MESSAGES.INVALID_RESPONSE);
            }

            return {
                answer: answer,
                recommendations: data.recommendations || [],
                confidence: data.confidence || 0.8,
                model: data.model || 'gpt-4.1-mini'
            };

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
            }
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            }
            
            throw error;
        }
    }

    /**
     * Generate fallback response when n8n is unavailable
     * @param {string} query - The user's query
     * @returns {Object} - Mock response
     */
    generateFallbackResponse(query) {
        // Check for specific query about إندلالي identity
        const identityKeywords = ['إندلالي', 'اندلالي', 'من هي إندلالي', 'من هي اندلالي', 'تعريف إندلالي', 'تعريف اندلالي'];
        const isIdentityQuery = identityKeywords.some(keyword => 
            query.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (isIdentityQuery) {
            return {
                answer: 'إندلالي هي المعلمة ريم مشاري المطيري، تخصص مكتبات ومعلومات ومعلمة لمادة البحث ومصادر المعلومات ومشروع التخرج. تهدف إلى مساعدة الطلاب والباحثين في فهم خطوات البحث العلمي ومشاريع التخرج.',
                recommendations: [
                    'يمكنك سؤالي عن أي موضوع في البحث العلمي ومصادر المعلومات',
                    'أقدم المساعدة في خطوات البحث العلمي ومشاريع التخرج',
                    'أهدف إلى تقديم معلومات دقيقة ومفيدة في مجال البحث العلمي'
                ],
                confidence: 1.0,
                model: 'custom_identity'
            };
        }
        
        const responses = {
            'تعلم': {
                answer: 'التعلم الفعال يتطلب التنظيم والتخطيط. أنصحك بوضع جدول زمني محدد وتقسيم المواد إلى أجزاء صغيرة قابلة للإدارة. استخدم تقنيات مثل التكرار المتباعد والتعلم النشط.',
                recommendations: [
                    'ضع جدولاً زمنياً واضحاً للدراسة',
                    'استخدم تقنية البومودورو (25 دقيقة دراسة + 5 دقائق راحة)',
                    'اعتمد على التعلم النشط بدلاً من القراءة السلبية'
                ]
            },
            'مهارات': {
                answer: 'تطوير المهارات الأكاديمية يتطلب الممارسة المستمرة والتقييم الذاتي. ركز على مهارات التفكير النقدي، القراءة السريعة، وإدارة الوقت.',
                recommendations: [
                    'مارس مهارات التفكير النقدي بانتظام',
                    'تعلم تقنيات القراءة السريعة والفهم',
                    'طور مهارات إدارة الوقت والتنظيم'
                ]
            },
            'بحث': {
                answer: 'البحث العلمي يتطلب منهجية واضحة ومصادر موثقة. ابدأ بتحديد موضوع البحث بدقة، ثم اجمع المصادر من قواعد البيانات الأكاديمية الموثوقة.',
                recommendations: [
                    'حدد موضوع البحث بدقة ووضوح',
                    'استخدم قواعد البيانات الأكاديمية الموثوقة',
                    'وثق المصادر بطريقة علمية صحيحة'
                ]
            },
            'امتحان': {
                answer: 'للاستعداد للامتحانات بفعالية، ابدأ مبكراً وضع خطة مراجعة تدريجية. استخدم أساليب متنوعة مثل الملخصات، الخرائط الذهنية، والاختبارات التجريبية.',
                recommendations: [
                    'ابدأ الاستعداد مبكراً مع خطة واضحة',
                    'استخدم الخرائط الذهنية والملخصات',
                    'مارس الاختبارات التجريبية'
                ]
            },
            'قراءة': {
                answer: 'تحسين مهارات القراءة يتطلب الممارسة المنتظمة وتنويع المواد المقروءة. ركز على فهم المعنى العام أولاً، ثم انتقل للتفاصيل.',
                recommendations: [
                    'اقرأ بانتظام من مصادر متنوعة',
                    'استخدم تقنية القراءة التدريجية',
                    'لخص ما تقرأ لتعزيز الفهم'
                ]
            },
            'كتابة': {
                answer: 'تطوير مهارات الكتابة الأكاديمية يتطلب التدريب على التنظيم والوضوح. ابدأ بوضع مخطط واضح، ثم اكتب بأسلوب منطقي ومترابط.',
                recommendations: [
                    'ضع مخططاً قبل بدء الكتابة',
                    'استخدم جملاً واضحة ومباشرة',
                    'راجع وحرر نصوصك بعناية'
                ]
            }
        };

        // Find matching response
        for (const [key, response] of Object.entries(responses)) {
            if (query.includes(key)) {
                return {
                    ...response,
                    confidence: 0.7,
                    model: 'fallback'
                };
            }
        }

        // Default response
        return {
            answer: 'بناءً على استفسارك التعليمي، أنصحك بالتشاور مع معلم متخصص للحصول على إرشاد مفصل. هذه إجابة مبدئية تهدف إلى توجيهك في الاتجاه الصحيح.',
            recommendations: [
                'حدد أهدافك التعليمية بوضوح',
                'استشر معلمين متخصصين في المجال',
                'استخدم مصادر تعليمية متنوعة وموثوقة'
            ],
            confidence: 0.5,
            model: 'fallback'
        };
    }

    /**
     * Submit user rating to Google Sheets via Google Apps Script
     * @param {Object} ratingData - Rating information
     * @returns {Promise<Object>} - Response from Google Apps Script
     */
    async submitRating(ratingData) {
        console.log('submitRating called with data:', JSON.stringify(ratingData));
        
        try {
            if (!this.isOnline) {
                console.log('Offline mode: Rating stored locally');
                return { success: true, source: 'local' };
            }

            // إضافة معلومات إضافية للتقييم
            const enhancedRatingData = {
                ...ratingData,
                ipAddress: await this.getClientIP(),
                source: 'web',
                timestamp: new Date().toISOString(),
                context: 'educational'
            };
            
            console.log('Enhanced rating data:', JSON.stringify(enhancedRatingData));

            // محاولة إرسال إلى Google Sheets أولاً
            try {
                console.log('Attempting to submit to Google Sheets...');
                const googleResponse = await this.submitToGoogleSheets(enhancedRatingData);
                if (googleResponse.success) {
                    console.log('Rating saved to Google Sheets successfully');
                    return { success: true, source: 'google-sheets', data: googleResponse };
                }
            } catch (googleError) {
                console.warn('Google Sheets submission failed:', googleError);
            }

            // إذا فشل Google Sheets، جرب n8n كبديل
            try {
                const n8nResponse = await fetch('https://zoheir.app.n8n.cloud/webhook/de59295e-acda-4cfb-b178-3e8ba6dcc17f/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(enhancedRatingData)
                });

                if (n8nResponse.ok) {
                    const result = await n8nResponse.json();
                    return { success: true, source: 'n8n', data: result };
                }
            } catch (n8nError) {
                console.warn('n8n submission failed:', n8nError);
            }

            // إذا فشل كلاهما، احفظ محلياً
            console.log('All remote submissions failed, storing locally');
            this.storeRatingLocally(enhancedRatingData);
            return { success: true, source: 'local' };

        } catch (error) {
            console.warn('Rating submission failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * إرسال التقييم إلى Google Sheets
     */
    async submitToGoogleSheets(ratingData) {
        console.log('submitToGoogleSheets called with data:', JSON.stringify(ratingData));
        
        // التحقق من إعدادات Google Sheets
        if (!CONFIG.GOOGLE_SHEETS || !CONFIG.GOOGLE_SHEETS.ENABLED) {
            console.error('Google Sheets integration is disabled');
            throw new Error('Google Sheets integration is disabled');
        }

        const scriptUrl = CONFIG.GOOGLE_SHEETS.SCRIPT_URL;
        console.log('Script URL:', scriptUrl);
        
        if (!scriptUrl || scriptUrl === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            console.error('Google Apps Script URL not configured');
            throw new Error('Google Apps Script URL not configured');
        }
        
        // استخدام GET مباشرة (أكثر موثوقية)
        try {
            const params = new URLSearchParams();
            params.append('action', 'submitRating');
            params.append('data', JSON.stringify(ratingData));
            
            const getUrl = `${scriptUrl}?${params.toString()}`;
            console.log('Attempting GET request to:', getUrl);
            
            const getResponse = await fetch(getUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            });

            console.log('GET Response status:', getResponse.status);
            console.log('GET Response ok:', getResponse.ok);

            if (!getResponse.ok) {
                const errorText = await getResponse.text();
                console.error('GET Response error text:', errorText);
                throw new Error(`HTTP ${getResponse.status}: ${errorText}`);
            }

            const result = await getResponse.json();
            console.log('GET Response JSON:', JSON.stringify(result));
            return result;
            
        } catch (getError) {
            console.error('GET method failed:', getError);
            
            // محاولة POST كبديل (في حالة نادرة)
            try {
                console.log('Attempting POST request as fallback...');
                console.log('Request body:', JSON.stringify(ratingData));
                
                const response = await fetch(scriptUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ratingData)
                });

                console.log('POST Response status:', response.status);
                console.log('POST Response ok:', response.ok);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('POST Response error text:', errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                const result = await response.json();
                console.log('POST Response JSON:', JSON.stringify(result));
                return result;
                
            } catch (postError) {
                console.error('Both GET and POST methods failed:', postError);
                throw postError;
            }
        }
    }

    /**
     * الحصول على عنوان IP للمستخدم (تقريبي)
     */
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not get client IP:', error);
            return 'unknown';
        }
    }

    /**
     * حفظ التقييم محلياً في localStorage
     */
    storeRatingLocally(ratingData) {
        try {
            const storedRatings = JSON.parse(localStorage.getItem('indlali_ratings') || '[]');
            storedRatings.push({
                ...ratingData,
                storedAt: new Date().toISOString()
            });
            
            // حفظ آخر 50 تقييم فقط
            if (storedRatings.length > 50) {
                storedRatings.splice(0, storedRatings.length - 50);
            }
            
            localStorage.setItem('indlali_ratings', JSON.stringify(storedRatings));
            console.log('Rating stored locally');
        } catch (error) {
            console.error('Error storing rating locally:', error);
        }
    }

    /**
     * Check if n8n webhook is available
     * @returns {Promise<boolean>} - True if available
     */
    async checkN8nHealth() {
        try {
            const response = await fetch('https://zoheir.app.n8n.cloud/webhook/de59295e-acda-4cfb-b178-3e8ba6dcc17f/chat', {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create global instance
window.apiService = new ApiService();

// Also make apiService available as a const for compatibility
const apiService = window.apiService;

// Debug log to confirm loading
console.log('apiService loaded successfully:', window.apiService ? 'YES' : 'NO');

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
