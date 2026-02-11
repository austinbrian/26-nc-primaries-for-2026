// State
let races = [];
let currentView = 'peek';
let currentFilter = 'ALL';
let expandedRace = null; // Track which race is expanded

// DOM Elements
const board = document.getElementById('board');
const lastUpdatedEl = document.getElementById('lastUpdated');
const pageSubtitleEl = document.getElementById('pageSubtitle');
const viewBtns = document.querySelectorAll('.view-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Load data
async function loadData() {
  try {
    const response = await fetch('races.json');
    const data = await response.json();
    races = data.races;
    lastUpdatedEl.textContent = formatDate(data.lastUpdated);
    if (data.subtitle) {
      pageSubtitleEl.textContent = data.subtitle;
    }
    renderBoard();
  } catch (error) {
    console.error('Error loading race data:', error);
    board.innerHTML = `
      <div class="empty-state">
        <h3>Error Loading Data</h3>
        <p>Could not load race data. Make sure races.json exists.</p>
      </div>
    `;
  }
}

// Format date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Check if race matches filter
function matchesFilter(race, filter) {
  if (filter === 'ALL') return true;
  // Check party or type
  return race.party === filter || race.type === filter;
}

// Get role class for styling
function getRoleClass(role) {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('incumbent')) return 'incumbent';
  if (roleLower.includes('appointed')) return 'appointed';
  if (roleLower.includes('frontrunner')) return 'frontrunner';
  if (roleLower.includes('challenger')) return 'challenger';
  if (roleLower.includes('candidate')) return 'candidate';
  return 'candidate';
}

// Create race card HTML
function createRaceCard(race, isModal = false) {
  const isHidden = !matchesFilter(race, currentFilter);
  const partyClass = race.party.toLowerCase();

  const candidatesHTML = race.candidates
    .map(c => `
      <div class="candidate">
        <div class="candidate-header">
          <span class="candidate-name">${c.name}</span>
          <span class="candidate-role ${getRoleClass(c.role)}">${c.role}</span>
        </div>
        <p class="candidate-desc">${c.description}</p>
      </div>
    `)
    .join('');

  const issuesHTML = race.keyIssues
    .map(issue => `<span class="issue-tag">${issue}</span>`)
    .join('');

  const clickable = !isModal ? 'clickable' : '';

  return `
    <article class="race-card party-${partyClass} ${isHidden ? 'hidden' : ''} ${clickable}"
             data-party="${race.party}"
             data-type="${race.type}"
             data-rank="${race.rank}">
      <div class="card-header">
        <span class="card-rank">${race.rank}</span>
        <div class="card-info">
          <h3 class="card-title">${race.title}</h3>
          <div class="card-meta">
            <span class="card-party ${partyClass}">${race.party}</span>
            <span class="card-type">${race.type}</span>
          </div>
          <div class="card-location">${race.location}</div>
        </div>
      </div>

      <div class="card-candidates">
        ${candidatesHTML}
      </div>

      <p class="card-summary">${race.summary}</p>

      <div class="card-stakes">
        <div class="card-stakes-label">Why It Matters</div>
        ${race.stakes}
      </div>

      <div class="card-issues">
        ${issuesHTML}
      </div>

      <div class="card-keyfact">
        <div class="card-keyfact-label">Key Fact</div>
        ${race.keyFact}
      </div>
    </article>
  `;
}

// Get expanded view type based on current view
function getExpandedView() {
  if (currentView === 'skim') return 'peruse';
  return 'deep-dive';
}

// Show expanded race modal
function showExpandedRace(rank) {
  const race = races.find(r => r.rank === rank);
  if (!race) return;

  expandedRace = rank;
  const expandedView = getExpandedView();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content view-${expandedView}">
      <button class="modal-close" aria-label="Close">&times;</button>
      ${createRaceCard(race, true)}
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Close handlers
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

// Close modal
function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
    expandedRace = null;
  }
}

// Handle card clicks
function handleCardClick(e) {
  const card = e.target.closest('.race-card.clickable');
  if (!card) return;

  const rank = parseInt(card.dataset.rank, 10);
  showExpandedRace(rank);
}

// Render the board
function renderBoard() {
  // Update board class for view mode
  board.className = `board view-${currentView}`;

  // Filter and render races
  const filteredRaces = races.filter(r => matchesFilter(r, currentFilter));

  if (filteredRaces.length === 0) {
    board.innerHTML = `
      <div class="empty-state">
        <h3>No Races Found</h3>
        <p>No races match the selected filter.</p>
      </div>
    `;
    return;
  }

  board.innerHTML = races.map(createRaceCard).join('');
}

// Handle view mode change
function setView(view) {
  currentView = view;
  viewBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  renderBoard();
}

// Handle filter change
function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === filter);
  });

  // Update visibility of cards
  document.querySelectorAll('.race-card').forEach(card => {
    const cardParty = card.dataset.party;
    const cardType = card.dataset.type;
    const isVisible = matchesFilter({ party: cardParty, type: cardType }, filter);
    card.classList.toggle('hidden', !isVisible);
  });
}

// Event Listeners
viewBtns.forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.dataset.type));
});

// Card click handler (delegated)
board.addEventListener('click', handleCardClick);

// Keyboard escape to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Initialize
loadData();
