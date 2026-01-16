document.addEventListener('DOMContentLoaded', () => {
    // 1. Determine Root Path
    // Identify the script tag that loaded this file to find relative path to root
    const scripts = document.getElementsByTagName('script');
    let rootPath = './';
    for (let script of scripts) {
        if (script.src.includes('script.js')) {
            const url = new URL(script.src, window.location.href);
            // If the script is loaded as "../script.js", the pathname in URL might not reflect it directly if resolved.
            // But we can check the attribute.
            const srcAttr = script.getAttribute('src');
            if (srcAttr && srcAttr.includes('../')) {
                rootPath = '../';
            }
        }
    }

    // 2. Inject CSS if missing
    if (!document.querySelector(`link[href*="style.css"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${rootPath}style.css`;
        document.head.appendChild(link);
    }

    // 3. Inject Navigation if missing
    if (!document.getElementById('fixed-nav-wrapper')) {
        const navHTML = `
        <div id="fixed-nav-wrapper">
            <header class="site-header">
                <h1>İhsan Soyçelik</h1>
            </header>

            <div class="grid-container">
                <!-- Column 1: Main Navigation -->
                <nav class="column nav-column">
                    <h2 class="column-header">Type</h2>
                    <ul class="tree-list" id="type-list">
                        <li><span class="num">01</span><span class="separator">-</span><a href="#" class="nav-link active"
                                data-filter="all" aria-current="page">Creative Coding</a></li>
                        <li><span class="num">02</span><span class="separator">;</span><a href="#" class="nav-link disabled"
                                data-category="sketches" aria-disabled="true" tabindex="-1">Graphic Design</a></li>
                        <li><span class="num">03</span><span class="separator">;</span><a href="#" class="nav-link disabled"
                                data-category="ui-design" aria-disabled="true" tabindex="-1">UI Design</a></li>
                        <li><span class="num">04</span><span class="separator">;</span><a href="#" class="nav-link disabled"
                                data-category="other" aria-disabled="true" tabindex="-1">Other Works</a></li>
                    </ul>
                </nav>

                <!-- Column 2: Specific Tags/Topics -->
                <aside class="column filter-column">
                    <h2 class="column-header">Topic</h2>
                    <ul class="tree-list" id="topic-list">
                        <li><span class="num">01</span> <a href="#" class="tag-link active" data-tag="all"
                                aria-current="page">All</a></li>
                        <li><span class="num">02</span> <a href="#" class="tag-link" data-tag="Generative">Generative</a>
                        </li>
                        <li><span class="num">03</span> <a href="#" class="tag-link" data-tag="Physics">Physics</a></li>
                        <li><span class="num">04</span> <a href="#" class="tag-link" data-tag="Noise">Noise</a></li>
                        <li><span class="num">05</span> <a href="#" class="tag-link" data-tag="Interaction">Interaction</a>
                        </li>
                    </ul>
                </aside>

                <!-- Column 3: Project List -->
                <main class="column project-column">
                    <h2 class="column-header">Projects</h2>
                    <div id="project-list" class="tree-list">
                        <!-- Projects will be injected here -->
                    </div>
                </main>

                <!-- Column 4: Contact Info -->
                <aside class="column contact-column">
                    <ul class="contact-list">
                        <li>
                            <a href="https://soycelik.com" target="_blank" rel="noopener noreferrer" class="contact-link"
                                aria-label="Visit my portfolio soycelik.com (opens in new tab)">
                                Visit my portfolio soycelik.com
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                    <polyline points="7 7 17 7 17 17"></polyline>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="mailto:contact@soycelik.com" class="contact-link">
                                contact@soycelik.com
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z">
                                    </path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </a>
                        </li>
                        <li>
                            <a href="https://instagram.com/isoycelik" target="_blank" rel="noopener noreferrer"
                                class="contact-link" aria-label="isoycelik on Instagram (opens in new tab)">
                                isoycelik
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                        </li>
                    </ul>
                </aside>
            </div>
        </div>
        `;

        // Use a temporary container to parse HTML string
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = navHTML;
        const navElement = tempDiv.firstElementChild;
        document.body.prepend(navElement);
    }

    // 4. Data Management: Constant array of projects
    const projects = [
        {
            title: "Crinkle-Cut Type",
            tag: "Interaction",
            category: "Posters",
            url: "crinkle-cut-fry/index.html",
            date: "2023-10-27",
            author: "Me",
            tech: "Vanilla JS",
            backgroundColor: "#FDEE3F"
        },
        {
            title: "Kinetic-Poster-1",
            tag: "Generative",
            category: "Posters",
            url: "kinetic-poster-1/index.html",
            date: "2023-09-22",
            author: "Me",
            tech: "p5.js",
            backgroundColor: "#0022AA"
        },
        {
            title: "Kinetic-Poster-2",
            tag: "Generative",
            category: "Posters",
            url: "kinetic-poster-2/index.html",
            date: "2023-08-05",
            author: "Me",
            tech: "p5.js",
            backgroundColor: "#111111"
        },
        {
            title: "Interactive-Graffiti-1",
            tag: "Generative",
            category: "Posters",
            url: "Interactive-graffiti-1/index.html",
            date: "2023-07-12",
            author: "Me",
            tech: "p5.js",
            backgroundColor: "#0022AA"
        }
    ];

    const projectListContainer = document.getElementById('project-list');
    const navLinks = document.querySelectorAll('.nav-link');
    const tagLinks = document.querySelectorAll('.tag-link');
    const gridContainer = document.querySelector('.grid-container');

    // Create SVG Layer
    const svgNS = "http://www.w3.org/2000/svg";
    const svgLayer = document.createElementNS(svgNS, "svg");
    svgLayer.id = "connections-layer";
    gridContainer.appendChild(svgLayer);

    // Theme Colors
    const defaultBgColor = '#FFFFFF';

    // Function to update page theme based on project background
    function updatePageTheme(bgColor) {
        const root = document.documentElement;

        // Calculate luminance to determine if we need light or dark text
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate relative luminance using sRGB formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // If luminance is low (dark background), use light text, otherwise dark text
        const textColor = luminance < 0.5 ? '#FFFFFF' : '#000000';
        const secondaryTextColor = luminance < 0.5 ? '#999999' : '#999999';
        const activeBgColor = luminance < 0.5 ? 'rgba(255, 255, 255, 0.2)' : '#E0E0E0';
        const grainBlendMode = luminance < 0.5 ? 'screen' : 'multiply';

        // Update CSS variables
        root.style.setProperty('--bg-color', bgColor);
        root.style.setProperty('--text-color', textColor);
        root.style.setProperty('--secondary-text-color', secondaryTextColor);
        root.style.setProperty('--active-bg-color', activeBgColor);
        root.style.setProperty('--grain-blend-mode', grainBlendMode);

        // Also enforce on body directly to handle potential overrides or timing
        document.body.style.backgroundColor = bgColor;

        // Redraw lines with new color
        drawLines();
    }

    // Function to render projects
    function renderProjects(projectsToRender) {
        projectListContainer.innerHTML = ''; // Clear current list

        projectsToRender.forEach((project, index) => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';

            // Number
            const numSpan = document.createElement('span');
            numSpan.className = 'num';
            numSpan.textContent = String(index + 1).padStart(2, '0');

            // Link wrapper
            const link = document.createElement('a');
            // Resolve URL based on rootPath
            link.href = rootPath + project.url;
            link.className = 'project-link'; // For selection

            // Title
            const titleSpan = document.createElement('span');
            titleSpan.className = 'project-title';
            titleSpan.textContent = project.title;

            link.appendChild(titleSpan);

            projectItem.appendChild(numSpan);
            projectItem.appendChild(link);

            projectListContainer.appendChild(projectItem);
        });

        // After rendering, redraw lines
        drawLines();
    }

    // Initial Render
    renderProjects(projects);

    // Set Theme based on current URL
    function initializeTheme() {
        const currentPath = window.location.pathname;
        let foundProject = null;

        // Simple matching of URL
        for (let p of projects) {
            // Check if current path contains the project url folder
            // e.g. /kinetic-poster-1/index.html contains kinetic-poster-1
            const projectFolder = p.url.split('/')[0];
            if (currentPath.includes(projectFolder)) {
                foundProject = p;
                break;
            }
        }

        if (foundProject && foundProject.backgroundColor) {
            updatePageTheme(foundProject.backgroundColor);
        } else {
            updatePageTheme(defaultBgColor);
        }
    }

    initializeTheme();

    // Drawing Logic
    function drawLines() {
        // Clear existing lines
        while (svgLayer.firstChild) {
            svgLayer.removeChild(svgLayer.firstChild);
        }

        // Mobile check (basic)
        if (window.innerWidth <= 768) return;

        // 1. Draw from Active Nav (Col 1) to Tags (Col 2)
        const activeNav = document.querySelector('.nav-link.active');
        const visibleTags = document.querySelectorAll('.tag-link');

        if (activeNav && visibleTags.length > 0) {
            drawFork(activeNav, visibleTags);
        }

        // 2. Draw from Active Tag (Col 2) to Projects (Col 3)
        const activeTag = document.querySelector('.tag-link.active');
        const visibleProjects = document.querySelectorAll('.project-link');

        if (activeTag && visibleProjects.length > 0) {
            drawFork(activeTag, visibleProjects);
        }
    }

    function drawFork(sourceEl, destNodeList) {
        const containerRect = gridContainer.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();

        // Source Point: Right Middle
        const x1 = sourceRect.right - containerRect.left;
        const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;

        // Collect Destination Points
        const destPoints = [];
        let minX = Infinity;

        destNodeList.forEach(dest => {
            const li = dest.closest('li') || dest.closest('.project-item');
            const num = li.querySelector('.num');
            const targetEl = num || dest;

            const targetRect = targetEl.getBoundingClientRect();

            // Destination Point: Left Middle
            const dx = targetRect.left - containerRect.left - 10;
            const dy = targetRect.top + targetRect.height / 2 - containerRect.top;

            destPoints.push({ x: dx, y: dy, type: 'child' });
            if (dx < minX) minX = dx;
        });

        // Vertical Spine X Position
        const vx = minX - 20;
        const r = 15; // Increased Radius for softer curves

        // Combine Source and Children into a list of "Vertical Events"
        const events = [
            { y: y1, type: 'source', x: x1 },
            ...destPoints
        ];

        // Sort by Y
        events.sort((a, b) => a.y - b.y);

        const minY = events[0].y;
        const maxY = events[events.length - 1].y;

        // Alignment Fix: Check if source and single dest are close in Y
        const isSingle = (events.length === 2 && Math.abs(events[0].y - events[1].y) < 5);
        if (isSingle) {
            // Force flat line
            const commonY = events[0].y;
            const sourceX = events.find(e => e.type === 'source').x;
            const childX = events.find(e => e.type === 'child').x;

            const d = `M ${sourceX} ${commonY} L ${childX} ${commonY}`;

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", d);
            path.setAttribute("stroke-width", "1");
            path.setAttribute("fill", "none");
            path.classList.add('connection-line');
            svgLayer.appendChild(path);
            return;
        }

        let d = "";

        // 1. Draw Vertical Spine with rounded ends
        const spineTop = minY + r;
        const spineBottom = maxY - r;

        // Draw Vertical Line (if space exists)
        if (spineBottom >= spineTop) {
            d += `M ${vx} ${spineTop} L ${vx} ${spineBottom} `;
        }

        // Process Connections
        events.forEach(ev => {
            const isTop = (ev.y === minY);
            const isBottom = (ev.y === maxY);
            const isMiddle = !isTop && !isBottom;

            if (ev.type === 'source') {
                // Source (Left) -> Spine (Right)
                // If Top: Line from left, Curve Down
                if (isTop) {
                    d += `M ${ev.x} ${ev.y} L ${vx - r} ${ev.y} Q ${vx} ${ev.y} ${vx} ${ev.y + r} `;
                }
                // If Bottom: Line from left, Curve Up
                else if (isBottom) {
                    d += `M ${ev.x} ${ev.y} L ${vx - r} ${ev.y} Q ${vx} ${ev.y} ${vx} ${ev.y - r} `;
                }
                else {
                    d += `M ${ev.x} ${ev.y} L ${vx} ${ev.y} `;
                }
            } else {
                // Spine (Left) -> Child (Right)
                // If Top: Curve from Down -> Right
                if (isTop) {
                    d += `M ${vx} ${ev.y + r} Q ${vx} ${ev.y} ${vx + r} ${ev.y} L ${ev.x} ${ev.y} `;
                }
                // If Bottom: Curve from Up -> Right
                else if (isBottom) {
                    d += `M ${vx} ${ev.y - r} Q ${vx} ${ev.y} ${vx + r} ${ev.y} L ${ev.x} ${ev.y} `;
                }
                else {
                    d += `M ${vx} ${ev.y} L ${ev.x} ${ev.y} `;
                }
            }
        });

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", d);
        path.setAttribute("stroke-width", "1");
        path.setAttribute("fill", "none");
        path.classList.add('connection-line');
        svgLayer.appendChild(path);
    }

    // Filtering Logic
    let currentCategory = 'all';
    let currentTag = 'all';

    function filterProjects() {
        let filtered = projects;

        // Filter by Category (Nav)
        if (currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === currentCategory);
        }

        // Filter by Tag (Aside)
        if (currentTag !== 'all') {
            filtered = filtered.filter(p => p.tag === currentTag);
        }

        renderProjects(filtered);
    }

    // Event Listeners for Navigation (Categories)
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.classList.contains('disabled')) return;
            navLinks.forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-current', 'page');

            if (e.target.dataset.filter === 'all') {
                currentCategory = 'all';
            } else {
                currentCategory = e.target.dataset.category;
            }

            filterProjects();
            drawLines();
        });
    });

    // Event Listeners for Tags
    tagLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            tagLinks.forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
            });
            e.target.classList.add('active');
            e.target.setAttribute('aria-current', 'page');
            currentTag = e.target.dataset.tag;

            filterProjects();
            drawLines();
        });
    });

    // Resize Listeners
    window.addEventListener('resize', () => {
        drawLines();
    });

    // Initial Draw
    setTimeout(() => {
        drawLines();
    }, 100);
});
