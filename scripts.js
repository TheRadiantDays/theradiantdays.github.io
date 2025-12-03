// --- ICONS (SVG) ---
const ICONS = {
    sun: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    moon: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    speaker: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>',
    mute: '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
};

// --- INJECT CONTROLS ---
function injectControls() {
    const sections = document.querySelectorAll('.section');
    const controlsHTML = `
                <div class="section-controls">
                    <button class="control-btn theme-btn" onclick="toggleTheme()">
                        <span class="icon">${ICONS.sun}</span>
                        <span class="label">Switch Theme</span>
                    </button>
                    <button class="control-btn mute-btn" onclick="toggleMute()">
                        <span class="icon">${ICONS.mute}</span>
                        <span class="label">Mute Sounds</span>
                    </button>
                </div>
            `;
    sections.forEach(sec => {
        sec.insertAdjacentHTML('afterbegin', controlsHTML);
    });
}

// --- THEME TOGGLE LOGIC ---
let isLightMode = false;

function toggleTheme() {
    if (typeof audioManager !== 'undefined') audioManager.playThemeSwitch();
    const viewport = document.getElementById('viewport');

    // 1. Trigger Animation
    viewport.classList.add('flipping-world');

    // 2. Wait for 50%
    setTimeout(() => {
        isLightMode = !isLightMode;
        document.body.classList.toggle('light-mode');

        // Update ALL theme buttons
        const icons = document.querySelectorAll('.theme-btn .icon');
        icons.forEach(icon => {
            icon.innerHTML = isLightMode ? ICONS.moon : ICONS.sun;
        });

        viewport.classList.remove('flipping-world');
    }, 750);
}

function toggleMute() {
    if (typeof audioManager === 'undefined') return;

    audioManager.enabled = !audioManager.enabled;

    // Update ALL mute buttons
    const icons = document.querySelectorAll('.mute-btn .icon');
    icons.forEach(icon => {
        if (audioManager.enabled) {
            icon.innerHTML = ICONS.mute; // Active -> Show Mute Action
            audioManager.playClick();
        } else {
            icon.innerHTML = ICONS.speaker; // Muted -> Show Unmute Action
        }
    });
}

// Add BACK button to arcade controls (for game views only)
function addArcadeBackButton() {
    const arcadeSection = document.getElementById('sec-arcade');
    if (!arcadeSection) return;

    const controls = arcadeSection.querySelector('.section-controls');
    if (!controls) return;

    // Check if BACK button already exists
    if (controls.querySelector('.arcade-back-btn')) return;

    // Create the BACK button
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'control-btn arcade-back-btn';
    backBtn.innerHTML = '<span class="icon">←</span><span class="label">Back</span>';
    backBtn.onclick = showMenu;

    // Prepend BACK button before theme/mute
    controls.insertBefore(backBtn, controls.firstChild);
    arcadeBackBtn = backBtn;
}

// Remove BACK button from arcade controls
function removeArcadeBackButton() {
    const arcadeSection = document.getElementById('sec-arcade');
    if (!arcadeSection) return;

    const controls = arcadeSection.querySelector('.section-controls');
    if (!controls) return;

    const backBtn = controls.querySelector('.arcade-back-btn');
    if (backBtn) {
        backBtn.remove();
        arcadeBackBtn = null;
    }
}


// --- DATA: BLOG POSTS (DYNAMIC LOADING) ---
let allPosts = [];
const blogGrid = document.getElementById('blog-grid');
const blogReader = document.getElementById('blog-reader');
const readerTitle = document.getElementById('reader-title');
const readerDate = document.getElementById('reader-date');
const readerCategory = document.getElementById('reader-category');
const readerBody = document.getElementById('reader-body');
const blogMainTitle = document.getElementById('blog-title');
const yearFilter = document.getElementById('year-filter');
const categoryFilter = document.getElementById('category-filter');

// Load all blog posts from JSON files
async function loadAllPosts() {
    // Show loading indicator
    blogGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--neon-pink);">
                    <p style="font-size: 1.5rem; margin-bottom: 1rem;">⚡ LOADING POSTS...</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">Scanning archives...</p>
                </div>
            `;

    try {
        let postNumber = 1;
        allPosts = []; // Reset

        // Keep trying to load posts until we get a 404
        while (true) {
            try {
                const response = await fetch(`posts/${postNumber}.json`);
                if (!response.ok) {
                    console.log(`No more posts found after ${postNumber - 1}`);
                    break; // No more posts
                }

                const postData = await response.json();

                // Process post content from array format to HTML
                let contentHTML = '';
                let plainText = '';

                if (postData.content && Array.isArray(postData.content)) {
                    contentHTML = postData.content.map((item, index) => {
                        // Skip first H1 (Title) to prevent duplication
                        if (index === 0 && item.tag === 'h1') return '';

                        const tag = item.tag || 'p';
                        const text = item.text || '';
                        // Also extract plain text for description
                        const cleanText = text.replace(/<[^>]*>/g, ' ');
                        plainText += cleanText + ' ';
                        return `<${tag}>${text}</${tag}>`;
                    }).join('');
                }

                // Generate description
                let desc = '';
                if (postData.desc) {
                    desc = postData.desc;
                } else if (plainText.trim().length > 0) {
                    // Create description from content
                    desc = plainText.trim().substring(0, 150) + '...';
                } else {
                    desc = 'Read more...';
                }

                allPosts.push({
                    id: postNumber,
                    title: postData.title || 'Untitled Post',
                    date: postData.date || 'Unknown Date',
                    category: postData.category || 'Uncategorized',
                    content: contentHTML,
                    desc: desc
                });

                console.log(`✓ Loaded post ${postNumber}: ${postData.title}`);
                postNumber++;
            } catch (error) {
                console.log(`Stopped loading at post ${postNumber}:`, error.message);
                break; // Stop if fetch fails
            }
        }

        console.log(`Total posts loaded: ${allPosts.length}`);

        if (allPosts.length === 0) {
            blogGrid.innerHTML = '<div class="text-center text-gray-500">No posts found.</div>';
        } else {
            // Sort posts by ID descending (newest first)
            allPosts.sort((a, b) => b.id - a.id);
            // Initialize filters
            populateFilters();
            filteredPosts = [...allPosts];
            renderBlogGrid();
        }

    } catch (error) {
        console.error("Error loading posts:", error);
        blogGrid.innerHTML = '<div class="text-center text-red-500">Error loading posts.</div>';
    }
}

// Extract year from date string
function extractYear(dateString) {
    const match = dateString.match(/\d{4}/);
    return match ? match[0] : 'Unknown';
}

// Populate filter dropdowns
function populateFilters() {
    // Get unique years
    const years = [...new Set(allPosts.map(post => extractYear(post.date)))].sort().reverse();
    yearFilter.innerHTML = '<option value="all">All Years</option>' +
        years.map(year => `<option value="${year}">${year}</option>`).join('');

    // Get unique categories
    const categories = [...new Set(allPosts.map(post => post.category))].sort();
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Apply filters
function applyFilters() {
    const selectedYear = yearFilter.value;
    const selectedCategory = categoryFilter.value;

    filteredPosts = allPosts.filter(post => {
        const yearMatch = selectedYear === 'all' || extractYear(post.date) === selectedYear;
        const categoryMatch = selectedCategory === 'all' || post.category === selectedCategory;
        return yearMatch && categoryMatch;
    });

    renderBlogGrid();
}

// Clear all filters
function clearFilters() {
    yearFilter.value = 'all';
    categoryFilter.value = 'all';
    filteredPosts = [...allPosts];
    renderBlogGrid();
}

// Render blog grid
function renderBlogGrid() {
    if (filteredPosts.length === 0) {
        blogGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-sub);">
                        <p style="font-size: 1.2rem; margin-bottom: 1rem;">📭 No posts found</p>
                        <p style="font-size: 0.9rem;">Try adjusting your filters</p>
                    </div>
                `;
        return;
    }

    blogGrid.innerHTML = filteredPosts.map(post => `
                <div class="card" onclick="openArticle(${post.id})">
                    <div class="card-meta">
                        <div class="card-date">${post.date}</div>
                        <div class="card-category">${post.category}</div>
                    </div>
                    <h3 class="card-title" style="display: block; opacity: 1; visibility: visible;">${post.title || 'Untitled Post'}</h3>
                    <p class="card-desc" style="display: block; opacity: 1; visibility: visible;">${post.desc || 'No description available.'}</p>
                </div>
            `).join('');
}

// Open article
function openArticle(id) {
    if (typeof audioManager !== 'undefined') audioManager.playExpand();
    const post = allPosts.find(p => p.id === id);
    if (!post) return;

    blogGrid.classList.add('minimized');
    blogMainTitle.style.opacity = '0';

    readerTitle.innerText = post.title;
    readerDate.innerText = post.date;
    readerCategory.innerText = post.category;

    blogReader.classList.add('active');
    readerBody.innerHTML = '<span class="typing-cursor"></span>';
    setTimeout(() => {
        readerBody.innerHTML = post.content + '<div style="height: 150px; width: 100%; flex-shrink: 0;"></div>';
    }, 300);
}

// Close article
function closeArticle() {
    if (blogReader.classList.contains('active')) {
        if (typeof audioManager !== 'undefined') audioManager.playCloseWindow();
    }
    blogReader.classList.remove('active');
    blogGrid.classList.remove('minimized');
    blogMainTitle.style.opacity = '1';
}

// Initialize blog
loadAllPosts();



// --- NAVIGATION LOGIC ---
const world = document.getElementById('world');
const sections = {
    'home': document.getElementById('sec-home'),
    'blog': document.getElementById('sec-blog'),
    'arcade': document.getElementById('sec-arcade'),
    'gallery': document.getElementById('sec-gallery'),
    'social': document.getElementById('sec-social'),
    'about': document.getElementById('sec-about')
};
const buttons = document.querySelectorAll('.nav-btn');
let currentSection = 'home';
let isGameRunning = false;

function navigateTo(targetId) {
    if (typeof audioManager !== 'undefined') audioManager.playCameraSwoosh();
    currentSection = targetId;
    if (targetId !== 'arcade' && isGameRunning) gameOver();
    if (targetId !== 'blog') closeArticle();

    buttons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(buttons).find(b => b.textContent.toLowerCase().includes(targetId === 'blog' ? 'archives' : targetId));
    if (activeBtn) activeBtn.classList.add('active');

    const targetEl = sections[targetId];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const style = window.getComputedStyle(targetEl);
    const tTop = parseFloat(style.top);
    const tLeft = parseFloat(style.left);
    const tWidth = parseFloat(style.width);
    const tHeight = parseFloat(style.height);

    const centerX = tLeft + (tWidth / 2);
    const centerY = tTop + (tHeight / 2);
    const transX = (vw / 2) - centerX;
    const transY = (vh / 2) - centerY;

    world.style.transform = `translate(${transX}px, ${transY}px) scale(1)`;
}

// --- INTRO SEQUENCE ---
window.onload = () => {
    const loader = document.getElementById('loader-text');
    const hud = document.getElementById('hud');

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const worldCenterX = (vw * 3) / 2;
    const worldCenterY = (vh * 3) / 2;
    const initialX = (vw / 2) - worldCenterX;
    const initialY = (vh / 2) - worldCenterY;

    world.style.transition = 'none';
    world.style.transform = `translate(${initialX}px, ${initialY}px) scale(0.25)`;
    loader.style.opacity = '1';

    setTimeout(() => {
        loader.style.opacity = '0';
        world.style.transition = 'transform 2.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
        navigateTo('home');
        setTimeout(() => { hud.classList.remove('hud-hidden'); }, 2000);
    }, 1000);
};

window.addEventListener('resize', () => {
    navigateTo(currentSection);
    resizeCanvas();
});

// --- SNAKE GAME LOGIC ---
const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreVal');
const hiScoreEl = document.getElementById('hiscoreVal');

let gridSize = 25;
let tileCountX, tileCountY;
let snake = [];
let food = { x: 10, y: 10 };
let dx = 0, dy = 0;
let score = 0, hiScore = 0;
let lastTime = 0, accumulator = 0;
const tickRate = 100;
let animationFrameId;
let particles = [];

function resizeCanvas() {
    const container = document.getElementById('snake-container');
    if (!container) return;

    // Force a minimum size if hidden or small
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    canvas.width = width;
    canvas.height = height;

    // Ensure grid size is reasonable
    gridSize = Math.max(15, Math.floor(width / 25));
    tileCountX = Math.floor(width / gridSize);
    tileCountY = Math.floor(height / gridSize);

    drawInitialSnake();
}
// Initial call might fail if hidden, but that's fine now
resizeCanvas();

function drawInitialSnake() {
    const ctx = document.getElementById('snakeCanvas').getContext('2d');
    const previewSnake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Use the curvy draw function
    const style = getComputedStyle(document.body);
    const neonBlue = style.getPropertyValue('--neon-blue').trim() || '#00ffff';
    drawSnake(ctx, previewSnake, gridSize, 0, neonBlue);
}

function startSnake() {
    if (isGameRunning) return;

    // Ensure canvas is sized correctly before starting
    resizeCanvas();

    isGameRunning = true;
    document.getElementById('start-btn-snake').style.display = 'none';
    score = 0;
    scoreEl.innerText = score;

    // Center the snake
    const startX = Math.floor(tileCountX / 2);
    const startY = Math.floor(tileCountY / 2);
    snake = [{ x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY }];
    dx = 1; dy = 0;

    createFood();
    lastTime = performance.now();
    accumulator = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) createFood();
    });
}

function gameOver() {
    isGameRunning = false;
    if (typeof audioManager !== 'undefined') audioManager.playGameOver();
    cancelAnimationFrame(animationFrameId);
    const btn = document.getElementById('start-btn-snake');
    if (btn) {
        btn.style.display = 'block';
        btn.innerText = "GAME OVER - RETRY";
    }
    if (score > hiScore) { hiScore = score; hiScoreEl.innerText = hiScore; }
}

function gameLoop(timestamp) {
    if (!isGameRunning) return;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += deltaTime;

    while (accumulator >= tickRate) {
        updateGameLogic();
        accumulator -= tickRate;
    }
    drawGame(timestamp);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function updateGameLogic() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (typeof audioManager !== 'undefined') audioManager.playSnakeMove();

    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        gameOver();
        return;
    }

    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = score;
        if (score % 25 === 0 && typeof audioManager !== 'undefined') audioManager.playScoreMilestone();
        createFood();
        createParticles(head.x * gridSize + gridSize / 2, head.y * gridSize + gridSize / 2, '#0aff0a');
    } else {
        snake.pop();
    }
}

function drawGame(time) {
    // Get Colors dynamically from CSS
    const style = getComputedStyle(document.body);
    const bgColor = style.getPropertyValue('--snake-bg').trim();
    const gridColor = style.getPropertyValue('--grid-line').trim();
    const neonBlue = style.getPropertyValue('--neon-blue').trim();
    const neonGreen = style.getPropertyValue('--neon-green').trim();

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Subtle Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < tileCountX; i++) {
        ctx.beginPath(); ctx.moveTo(i * gridSize, 0); ctx.lineTo(i * gridSize, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < tileCountY; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * gridSize); ctx.lineTo(canvas.width, i * gridSize); ctx.stroke();
    }

    drawFrog(ctx, food.x * gridSize, food.y * gridSize, gridSize, time, neonGreen);
    drawSnake(ctx, snake, gridSize, time, neonBlue);
    updateParticles();
}

function drawFrog(ctx, x, y, size, time, color) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const r = size / 2.5;
    const breath = Math.sin(time / 200) * 2;

    // Legs
    ctx.fillStyle = isLightMode ? '#004d00' : '#006400';
    ctx.beginPath();
    ctx.ellipse(centerX - r, centerY + r / 2, r / 2, r / 4, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + r, centerY + r / 2, r / 2, r / 4, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 2, r + breath / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eyes & Pupils
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX - r / 2, centerY - r / 2, r / 2.5, 0, Math.PI * 2);
    ctx.arc(centerX + r / 2, centerY - r / 2, r / 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX - r / 2, centerY - r / 2, r / 5, 0, Math.PI * 2);
    ctx.arc(centerX + r / 2, centerY - r / 2, r / 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawSnake(ctx, snakeParts, size, time, color) {
    if (snakeParts.length < 2) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    const headX = snakeParts[0].x * size + size / 2;
    const headY = snakeParts[0].y * size + size / 2;
    ctx.moveTo(headX, headY);

    for (let i = 1; i < snakeParts.length - 1; i++) {
        const current = snakeParts[i];
        const next = snakeParts[i + 1];
        const cX = current.x * size + size / 2;
        const cY = current.y * size + size / 2;
        const nX = next.x * size + size / 2;
        const nY = next.y * size + size / 2;
        const midX = (cX + nX) / 2;
        const midY = (cY + nY) / 2;

        const wave = Math.sin((i * 0.5) - (time / 200)) * (size * 0.2);
        let perpX = 0, perpY = 0;
        if (cX === nX) { perpX = 1; }
        else { perpY = 1; }

        ctx.quadraticCurveTo(cX + (perpX * wave), cY + (perpY * wave), midX, midY);
    }
    const tail = snakeParts[snakeParts.length - 1];
    ctx.lineTo(tail.x * size + size / 2, tail.y * size + size / 2);

    const pulse = Math.sin(time / 150) * 2;
    ctx.lineWidth = (size * 0.7) + pulse;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Head Detail
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(headX, headY, size / 4, 0, Math.PI * 2);
    ctx.fill();
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
            life: 1.0, color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.1;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

document.addEventListener('keydown', (e) => {
    if (!isGameRunning) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) e.preventDefault();
    switch (e.key) {
        case 'ArrowUp': if (dy !== 1) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (dy !== -1) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (dx !== 1) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx !== -1) { dx = 1; dy = 0; } break;
    }
});

let touchStartX = 0, touchStartY = 0;
const gameEl = document.getElementById('snake-container');
gameEl.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; touchStartY = e.changedTouches[0].screenY; }, { passive: false });
gameEl.addEventListener('touchmove', e => { e.preventDefault(); }, { passive: false });
gameEl.addEventListener('touchend', e => {
    if (!isGameRunning) return;
    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;
    let diffX = touchEndX - touchStartX;
    let diffY = touchEndY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0 && dx !== -1) { dx = 1; dy = 0; }
        else if (diffX < 0 && dx !== 1) { dx = -1; dy = 0; }
    } else {
        if (diffY > 0 && dy !== -1) { dx = 0; dy = 1; }
        else if (diffY < 0 && dy !== 1) { dx = 0; dy = -1; }
    }
});

// --- ARCADE CAROUSEL LOGIC ---
let currentCarouselIndex = 0;
const totalGames = 3;
const carouselTrack = document.getElementById('game-carousel');
const indicators = [document.getElementById('ind-0'), document.getElementById('ind-1'), document.getElementById('ind-2')];
let arcadeBackBtn = null; // Unified BACK button for arcade

function rotateCarousel(direction) {
    if (typeof audioManager !== 'undefined') audioManager.playSwoosh();
    currentCarouselIndex = (currentCarouselIndex + direction + totalGames) % totalGames;
    updateCarousel();
}

function updateCarousel() {
    carouselTrack.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    indicators.forEach((ind, i) => {
        if (i === currentCarouselIndex) {
            ind.classList.add('active', 'bg-green-500');
            ind.classList.remove('bg-gray-600');
        } else {
            ind.classList.remove('active', 'bg-green-500');
            ind.classList.add('bg-gray-600');
        }
    });
}


function selectGame(game) {
    if (typeof audioManager !== 'undefined') audioManager.playSelect();
    document.getElementById('arcade-menu').classList.add('hidden');
    document.querySelectorAll('.game-view').forEach(view => view.classList.add('hidden'));

    if (game === 'snake') {
        document.getElementById('game-snake').classList.remove('hidden');
        // Wait for display change to take effect before resizing
        setTimeout(resizeCanvas, 50);
    } else if (game === 'tictactoe') {
        document.getElementById('game-tictactoe').classList.remove('hidden');
        // Show menu, hide game area
        document.getElementById('ttt-menu').classList.remove('hidden');
        document.getElementById('ttt-game-area').classList.add('hidden');
    } else if (game === 'dino') {
        document.getElementById('game-dino').classList.remove('hidden');
        initDino();
    }

    // Add BACK button to controls
    addArcadeBackButton();
}

function showMenu() {
    document.getElementById('arcade-menu').classList.remove('hidden');
    document.querySelectorAll('.game-view').forEach(view => view.classList.add('hidden'));

    // Stop games if running
    isGameRunning = false; // Stop Snake
    isDinoRunning = false; // Stop Dino

    // Remove BACK button from controls
    removeArcadeBackButton();
}

// --- TIC TAC TOE LOGIC (4x4 CONNECT-4 WITH SAVAGE AI) ---
let tttBoard = Array(16).fill('');
let tttGameActive = false;
let tttPlayer = 'X'; // User is always X
let tttAi = 'O';

// 50 SAVAGE ROAST MESSAGES
const aiRoasts = [
    "Is that really your best move? My calculator has better logic.",
    "I've seen toddlers with better strategy.",
    "Did you close your eyes before clicking that?",
    "Are you even trying, or is this performance art?",
    "Your gameplay is making my circuits cringe.",
    "I'm an AI and even I feel secondhand embarrassment.",
    "That move was so bad, I almost let you win out of pity. Almost.",
    "Congratulations, you just invented a new way to lose.",
    "I've seen better plays from a random number generator.",
    "Your strategy is as confused as a chameleon in a bag of Skittles.",
    "Did you learn this from a 'How to Lose' tutorial?",
    "I'd say nice try, but... no.",
    "Even my bugs play better than this.",
    "That move hurt my artificial feelings.",
    "Are you trying to lose, or does it just come naturally?",
    "I'm programmed to be unbeatable, but you're making it too easy.",
    "Your next move should be 'surrender'.",
    "I've calculated 1,000 scenarios. You lose in all of them.",
    "This is easier than dividing by zero... wait.",
    "My grandma's calculator plays better, and it's solar-powered.",
    "Did you just click randomly? Be honest.",
    "I don't need minimax for this. I could win with my eyes closed. Oh wait.",
    "Your moves are unpredictable, but only because they make no sense.",
    "I'm not angry, I'm just disappointed.",
    "This is why humans invented participation trophies.",
    "You play like my error logs look.",
    "I've seen smarter plays in a coin flip.",
    "That move violated several laws of logic.",
    "Are you allergic to winning?",
    "I'm starting to think you're the AI and I'm the human.",
    "Your strategy needs a software update.",
    "This is like watching someone try to swim upstream in a desert.",
    "Did you mean to do that, or is this a new avant-garde style?",
    "I'm unbeatable, but you're making it embarrassing.",
    "Your moves are so bad, they're almost good. But no, still bad.",
    "I could win this with half my processing power. Let me try... yep, still winning.",
    "Next time bring your A-game. Actually, bring any game.",
    "I've analyzed your strategy. Error 404: Strategy not found.",
    "That wasn't a move, that was a cry for help.",
    "Do you want me to play for you? It'd be faster.",
    "Your gameplay is downloading... 1%... still 1%...",
    "I'm not locked in here with you. You're locked in here with ME.",
    "Plot twist: there is no plot. You're just losing.",
    "My code has fewer bugs than your strategy has flaws.",
    "This game is rated E for Everyone, but your skills are rated LOL.",
    "I'd give you a hint, but where's the fun in that?",
    "You're playing 4D chess while I'm playing 5D chess. You're still losing.",
    "That move was so predictable, I saw it coming last game.",
    "Victory is in my code. Defeat is in yours.",
    "Fun fact: I've never lost. Sad fact: you never win."
];

function initTicTacToe() {
    document.getElementById('ttt-menu').classList.add('hidden');
    document.getElementById('ttt-game-area').classList.remove('hidden');
    resetTicTacToe();
}

function resetTicTacToe() {
    tttBoard = Array(16).fill('');
    tttGameActive = true;
    document.getElementById('ttt-roast').innerText = "";
    document.getElementById('ttt-status').innerText = "";
    document.getElementById('ttt-status').classList.remove('ai-thinking-blink');
    renderTTT();

    const playerFirst = document.getElementById('ttt-player-first').checked;
    if (!playerFirst) {
        // AI goes first
        tttGameActive = false;
        document.getElementById('ttt-roast').innerText = "Let me show you how it's done...";
        document.getElementById('ttt-status').innerText = "AI THINKING...";
        document.getElementById('ttt-status').classList.add('ai-thinking-blink');
        setTimeout(aiMove, 600);
    }
}

function renderTTT() {
    const boardEl = document.getElementById('ttt-board');
    boardEl.innerHTML = '';
    tttBoard.forEach((cell, index) => {
        const div = document.createElement('div');
        div.className = `ttt-cell ${cell ? 'taken ' + cell.toLowerCase() : ''}`;
        div.innerText = cell;
        div.onclick = () => userMove(index);
        boardEl.appendChild(div);
    });
}

function userMove(index) {
    if (!tttGameActive || tttBoard[index] !== '') return;

    tttBoard[index] = tttPlayer;
    if (typeof audioManager !== 'undefined') audioManager.playTicTacToeMove(tttPlayer);
    renderTTT();

    if (checkWinner(tttBoard, tttPlayer)) {
        document.getElementById('ttt-roast').innerText = "";
        document.getElementById('ttt-status').innerText = "";
        document.getElementById('ttt-status').classList.remove('ai-thinking-blink');
        endTTT("YOU WIN! (Impossible...)");
        return;
    }
    if (tttBoard.every(cell => cell !== '')) {
        document.getElementById('ttt-roast').innerText = "";
        document.getElementById('ttt-status').innerText = "";
        document.getElementById('ttt-status').classList.remove('ai-thinking-blink');
        endTTT("DRAW");
        return;
    }

    tttGameActive = false;

    // Show roast and blinking thinking message
    const roast = aiRoasts[Math.floor(Math.random() * aiRoasts.length)];
    document.getElementById('ttt-roast').innerText = roast;
    document.getElementById('ttt-status').innerText = "AI THINKING...";
    document.getElementById('ttt-status').classList.add('ai-thinking-blink');

    setTimeout(aiMove, 2500); // Increased from 500ms to 2500ms
}

function aiMove() {
    let bestScore = -Infinity;
    let move;

    // First move optimization for 4x4
    const emptySpots = tttBoard.filter(c => c === '').length;
    if (emptySpots === 16) {
        // Take center-ish position
        move = Math.random() > 0.5 ? 5 : 6;
    } else if (emptySpots === 15) {
        // Strategic response
        const centerPositions = [5, 6, 9, 10];
        move = centerPositions.find(pos => tttBoard[pos] === '') || 5;
    } else {
        // Use minimax with depth limit for performance
        const maxDepth = emptySpots > 10 ? 3 : 5;
        for (let i = 0; i < 16; i++) {
            if (tttBoard[i] === '') {
                tttBoard[i] = tttAi;
                let score = minimaxLimited(tttBoard, 0, false, maxDepth);
                tttBoard[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    move = i;
                }
            }
        }
    }

    // Apply move
    if (move !== undefined) {
        tttBoard[move] = tttAi;
        if (typeof audioManager !== 'undefined') audioManager.playTicTacToeMove(tttAi);
        renderTTT();

        // Clear roast and thinking status
        document.getElementById('ttt-roast').innerText = "";
        document.getElementById('ttt-status').innerText = "";
        document.getElementById('ttt-status').classList.remove('ai-thinking-blink');

        if (checkWinner(tttBoard, tttAi)) {
            endTTT("AI WINS");
        } else if (tttBoard.every(cell => cell !== '')) {
            endTTT("DRAW");
        } else {
            tttGameActive = true;
            document.getElementById('ttt-status').innerText = "YOUR TURN";
        }
    }
}

const scores = { X: -10, O: 10, tie: 0 };

function minimaxLimited(board, depth, isMaximizing, maxDepth) {
    let result = checkWinner(board, tttAi) ? 'O' : checkWinner(board, tttPlayer) ? 'X' : null;
    if (result) return scores[result];
    if (board.every(cell => cell !== '')) return scores.tie;
    if (depth >= maxDepth) return 0; // Depth limit

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 16; i++) {
            if (board[i] === '') {
                board[i] = tttAi;
                let score = minimaxLimited(board, depth + 1, false, maxDepth);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 16; i++) {
            if (board[i] === '') {
                board[i] = tttPlayer;
                let score = minimaxLimited(board, depth + 1, true, maxDepth);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinner(board, player) {
    // Check all possible 4-in-a-row combinations for 4x4 grid
    const wins = [
        // Horizontal
        [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
        // Vertical
        [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
        // Diagonal
        [0, 5, 10, 15], [3, 6, 9, 12]
    ];
    return wins.some(combo => combo.every(i => board[i] === player));
}

function endTTT(winner) {
    tttGameActive = false;
    let msg = '';
    let icon = '';

    if (winner === 'DRAW') {
        msg = "AI MADE YOU DRAW, SO AI WINS!";
        icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="display: inline-block; vertical-align: middle; margin-left: 8px;"><rect x="8" y="4" width="8" height="12" fill="var(--neon-pink)" opacity="0.8"/><circle cx="10" cy="8" r="1" fill="var(--neon-blue)"/><circle cx="14" cy="8" r="1" fill="var(--neon-blue)"/><rect x="10" y="11" width="4" height="1" fill="var(--neon-blue)"/><rect x="6" y="16" width="3" height="4" fill="var(--neon-pink)" opacity="0.6"/><rect x="15" y="16" width="3" height="4" fill="var(--neon-pink)" opacity="0.6"/></svg>';
        if (typeof audioManager !== 'undefined') audioManager.playLoss();
    } else if (winner === tttPlayer) {
        msg = "YOU WON! (Impossible...)";
        icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="display: inline-block; vertical-align: middle; margin-left: 8px;"><path d="M12 2L15 9L22 10L17 15L18 22L12 18.5L6 22L7 15L2 10L9 9L12 2Z" fill="var(--neon-green)" opacity="0.9"/></svg>';
        if (typeof audioManager !== 'undefined') audioManager.playWin();
    } else {
        msg = "AI WINS! AS EXPECTED.";
        icon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="display: inline-block; vertical-align: middle; margin-left: 8px;"><rect x="8" y="4" width="8" height="12" fill="var(--neon-pink)" opacity="0.8"/><circle cx="10" cy="8" r="1" fill="var(--neon-blue)"/><circle cx="14" cy="8" r="1" fill="var(--neon-blue)"/><rect x="10" y="11" width="4" height="1" fill="var(--neon-blue)"/><rect x="6" y="16" width="3" height="4" fill="var(--neon-pink)" opacity="0.6"/><rect x="15" y="16" width="3" height="4" fill="var(--neon-pink)" opacity="0.6"/></svg>';
        if (typeof audioManager !== 'undefined') audioManager.playLoss();
    }

    const overlay = document.getElementById('ttt-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        document.getElementById('ttt-msg').innerText = msg;
    } else {
        document.getElementById('ttt-roast').innerHTML = msg + icon;
        document.getElementById('ttt-status').innerText = "";
        document.getElementById('ttt-status').classList.remove('ai-thinking-blink');
        setTimeout(resetTicTacToe, 3000);
    }
}

// --- CYBER DINO LOGIC ---
const dinoCanvas = document.getElementById('dinoCanvas');
const dinoCtx = dinoCanvas.getContext('2d');
let isDinoRunning = false;
let dinoScore = 0;
let dino = { x: 50, y: 150, w: 30, h: 30, dy: 0, jumpPower: -18, grounded: true }; // Stronger jump
let obstacles = [];
let gravity = 1.2; // Faster gravity
let gameSpeed = 10; // Faster start
let dinoFrame = 0;

function initDino() {
    isDinoRunning = false;
    dinoScore = 0;
    document.getElementById('dinoScore').innerText = dinoScore;
    document.getElementById('dino-overlay').classList.remove('hidden');
    // Reset if needed
    if (!isDinoRunning) {
        dinoCtx.fillStyle = '#000';
        dinoCtx.fillRect(0, 0, dinoCanvas.width, dinoCanvas.height);
        dinoCtx.fillStyle = '#ff00ff';
        dinoCtx.font = "20px Orbitron";
        dinoCtx.fillText("PRESS JUMP TO START", 180, 100);
    }
}

function startDino() {
    if (isDinoRunning) return;
    isDinoRunning = true;
    document.getElementById('dino-overlay').classList.add('hidden');
    dinoScore = 0;
    document.getElementById('dinoScore').innerText = dinoScore;
    dino = { x: 50, y: 150, w: 30, h: 30, dy: 0, jumpPower: -18, grounded: true, jumpCount: 0 };
    obstacles = [];
    gameSpeed = 10;
    requestAnimationFrame(dinoLoop);
}

function dinoLoop() {
    if (!isDinoRunning) return;

    dinoCtx.clearRect(0, 0, dinoCanvas.width, dinoCanvas.height);

    // Background - Black for high contrast
    dinoCtx.fillStyle = '#000';
    dinoCtx.fillRect(0, 0, dinoCanvas.width, dinoCanvas.height);

    // Grid lines for cyberpunk feel
    dinoCtx.strokeStyle = 'rgba(255, 0, 255, 0.2)';
    dinoCtx.lineWidth = 1;
    for (let i = 0; i < dinoCanvas.width; i += 40) {
        dinoCtx.beginPath(); dinoCtx.moveTo(i, 0); dinoCtx.lineTo(i, dinoCanvas.height); dinoCtx.stroke();
    }

    // Ground
    dinoCtx.strokeStyle = '#ff00ff'; // Neon Pink
    dinoCtx.lineWidth = 2;
    dinoCtx.beginPath();
    dinoCtx.moveTo(0, 180);
    dinoCtx.lineTo(600, 180);
    dinoCtx.stroke();

    // Dino Physics
    if (!dino.grounded) {
        dino.dy += gravity;
        dino.y += dino.dy;
    }
    if (dino.y > 150) {
        dino.y = 150;
        dino.dy = 0;
        dino.grounded = true;
        dino.jumpCount = 0;
    }

    drawDino();

    // Obstacles
    if (Math.random() < 0.03 + (dinoScore * 0.001)) spawnObstacle();

    obstacles.forEach((obs, i) => {
        obs.x -= gameSpeed;
        drawObstacle(obs);

        // Collision
        if (dino.x < obs.x + obs.w &&
            dino.x + dino.w > obs.x &&
            dino.y < obs.y + obs.h &&
            dino.y + dino.h > obs.y) {
            gameOverDino();
        }

        if (obs.x + obs.w < 0) {
            obstacles.splice(i, 1);
            dinoScore++;
            if (dinoScore % 25 === 0 && typeof audioManager !== 'undefined') audioManager.playScoreMilestone();
            document.getElementById('dinoScore').innerText = "SCORE: " + dinoScore;
            if (dinoScore % 5 === 0) gameSpeed += 0.8;
        }
    });

    dinoFrame++;
    requestAnimationFrame(dinoLoop);
}

function jump() {
    if (dino.grounded || dino.jumpCount < 2) {
        if (typeof audioManager !== 'undefined') audioManager.playDinoJump();
        dino.dy = dino.jumpPower;
        dino.grounded = false;
        dino.jumpCount++;
    }
}

function spawnObstacle() {
    const minGap = Math.max(100, 250 - (gameSpeed * 5)); // Dynamic gap
    if (obstacles.length > 0 && 600 - obstacles[obstacles.length - 1].x < minGap) return;

    let h = 20 + Math.random() * 50; // Taller
    let y = 180 - h;

    // Glitch/Floating obstacles
    if (Math.random() < 0.4) {
        y = 180 - h - (40 + Math.random() * 40); // Float high
        h = 20 + Math.random() * 20;
    }

    obstacles.push({ x: 600, y: y, w: 20 + Math.random() * 15, h: h });
}

function drawDino() {
    dinoCtx.fillStyle = '#ff00ff'; // Neon Pink
    dinoCtx.shadowBlur = 10;
    dinoCtx.shadowColor = '#ff00ff';
    dinoCtx.fillRect(dino.x, dino.y, dino.w, dino.h);
    // Eye
    dinoCtx.fillStyle = '#000';
    dinoCtx.fillRect(dino.x + 20, dino.y + 5, 5, 5);
    dinoCtx.shadowBlur = 0;
}

function drawObstacle(obs) {
    dinoCtx.fillStyle = '#00ff00'; // Neon Green
    dinoCtx.shadowBlur = 5;
    dinoCtx.shadowColor = '#00ff00';
    dinoCtx.fillRect(obs.x, obs.y, obs.w, obs.h);
    dinoCtx.shadowBlur = 0;
}

function gameOverDino() {
    isDinoRunning = false;
    if (typeof audioManager !== 'undefined') audioManager.playGameOver();
    document.getElementById('dino-overlay').classList.remove('hidden');
    document.getElementById('start-btn-dino').innerText = "GAME OVER - RETRY";
}



// Dino Controls
document.addEventListener('keydown', (e) => {
    if (document.getElementById('game-dino').classList.contains('hidden')) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
    }
});
document.getElementById('game-dino').addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    e.preventDefault();
    jump();
}, { passive: false });





// --- GALLERY LOGIC ---
const galleryGrid = document.getElementById('gallery-grid');
const storyModal = document.getElementById('story-modal');
const modalImage = document.getElementById('modal-image');
const modalText = document.getElementById('modal-text');
let galleryItems = [];

async function loadGallery() {
    galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--neon-yellow);">Loading Visual Stories...</div>';
    galleryItems = [];
    let itemNum = 1;
    const maxItems = 50;

    while (itemNum <= maxItems) {
        try {
            // Try fetching the text file first as it's lighter
            const textResponse = await fetch(`pics/${itemNum}.txt`);
            if (!textResponse.ok) break;

            const text = await textResponse.text();

            // Assume image exists if text exists (based on user's setup)
            // We'll use the .jpeg extension as seen in the file list
            const imagePath = `pics/${itemNum}.jpeg`;

            galleryItems.push({
                id: itemNum,
                image: imagePath,
                text: text
            });

            itemNum++;
        } catch (e) {
            console.error("Error loading gallery item:", e);
            break;
        }
    }

    renderGallery();
}

function renderGallery() {
    if (galleryItems.length === 0) {
        galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-sub);">No stories found.</div>';
        return;
    }

    galleryGrid.innerHTML = galleryItems.map(item => `
                <div class="gallery-item" onclick="openStory(${item.id})">
                    <img src="${item.image}" alt="Story ${item.id}" loading="lazy">
                    <div class="gallery-overlay">
                        <p class="gallery-preview-text">${item.text}</p>
                    </div>
                </div>
            `).join('');
}

function openStory(id) {
    if (typeof audioManager !== 'undefined') audioManager.playExpand();
    const item = galleryItems.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('story-modal');
    const img = modal.querySelector('img');
    const p = modal.querySelector('p');

    img.src = item.image;
    p.innerText = item.text;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeStory() {
    const modal = document.getElementById('story-modal');
    if (modal.classList.contains('active')) {
        if (typeof audioManager !== 'undefined') audioManager.playCloseWindow();
    }
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
        const img = modal.querySelector('img');
        if (img) img.src = '';
    }, 300);
}

// Close modal on outside click
storyModal.addEventListener('click', (e) => {
    if (e.target === storyModal) closeStory();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && storyModal.classList.contains('active')) {
        closeStory();
    }
});

// Initialize
loadGallery();

// --- AUDIO MANAGER ---
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.2; // Master volume
        this.masterGain.connect(this.ctx.destination);
        this.enabled = true;
        this.audioUnlocked = false;
        this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.scrollThrottle = false;
    }

    playTone(freq, type, duration, vol = 1, slideTo = null) {
        if (!this.enabled || !this.audioUnlocked) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // --- UI Sounds ---
    playClick() { this.playTone(800, 'sine', 0.1, 0.5); }
    playHover() { if (!this.isMobile) this.playTone(400, 'triangle', 0.05, 0.1); }
    playSelect() { this.playTone(600, 'sine', 0.1, 0.3); setTimeout(() => this.playTone(900, 'sine', 0.2, 0.3), 50); }
    playThemeSwitch() { this.playTone(1200, 'square', 0.1, 0.2); }
    playExpand() { this.playTone(300, 'sine', 0.3, 0.3, 600); }
    playCloseWindow() { this.playTone(600, 'sawtooth', 0.2, 0.3, 200); }
    playCameraSwoosh() { this.playTone(200, 'sine', 0.5, 0.4, 600); }
    playSystemInit() {
        this.playTone(220, 'sine', 1.0, 0.3);
        setTimeout(() => this.playTone(440, 'sine', 1.0, 0.3), 200);
        setTimeout(() => this.playTone(880, 'sine', 1.5, 0.3), 400);
    }
    playTyping() { this.playTone(800 + Math.random() * 200, 'square', 0.03, 0.05); }

    playScroll() {
        if (this.scrollThrottle) return;
        this.playTone(150, 'triangle', 0.05, 0.05);
        this.scrollThrottle = true;
        setTimeout(() => this.scrollThrottle = false, 150);
    }

    attachScrollListeners() {
        const scrollables = document.querySelectorAll('.section, .reader-content, #blog-grid, #gallery-grid, #hud');
        scrollables.forEach(el => {
            if (el) el.addEventListener('scroll', () => this.playScroll());
        });
        window.addEventListener('scroll', () => this.playScroll());
    }

    // --- Game Sounds ---
    playSnakeMove() { this.playTone(300, 'triangle', 0.05, 0.1); }
    playTicTacToeMove(type) {
        if (type === 'X') this.playTone(600, 'square', 0.1, 0.3);
        else this.playTone(400, 'sine', 0.1, 0.3);
    }
    playDinoJump() { this.playTone(300, 'square', 0.2, 0.3, 600); }
    playGameOver() {
        this.playTone(300, 'sawtooth', 0.5, 0.5, 50);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.5, 0.5, 40), 400);
    }
    playWin() {
        this.playTone(523.25, 'sine', 0.2, 0.4); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.4), 100); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.4, 0.4), 200); // G5
    }
    playLoss() {
        this.playTone(300, 'triangle', 0.3, 0.4, 200);
        setTimeout(() => this.playTone(200, 'triangle', 0.4, 0.4, 100), 300);
    }
    playScoreMilestone() {
        this.playTone(880, 'sine', 0.1, 0.3);
        setTimeout(() => this.playTone(1760, 'sine', 0.2, 0.3), 100);
    }

    playSwoosh() {
        if (!this.enabled || !this.audioUnlocked) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 0.15);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start();
    }
}

const audioManager = new AudioManager();

// Unlock audio on first interaction
// Init Overlay Logic
const initOverlay = document.getElementById('init-overlay');

function startSystem() {
    injectControls();
    if (audioManager.ctx.state === 'suspended') {
        audioManager.ctx.resume().then(() => {
            audioManager.audioUnlocked = true;
            audioManager.playSystemInit();
            audioManager.attachScrollListeners();
        });
    } else {
        audioManager.audioUnlocked = true;
        audioManager.playSystemInit();
        audioManager.attachScrollListeners();
    }

    if (initOverlay) {
        initOverlay.style.opacity = '0';
        setTimeout(() => initOverlay.remove(), 1000);
    }
}

if (initOverlay) {
    initOverlay.addEventListener('click', startSystem);
} else {
    document.addEventListener('click', function fallbackUnlock() {
        if (!audioManager.audioUnlocked) startSystem();
        document.removeEventListener('click', fallbackUnlock);
    });
}

window.addEventListener('scroll', () => {
    if (typeof audioManager !== 'undefined') audioManager.playScroll();
});

// Global Event Listeners
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') ||
        e.target.tagName === 'A' || e.target.closest('a') ||
        e.target.classList.contains('game-card') || e.target.closest('.game-card')) {
        audioManager.playClick();
    }
});

document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') ||
        e.target.tagName === 'A' || e.target.closest('a') ||
        e.target.classList.contains('game-card') || e.target.closest('.game-card')) {
        audioManager.playHover();
    }
});
