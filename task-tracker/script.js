document.addEventListener('DOMContentLoaded', () => {
    const taskMenu = document.getElementById('task-menu');
    const addButton = document.getElementById('add-task-btn');
    let taskCount = 1;

    addButton.addEventListener('click', () => {
        // Create new task item
        const newTaskLink = document.createElement('a');
        newTaskLink.href = '#';
        newTaskLink.className = 'menu-item';

        // Generic List icon for new tasks
        newTaskLink.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>Task ${taskCount}</span>
        `;

        // Insert before the add button
        taskMenu.insertBefore(newTaskLink, addButton);

        // Add click event for active state toggling
        newTaskLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            newTaskLink.classList.add('active');
        });

        taskCount++;
    });

    // Handle initial items active state
    const initialItems = document.querySelectorAll('.menu-item:not(#add-task-btn)');
    initialItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
});
