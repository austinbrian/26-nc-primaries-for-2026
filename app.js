// State
let races = [];
let currentView = 'peek';
let currentFilter = 'ALL';

// DOM Elements
const board = document.getElementById('board');
const lastUpdatedEl = document.getElementById('lastUpdated');
const pageSubtitleEl = document.getElementById('pageSubtitle');
const viewBtns = document.querySelectorAll('.view-btn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Load data
async function loadData() {
  try {
    const response = await fetch('races.json?v=' + Date.now());
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
  return race.party === filter || race.type === filter;
}

// Get role class for styling
function getRoleClass(role) {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('incumbent')) return 'incumbent';
  if (roleLower.includes('appointed')) return 'appointed';
  if (roleLower.includes('frontrunner')) return 'frontrunner';
  if (roleLower.includes('challenger')) return 'challenger';
  return 'candidate';
}

// Get expanded view type based on current view
function getExpandedView() {
  if (currentView === 'skim') return 'expanded-peruse';
  return 'expanded-deep-dive';
}

// Create race card HTML
function createRaceCard(race) {
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

  return `
    <article class="race-card party-${partyClass} ${isHidden ? 'hidden' : ''}"
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

// Render the board
function renderBoard() {
  board.className = `board view-${currentView}`;

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

// Card click handler using event delegation
board.addEventListener('click', function(e) {
  const card = e.target.closest('.race-card');
  if (!card) return;

  const expandedClass = getExpandedView();

  // If clicking an already expanded card, collapse it
  if (card.classList.contains('expanded')) {
    card.classList.remove('expanded', 'expanded-peruse', 'expanded-deep-dive');
    return;
  }

  // Collapse any other expanded card
  const previouslyExpanded = board.querySelector('.race-card.expanded');
  if (previouslyExpanded) {
    previouslyExpanded.classList.remove('expanded', 'expanded-peruse', 'expanded-deep-dive');
  }

  // Expand this card
  card.classList.add('expanded', expandedClass);

  // Scroll into view
  setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
});

// Initialize
loadData();
