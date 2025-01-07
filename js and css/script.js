// Handle repository form submission
document.getElementById("repo-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const token = document.getElementById("token").value;
    const username = document.getElementById("username").value;
    const repo = document.getElementById("repo").value;

    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `token ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const contents = await response.json();
        displayFolders(contents, token, username, repo, '');
    } catch (error) {
        alert(error.message);
    }
});

// Display folder list
function displayFolders(contents, token, username, repo, path) {
    const folderList = document.getElementById("folder-list");
    folderList.innerHTML = '';

    // Filter for folders
    const folders = contents.filter(item => item.type === 'dir');

    if (folders.length === 0) {
        folderList.innerHTML = '<li>No folders found.</li>';
    } else {
        folders.forEach(folder => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${folder.name}</span>
                <button class="open-btn" data-path="${folder.path}">Open</button>
                <button class="delete-btn" data-path="${folder.path}">Delete</button>
            `;
            folderList.appendChild(li);
        });

        // Add event listeners for buttons
        document.querySelectorAll('.open-btn').forEach(button =>
            button.addEventListener('click', () => openFolder(token, username, repo, button.dataset.path))
        );
        document.querySelectorAll('.delete-btn').forEach(button =>
            button.addEventListener('click', () => deleteFolder(token, username, repo, button.dataset.path))
        );
    }

    document.getElementById("folders").classList.remove("hidden");
}

// Open folder to explore subfolders or create/delete a folder
async function openFolder(token, username, repo, folderPath) {
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${folderPath}`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `token ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const contents = await response.json();

        // Render a new HTML interface for creating/deleting folders
        renderFolderInterface(contents, token, username, repo, folderPath);
    } catch (error) {
        alert(error.message);
    }
}

// Render the interface for managing a folder
function renderFolderInterface(contents, token, username, repo, folderPath) {
    const container = document.querySelector('.container');
    container.innerHTML = `
        <h1>Manage Folder: ${folderPath}</h1>
        <ul id="subfolder-list"></ul>
        <form id="create-folder-form">
            <label for="new-folder-name">New Folder Name:</label>
            <input type="text" id="new-folder-name" placeholder="Enter folder name" required>
            <button type="submit">Create Folder</button>
        </form>
        <button id="back-button">Back</button>
    `;

    const subfolderList = document.getElementById("subfolder-list");

    // Filter and display subfolders with delete option
    const subfolders = contents.filter(item => item.type === 'dir');
    subfolderList.innerHTML = subfolders.length
        ? subfolders.map(subfolder => `
            <li>
                <span>${subfolder.name}</span>
                <button class="delete-subfolder-btn" data-path="${subfolder.path}">Delete</button>
            </li>`).join('')
        : '<li>No subfolders found.</li>';

    document.querySelectorAll('.delete-subfolder-btn').forEach(button =>
        button.addEventListener('click', () => deleteFolder(token, username, repo, button.dataset.path))
    );

    document.getElementById("back-button").addEventListener("click", () => location.reload());

    document.getElementById("create-folder-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const newFolderName = document.getElementById("new-folder-name").value;

        const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${folderPath}/${newFolderName}/placeholders.txt`;

        try {
            const response = await fetch(apiUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `token ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Create folder: ${newFolderName}`,
                    content: btoa("") // Empty file content
                })
            });

            if (response.ok) {
                alert(`Folder "${newFolderName}" created successfully!`);
                location.reload();
            } else {
                const result = await response.json();
                throw new Error(result.message);
            }
        } catch (error) {
            alert(error.message);
        }
    });
}

// Delete a folder
async function deleteFolder(token, username, repo, folderPath) {
    const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${folderPath}`;

    try {
        // Fetch the folder to get the SHA of the folder contents
        const response = await fetch(apiUrl, {
            headers: {
                Authorization: `token ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const contents = await response.json();

        // Delete each file or folder in the folder
        for (const item of contents) {
            await fetch(item.url, {
                method: "DELETE",
                headers: {
                    "Authorization": `token ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Delete ${item.name}`,
                    sha: item.sha
                })
            });
        }

        alert(`Folder "${folderPath}" deleted successfully!`);
        location.reload();
    } catch (error) {
        alert(error.message);
    }
}
