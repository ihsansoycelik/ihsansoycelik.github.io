document.addEventListener('DOMContentLoaded', () => {
    const taskList = document.getElementById('task-list');
    const addButton = document.getElementById('add-task-btn');
    let taskCount = 3; // Start from 3 as 1 and 2 exist

    function activateItem(item) {
        document.querySelectorAll('.task-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Update main content header to match selection
        const title = item.querySelector('span').textContent;
        const mainHeader = document.querySelector('.content h1');
        if (mainHeader) {
            mainHeader.textContent = title;
        }
    }

    addButton.addEventListener('click', () => {
        const newTaskLink = document.createElement('a');
        newTaskLink.href = '#';
        newTaskLink.className = 'task-item';

        // Use the circle icon for new tasks
        newTaskLink.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <span>Task ${taskCount}</span>
        `;

        taskList.appendChild(newTaskLink);

        newTaskLink.addEventListener('click', (e) => {
            e.preventDefault();
            activateItem(newTaskLink);
        });

        // Scroll to the new item
        newTaskLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        taskCount++;
    });

    // Attach listeners to initial items
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            activateItem(item);
        });
    });
});
