document.addEventListener('DOMContentLoaded', () => {
    // 1. Data: Projects
    const projects = [
        {
            title: "Kinetic Poster 1",
            url: "kinetic-poster-1/index.html"
        },
        {
            title: "Kinetic Poster 2",
            url: "kinetic-poster-2/index.html"
        },
        {
            title: "Interactive Graffiti",
            url: "Interactive-graffiti-1/index.html"
        }
    ];

    const taskList = document.getElementById('task-list');
    const projectFrame = document.getElementById('project-frame');
    const spinner = document.getElementById('loading-spinner');

    // 2. Render Sidebar Navigation
    function renderNav() {
        taskList.innerHTML = '';

        projects.forEach((project, index) => {
            const li = document.createElement('li');
            li.className = 'nav-item';

            const link = document.createElement('a');
            link.href = '#';
            link.className = 'nav-link';

            // "Task X" convention
            link.textContent = `Task ${index + 1}`;

            // Store data
            link.dataset.url = project.url;
            link.dataset.index = index;

            link.addEventListener('click', (e) => {
                e.preventDefault();
                loadProject(index);
            });

            li.appendChild(link);
            taskList.appendChild(li);
        });

        // Load first project by default
        if (projects.length > 0) {
            loadProject(0);
        }
    }

    // 3. Load Project Logic
    function loadProject(index) {
        // Update Active State
        const links = document.querySelectorAll('.nav-link');
        links.forEach(l => l.classList.remove('active'));
        if (links[index]) links[index].classList.add('active');

        // Load Iframe
        const url = projects[index].url;
        if (projectFrame.src.includes(url)) return; // Don't reload if same

        spinner.style.display = 'block';
        projectFrame.style.opacity = '0'; // Hide during load
        projectFrame.style.transition = 'opacity 0.2s';

        projectFrame.src = url;
    }

    // Iframe Load Handler
    projectFrame.addEventListener('load', () => {
        spinner.style.display = 'none';
        projectFrame.style.opacity = '1';

        // Optional: We can still sync window background if we want,
        // but macOS apps usually keep the sidebar consistent.
        // Let's keep the sidebar static (gray) and only the content area changes.
        // If the user wants the "content area" to match the iframe background, we can do that.
        // But for now, let's stick to the standard macOS split view where content is independent.
    });

    // Initialize
    renderNav();
});
