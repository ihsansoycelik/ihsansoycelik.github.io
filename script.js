document.addEventListener('DOMContentLoaded', () => {
    // 4. Data Management: Constant array of projects
    const projects = [
        {
            title: "p5-js-1",
            tag: "P5.js",
            category: "all",
            url: "p5-js-1/index.html",
            date: "2023-10-15",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Kinetic-Poster-1",
            tag: "Generative",
            category: "Posters",
            url: "kinetic-poster-1/index.html",
            date: "2023-09-22",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Kinetic-Poster-2",
            tag: "Generative",
            category: "Posters",
            url: "kinetic-poster-2/index.html",
            date: "2023-08-05",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Interactive-Graffiti-1",
            tag: "Generative",
            category: "Posters",
            url: "Interactive-graffiti-1/index.html",
            date: "2023-07-12",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "More is More",
            tag: "Generative",
            category: "Posters",
            url: "more-is-more/index.html",
            date: "2023-10-27",
            author: "Me",
            tech: "p5.js"
        }
    ];

    const projectListContainer = document.getElementById('project-list');
    const navLinks = document.querySelectorAll('.nav-link');
    const tagLinks = document.querySelectorAll('.tag-link');
    const gridContainer = document.querySelector('.grid-container');
    const projectFrame = document.getElementById('project-frame');
    const projectViewer = document.getElementById('project-viewer');

    // Iframe Auto-Resize Logic
    projectFrame.addEventListener('load', () => {
        try {
            const iframeDoc = projectFrame.contentDocument || projectFrame.contentWindow.document;
            if (iframeDoc) {
                // Set height to content's scrollHeight
                // Resetting to auto first helps if shrinking, but just scrollHeight is safer for now to prevent flicker
                projectFrame.style.height = iframeDoc.body.scrollHeight + 'px';

                // Optional: Observer for dynamic content changes
                const ro = new ResizeObserver(() => {
                    projectFrame.style.height = iframeDoc.body.scrollHeight + 'px';
                });
                ro.observe(iframeDoc.body);
            }
        } catch (e) {
            console.warn('Cannot auto-resize iframe due to cross-origin or limitations', e);
        }
    });

    // Create SVG Layer
    const svgNS = "http://www.w3.org/2000/svg";
    const svgLayer = document.createElementNS(svgNS, "svg");
    svgLayer.id = "connections-layer";
    gridContainer.appendChild(svgLayer);

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
            link.href = project.url;
            link.className = 'project-link'; // For selection

            // Intercept Click
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = project.url;

                if (url && url !== '#' && url !== '') {
                    projectFrame.src = url;
                    projectFrame.style.display = 'block';

                    // Smooth scroll to the iframe
                    projectFrame.scrollIntoView({ behavior: 'smooth' });
                }
            });

            // Title
            const titleSpan = document.createElement('span');
            titleSpan.className = 'project-title';
            titleSpan.textContent = project.title;

            // Meta (Removed as per request)
            // const metaSpan = document.createElement('span');
            // metaSpan.className = 'project-meta';
            // metaSpan.textContent = `${project.date} / ${project.tech}`;

            link.appendChild(titleSpan);
            // link.appendChild(metaSpan);

            projectItem.appendChild(numSpan);
            projectItem.appendChild(link);

            projectListContainer.appendChild(projectItem);
        });

        // After rendering, redraw lines
        drawLines();
    }

    // Initial Render
    renderProjects(projects);

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
            path.setAttribute("stroke", "black");
            path.setAttribute("stroke-width", "1");
            path.setAttribute("fill", "none");
            path.classList.add('connection-line');
            svgLayer.appendChild(path);
            return;
        }

        let d = "";

        // 1. Draw Vertical Spine with rounded ends
        // But actually the spine connects horizontal arms.
        // It's not just a vertical line. It's segments between arms.

        // We draw:
        // Source arm -> curve -> spine -> curve -> child arm.

        // Find Source Index in sorted events
        const sourceIndex = events.findIndex(e => e.type === 'source');
        const sourceEvent = events[sourceIndex];

        // Connect Source to Spine
        // If source is somewhere in middle, it joins the spine.
        // If source is at top/bottom, it starts/ends the spine?
        // Actually, the structure is a fork.
        // Source connects to Vx.
        // Spine runs from MinY to MaxY (covering all children + source).

        // Let's iterate segments.
        // We need to know if we are at the top or bottom of the spine to draw corners.

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
                // Middle: Just Straight Line (T-junction? No, usually forks don't T-junction from side. But here Source enters spine.)
                // "All" -> Spine.
                // If "All" is in middle (unlikely for Source, usually Source is one, Children many).
                // But if Source Y is between Child Ys...
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
                // Middle: Straight Line from Spine
                else {
                    d += `M ${vx} ${ev.y} L ${ev.x} ${ev.y} `;
                }
            }
        });

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", d);
        path.setAttribute("stroke", "black");
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
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');

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

            tagLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            currentTag = e.target.dataset.tag;

            filterProjects();
            drawLines();
        });
    });

    // Resize & Scroll Listeners
    // window.addEventListener('scroll', drawLines); // Removed scroll listener

    // Resize Listeners
    window.addEventListener('resize', () => {
        drawLines();
    });

    // Initial Draw
    setTimeout(() => {
        drawLines();
    }, 100);
});
