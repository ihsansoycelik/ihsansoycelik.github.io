document.addEventListener('DOMContentLoaded', () => {
    // 4. Data Management: Constant array of projects
    const projects = [
        {
            title: "Neural Diversity Regularizes Hallucinations in Small Models",
            tag: "AI / ML",
            category: "all",
            url: "#",
            date: "2023-10-15",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Generative Landscapes with Perlin Noise",
            tag: "Generative",
            category: "sketches",
            url: "#",
            date: "2023-09-22",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Physics Simulation: Double Pendulum",
            tag: "Physics",
            category: "simulations",
            url: "#",
            date: "2023-08-05",
            author: "Me",
            tech: "Vanilla JS"
        },
        {
            title: "Flow Fields and Noise",
            tag: "Noise",
            category: "sketches",
            url: "#",
            date: "2023-07-12",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Interactive Particle System",
            tag: "Interaction",
            category: "simulations",
            url: "#",
            date: "2023-06-30",
            author: "Me",
            tech: "p5.js"
        },
         {
            title: "The Near Future of AI is Action-Driven",
            tag: "AI / ML",
            category: "all",
            url: "#",
            date: "2023-06-30",
            author: "Me",
            tech: "p5.js"
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

            // Title
            const titleSpan = document.createElement('span');
            titleSpan.className = 'project-title';
            titleSpan.textContent = project.title;

            // Meta (Hidden mostly)
            const metaSpan = document.createElement('span');
            metaSpan.className = 'project-meta';
            metaSpan.textContent = `${project.date} / ${project.tech}`;

            link.appendChild(titleSpan);
            link.appendChild(metaSpan);

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

        // Combine Source and Children into a list of "Vertical Events"
        const events = [
            { y: y1, type: 'source', x: x1 },
            ...destPoints
        ];

        // Sort by Y
        events.sort((a, b) => a.y - b.y);

        const minY = events[0].y;
        const maxY = events[events.length - 1].y;

        let d = "";

        // 1. Draw Vertical Spine (Square corners = full length)
        if (maxY - minY > 0) {
             d += `M ${vx} ${minY} L ${vx} ${maxY} `;
        }

        // 2. Process each event to connect to spine
        events.forEach(ev => {
            const isSingle = (minY === maxY);

            if (ev.type === 'source') {
                // Connect Source (Left) to Spine (Right)
                // Square Corner: Just horizontal line to vx
                d += `M ${ev.x} ${ev.y} L ${vx} ${ev.y} `;
            } else {
                // Connect Spine (Left) to Child (Right)
                // Square Corner: Just horizontal line from vx
                d += `M ${vx} ${ev.y} L ${ev.x} ${ev.y} `;
            }
        });

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", d);
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("fill", "none");
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
    window.addEventListener('resize', drawLines);
    window.addEventListener('scroll', drawLines);

    // Initial Draw
    setTimeout(drawLines, 100);
});
