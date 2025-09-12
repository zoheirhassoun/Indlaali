// AI Chat functionality for إندلالي - المعلمة الذكية
// Handles educational AI interactions and UI management

document.addEventListener('DOMContentLoaded', function() {
    // Wait for CONFIG and apiService to be available for educational AI
    function waitForEducationalScripts() {
        if (typeof CONFIG !== 'undefined' && typeof apiService !== 'undefined') {
            console.log('CONFIG available:', true);
            console.log('apiService available:', true);
            initializeEducationalAI();
        } else {
            console.log('Waiting for educational scripts to load...');
            setTimeout(waitForEducationalScripts, 100);
        }
    }

    // Initialize educational AI functionality
    function initializeEducationalAI() {
        console.log('Initializing Educational AI...');
        
        // DOM Elements for Educational AI
        const submitEducationalQueryBtn = document.getElementById('submit-educational-query');
        const educationalQueryTextarea = document.getElementById('educational-query');
        const educationalResultContent = document.getElementById('educational-result-content');
        const educationalResultActions = document.getElementById('educational-result-actions');
        const educationalCopyBtn = document.getElementById('educational-copy-btn');
        const educationalPrintBtn = document.getElementById('educational-print-btn');
        const educationalRatingSection = document.getElementById('educational-rating-section');
        const educationalPositiveRatingBtn = document.getElementById('educational-positive-rating');
        const educationalNegativeRatingBtn = document.getElementById('educational-negative-rating');
        const educationalCommentSection = document.getElementById('educational-comment-section');
        const educationalUserCommentTextarea = document.getElementById('educational-user-comment');
        const educationalSubmitRatingBtn = document.getElementById('educational-submit-rating');

        // Hide loading state when page is ready
        function hideEducationalLoadingState() {
            const loadingElement = document.getElementById('educational-initial-loading');
            const placeholderElement = document.getElementById('educational-placeholder-text');
            
            if (typeof CONFIG !== 'undefined' && typeof apiService !== 'undefined') {
                console.log('All educational scripts loaded successfully');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
                if (placeholderElement) {
                    placeholderElement.style.display = 'block';
                }
            } else {
                console.log('Educational scripts not ready yet, retrying...');
                setTimeout(hideEducationalLoadingState, 500);
            }
        }

        // Start checking when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', hideEducationalLoadingState);
        } else {
            hideEducationalLoadingState();
        }

        // Analytics tracking for educational queries
        let educationalSessionData = {
            queryCount: 0,
            positiveRatings: 0,
            negativeRatings: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            n8nUsage: 0,
            fallbackUsage: 0
        };

        // Educational Query Submission
        if (submitEducationalQueryBtn) {
            submitEducationalQueryBtn.addEventListener('click', async () => {
                // Check if CONFIG is available
                if (typeof CONFIG === 'undefined') {
                    educationalResultContent.innerHTML = `
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>خطأ في تحميل الإعدادات. يرجى تحديث الصفحة.</p>
                        </div>
                    `;
                    return;
                }
                
                const query = educationalQueryTextarea.value.trim();
                
                if (!query) {
                    alert(CONFIG.ERROR_MESSAGES.QUERY_EMPTY);
                    return;
                }
                
                if (query.length < 10) {
                    alert(CONFIG.ERROR_MESSAGES.QUERY_TOO_SHORT);
                    return;
                }
                
                // Show loading state
                submitEducationalQueryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';
                submitEducationalQueryBtn.disabled = true;
                
                try {
                    // Check if apiService is available
                    if (typeof apiService === 'undefined') {
                        educationalResultContent.innerHTML = `
                            <div class="error-message">
                                <i class="fas fa-exclamation-triangle"></i>
                                <p>خطأ في تحميل خدمة API. يرجى تحديث الصفحة.</p>
                            </div>
                        `;
                        return;
                    }
                    
                    // Use API service to send educational query
                    const result = await apiService.sendEducationalQuery(query);
                    
                    // Update result content
                    educationalResultContent.innerHTML = `
                        <div class="educational-response">
                            <h4>إجابة المعلمة الذكية:</h4>
                            <p>${result.data.answer}</p>
                            ${result.data.recommendations && result.data.recommendations.length > 0 ? `
                                <h4>التوصيات:</h4>
                                <ul>
                                    ${result.data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                                </ul>
                            ` : ''}
                            ${result.source === 'fallback' ? `
                                <div class="fallback-notice">
                                    <i class="fas fa-info-circle"></i>
                                    <small>تم استخدام الإجابة الاحتياطية (نظام n8n غير متاح حالياً)</small>
                                </div>
                            ` : ''}
                        </div>
                    `;
                    
                    // Update time
                    const actualTime = (result.responseTime / 1000).toFixed(1);
                    const timeElement = document.querySelector('#educational-consultation-result .time');
                    if (timeElement) {
                        timeElement.textContent = `الوقت: ${actualTime} ثانية`;
                    }
                    
                    // Show result actions and rating section
                    if (educationalResultActions) {
                        educationalResultActions.style.display = 'block';
                    }
                    if (educationalRatingSection) {
                        educationalRatingSection.style.display = 'block';
                    }
                    
                    // Track analytics
                    educationalSessionData.queryCount++;
                    educationalSessionData.totalResponseTime += parseFloat(actualTime);
                    educationalSessionData.averageResponseTime = educationalSessionData.totalResponseTime / educationalSessionData.queryCount;
                    
                    if (result.source === 'n8n') {
                        educationalSessionData.n8nUsage++;
                    } else {
                        educationalSessionData.fallbackUsage++;
                    }
                    
                    // Log to console for analytics
                    console.log('Educational query submitted:', {
                        query: query,
                        responseTime: actualTime,
                        source: result.source,
                        sessionData: educationalSessionData
                    });
                    
                } catch (error) {
                    educationalResultContent.innerHTML = `<p class="error">${error.message}</p>`;
                    console.error('Error processing educational query:', error);
                } finally {
                    // Reset button state
                    submitEducationalQueryBtn.innerHTML = '<i class="fas fa-brain"></i> أرسل سؤالك للمعلمة الذكية';
                    submitEducationalQueryBtn.disabled = false;
                }
            });
        }

        // دعم الإرسال عند الضغط على Enter في textarea
        if (educationalQueryTextarea) {
            educationalQueryTextarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (submitEducationalQueryBtn) {
                        submitEducationalQueryBtn.click();
                    }
                }
            });
        }

        // Copy Answer Functionality for Educational
        if (educationalCopyBtn) {
            educationalCopyBtn.addEventListener('click', async () => {
                try {
                    const answerText = getEducationalAnswerText();
                    if (answerText) {
                        await navigator.clipboard.writeText(answerText);
                        
                        // Show success feedback
                        educationalCopyBtn.classList.add('copied');
                        educationalCopyBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
                        
                        // Reset button after 2 seconds
                        setTimeout(() => {
                            educationalCopyBtn.classList.remove('copied');
                            educationalCopyBtn.innerHTML = '<i class="fas fa-copy"></i> نسخ الإجابة';
                        }, 2000);
                        
                        console.log('Educational answer copied to clipboard');
                    }
                } catch (error) {
                    console.error('Failed to copy educational answer:', error);
                    // Fallback for older browsers
                    fallbackCopyEducationalTextToClipboard(getEducationalAnswerText());
                }
            });
        }

        // Print Answer Functionality for Educational
        if (educationalPrintBtn) {
            educationalPrintBtn.addEventListener('click', () => {
                try {
                    const answerElement = document.querySelector('.educational-response');
                    if (!answerElement) {
                        alert('لا توجد إجابة للطباعة');
                        return;
                    }
                    
                    console.log('Educational answer element found:', answerElement);

                    // Create a new window for printing
                    const printWindow = window.open('', '_blank', 'width=800,height=600');
                    
                    if (!printWindow) {
                        alert('فشل في فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة أو المحاولة مرة أخرى.');
                        return;
                    }
                    
                    // Get current date and time
                    const currentDate = new Date().toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // Create print content
                    const printContent = `
                        <!DOCTYPE html>
                        <html dir="rtl" lang="ar">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>إندلالي - المعلمة الذكية</title>
                            <style>
                                body {
                                    font-family: 'Arial', sans-serif;
                                    line-height: 1.6;
                                    color: #333;
                                    max-width: 800px;
                                    margin: 0 auto;
                                    padding: 20px;
                                }
                                .print-header {
                                    text-align: center;
                                    border-bottom: 2px solid #2d5016;
                                    padding-bottom: 15px;
                                    margin-bottom: 30px;
                                }
                                .print-title {
                                    font-size: 24pt;
                                    font-weight: bold;
                                    margin-bottom: 10px;
                                    color: #2d5016;
                                }
                                .print-subtitle {
                                    font-size: 14pt;
                                    color: #666;
                                    margin-bottom: 20px;
                                }
                                .print-content {
                                    font-size: 12pt;
                                    line-height: 1.6;
                                    color: #000;
                                }
                                .print-content h4 {
                                    font-size: 16pt;
                                    font-weight: bold;
                                    margin: 20px 0 15px 0;
                                    color: #2d5016;
                                    border-bottom: 1px solid #ccc;
                                    padding-bottom: 5px;
                                }
                                .print-content p {
                                    margin: 10px 0;
                                    text-align: justify;
                                }
                                .print-content ul {
                                    margin: 15px 0;
                                    padding-right: 20px;
                                }
                                .print-content li {
                                    margin: 8px 0;
                                }
                                .print-footer {
                                    margin-top: 40px;
                                    padding-top: 20px;
                                    border-top: 1px solid #ccc;
                                    font-size: 10pt;
                                    color: #666;
                                }
                                @media print {
                                    .no-print { display: none !important; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="print-header">
                                <div class="print-title">إندلالي - المعلمة الذكية</div>
                                <div class="print-subtitle">استشارة تعليمية</div>
                            </div>
                            
                            <div class="print-content">
                                ${answerElement.innerHTML}
                            </div>
                            
                            <div class="print-footer">
                                <div>تاريخ الطباعة: ${currentDate}</div>
                                <div>تم إنشاء هذه الوثيقة بواسطة إندلالي - المعلمة الذكية</div>
                            </div>
                            
                            <div class="print-actions no-print" style="text-align: center; margin: 20px 0;">
                                <button onclick="window.print()" style="background: #2d5016; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 0 10px;">طباعة</button>
                                <button onclick="window.close()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 0 10px;">إغلاق</button>
                            </div>
                        </body>
                        </html>
                    `;

                    // Write content to the new window
                    try {
                        printWindow.document.write(printContent);
                        printWindow.document.close();
                        
                        // Wait for content to load then print
                        printWindow.onload = function() {
                            try {
                                setTimeout(() => {
                                    printWindow.print();
                                }, 500);
                            } catch (printError) {
                                console.error('Print error:', printError);
                                alert('حدث خطأ أثناء الطباعة: ' + printError.message);
                            }
                        };
                        
                        // Fallback - auto print after delay if onload doesn't fire
                        setTimeout(() => {
                            if (printWindow && !printWindow.closed) {
                                try {
                                    printWindow.print();
                                } catch (fallbackPrintError) {
                                    console.error('Fallback print error:', fallbackPrintError);
                                }
                            }
                        }, 2000);
                        
                        console.log('Educational print window opened successfully');
                    } catch (writeError) {
                        console.error('Error writing to print window:', writeError);
                        printWindow.close();
                        alert('فشل في إعداد محتوى الطباعة: ' + writeError.message);
                    }
                } catch (error) {
                    console.error('Failed to print educational answer:', error);
                    
                    // طريقة بديلة للطباعة - إنشاء صفحة طباعة في نفس النافذة
                    if (confirm('فشل في فتح نافذة طباعة منفصلة. هل تريد طباعة الصفحة الحالية؟')) {
                        // إخفاء جميع العناصر عدا الإجابة
                        const originalDisplay = [];
                        const elementsToHide = document.querySelectorAll('body > *:not(.consultation)');
                        elementsToHide.forEach((element, index) => {
                            originalDisplay[index] = element.style.display;
                            element.style.display = 'none';
                        });
                        
                        // إضافة عنوان للطباعة
                        const printHeader = document.createElement('div');
                        printHeader.innerHTML = `
                            <h1 style="text-align: center; color: #2d5016; margin-bottom: 2rem;">
                                إندلالي - المعلمة الذكية
                            </h1>
                            <h2 style="text-align: center; color: #666; margin-bottom: 2rem;">
                                استشارة تعليمية
                            </h2>
                        `;
                        document.body.insertBefore(printHeader, document.body.firstChild);
                        
                        // طباعة الصفحة
                        window.print();
                        
                        // استعادة الحالة الأصلية
                        setTimeout(() => {
                            document.body.removeChild(printHeader);
                            elementsToHide.forEach((element, index) => {
                                element.style.display = originalDisplay[index];
                            });
                        }, 1000);
                    }
                }
            });
        }

        // Helper function to get educational answer text
        function getEducationalAnswerText() {
            const answerElement = document.querySelector('.educational-response');
            if (answerElement) {
                // Get the text content without HTML tags
                let text = '';
                
                // Add title
                const title = answerElement.querySelector('h4');
                if (title) {
                    text += title.textContent + '\n\n';
                }
                
                // Add answer paragraphs
                const paragraphs = answerElement.querySelectorAll('p');
                paragraphs.forEach(p => {
                    text += p.textContent + '\n\n';
                });
                
                // Add recommendations if available
                const recommendations = answerElement.querySelector('ul');
                if (recommendations) {
                    text += 'التوصيات:\n';
                    const listItems = recommendations.querySelectorAll('li');
                    listItems.forEach(li => {
                        text += '• ' + li.textContent + '\n';
                    });
                    text += '\n';
                }
                
                // Add timestamp
                const timeElement = document.querySelector('#educational-consultation-result .time');
                if (timeElement) {
                    text += timeElement.textContent + '\n';
                }
                
                return text.trim();
            }
            return '';
        }

        // Fallback copy function for older browsers
        function fallbackCopyEducationalTextToClipboard(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful && educationalCopyBtn) {
                    // Show success feedback
                    educationalCopyBtn.classList.add('copied');
                    educationalCopyBtn.innerHTML = '<i class="fas fa-check"></i> تم النسخ!';
                    
                    // Reset button after 2 seconds
                    setTimeout(() => {
                        educationalCopyBtn.classList.remove('copied');
                        educationalCopyBtn.innerHTML = '<i class="fas fa-copy"></i> نسخ الإجابة';
                    }, 2000);
                    
                    console.log('Educational answer copied using fallback method');
                }
            } catch (err) {
                console.error('Fallback copy failed:', err);
                alert('فشل في نسخ النص. يرجى المحاولة مرة أخرى.');
            }
            
            document.body.removeChild(textArea);
        }

        // Educational Rating System
        if (educationalPositiveRatingBtn) {
            educationalPositiveRatingBtn.addEventListener('click', () => {
                selectEducationalRating('positive');
            });
        }

        if (educationalNegativeRatingBtn) {
            educationalNegativeRatingBtn.addEventListener('click', () => {
                selectEducationalRating('negative');
            });
        }

        function selectEducationalRating(type) {
            // Remove previous selection
            if (educationalPositiveRatingBtn) {
                educationalPositiveRatingBtn.classList.remove('selected');
            }
            if (educationalNegativeRatingBtn) {
                educationalNegativeRatingBtn.classList.remove('selected');
            }
            
            // Add selection to clicked button
            if (type === 'positive' && educationalPositiveRatingBtn) {
                educationalPositiveRatingBtn.classList.add('selected');
            } else if (type === 'negative' && educationalNegativeRatingBtn) {
                educationalNegativeRatingBtn.classList.add('selected');
            }
            
            // Show comment section
            if (educationalCommentSection) {
                educationalCommentSection.style.display = 'block';
            }
        }

        // Submit Educational Rating
        if (educationalSubmitRatingBtn) {
            educationalSubmitRatingBtn.addEventListener('click', async () => {
                // Check if CONFIG is available
                if (typeof CONFIG === 'undefined') {
                    alert('خطأ في تحميل الإعدادات. يرجى تحديث الصفحة.');
                    return;
                }
                
                const selectedRating = educationalPositiveRatingBtn && educationalPositiveRatingBtn.classList.contains('selected') ? 'positive' : 
                                      educationalNegativeRatingBtn && educationalNegativeRatingBtn.classList.contains('selected') ? 'negative' : null;
                
                if (!selectedRating) {
                    alert(CONFIG.ERROR_MESSAGES.RATING_REQUIRED);
                    return;
                }
                
                const comment = educationalUserCommentTextarea ? educationalUserCommentTextarea.value.trim() : '';
                
                // Show loading state
                educationalSubmitRatingBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
                educationalSubmitRatingBtn.disabled = true;
                
                try {
                    // Prepare rating data with additional information
                    const ratingData = {
                        rating: selectedRating,
                        comment: comment,
                        timestamp: new Date().toISOString(),
                        sessionId: educationalSessionData.queryCount,
                        userAgent: navigator.userAgent,
                        language: navigator.language || 'ar',
                        queryText: educationalQueryTextarea ? educationalQueryTextarea.value.trim() : '', // نص الاستفسار الأصلي
                        responseTime: educationalSessionData.lastResponseTime || 0, // وقت الاستجابة
                        source: 'web',
                        context: 'educational',
                        pageUrl: window.location.href,
                        screenResolution: `${screen.width}x${screen.height}`,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    };
                    
                    // Check if apiService is available for rating
                    if (typeof apiService === 'undefined') {
                        alert('خطأ في تحميل خدمة API. يرجى تحديث الصفحة.');
                        return;
                    }
                    
                    // Submit rating via API service
                    const result = await apiService.submitRating(ratingData);
                    
                    // Track rating locally
                    if (selectedRating === 'positive') {
                        educationalSessionData.positiveRatings++;
                    } else {
                        educationalSessionData.negativeRatings++;
                    }
                    
                    // Calculate satisfaction rate
                    const totalRatings = educationalSessionData.positiveRatings + educationalSessionData.negativeRatings;
                    const satisfactionRate = totalRatings > 0 ? (educationalSessionData.positiveRatings / totalRatings * 100).toFixed(1) : 0;
                    
                    // Log rating submission
                    console.log('Educational rating submitted:', {
                        rating: selectedRating,
                        satisfactionRate: satisfactionRate,
                        result: result,
                        sessionData: educationalSessionData
                    });
                    
                    // Show success message
                    alert('شكراً لك! تم إرسال تقييمك بنجاح.');
                    
                    // Reset rating section
                    resetEducationalRatingSection();
                    
                } catch (error) {
                    console.error('Error submitting educational rating:', error);
                    alert('حدث خطأ في إرسال التقييم. يرجى المحاولة مرة أخرى.');
                } finally {
                    // Reset button state
                    educationalSubmitRatingBtn.innerHTML = 'إرسال التقييم';
                    educationalSubmitRatingBtn.disabled = false;
                }
            });
        }

        function resetEducationalRatingSection() {
            if (educationalPositiveRatingBtn) {
                educationalPositiveRatingBtn.classList.remove('selected');
            }
            if (educationalNegativeRatingBtn) {
                educationalNegativeRatingBtn.classList.remove('selected');
            }
            if (educationalCommentSection) {
                educationalCommentSection.style.display = 'none';
            }
            if (educationalUserCommentTextarea) {
                educationalUserCommentTextarea.value = '';
            }
            if (educationalRatingSection) {
                educationalRatingSection.style.display = 'none';
            }
            if (educationalResultActions) {
                educationalResultActions.style.display = 'none';
            }
        }

        // Form validation for educational queries
        if (educationalQueryTextarea) {
            educationalQueryTextarea.addEventListener('input', () => {
                const query = educationalQueryTextarea.value.trim();
                if (submitEducationalQueryBtn) {
                    submitEducationalQueryBtn.disabled = query.length < 10;
                    
                    if (query.length < 10) {
                        submitEducationalQueryBtn.style.opacity = '0.6';
                    } else {
                        submitEducationalQueryBtn.style.opacity = '1';
                    }
                }
            });

            // Auto-save form data
            educationalQueryTextarea.addEventListener('input', () => {
                localStorage.setItem('educationalQuery', educationalQueryTextarea.value);
            });
        }

        // Restore educational form data on page load
        window.addEventListener('load', () => {
            const savedQuery = localStorage.getItem('educationalQuery');
            if (savedQuery && educationalQueryTextarea) {
                educationalQueryTextarea.value = savedQuery;
            }
            
            // Initialize analytics
            console.log('إندلالي - المعلمة الذكية');
            console.log('Educational AI System - Analytics initialized');
        });

        console.log('إندلالي - المعلمة الذكية - تم تحميل النظام بنجاح!');
    }

    // Start waiting for educational scripts
    waitForEducationalScripts();
});
