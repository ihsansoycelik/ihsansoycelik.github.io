document.addEventListener('DOMContentLoaded', () => {
    // 4. Data Management: Constant array of projects
    const projects = [
        {
            title: "Flow Field Simulation",
            tag: "Physics",
            category: "simulations",
            url: "#",
            date: "2023-10-15",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Perlin Noise Terrain",
            tag: "Noise",
            category: "sketches",
            url: "#",
            date: "2023-09-22",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Recursive Tree Fractal",
            tag: "Generative",
            category: "sketches",
            url: "#",
            date: "2023-08-05",
            author: "Me",
            tech: "Vanilla JS"
        },
        {
            title: "Interactive Particles",
            tag: "Interaction",
            category: "simulations",
            url: "#",
            date: "2023-07-12",
            author: "Me",
            tech: "p5.js"
        },
        {
            title: "Voronoi Diagrams",
            tag: "Generative",
            category: "sketches",
            url: "#",
            date: "2023-06-30",
            author: "Me",
            tech: "p5.js"
        }
    ];

    const projectListContainer = document.getElementById('project-list');
    const navLinks = document.querySelectorAll('.nav-link');
    const tagLinks = document.querySelectorAll('.tag-link');

    // Function to render projects
    function renderProjects(projectsToRender) {
        projectListContainer.innerHTML = ''; // Clear current list

        projectsToRender.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';

            // Link wrapper
            const link = document.createElement('a');
            link.href = project.url;
            link.style.width = '100%';
            link.style.display = 'flex';
            link.style.justifyContent = 'space-between';

            // Title
            const titleSpan = document.createElement('span');
            titleSpan.className = 'project-title';
            titleSpan.textContent = project.title;

            // Meta (Date / Tech)
            const metaSpan = document.createElement('span');
            metaSpan.className = 'project-meta';
            metaSpan.textContent = `${project.date} / ${project.tech}`;

            link.appendChild(titleSpan);
            link.appendChild(metaSpan);
            projectItem.appendChild(link);

            projectListContainer.appendChild(projectItem);
        });
    }

    // Initial Render
    renderProjects(projects);

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

            // Remove active class from all nav links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            e.target.classList.add('active');

            // Set current category
            if (e.target.dataset.filter === 'all') {
                currentCategory = 'all';
            } else {
                currentCategory = e.target.dataset.category;
            }

            // Reset tags when switching main category?
            // The prompt implies independent filtering or hierarchical.
            // "Clicking a 'Tag' in Column 2 should filter the list in Column 3 to show only matching projects."
            // Usually category filters might reset tag filters or work in conjunction.
            // Let's keep them working in conjunction for now, or maybe just filter by tag resets category?
            // "Column 1 (Left): High-level navigation... Column 2 (Middle): Topic/Tag filtering... Clicking a 'Tag'... should filter"
            // Let's assume standard behavior: Click category -> filter by category (show all tags in that category?). Click tag -> filter by tag.
            // But if I click "Sketches", and then "Physics", should it show Physics Sketches?
            // The prompt doesn't specify complex AND logic, but "Clicking a 'Tag' ... should filter ... to show only matching projects."

            // For simplicity and to match the "MinusOne" likely behavior (which seems to act as filters), I will make them work together.

            filterProjects();
        });
    });

    // Event Listeners for Tags
    tagLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

             // Remove active class from all tag links
             tagLinks.forEach(l => l.classList.remove('active'));

             // Toggle behavior or single selection?
             // "Clicking a 'Tag' ... should filter"
             // Let's implement single selection for tags.

             if (currentTag === e.target.dataset.tag) {
                 // Deselect if already selected
                 currentTag = 'all';
                 e.target.classList.remove('active');
             } else {
                 currentTag = e.target.dataset.tag;
                 e.target.classList.add('active');
             }

             filterProjects();
        });
    });
});
