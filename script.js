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
            drawFork(activeTag, visibleProjects, 2);
        }
    }

    function drawFork(sourceEl, destNodeList, colIndex) {
        const containerRect = gridContainer.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();

        // Source Point: Right Middle
        const sourceX = sourceRect.right - containerRect.left;
        const sourceY = sourceRect.top + sourceRect.height / 2 - containerRect.top;

        // Determine Fixed Spine X based on column index
        // Grid padding is 40px. Columns are 250px.
        // Col 1 ends at 40 + 250 = 290.
        // Col 2 ends at 40 + 500 = 540.
        // We put the spine slightly before the next column starts to give a "margin".
        let vx;
        if (colIndex === 1) {
            vx = 40 + 250 - 20; // 270px
        } else {
            // Col 2 -> Col 3
            vx = 40 + 250 + 250 - 20; // 520px
        }

        const r = 12; // Corner Radius

        // Collect Destinations
        const destinations = [];
        destNodeList.forEach(dest => {
            const li = dest.closest('li') || dest.closest('.project-item');
            const targetEl = dest; // Use the link itself for precision
            const targetRect = targetEl.getBoundingClientRect();

            const dy = targetRect.top + targetRect.height / 2 - containerRect.top;

            // For the child, we want the line to enter from the left.
            // Child starts at column start. 
            // We can calculate strict entry X or use the element's left.
            // Let's use the element's left minus a small gap.
            const dx = targetRect.left - containerRect.left - 10;

            destinations.push({ x: dx, y: dy });
        });

        // Sort destinations by Y
        destinations.sort((a, b) => a.y - b.y);

        if (destinations.length === 0) return;

        const minY = destinations[0].y;
        const maxY = destinations[destinations.length - 1].y;

        // Path Construction
        let d = "";

        // 1. Draw Vertical Spine
        // The spine runs from the topmost child connection to the bottommost.
        // But we also need to connect to the source Y.
        // So the spine range is [min(sourceY, firstChildY), max(sourceY, lastChildY)]?
        // NO. The standard tree look is:
        // Source -> Horizontal -> Vertical Spine.
        // Children -> Horizontal -> Vertical Spine.
        // The Vertical Spine connects the Source's entry point to the Children's branching points.

        // Actually, often the Source connects to the MIDDLE of the spine?
        // Or the Source IS the parent, so the spine starts at Source Y?
        // Let's stick to the "Fork" style:
        // Source -> vx.
        // Spine runs along vx to cover all children ranges (and source entry).

        // Range of the vertical line:
        // It must cover Source Y AND all Child Ys.
        const allYs = [sourceY, ...destinations.map(p => p.y)];
        const spineTop = Math.min(...allYs);
        const spineBottom = Math.max(...allYs);

        // However, aesthetically, we usually want:
        // Source -> (curve) -> Spine
        // Spine -> (curve) -> Child

        // If Source Y is strictly between First and Last Child, the spine is just FirstChildY to LastChildY.
        // If Source Y is outside, we extend.

        // Let's strictly draw segments.

        // CONNECTIONS TO SPINE

        // Source -> Spine
        // We draw: M sourceX sourceY L (vx-r) sourceY Q vx sourceY vx (sourceY + direction * r) ?
        // This is complex.

        // Alternative: Just Horizontal and Vertical lines with arcs.

        // Helper to draw horizontal-to-vertical corner
        // from (x1, y1) to (x2, y2).
        // Since we have a shared spine at x=vx.

        // Source Connection:
        // sourceX, sourceY -> vx, sourceY
        // But we need a curve if it turns up/down.
        // If sourceY is within the spine implementation, it's a T-junction or corner.

        // Let's iterate all "Events" approach again but with fixed vx.

        // Draw the vertical line segment first?
        // Let's determine the purely vertical segment.
        // Are we branching FROM the source Y?
        // Yes, the conceptual "root" is at sourceY.
        // But the visual spine might need to go up or down to reach children.

        // Case 1: All children below Source.
        // Spine goes from sourceY down to lastChildY.
        // Case 2: Children above and below.
        // Spine goes from firstChildY to lastChildY.

        // Wait, if Source is in middle, does the spine break? No.
        // The spine is continuous.

        // Let's draw the vertical line from min(TargetYs) to max(TargetYs).
        // AND include SourceY?
        // Usually Source connects to the spine.
        // So Spine Top = min(SourceY, destinations[0].y)
        // Spine Bottom = max(SourceY, destinations[last].y)

        // ADJUSTMENT: We want rounded corners.
        // We can't just draw a single line.

        // Let's build the path command `d`.

        // 1. Source -> Spine
        d += `M ${sourceX} ${sourceY} L ${vx - r} ${sourceY} `;

        // Determine direction to turn for spine logic.
        // Actually, the spine exists at x = vx.
        // We need to render the vertical spine "smartly".

        // Instead of complex logic, let's just draw:
        // A. Horizontal line from Source to Spine.
        // B. Vertical line along Spine.
        // C. Horizontal lines from Spine to Children.
        // AND handle corners for A and C relative to B.

        // To do this cleanly with a single path:
        // It's a tree.
        // We can start at Source.
        // Move to Spine.
        // Then we can't "branch" in SVG path (it's one line), unless we re-trace or use multiple M commands.
        // Yes, `d` can contain multiple sub-paths (MoveTo).

        // Source -> Spine Intersection
        // M sourceX sourceY L (vx) sourceY ? No corner?
        // If we want corners:
        // M sourceX sourceY L (vx - r?) sourceY ...

        // Let's simplify.
        // Draw Source -> Spine
        // Check if we need to go up or down.
        // If destinations extend above SourceY:
        //    Line/Curve up.
        // If destinations extend below SourceY:
        //    Line/Curve down.

        // Let's tackle "Source to Spine" first.
        d += `M ${sourceX} ${sourceY} L ${vx} ${sourceY} `; // Straight line to spine

        // Now "Spine" vertical.
        // We need to cover [minY, maxY] of children.
        // We can just draw M vx minY L vx maxY.
        // But that overlaps the source junction without curves.

        // REFINED AESTHETIC:
        // The user wants "estetik". Sharp 90deg is techy but maybe too harsh.
        // Rounded corners are better.

        // Let's try this:
        // 1. Calculate Spine Top and Bottom (based on children).
        // 2. Adjust for SourceY.

        const effectiveTop = Math.min(minY, sourceY);
        const effectiveBottom = Math.max(maxY, sourceY);

        // Draw Vertical Line Segment (with gaps for corners)
        // M vx (effectiveTop + r) L vx (effectiveBottom - r)

        // But what if effectiveTop == sourceY? (Source is top).
        // Then we curve DOWN from Source.

        // Let's do a sub-path for the Vertical Spine + Child Branches.

        // Iterate children
        destinations.forEach(dest => {
            const dy = dest.y;
            const dx = dest.x;

            // Draw Branch from Spine to Child
            // We start at Spine: (vx, dy)
            // But we need to curve from the Vertical Spine.

            // Is this child above or below source? or just relative to the spine's flow?
            // Actually, we can draw the connection independently?
            // No, the vertical line connects them.

            // Let's draw:
            // 1. Horizontal from Child to Spine-with-corner.
            //    M dx dy L (vx + r) dy Q vx dy vx (dy - r_sign?)
            //    Direction depends on where this child is relative to the "main" flow?
            //    Actually, if we just draw L to vx, it's a T-junction.

            // Simplest Aesthetic Algorithm (Orthogonal with radius):
            // 1. Draw Source -> (vx, sourceY)
            // 2. Draw Vertical Spine from (vx, minY) to (vx, maxY).
            // 3. Draw Child -> (vx, childY)
            // 4. ADD ROUNDING later? No, hard to do later.

            // Let's try strict corners for alignment first, with standard "circuit" look.
            // User said "estetik", maybe straight is enough if aligned.
            // But "yumuşak" implies curves.

            // Okay, let's try strict corners for alignment first, with standard "circuit" look.
            // M sourceX sourceY L vx sourceY
            // M vx minY L vx maxY
            // M vx childY L childX childY

            // Wait, if I do just this, the wipe animation (stroke-dasharray) looks weird because it's multiple sub-paths.
            // It will wipe all segments simultaneously or in sequence?
            // Depending on browser. Usually simultaneous for one path element?
            // No, dashoffset applies to total length.
            // So it will wipe the WHOLE tree linearly.
            // That is a cool effect!
            // Order of drawing matters for the wipe direction.

            // Order:
            // 1. Source -> Spine (Left to Right)
            // 2. Spine Top -> Spine Bottom? Or Start from SourceY outwards?
            //    If we draw `M` again, it jumps.
            //    Wipe effect: The dash moves.
            //    If the path is discontinuous (MoveTo), the hidden part "jumps".
            //    Ideally, we want a continuous line? Impossible for a fork.

            // But `stroke-dashoffset` works on the total length of the path, including jumps (jumps length = 0).
            // So the "time" spent jumping is 0.

            // To look good:
            // Source -> Spine.
            // then Spine Top?

            // Let's just create ONE path string.
            // M sourceX sourceY L vx sourceY (Trace 1)
            // M vx minY L vx maxY (Trace 2 - The Spine)
            // For each child: M vx childY L childX childY (Trace 3...N)

            d += `M ${vx} ${dy} L ${dx} ${dy} `;
        });

        // Add Spine Line
        d += `M ${vx} ${minY} L ${vx} ${maxY} `;

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
