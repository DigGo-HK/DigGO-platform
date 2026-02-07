// DigGO Platform - Main JavaScript
console.log('DigGO Platform loaded successfully!');

// DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // 1. Navigation active state
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const pageName = this.querySelector('i').className.replace('fas fa-', '');
            console.log(`Navigating to: ${pageName}`);
        });
    });
    
    // 2. Search functionality
    const searchButton = document.querySelector('.btn-search');
    const searchInput = document.querySelector('.search-input input');
    const locationInput = document.querySelector('.search-location input');
    
    searchButton.addEventListener('click', function() {
        const query = searchInput.value.trim();
        const location = locationInput.value.trim();
        
        if (!query) {
            alert('Please enter what you are looking for!');
            searchInput.focus();
            return;
        }
        
        console.log(`Searching for: "${query}" in ${location}`);
        showSearchResults(query, location);
    });
    
    // Enter key search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
    
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });
    
    // 3. Quick tags click
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagText = this.textContent.replace(/[^a-zA-Z& ]/g, '').trim();
            searchInput.value = tagText;
            console.log(`Selected tag: ${tagText}`);
            
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
    
    // 4. Login button
    const loginButton = document.querySelector('.btn-login');
    loginButton.addEventListener('click', function() {
        const isLoggedIn = this.textContent.includes('Sign In');
        
        if (isLoggedIn) {
            this.innerHTML = '<i class="fas fa-user"></i> DigGo-HK';
            this.style.background = 'linear-gradient(45deg, #4cd964, #5ac8fa)';
            console.log('User logged in: DigGo-HK');
            alert('Welcome back, DigGo-HK!');
        } else {
            this.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            this.style.background = 'linear-gradient(45deg, #4a6cf7, #6a11cb)';
            console.log('User logged out');
            alert('Successfully logged out!');
        }
    });
    
    // 5. Discovery cards click
    const discoveryCards = document.querySelectorAll('.discovery-card');
    discoveryCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h4').textContent;
            const tag = this.querySelector('.discovery-tag').textContent;
            console.log(`Selected discovery: ${title} (${tag})`);
            
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
            setTimeout(() => {
                this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
            }, 300);
            
            alert(`You selected: ${title}\nCategory: ${tag}\n\nThis feature is coming soon!`);
        });
    });
    
    // 6. Social media icons
    const socialIcons = document.querySelectorAll('.social-icons a');
    socialIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.querySelector('i').className.replace('fab fa-', '');
            console.log(`Opening ${platform} page`);
            alert(`${platform.charAt(0).toUpperCase() + platform.slice(1)} link would open here!`);
        });
    });
    
    // 7. GitHub link
    const githubLink = document.querySelector('.github-link a');
    if (githubLink) {
        githubLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Opening GitHub repository');
            window.open('https://github.com/DigGo-HK/DigGO-platform', '_blank');
        });
    }
    
    // 8. Scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
            navbar.style.padding = '10px 0';
        } else {
            navbar.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
            navbar.style.padding = '15px 0';
        }
    });
    
    console.log('DigGO Platform initialized successfully!');
});

// Search results function
function showSearchResults(query, location) {
    const results = [
        `Found 15 "${query}" places in ${location}`,
        `Top recommendation: "Hidden ${query} Spot" - 4.8 stars`,
        `Community tip: Try the ${query} experience at Central`
    ];
    
    alert(`🔍 Search Results:\n\n${results.join('\n\n')}\n\n(Full search functionality coming soon!)`);
    
    const searchBtn = document.querySelector('.btn-search');
    const originalText = searchBtn.innerHTML;
    
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    searchBtn.disabled = true;
    
    setTimeout(() => {
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }, 1500);
}

// Current time function (FIXED VERSION)
function updateDateTime() {
    const now = new Date();
    const dateTimeStr = now.toLocaleDateString('en-HK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    console.log(`Current Hong Kong time: ${dateTimeStr}`);
    return dateTimeStr;
}

// Show time on page load
window.onload = function() {
    updateDateTime();
    setInterval(updateDateTime, 60000);
};
