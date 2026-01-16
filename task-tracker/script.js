document.addEventListener('DOMContentLoaded', () => {
    // --- Data State ---
    const state = {
        lists: [
            { id: 'personal', name: 'Personal', color: 'blue', icon: 'list' },
            { id: 'work', name: 'Work', color: 'orange', icon: 'briefcase' }
        ],
        tasks: [
            { id: 1, text: 'Buy groceries', completed: false, listId: 'personal', date: new Date() },
            { id: 2, text: 'Finish project proposal', completed: false, listId: 'work', date: new Date() },
            { id: 3, text: 'Call Mom', completed: true, listId: 'personal', date: new Date() }
        ],
        currentView: 'all' // 'all', 'today', 'scheduled', 'flagged', or listId
    };

    // --- DOM Elements ---
    const els = {
        smartCards: document.querySelectorAll('.smart-card'),
        userLists: document.getElementById('user-lists'),
        listTitle: document.getElementById('list-title'),
        listTotalCount: document.getElementById('list-total-count'),
        taskList: document.getElementById('task-list'),
        newTaskWrapper: document.getElementById('new-task-wrapper'),
        counts: {
            today: document.getElementById('count-today'),
            scheduled: document.getElementById('count-scheduled'),
            all: document.getElementById('count-all'),
            flagged: document.getElementById('count-flagged')
        }
    };

    // --- Core Logic ---

    function init() {
        renderSidebar();
        renderMainView();
        setupEventListeners();
    }

    function getFilteredTasks() {
        switch (state.currentView) {
            case 'all':
                return state.tasks;
            case 'today':
                // Simplified "Today" logic (checks if created/due today)
                const today = new Date().toDateString();
                return state.tasks.filter(t => new Date(t.date).toDateString() === today);
            case 'scheduled':
                // Simplified: All tasks with a date are "scheduled" in this demo
                return state.tasks;
            case 'flagged':
                return []; // No flag feature implemented yet
            default:
                return state.tasks.filter(t => t.listId === state.currentView);
        }
    }

    function getViewTitle() {
        switch (state.currentView) {
            case 'all': return 'All';
            case 'today': return 'Today';
            case 'scheduled': return 'Scheduled';
            case 'flagged': return 'Flagged';
            default:
                const list = state.lists.find(l => l.id === state.currentView);
                return list ? list.name : 'Unknown';
        }
    }

    function getViewColor() {
         switch (state.currentView) {
            case 'all': return 'var(--color-gray)';
            case 'today': return 'var(--color-blue)';
            case 'scheduled': return 'var(--color-red)';
            case 'flagged': return 'var(--color-orange)';
            default:
                const list = state.lists.find(l => l.id === state.currentView);
                return list ? `var(--color-${list.color})` : 'black';
        }
    }

    // --- Rendering ---

    function renderSidebar() {
        // Update Smart Counts
        els.counts.all.textContent = state.tasks.filter(t => !t.completed).length;
        // simplistic counts for demo
        els.counts.today.textContent = state.tasks.filter(t => !t.completed).length;
        els.counts.scheduled.textContent = state.tasks.filter(t => !t.completed).length;
        els.counts.flagged.textContent = 0;

        // Render User Lists
        els.userLists.innerHTML = '';
        state.lists.forEach(list => {
            const li = document.createElement('li');
            li.className = `list-row ${state.currentView === list.id ? 'active' : ''}`;
            li.dataset.id = list.id;

            const count = state.tasks.filter(t => t.listId === list.id && !t.completed).length;

            li.innerHTML = `
                <div class="list-icon-bg ${list.color}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                </div>
                <span class="list-name">${list.name}</span>
                <span class="list-count">${count || ''}</span>
            `;

            li.addEventListener('click', () => switchView(list.id));
            els.userLists.appendChild(li);
        });
    }

        // Update Smart Cards Active State
        els.smartCards.forEach(card => {
            if (card.dataset.list === state.currentView) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    function renderMainView() {
        const tasks = getFilteredTasks();
        const title = getViewTitle();
        const color = getViewColor();

        els.listTitle.textContent = title;
        els.listTitle.style.color = color;
        els.listTotalCount.textContent = tasks.length;

        els.taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskRow = document.createElement('div');
            taskRow.className = `task-row ${task.completed ? 'completed' : ''}`;
            taskRow.innerHTML = `
                <div class="check-circle" role="button"></div>
                <div class="task-content">
                    <input type="text" class="task-text" value="${escapeHtml(task.text)}" readonly>
                    <!-- <div class="task-details">Notes or Date</div> -->
                </div>
                <!-- Delete Icon (appears on hover) -->
                <button class="delete-btn" aria-label="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;

            // Event Listeners for Task Items
            const check = taskRow.querySelector('.check-circle');
            check.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTask(task.id);
            });

            const deleteBtn = taskRow.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            els.taskList.appendChild(taskRow);
        });
    }

    // --- Actions ---

    function switchView(viewId) {
        state.currentView = viewId;
        renderSidebar();
        renderMainView();
    }

    function toggleTask(id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            renderMainView();
            renderSidebar(); // Update counts
        }
    }

    function deleteTask(id) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        renderMainView();
        renderSidebar();
    }

    function addTask(text) {
        const listId = (['all', 'today', 'scheduled', 'flagged'].includes(state.currentView))
            ? 'personal' // Default for smart lists
            : state.currentView;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false,
            listId: listId,
            date: new Date()
        };
        state.tasks.push(newTask);
        renderMainView();
        renderSidebar();
    }

    // --- Setup ---

    function setupEventListeners() {
        // Smart Cards
        els.smartCards.forEach(card => {
            card.addEventListener('click', () => switchView(card.dataset.list));
        });

        // New Task Interaction
        const placeholder = els.newTaskWrapper.querySelector('.task-row.is-placeholder');

        // Transform placeholder to input
        placeholder.addEventListener('click', () => {
            els.newTaskWrapper.innerHTML = `
                <div class="task-row">
                    <div class="check-circle-placeholder"></div>
                    <div class="task-content">
                        <input type="text" id="new-task-input" class="task-text" placeholder="New Reminder" autofocus>
                    </div>
                </div>
            `;
            const input = document.getElementById('new-task-input');
            input.focus();

            // Handle Input Enter
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (input.value.trim()) {
                        addTask(input.value.trim());
                        input.value = ''; // Clear for next
                    } else {
                        // Empty enter, revert
                        resetNewTaskArea();
                    }
                }
            });

            // Handle Blur (revert if empty)
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    resetNewTaskArea();
                } else {
                    // Option: auto-save on blur? Apple Reminders doesn't usually, but let's just keep it focused or add.
                    // For now, if they click away with text, let's add it.
                    addTask(input.value.trim());
                    resetNewTaskArea();
                }
            });
        });
    }

    function resetNewTaskArea() {
        els.newTaskWrapper.innerHTML = `
            <div class="task-row is-placeholder">
                <div class="check-circle-placeholder"></div>
                <span class="placeholder-text">New Reminder</span>
            </div>
        `;
        // Re-bind click
        const placeholder = els.newTaskWrapper.querySelector('.task-row.is-placeholder');
        placeholder.addEventListener('click', () => {
             // ... trigger setup again (easier to just call setupEventListeners part for this, but simplistic approach below)
             // Actually, since I replaced innerHTML, the original event listener is gone.
             // I need to extract the logic.
             handleNewTaskClick(placeholder);
        });
    }

    function handleNewTaskClick(element) {
        // Copied logic from setupEventListeners to handle re-binding
         els.newTaskWrapper.innerHTML = `
            <div class="task-row">
                <div class="check-circle-placeholder"></div>
                <div class="task-content">
                    <input type="text" id="new-task-input" class="task-text" placeholder="New Reminder" autofocus>
                </div>
            </div>
        `;
        const input = document.getElementById('new-task-input');
        input.focus();

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (input.value.trim()) {
                    addTask(input.value.trim());
                    input.value = '';
                } else {
                    resetNewTaskArea();
                }
            }
        });

        input.addEventListener('blur', () => {
            if (input.value.trim()) {
                addTask(input.value.trim());
            }
            resetNewTaskArea();
        });
    }

    // Initial binding fix
    function bindNewTask() {
         const placeholder = els.newTaskWrapper.querySelector('.task-row.is-placeholder');
         if(placeholder) {
             placeholder.addEventListener('click', () => handleNewTaskClick(placeholder));
         }
    }

    // Override reset to use bind
    function resetNewTaskArea() {
        els.newTaskWrapper.innerHTML = `
            <div class="task-row is-placeholder">
                <div class="check-circle-placeholder"></div>
                <span class="placeholder-text">New Reminder</span>
            </div>
        `;
        bindNewTask();
    }

    // Helper to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Replace setupEventListeners placeholder logic with bindNewTask
    els.smartCards.forEach(card => {
        card.addEventListener('click', () => switchView(card.dataset.list));
    });
    bindNewTask();

    // Start
    init();
});
