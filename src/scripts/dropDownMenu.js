document.addEventListener('DOMContentLoaded', () => {
    let hideTimeout;

    // Show dropdown when hovering over the dropdown trigger or dropdown content
    document.body.addEventListener('mouseover', event => {
        const dropdown = event.target.closest('.dropdown');
        if (dropdown) {
            const dropdownContent = dropdown.querySelector('.dropdown-content');
            if (dropdownContent) {
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                }
                dropdownContent.style.display = 'block';
            }
        }
    });

    // Hide dropdown with delay when mouse leaves the dropdown trigger or content
    document.body.addEventListener('mouseout', event => {
        const dropdown = event.target.closest('.dropdown');
        if (dropdown) {
            const dropdownContent = dropdown.querySelector('.dropdown-content');
            if (dropdownContent) {
                hideTimeout = setTimeout(() => {
                    dropdownContent.style.display = 'none';
                }, 300); // Adding a delay of 300ms before hiding
            }
        }
    });

    // Handle clicks for disconnect or other actions
    document.body.addEventListener('click', event => {
        if (event.target.classList.contains('disconnect')) {
            console.log('Disconnect clicked');
        }
    });
});
