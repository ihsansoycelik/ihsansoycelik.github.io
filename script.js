document.addEventListener('DOMContentLoaded', () => {
    // 4. Data Management: Constant array of projects
    const projects = [
        {
            title: "Neural Diversity Regularizes Hallucinations in Small Models",
            tag: "AI / ML", // Updated to match image text
            category: "all",
            url: "#",
            date: "2023-10-15",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "The Part of Scaling Laws No One Talks About: The Bitter Lesson is Misunderstood",
            tag: "AI / ML",
            category: "all",
            url: "#",
            date: "2023-09-22",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "ML and the Future of Simulation",
            tag: "AI / ML",
            category: "all",
            url: "#",
            date: "2023-08-05",
            author: "Me",
            tech: "Vanilla JS"
        },
        {
            title: "Where are Full-stack ML Systems Going?",
            tag: "AI / ML",
            category: "all",
            url: "#",
            date: "2023-07-12",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Building a Real-time, Interactive, Agentic Voice AI Application",
            tag: "AI / ML",
            category: "all",
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
            // Pad index+1 with leading zero
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
            // link.appendChild(metaSpan); // Optional

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
        const visibleTags = document.querySelectorAll('.tag-link'); // Assume all visible for now

        if (activeNav && visibleTags.length > 0) {
            drawFork(activeNav, visibleTags, -10); // Offset for better visual
        }

        // 2. Draw from Active Tag (Col 2) to Projects (Col 3)
        const activeTag = document.querySelector('.tag-link.active');
        const visibleProjects = document.querySelectorAll('.project-link');

        if (activeTag && visibleProjects.length > 0) {
            drawFork(activeTag, visibleProjects, -10);
        }
    }

    function drawFork(sourceEl, destNodeList, xOffsetAdjustment = 0) {
        // Get coordinates relative to gridContainer
        const containerRect = gridContainer.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();

        // Start Point: Right Middle of Source
        const x1 = sourceRect.right - containerRect.left;
        const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;

        // Determine X split point (approx halfway between columns)
        const firstDest = destNodeList[0];
        const destRect = firstDest.getBoundingClientRect();
        const destLeft = destRect.left - containerRect.left;

        // Target the parent LI for coordinates (since link is inside LI with number)

        const verticalX = destLeft - 40; // Arbitrary gap
        const radius = 10;

        // Find Min and Max Y of destinations
        let minY = Infinity;
        let maxY = -Infinity;

        const destPoints = [];

        destNodeList.forEach(dest => {
            const li = dest.closest('li') || dest.closest('.project-item');
            const num = li.querySelector('.num');
            const targetRect = num.getBoundingClientRect();

            // Destination Point: Left Middle of Number
            const dx = targetRect.left - containerRect.left - 10; // 10px padding
            const dy = targetRect.top + targetRect.height / 2 - containerRect.top;

            destPoints.push({ x: dx, y: dy });

            if (dy < minY) minY = dy;
            if (dy > maxY) maxY = dy;
        });

        // Create path string
        let d = "";

        // Adjust Vertical X to be closer to Dests
        const vx = destPoints[0].x - 20;

        // Start at Source
        // Assume Top Alignment for "Minus One" style

        // Line from Source to First Child (Horizontal)
        // If aligned:
        const firstP = destPoints[0];
        d = `M ${x1} ${y1} L ${firstP.x} ${y1} `; // Direct line to first item

        // If there are more items, we need the vertical drop.
        if (destPoints.length > 1) {

            // 2. Top Corner (Source -> Down)
            // We draw the curve connecting the horizontal line to the vertical drop
            d += `M ${vx - radius} ${y1} Q ${vx} ${y1} ${vx} ${y1 + radius} `;

            // 3. Vertical Spine (down to last item's corner start)
            const lastP = destPoints[destPoints.length - 1];
            d += `L ${vx} ${lastP.y - radius} `;

            // 4. Branches (Child 2 to Last)
            for (let i = 1; i < destPoints.length; i++) {
                const p = destPoints[i];
                // Corner
                d += `M ${vx} ${p.y - radius} Q ${vx} ${p.y} ${vx + radius} ${p.y} L ${p.x} ${p.y} `;
            }
        }

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", d);
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "1.5"); // Slightly bolder
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
            // Lines are redrawn in renderProjects
            // But we also need to redraw lines for the Col 1 -> Col 2 connection
            // because Active Col 1 might have changed position (if filtering changed layout? No, fixed).
            // But drawing fork depends on active class.
            drawLines();
        });
    });

    // Event Listeners for Tags
    tagLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Single selection
             tagLinks.forEach(l => l.classList.remove('active'));

             // Toggle logic?
             if (currentTag === e.target.dataset.tag) {
                 // Keep active to maintain tree view structure usually
                 // or deselect.
                 // If we deselect, we have no lines.
                 // Let's allow deselecting to "All"?
                 // The design shows "AI/ML" active.
             }

             e.target.classList.add('active');
             currentTag = e.target.dataset.tag;

             filterProjects();
             drawLines(); // Redraw lines (Col 2 -> Col 3)
        });
    });

    // Resize Listener
    window.addEventListener('resize', drawLines);

    // Initial Draw
    setTimeout(drawLines, 100); // Small delay to ensure layout
});
