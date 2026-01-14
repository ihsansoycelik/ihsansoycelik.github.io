document.addEventListener('DOMContentLoaded', () => {
    // List Data Management
    const lists = {
        'Personal': {
            color: 'var(--color-blue)',
            tasks: [
                { text: 'Buy groceries for the week', meta: 'Today', completed: false },
                { text: 'Call insurance company', meta: 'Overdue', overdue: true, completed: false },
                { text: 'Schedule dentist appointment', meta: 'Yesterday', completed: true }
            ]
        },
        'Work': {
            color: 'var(--color-orange)',
            tasks: [
                { text: 'Review Q1 Reports', meta: 'Today', completed: false },
                { text: 'Email Client X', meta: 'Tomorrow', completed: false },
                { text: 'Update Project Timeline', meta: 'Friday', completed: false },
                { text: 'Team Meeting Prep', meta: 'Yesterday', completed: true },
                { text: 'Submit Expenses', meta: 'Monday', completed: true }
            ]
        },
        'Clients': {
            color: 'var(--color-green)',
            tasks: [
                { text: 'Design Review with Alice', meta: 'Thursday', completed: false },
                { text: 'Send Invoice #402', meta: 'Friday', completed: false }
            ]
        }
    };

    let activeList = 'Personal';

    // DOM Elements
    const taskListNav = document.getElementById('task-list');
    const mainTitle = document.getElementById('list-title');
    const mainCount = document.getElementById('list-count');
    const tasksContainer = document.getElementById('tasks-container');
    const addListBtn = document.getElementById('add-list-btn');

    // Render Tasks Function
    function renderTasks(listName) {
        const data = lists[listName];
        if (!data) return;

        // Update Header
        mainTitle.textContent = listName;
        mainTitle.style.color = data.color;
        mainCount.textContent = `${data.tasks.filter(t => !t.completed).length} items`;

        // Clear Container
        tasksContainer.innerHTML = '';

        // Generate HTML
        data.tasks.forEach((task, index) => {
            const row = document.createElement('div');
            row.className = `task-row ${task.completed ? 'completed' : ''}`;

            const checkbox = document.createElement('button');
            checkbox.className = `checkbox-btn ${task.completed ? 'checked' : ''}`;
            checkbox.onclick = () => toggleTask(listName, index);

            const details = document.createElement('div');
            details.className = 'task-details';

            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.text;

            const metaSpan = document.createElement('span');
            metaSpan.className = `task-meta ${task.overdue ? 'text-red' : ''}`;
            metaSpan.textContent = task.meta;

            details.appendChild(textSpan);
            details.appendChild(metaSpan);

            row.appendChild(checkbox);
            row.appendChild(details);

            tasksContainer.appendChild(row);
        });
    }

    // Toggle Task Completion
    function toggleTask(listName, index) {
        const list = lists[listName];
        list.tasks[index].completed = !list.tasks[index].completed;
        renderTasks(listName); // Re-render to update counts and styles
    }

    // Handle List Switching
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Remove active class from all
            document.querySelectorAll('.task-item').forEach(i => i.classList.remove('active'));
            // Add to clicked
            item.classList.add('active'); // Note: closest('a') if using bubbles

            // Get list name
            const listName = item.getAttribute('data-list');
            activeList = listName;
            renderTasks(listName);
        });
    });

    // Add List Functionality (Mock)
    addListBtn.addEventListener('click', () => {
        const name = prompt("Enter new list name:", "New List");
        if (name) {
            lists[name] = { color: 'var(--text-secondary)', tasks: [] };

            // Add to Sidebar DOM
            const newLink = document.createElement('a');
            newLink.href = '#';
            newLink.className = 'task-item';
            newLink.setAttribute('data-list', name);
            newLink.innerHTML = `
                <div class="icon-wrapper" style="background: rgba(255,255,255,0.1); color: white;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </div>
                <span>${name}</span>
                <span class="count">0</span>
            `;

            // Insert before the last item or append
            taskListNav.appendChild(newLink);

            // Add click listener
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.task-item').forEach(i => i.classList.remove('active'));
                newLink.classList.add('active');
                activeList = name;
                renderTasks(name);
            });

            // Switch to it
            newLink.click();
        }
    });

    // Handle New Task Input (Mock)
    const taskInput = document.querySelector('.new-task-input input');
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && taskInput.value.trim() !== '') {
            lists[activeList].tasks.unshift({
                text: taskInput.value,
                meta: 'Just now',
                completed: false
            });
            taskInput.value = '';
            renderTasks(activeList);
        }
    });

    // Initial Render
    renderTasks('Personal');
});
