// UserDirectory class to handle fetching and displaying users
class UserDirectory {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.users = [];
        this.filteredUsers = [];
        this.stateAbbreviations = {
            'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
            'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
            'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
            'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA',
            'Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT',
            'Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM',
            'New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
            'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
            'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT',
            'Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
        };
    }

    // Fetch 12 users from API and store internally
    async loadUsers() {
        try {
            const response = await fetch(this.apiEndpoint);
            const json = await response.json();
            this.users = json.results;
            this.filteredUsers = this.users; // initially no filter
            this.renderUserCards(this.filteredUsers);
            this.injectSearchBox();
        } catch (err) {
            console.error('Failed to fetch users:', err);
            document.getElementById('gallery').textContent = 'Failed to load users.';
        }
    }

    // Render user cards to the gallery container
    renderUserCards(users) {
        const gallery = document.getElementById('gallery');
        gallery.replaceChildren(); // clear existing content

        users.forEach((user, index) => {
            const userCard = `
                <div class="card" data-index="${index}">
                    <div class="card-img-container">
                        <img class="card-img" src="${user.picture.large}" alt="Profile picture of ${user.name.first} ${user.name.last}">
                    </div>
                    <div class="card-info-container">
                        <h3 class="card-name cap">${user.name.first} ${user.name.last}</h3>
                        <p class="card-text">${user.email}</p>
                        <p class="card-text cap">${user.location.city}, ${user.location.state}</p>
                    </div>
                </div>
            `;
            gallery.insertAdjacentHTML('beforeend', userCard);
        });
    }

    // Add search input above gallery if not present
    injectSearchBox() {
        if (!document.querySelector('.search-container input')) {
            const searchHTML = `<input type="search" class="search-input" placeholder="Search employees...">`;
            document.querySelector('.search-container').insertAdjacentHTML('beforeend', searchHTML);

            document.querySelector('.search-input').addEventListener('input', e => {
                const query = e.target.value.toLowerCase();
                this.filterUsers(query);
            });
        }
    }

    // Filter users based on search query and rerender cards
    filterUsers(query) {
        if (query === '') {
            this.filteredUsers = this.users;
        } else {
            this.filteredUsers = this.users.filter(user => {
                const fullName = `${user.name.first.toLowerCase()} ${user.name.last.toLowerCase()}`;
                return fullName.includes(query);
            });
        }
        this.renderUserCards(this.filteredUsers);
    }

    // Build and display modal for a selected user by index
    showModal(userIndex) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-container');
        if (existingModal) existingModal.remove();

        const user = this.filteredUsers[userIndex];
        const dobFormatted = new Date(user.dob.date).toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'});
        const stateCode = this.stateAbbreviations[user.location.state] || user.location.state;

        // Modal markup
        const modalHTML = `
            <div class="modal-container" data-index="${userIndex}">
                <div class="modal">
                    <button type="button" id="modal-close-btn" class="modal-close-btn" aria-label="Close modal">&times;</button>
                    <div class="modal-info-container">
                        <img class="modal-img" src="${user.picture.large}" alt="Profile picture of ${user.name.first} ${user.name.last}">
                        <h3 class="modal-name cap">${user.name.first} ${user.name.last}</h3>
                        <p class="modal-text">${user.email}</p>
                        <p class="modal-text cap">${user.location.city}</p>
                        <hr>
                        <p class="modal-text">${user.cell}</p>
                        <p class="modal-text">${user.location.street.number} ${user.location.street.name}, ${stateCode} ${user.location.postcode}</p>
                        <p class="modal-text">Birthday: ${dobFormatted}</p>
                    </div>
                    <div class="modal-btn-container">
                        <button type="button" id="modal-prev" class="modal-prev btn">Prev</button>
                        <button type="button" id="modal-next" class="modal-next btn">Next</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('gallery').insertAdjacentHTML('afterend', modalHTML);

        // Attach event listeners for modal controls
        document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-prev').addEventListener('click', () => this.showPrevUser());
        document.getElementById('modal-next').addEventListener('click', () => this.showNextUser());
    }

    // Close modal by removing it from DOM
    closeModal() {
        const modal = document.querySelector('.modal-container');
        if (modal) modal.remove();
    }

    // Show previous user modal, loops to last if at beginning
    showPrevUser() {
        const modal = document.querySelector('.modal-container');
        if (!modal) return;
        let currentIndex = Number(modal.dataset.index);
        currentIndex = (currentIndex === 0) ? this.filteredUsers.length - 1 : currentIndex - 1;
        this.showModal(currentIndex);
    }

    // Show next user modal, loops to first if at end
    showNextUser() {
        const modal = document.querySelector('.modal-container');
        if (!modal) return;
        let currentIndex = Number(modal.dataset.index);
        currentIndex = (currentIndex === this.filteredUsers.length - 1) ? 0 : currentIndex + 1;
        this.showModal(currentIndex);
    }
}


// Main Application controller
class DirectoryApp {
    constructor() {
        this.directory = new UserDirectory('https://randomuser.me/api/?results=12&nat=us&inc=picture,name,email,location,phone,cell,dob');
    }

    // Initialize the app
    init() {
        this.showLoadingMessage();
        this.directory.loadUsers();
        this.bindGalleryClick();
    }

    // Show loading text before data fetch completes
    showLoadingMessage() {
        const gallery = document.getElementById('gallery');
        gallery.textContent = 'Loading users...';
    }

    // Add event listener for user card clicks to open modal
    bindGalleryClick() {
        const gallery = document.getElementById('gallery');
        gallery.addEventListener('click', e => {
            const card = e.target.closest('.card');
            if (!card) return;
            const index = Number(card.dataset.index);
            this.directory.showModal(index);
        });
    }
}

// Instantiate and start the app
const app = new DirectoryApp();
app.init();
