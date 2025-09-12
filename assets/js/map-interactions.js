// Enhanced Interactive Map JavaScript
// إضافة تفاعلات متقدمة للخريطة التفاعلية

document.addEventListener('DOMContentLoaded', function() {
    // Initialize map interactions
    initMapInteractions();
});

function initMapInteractions() {
    const cityMarkers = document.querySelectorAll('.city-marker');
    const mapContainer = document.querySelector('.map-container');
    const mapImage = document.querySelector('.interactive-map img');
    
    // Add click ripple effect
    cityMarkers.forEach(marker => {
        marker.addEventListener('click', function(e) {
            e.stopPropagation();
            addRippleEffect(this);
            showCityDetails(this);
        });
        
        // Add hover sound effect (optional)
        marker.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
        });
        
        marker.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
        });
    });
    
    // Add map container interactions (مبسط لمنع المشاكل)
    if (mapContainer) {
        mapContainer.addEventListener('mousemove', function(e) {
            // تأثير خفيف فقط بدون دوران
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // تأثير خفيف فقط
            const moveX = (x - rect.width / 2) * 0.005;
            const moveY = (y - rect.height / 2) * 0.005;
            
            this.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
        
        mapContainer.addEventListener('mouseleave', function() {
            this.style.transform = 'translate(0px, 0px)';
        });
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllCityDetails();
        }
    });
    
    // Add touch interactions for mobile
    if ('ontouchstart' in window) {
        addTouchInteractions();
    }
}

function addRippleEffect(element) {
    // Remove existing ripple
    const existingRipple = element.querySelector('.ripple-effect');
    if (existingRipple) {
        existingRipple.remove();
    }
    
    // Create ripple element
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.6);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 5;
        animation: ripple 0.6s ease-out;
    `;
    
    element.appendChild(ripple);
    
    // Remove ripple after animation
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.remove();
        }
    }, 600);
}

function showCityDetails(marker) {
    const cityName = marker.querySelector('.city-name').textContent;
    const percentage = marker.querySelector('.percentage').textContent;
    
    // Create details modal
    const modal = document.createElement('div');
    modal.className = 'city-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 15px;
        text-align: center;
        max-width: 400px;
        margin: 1rem;
        transform: scale(0.8);
        transition: transform 0.3s ease;
    `;
    
    content.innerHTML = `
        <h3 style="color: #2c3e50; margin-bottom: 1rem;">${cityName}</h3>
        <div style="font-size: 3rem; font-weight: bold; color: #3498db; margin: 1rem 0;">${percentage}</div>
        <p style="color: #666; margin-bottom: 1.5rem;">نسبة التغطية التعليمية</p>
        <button onclick="this.closest('.city-details-modal').remove()" 
                style="background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
            إغلاق
        </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Animate modal
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        content.style.transform = 'scale(1)';
    });
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function hideAllCityDetails() {
    const modals = document.querySelectorAll('.city-details-modal');
    modals.forEach(modal => modal.remove());
}

function addTouchInteractions() {
    const cityMarkers = document.querySelectorAll('.city-marker');
    
    cityMarkers.forEach(marker => {
        let touchStartTime;
        
        marker.addEventListener('touchstart', function(e) {
            touchStartTime = Date.now();
            this.style.transform = 'translate(-50%, -50%) scale(1.1)';
        });
        
        marker.addEventListener('touchend', function(e) {
            const touchDuration = Date.now() - touchStartTime;
            
            if (touchDuration < 200) { // Quick tap
                addRippleEffect(this);
                showCityDetails(this);
            }
            
            this.style.transform = 'translate(-50%, -50%) scale(1)';
        });
    });
}

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            width: 100px;
            height: 100px;
            opacity: 0;
        }
    }
    
    .city-details-modal {
        backdrop-filter: blur(5px);
    }
    
    .city-details-modal div {
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
`;
document.head.appendChild(style);
