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
                    // Show Spinner, Hide Frame initially
                    const spinner = document.getElementById('loading-spinner');
                    spinner.style.display = 'block';
                    projectFrame.style.display = 'none'; // Hide until loaded for cleaner effect

                    projectFrame.src = url;

                    // Smooth scroll to the iframe container (viewer) instead of the frame
                    projectViewer.scrollIntoView({ behavior: 'smooth' });

                    // Hide Spinner on Load
                    projectFrame.onload = () => {
                        spinner.style.display = 'none';
                        projectFrame.style.display = 'block';
                    };
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

        // Source point: right edge, vertical center
        const x1 = sourceRect.right - containerRect.left;
        const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;

        // Collect all destination points
        const destPoints = [];
        let minDestX = Infinity;

        destNodeList.forEach(dest => {
            const targetRect = dest.getBoundingClientRect();
            const dx = targetRect.left - containerRect.left - 8;
            const dy = targetRect.top + targetRect.height / 2 - containerRect.top;
            destPoints.push({ x: dx, y: dy });
            if (dx < minDestX) minDestX = dx;
        });

        if (destPoints.length === 0) return;

        // Sort by Y position
        destPoints.sort((a, b) => a.y - b.y);

        // Calculate spine X position: midway between source right edge and leftmost destination
        const spineX = x1 + (minDestX - x1) / 2;
        const radius = 10; // Corner radius

        const firstY = destPoints[0].y;
        const lastY = destPoints[destPoints.length - 1].y;

        let d = "";

        // Source connects to spine
        if (destPoints.length === 1 && Math.abs(y1 - firstY) < 5) {
            // Single destination at same height: straight horizontal line
            d = `M ${x1} ${y1} L ${destPoints[0].x} ${destPoints[0].y}`;
        } else {
            // Multiple destinations or different heights

            // Determine if source is above, below, or between destinations
            const sourceAboveAll = y1 <= firstY;
            const sourceBelowAll = y1 >= lastY;

            if (sourceAboveAll) {
                // Source is at top: horizontal then curve down
                d += `M ${x1} ${y1} L ${spineX - radius} ${y1} `;
                d += `Q ${spineX} ${y1} ${spineX} ${y1 + radius} `;
                // Spine down to last destination
                if (lastY - radius > y1 + radius) {
                    d += `L ${spineX} ${lastY - radius} `;
                }
            } else if (sourceBelowAll) {
                // Source is at bottom: horizontal then curve up
                d += `M ${x1} ${y1} L ${spineX - radius} ${y1} `;
                d += `Q ${spineX} ${y1} ${spineX} ${y1 - radius} `;
                // Spine up to first destination
                if (y1 - radius > firstY + radius) {
                    d += `L ${spineX} ${firstY + radius} `;
                }
            } else {
                // Source is in the middle: T-junction
                d += `M ${x1} ${y1} L ${spineX} ${y1} `;
                // Spine goes both up and down from source Y
                d += `M ${spineX} ${firstY} L ${spineX} ${lastY} `;
            }

            // Draw branches to each destination
            destPoints.forEach((pt, i) => {
                const isFirst = (i === 0);
                const isLast = (i === destPoints.length - 1);

                if (sourceAboveAll) {
                    if (isLast) {
                        // Last destination: curve right
                        d += `Q ${spineX} ${pt.y} ${spineX + radius} ${pt.y} L ${pt.x} ${pt.y} `;
                    } else {
                        // Middle destinations: T-junction
                        d += `M ${spineX} ${pt.y} L ${pt.x} ${pt.y} `;
                    }
                } else if (sourceBelowAll) {
                    if (isFirst) {
                        // First destination: curve right
                        d += `Q ${spineX} ${pt.y} ${spineX + radius} ${pt.y} L ${pt.x} ${pt.y} `;
                    } else {
                        // Middle destinations: T-junction
                        d += `M ${spineX} ${pt.y} L ${pt.x} ${pt.y} `;
                    }
                } else {
                    // Source in middle: all branches are horizontal
                    d += `M ${spineX} ${pt.y} L ${pt.x} ${pt.y} `;
                }
            });
        }

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
