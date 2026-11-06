import { amenityLabels, initialSuggestions, spots as seedSpots } from './data.js';
import { supabase } from './supabase.js';
import { busynessLabel, crowdPattern, formatDistance, freshness, getVisibleSpots, REPORT_COOLDOWN_MS } from './domain.js';

const copy = (value) => JSON.parse(JSON.stringify(value));
const foodTruckSourceUrl = 'https://www.temple.edu/life-temple/housing-dining/temple-food-trucks';
const diningSourceUrl = 'https://www.temple.edu/life-temple/housing-dining/dining-options';
const mapIconPaths = {
  study: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 11h8"/>',
  academic: '<path d="m14 4 6 6M4 20l4.5-1 11-11a2.1 2.1 0 0 0-3-3l-11 11zM13 5l6 6"/>',
  dining: '<path d="M4 13h16a8 8 0 0 1-16 0zM3 13h18M8 8c-1-1 1-2 0-3M12 8c-1-1 1-2 0-3M16 8c-1-1 1-2 0-3"/>',
  'food-trucks': '<path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  recreation: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
  community: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
};
const mapIconMarkup = (category) => `<svg viewBox="0 0 24 24" aria-hidden="true">${mapIconPaths[category] ?? mapIconPaths.study}</svg>`;
const state = {
  spots: copy([...seedSpots, ...initialSuggestions]),
  toolView: 'database',
  tab: 'study',
  category: 'all',
  mapCategories: ['study', 'academic', 'dining', 'food-trucks', 'recreation', 'community'],
  query: '',
  group: 'any',
  amenities: [],
  selectedSpotId: 'charles-library',
  selectedFloors: { 'charles-library': 'charles-4' },
  userCoordinates: null,
  sortByDistance: false,
  reportCooldowns: (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hootroute-report-cooldowns') ?? '{}');
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    }
    catch { return {}; }
  })(),
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const visibleEntries = () => getVisibleSpots(state.spots, {
  query: state.query, group: state.group, amenities: state.amenities, category: state.category,
}, { tab: state.tab, sortByDistance: state.sortByDistance, userCoordinates: state.userCoordinates });

function currentFloor(entry) {
  const savedId = state.selectedFloors[entry.spot.id];
  return entry.matchingFloors.find((floor) => floor.id === savedId) ?? entry.matchingFloors[0];
}

function remainingCooldown(floorId) {
  return Math.max(0, (state.reportCooldowns[floorId] ?? 0) - Date.now());
}

function cooldownText(floorId) {
  const remaining = remainingCooldown(floorId);
  if (!remaining) return '';
  return `Update available in ${Math.ceil(remaining / 60_000)} min`;
}

function tagsMarkup(floor, community = false) {
  const tags = floor.amenities.slice(0, 3).map((amenity) => `<span class="spot-tag">${escapeHtml(amenityLabels[amenity] ?? amenity)}</span>`);
  if (floor.amenities.length > 3) tags.push(`<span class="spot-tag more-tag">+${floor.amenities.length - 3}</span>`);
  if (community) tags.unshift('<span class="spot-tag community-tag">Community suggestion</span>');
  if (!tags.length) tags.push('<span class="spot-tag">Details not added yet</span>');
  return tags.join('');
}

function spotMarkup(entry) {
  const { spot, matchingFloors, distance } = entry;
  const floor = currentFloor(entry);
  const crowd = crowdPattern(spot.floors);
  const reportFreshness = freshness(floor.updatedAt);
  const tone = crowd.level === 0 ? 'unknown' : crowd.level === 1 ? 'quiet' : crowd.level === 2 ? 'some' : 'busy';
  const isFoodListing = spot.category === 'food';
  const isFoodTruck = spot.type === 'Food truck';
  const selected = state.selectedSpotId === spot.id ? ' is-selected' : '';
  const floorOptions = matchingFloors.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === floor.id ? 'selected' : ''}>${escapeHtml(item.label)} · ${escapeHtml(item.area)}</option>`).join('');
  const floorSelector = isFoodListing ? ''
    : spot.floors.length > 1 || matchingFloors.length > 1
    ? `<div class="floor-row"><label for="floor-${escapeHtml(spot.id)}">Floor</label><select class="floor-select" id="floor-${escapeHtml(spot.id)}" data-floor-select="${escapeHtml(spot.id)}">${floorOptions}</select></div>`
    : `<div class="floor-row"><label>Area</label><span class="spot-building">${escapeHtml(floor.label)} · ${escapeHtml(floor.area)}</span></div>`;
  const status = isFoodListing ? '' : `<div class="typical-crowd">
    <span class="typical-crowd-title">Typical crowd</span>
    <span class="crowd-meter crowd-level-${tone}" role="img" aria-label="${escapeHtml(crowd.label)}"><i></i><i></i><i></i></span>
    <strong>${escapeHtml(crowd.label)}</strong>
    ${crowd.reports ? `<span class="report-count">Based on ${crowd.reports} sample ${crowd.reports === 1 ? 'report' : 'reports'}</span>` : ''}
  </div>`;
  const votesCurrent = Date.parse(floor.liveValidUntil) > Date.now();
  const voteCount = votesCurrent ? floor.liveVoteCount : 0;
  const liveBusyness = votesCurrent ? floor.liveBusyness : null;
  const liveFreshness = freshness(votesCurrent ? floor.liveUpdatedAt : null);
  const liveTone = (liveBusyness ?? 0) >= 4 ? 'busy' : (liveBusyness ?? 0) >= 3 ? 'some' : 'quiet';
  const liveStatus = `<div class="live-crowd">
    <span class="live-crowd-title">Community vote</span>
    ${liveBusyness !== null && liveBusyness !== undefined
      ? `<strong class="live-crowd-${liveTone}">${escapeHtml(busynessLabel(liveBusyness))}</strong><span>${escapeHtml(liveFreshness.label)}</span>`
      : '<span>Not enough votes</span>'}
    <span class="report-count">${voteCount} ${voteCount === 1 ? 'vote' : 'votes'} in the last hour${voteCount < 3 ? ' · minimum 3' : ''}</span>
  </div>`;
  const subline = floor.lastNote || floor.detail || spot.description;
  const updateText = cooldownText(floor.id);
  const buildingLine = !isFoodListing || distance !== null
    ? `<p class="spot-building">${isFoodListing ? '' : escapeHtml(spot.building)}${distance !== null ? `${isFoodListing ? '' : ' · '}${escapeHtml(formatDistance(distance))}` : ''}</p>`
    : '';
  const freshnessMarkup = isFoodListing || !crowd.reports ? '' : `<span class="freshness${reportFreshness.stale ? ' is-stale' : ''}${reportFreshness.unknown ? ' is-unknown' : ''}">${escapeHtml(reportFreshness.label)}</span>`;
  const tags = isFoodListing ? '' : `<div class="spot-tags">${tagsMarkup(floor, spot.community)}</div>`;
  const foodDetails = isFoodListing && spot.menu ? `<div class="food-truck-details">
    <p><strong>Serves</strong> ${escapeHtml(spot.menu)}</p>
    ${isFoodTruck ? '<p><strong>Hours</strong> Not listed on Temple’s truck map; schedules vary by vendor.</p>' : ''}
    <a href="${isFoodTruck ? foodTruckSourceUrl : (spot.menuUrl ?? diningSourceUrl)}" target="_blank" rel="noreferrer">${isFoodTruck ? 'Check Temple’s truck map' : 'Check Temple dining options'} ↗</a>
  </div>` : '';
  const actions = isFoodListing ? '' : `<div class="spot-actions"><span class="spot-subline" title="${escapeHtml(subline)}">${escapeHtml(subline)}</span><button class="report-button" data-report="${escapeHtml(spot.id)}" type="button" ${remainingCooldown(floor.id) ? 'disabled' : ''}>${updateText ? escapeHtml(updateText) : 'Update this spot →'}</button></div>`;
  return `<article class="spot-card${selected}" data-spot-card="${escapeHtml(spot.id)}">
    <span class="spot-accent status-${tone}" aria-hidden="true"></span>
    <div class="spot-content">
      <div class="spot-topline"><div class="spot-title-wrap">
        <div class="spot-overline"><span class="spot-type">${escapeHtml(spot.type)}</span><span>·</span><span>${escapeHtml(spot.area)}</span></div>
        <button class="spot-title spot-title-button" data-select-spot="${escapeHtml(spot.id)}" type="button">${escapeHtml(spot.name)}</button>
        ${buildingLine}
      </div>${freshnessMarkup}</div>
      ${status}
      ${isFoodListing ? '' : liveStatus}
      ${foodDetails}
      ${floorSelector}
      ${tags}
      ${actions}
    </div>
  </article>`;
}

function updateCategoryUi() {
  const community = state.tab === 'community';
  $('#category-tabs').hidden = community;
  $('#search-input').placeholder = community ? 'Search suggestions' : 'Search locations, buildings, or amenities';
  $$('.primary-tab').forEach((button) => {
    const active = button.dataset.tab === state.tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $$('.category-chip').forEach((button) => button.classList.toggle('is-active', button.dataset.category === state.category));
  $$('.category-chip').forEach((button) => {
    const count = state.spots.filter((spot) => !spot.community && (button.dataset.category === 'all' || spot.category === button.dataset.category)).length;
    const countLabel = $('.chip-small', button);
    if (countLabel) countLabel.textContent = String(count);
  });
  $('#result-summary').textContent = community ? 'Student suggestions' : state.sortByDistance ? 'Sorted from your location' : 'Temple campus locations';
  const sortLabel = state.sortByDistance ? 'Nearest first' : 'Best match';
  $('#sort-button').innerHTML = `${state.sortByDistance ? '⌖' : '✦'} <span>${sortLabel}</span><span aria-hidden="true">⌄</span>`;
  $('#sort-button').setAttribute('aria-label', state.userCoordinates ? `Sort spots: ${state.sortByDistance ? 'nearest first' : 'best match'}` : 'Sort by distance from your location');
}

function updateAmenitySummary() {
  const selected = state.amenities.map((amenity) => amenityLabels[amenity]);
  $('#amenity-filter-summary').innerHTML = `${selected.length ? `${selected.length} selected` : 'Any amenities'} <span aria-hidden="true">⌄</span>`;
  $('#amenity-filter-summary').setAttribute('aria-label', selected.length ? `Selected amenities: ${selected.join(', ')}` : 'Any amenities');
}

function renderList(entries) {
  const list = $('#spot-list');
  const empty = $('#empty-state');
  const count = entries.length;
  $('#result-count').textContent = `${count} ${count === 1 ? 'spot' : 'spots'}`;
  $('#community-count').textContent = String(state.spots.filter((spot) => spot.community).length);
  const existingIntro = $('.community-intro');
  if (existingIntro) existingIntro.remove();
  if (state.tab === 'community') {
    const intro = document.createElement('p');
    intro.className = 'community-intro';
    intro.textContent = 'Student-submitted · Details may be unverified';
    $('.search-row').insertAdjacentElement('afterend', intro);
  }
  list.innerHTML = entries.map(spotMarkup).join('');
  list.hidden = count === 0;
  empty.hidden = count !== 0;
}

function selectedEntry(entries) {
  return entries.find((entry) => entry.spot.id === state.selectedSpotId) ?? entries[0] ?? null;
}

let campusMap;
let campusMarkerLayer;
let campusMapFitted = false;
const mapCategories = new Set(['study', 'food', 'recreation']);

function selectMapSpot(spotId) {
  const spot = state.spots.find((item) => item.id === spotId);
  if (!spot) return;
  state.selectedSpotId = spot.id;
  state.tab = spot.community ? 'community' : 'study';
  state.category = spot.community ? 'all' : spot.category;
  state.query = '';
  $('#search-input').value = '';
  state.toolView = 'database';
  render();
  document.querySelector(`[data-spot-card="${CSS.escape(spotId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mapCategoriesForSpot(spot) {
  if (spot.mapCategories) return spot.mapCategories;
  if (spot.community) return ['study', 'community'];
  if (spot.category === 'food') return ['dining'];
  if (spot.category === 'recreation') return ['recreation'];
  return ['study'];
}

function foodSpotPopupMarkup(spot) {
  const isFoodTruck = spot.type === 'Food truck';
  return `<div class="food-truck-popup">
    <strong>${escapeHtml(spot.name)}</strong>
    <p><b>Serves:</b> ${escapeHtml(spot.menu ?? 'Check with the vendor for current menu details.')}</p>
    ${isFoodTruck ? '<p><b>Hours:</b> Not listed on Temple’s truck map; schedules vary by vendor.</p>' : ''}
    <a href="${isFoodTruck ? foodTruckSourceUrl : (spot.menuUrl ?? diningSourceUrl)}" target="_blank" rel="noreferrer">${isFoodTruck ? 'Temple food truck info' : 'Temple dining options'} ↗</a>
  </div>`;
}

function updateToolView() {
  const isMap = state.toolView === 'map';
  $('#database-view').hidden = isMap;
  $('#map-view').hidden = !isMap;
  $$('.tool-view-tab').forEach((button) => {
    const active = button.dataset.toolView === state.toolView;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
}

function initializeCampusMap() {
  const target = $('#campus-map');
  if (!target || !target.offsetWidth || !window.L || campusMap) return;
  campusMap = window.L.map(target, { scrollWheelZoom: true, touchZoom: true, maxZoom: 21 }).setView([39.98125, -75.15575], 16);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxNativeZoom: 19,
    maxZoom: 21,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(campusMap);
  campusMarkerLayer = window.L.layerGroup().addTo(campusMap);
  campusMap.on('zoomend', renderCampusMarkers);
}

function renderCampusMarkers() {
  initializeCampusMap();
  if (!campusMap || !campusMarkerLayer) return;
  campusMarkerLayer.clearLayers();
  const markerGroups = new Map();
  const zoom = campusMap.getZoom();
  const truckGridSize = zoom >= 19 ? 0 : zoom >= 18 ? 0.00015 : zoom >= 17 ? 0.00035 : 0.0008;
  const addMarker = (spot, count = 1, selected = spot.id === state.selectedSpotId) => {
    if (!spot.coordinates) return;
    const category = mapCategoriesForSpot(spot).find((item) => state.mapCategories.includes(item)) ?? 'study';
    const icon = window.L.divIcon({
      className: 'campus-map-icon',
      html: `<span class="campus-map-pin pin-${escapeHtml(category)}${count > 1 ? ' has-count' : ''}${selected ? ' is-selected' : ''}">${count > 1 ? `<span class="marker-count" aria-label="${count} locations">${count}</span>` : mapIconMarkup(category)}</span>`,
      iconSize: [38, 42],
      iconAnchor: [19, 39],
    });
    const marker = window.L.marker(spot.coordinates, { icon }).addTo(campusMarkerLayer);
    if (count === 1) {
      if (spot.category === 'food') {
        marker.bindPopup(foodSpotPopupMarkup(spot));
      } else {
        marker.bindTooltip(escapeHtml(spot.name));
        marker.on('click', () => selectMapSpot(spot.id));
      }
    }
    return marker;
  };

  state.spots.filter((spot) => spot.coordinates && mapCategoriesForSpot(spot).some((category) => state.mapCategories.includes(category))).forEach((spot) => {
    const [latitude, longitude] = spot.coordinates;
    const truckCluster = mapCategoriesForSpot(spot).includes('food-trucks') && truckGridSize
      ? `truck:${Math.round(latitude / truckGridSize)}:${Math.round(longitude / truckGridSize)}`
      : '';
    const group = spot.mapGroup ? `area:${spot.mapGroup}` : truckCluster || `spot:${spot.id}`;
    if (!markerGroups.has(group)) markerGroups.set(group, []);
    markerGroups.get(group).push(spot);
  });

  markerGroups.forEach((spots) => {
    const marker = addMarker(spots[0], spots.length, spots.some((spot) => spot.id === state.selectedSpotId));
    if (spots.length < 2) return;
    const links = spots.map((spot) => `<li><button class="map-popup-spot" type="button" data-map-spot="${escapeHtml(spot.id)}"><strong>${escapeHtml(spot.name)}</strong>${spot.category === 'food' ? `<small>Serves: ${escapeHtml(spot.menu ?? 'Check with the vendor for current menu details.')}</small>` : ''}</button></li>`).join('');
    const title = spots[0].mapGroup ? `${spots[0].area} · ${spots.length} locations` : `${spots.length} nearby food trucks`;
    marker?.bindPopup(`<strong>${escapeHtml(title)}</strong><ul class="map-popup-list">${links}</ul>`);
    marker?.on('popupopen', ({ popup }) => popup.getElement()?.querySelectorAll('[data-map-spot]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      const selectedSpot = state.spots.find((spot) => spot.id === button.dataset.mapSpot);
      if (!selectedSpot) return;
      if (selectedSpot.category === 'food') {
        marker.setPopupContent(foodSpotPopupMarkup(selectedSpot));
        marker.openPopup();
      } else {
        selectMapSpot(selectedSpot.id);
      }
    })));
  });
  if (!campusMapFitted) {
    const locations = state.spots.filter((spot) => spot.coordinates).map((spot) => spot.coordinates);
    campusMapFitted = true;
    if (locations.length) campusMap.fitBounds(window.L.latLngBounds(locations), { padding: [30, 30], maxZoom: 16 });
  }
}

function render() {
  updateToolView();
  updateCategoryUi();
  updateAmenitySummary();
  const entries = visibleEntries();
  const selected = selectedEntry(entries);
  if (selected) {
    state.selectedSpotId = selected.spot.id;
    if (!selected.matchingFloors.some((floor) => floor.id === state.selectedFloors[selected.spot.id])) {
      state.selectedFloors[selected.spot.id] = selected.matchingFloors[0].id;
    }
  }
  renderList(entries);
  renderCampusMarkers();
}

function setSelectedFloor(spotId, floorId) {
  state.selectedFloors[spotId] = floorId;
  render();
}

function setModal(id, open) {
  const modal = $(`#${id}`);
  if (!modal) return;
  modal.hidden = !open;
  document.body.classList.toggle('modal-open', open);
  if (open) {
    $('.modal-close', modal)?.focus();
  }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 3300);
}

function selectedSpotAndFloor() {
  const spot = state.spots.find((item) => item.id === state.selectedSpotId);
  if (!spot) return null;
  const floorId = state.selectedFloors[spot.id] ?? spot.floors[0].id;
  const floor = spot.floors.find((item) => item.id === floorId) ?? spot.floors[0];
  return { spot, floor };
}

function ratingButtons(name, value, labels) {
  return [1, 2, 3, 4, 5].map((rating) => `<label class="rating-choice"><input type="radio" name="${name}" value="${rating}" ${rating === value ? 'checked' : ''} required /><span>${rating}<small>${labels[rating - 1]}</small></span></label>`).join('');
}

function openReport(spotId) {
  const spot = state.spots.find((item) => item.id === spotId);
  if (!spot) return;
  state.selectedSpotId = spot.id;
  if (!state.selectedFloors[spot.id]) state.selectedFloors[spot.id] = spot.floors[0].id;
  const floor = spot.floors.find((item) => item.id === state.selectedFloors[spot.id]) ?? spot.floors[0];
  $('#report-spot-name').textContent = `${spot.name} · ${floor.label}`;
  $('#busyness-options').innerHTML = ratingButtons('report-busyness', null, ['Empty', 'Lots of room', 'Some seats open', 'Almost full', 'Full']);
  $('#report-note').value = '';
  const remaining = remainingCooldown(floor.id);
  $('#cooldown-note').textContent = remaining
    ? `Guest report · You can update this floor again in ${Math.ceil(remaining / 60_000)} minutes.`
    : 'Guest report · One update per floor every 15 minutes in this browser.';
  $('.modal-submit', $('#report-modal')).disabled = remaining > 0;
  setModal('report-modal', true);
}

function openSuggest() {
  $('#suggest-form').reset();
  setModal('suggest-modal', true);
}

function suggestionSpot(row) {
  const id = `suggestion-${row.id}`;
  const details = row.details || 'Student-submitted spot; details have not been verified.';
  return {
    id, name: row.name, building: row.building, category: 'study', type: 'Student suggestion', community: true,
    description: row.details || 'A place shared by a member of the Temple community.', area: row.building,
    coordinates: null, position: null,
    floors: [{
      id: `${id}-area`, label: row.floor_label || 'Building area', area: row.name,
      busyness: null, noise: null, groups: [], amenities: row.amenities ?? [],
      outlets: (row.amenities ?? []).includes('outlets'), updatedAt: null, reportCount: 0, detail: details,
    }],
  };
}

async function loadSharedData() {
  let suggestionsResult;
  let reportsResult;
  try {
    [suggestionsResult, reportsResult] = await Promise.all([
      supabase.from('community_suggestions').select('*').order('created_at', { ascending: false }),
      supabase.rpc('get_crowd_consensus'),
    ]);
  } catch (error) {
    console.error('Could not load shared updates:', error);
    showToast('Shared updates could not be loaded. Try refreshing the page.');
    return;
  }
  if (suggestionsResult.error) console.error('Could not load suggestions:', suggestionsResult.error);
  else state.spots.push(...suggestionsResult.data.map(suggestionSpot));
  if (reportsResult.error) console.error('Could not load crowd reports:', reportsResult.error);
  else applyCrowdConsensus(reportsResult.data);
  if (suggestionsResult.error || reportsResult.error) showToast('Some shared updates could not be loaded. Try refreshing the page.');
  render();
}

let crowdExpiryTimer;
function applyCrowdConsensus(rows) {
  clearTimeout(crowdExpiryTimer);
  for (const spot of state.spots) {
    for (const floor of spot.floors) {
      floor.liveBusyness = null;
      floor.liveVoteCount = 0;
      floor.liveUpdatedAt = null;
      floor.liveValidUntil = null;
    }
  }
  let nextExpiry = Infinity;
  for (const row of rows) {
    const spot = state.spots.find((item) => item.id === row.spot_key);
    const floor = spot?.floors.find((item) => item.id === row.floor_key);
    if (!floor) continue;
    floor.liveBusyness = row.busyness;
    floor.liveVoteCount = Number(row.vote_count);
    floor.liveUpdatedAt = row.updated_at;
    floor.liveValidUntil = row.valid_until;
    nextExpiry = Math.min(nextExpiry, Date.parse(row.valid_until));
  }
  if (Number.isFinite(nextExpiry)) {
    crowdExpiryTimer = window.setTimeout(async () => {
      render();
      await refreshCrowdVotes();
    }, Math.max(1000, nextExpiry - Date.now() + 100));
  }
}

async function refreshCrowdVotes() {
  try {
    const { data, error } = await supabase.rpc('get_crowd_consensus');
    if (error) throw error;
    applyCrowdConsensus(data);
    render();
    return true;
  } catch (error) {
    console.error('Could not refresh crowd votes:', error);
    showToast('Could not refresh crowd votes. Please reload the page.');
    render();
    clearTimeout(crowdExpiryTimer);
    crowdExpiryTimer = window.setTimeout(refreshCrowdVotes, 60_000);
    return false;
  }
}

let browserVoterId;
function getBrowserVoterId() {
  if (browserVoterId) return browserVoterId;
  try {
    const saved = localStorage.getItem('hootroute-voter-id');
    browserVoterId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved ?? '') ? saved : crypto.randomUUID();
    localStorage.setItem('hootroute-voter-id', browserVoterId);
  } catch {
    browserVoterId = crypto.randomUUID();
  }
  // shortcut: browser IDs can be reset or forged; use verified accounts for stronger duplicate protection.
  return browserVoterId;
}

function saveReportCooldown(floorId) {
  state.reportCooldowns[floorId] = Date.now() + REPORT_COOLDOWN_MS;
  try { localStorage.setItem('hootroute-report-cooldowns', JSON.stringify(state.reportCooldowns)); }
  catch { /* Browser storage may be unavailable; the in-memory cooldown still applies. */ }
}

function requestLocation() {
  if (!navigator.geolocation) {
    showToast('Location is not available in this browser. You can still browse and report manually.');
    return;
  }
  const button = $('#location-button');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  showToast('Checking your location…');
  navigator.geolocation.getCurrentPosition((position) => {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    state.userCoordinates = [position.coords.latitude, position.coords.longitude];
    state.sortByDistance = true;
    const nearest = [...state.spots].map((spot) => ({ spot, distance: spot.coordinates ? getVisibleSpots([spot], { query: '', group: 'any', amenities: [], category: 'all' }, { tab: spot.community ? 'community' : 'study', userCoordinates: state.userCoordinates })[0]?.distance : null }))
      .filter((item) => item.distance !== null).sort((a, b) => a.distance - b.distance)[0];
    if (nearest) {
      state.tab = nearest.spot.community ? 'community' : 'study';
      state.category = nearest.spot.community ? 'all' : nearest.spot.category;
      state.query = '';
      $('#search-input').value = '';
      state.selectedSpotId = nearest.spot.id;
      const floor = nearest.spot.floors[0];
      state.selectedFloors[nearest.spot.id] = floor.id;
    }
    render();
    if (nearest?.distance <= 0.16) {
      showToast(`You’re close to ${nearest.spot.name}. Want to share a quick check-in?`);
      window.setTimeout(() => openReport(nearest.spot.id), 650);
    } else {
      showToast('Spots are sorted by distance. Your location stays in this browser.');
    }
  }, (error) => {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    const message = error.code === 1 ? 'Location permission was not granted. You can still browse and report manually.' : 'Couldn’t get your location. You can still browse and report manually.';
    showToast(message);
  }, { enableHighAccuracy: false, maximumAge: 30_000, timeout: 8_000 });
}

function clearFilters() {
  state.query = '';
  state.group = 'any';
  state.amenities = [];
  $('#search-input').value = '';
  $('#group-filter').value = 'any';
  $$('.amenity-filter-options input', $('#amenity-filter')).forEach((input) => { input.checked = false; });
  render();
}

function switchTab(tab) {
  state.tab = tab;
  state.category = tab === 'community' ? 'all' : 'study';
  state.selectedSpotId = tab === 'community'
    ? state.spots.find((spot) => spot.community)?.id ?? ''
    : state.spots.find((spot) => !spot.community && spot.category === 'study')?.id ?? '';
  render();
}

$('#search-input').addEventListener('input', (event) => { state.query = event.target.value; render(); });
$('#group-filter').addEventListener('change', (event) => { state.group = event.target.value; render(); });
$('#amenity-filter').addEventListener('change', (event) => {
  const option = event.target.closest('input[type="checkbox"]');
  if (!option) return;
  state.amenities = $$('.amenity-filter-options input:checked', $('#amenity-filter')).map((input) => input.value);
  render();
});
$('#clear-filters').addEventListener('click', clearFilters);
$('#empty-clear').addEventListener('click', clearFilters);

$$('.primary-tab').forEach((button) => button.addEventListener('click', () => switchTab(button.dataset.tab)));
$$('.category-chip').forEach((button) => button.addEventListener('click', () => { state.category = button.dataset.category; render(); }));
$('#location-button').addEventListener('click', requestLocation);
$('#sort-button').addEventListener('click', () => {
  if (!state.userCoordinates) { requestLocation(); return; }
  state.sortByDistance = !state.sortByDistance;
  render();
});
$('#share-button').addEventListener('click', openSuggest);
$('#header-suggest').addEventListener('click', openSuggest);

$('#spot-list').addEventListener('click', (event) => {
  const reportButton = event.target.closest('[data-report]');
  if (reportButton && !reportButton.disabled) { openReport(reportButton.dataset.report); return; }
  const titleButton = event.target.closest('[data-select-spot]');
  if (titleButton) {
    state.selectedSpotId = titleButton.dataset.selectSpot;
    render();
    return;
  }
  const card = event.target.closest('[data-spot-card]');
  if (card && !event.target.closest('select, button')) {
    state.selectedSpotId = card.dataset.spotCard;
    render();
  }
});

$('#spot-list').addEventListener('change', (event) => {
  const select = event.target.closest('[data-floor-select]');
  if (select) setSelectedFloor(select.dataset.floorSelect, select.value);
});

$$('.tool-view-tab').forEach((button) => button.addEventListener('click', () => {
  state.toolView = button.dataset.toolView;
  render();
  if (state.toolView === 'map') requestAnimationFrame(() => campusMap?.invalidateSize());
}));

$('.tool-view-tabs').addEventListener('keydown', (event) => {
  const tabs = $$('.tool-view-tab');
  const currentIndex = tabs.indexOf(document.activeElement);
  const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    ? (currentIndex + 1) % tabs.length
    : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      ? (currentIndex - 1 + tabs.length) % tabs.length
      : event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : -1;
  if (nextIndex < 0) return;
  event.preventDefault();
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
});

$$('[data-map-category]').forEach((input) => input.addEventListener('change', () => {
  state.mapCategories = $$('[data-map-category]:checked').map((checkbox) => checkbox.dataset.mapCategory);
  renderCampusMarkers();
}));

$('#report-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const selection = selectedSpotAndFloor();
  if (!selection) return;
  const { spot, floor } = selection;
  if (remainingCooldown(floor.id)) return;
  const busyness = Number($('input[name="report-busyness"]:checked', event.currentTarget)?.value);
  if (!busyness) return;
  const button = $('.modal-submit', event.currentTarget);
  button.disabled = true;
  const note = $('#report-note').value.trim();
  try {
    const { error } = await supabase.from('crowd_reports').insert({
      spot_key: spot.id, floor_key: floor.id, voter_id: getBrowserVoterId(), busyness, note,
    });
    if (error) throw error;
    saveReportCooldown(floor.id);
    setModal('report-modal', false);
    const refreshed = await refreshCrowdVotes();
    if (refreshed) showToast('Your vote is saved. The crowd status uses at least 3 browser votes from the last hour.');
  } catch (error) {
    console.error('Could not save crowd report:', error);
    showToast('Could not save this update. Please try again.');
  } finally {
    button.disabled = false;
  }
});

$('#suggest-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('#suggest-name').value.trim();
  const building = $('#suggest-building').value.trim();
  if (!name || !building) return;
  const amenities = $$('input[type="checkbox"]:checked', $('#suggest-form')).map((input) => input.value);
  const requestedFloor = $('#suggest-floor').value.trim();
  const details = $('#suggest-details').value.trim();
  const button = $('.modal-submit', event.currentTarget);
  button.disabled = true;
  try {
    const { data, error } = await supabase.from('community_suggestions').insert({
      name, building, floor_label: requestedFloor, amenities, details,
    }).select().single();
    if (error) throw error;
    const spot = suggestionSpot(data);
    state.spots.push(spot);
    state.selectedFloors[spot.id] = spot.floors[0].id;
    state.tab = 'community';
    state.category = 'all';
    state.query = '';
    $('#search-input').value = '';
    state.selectedSpotId = spot.id;
    setModal('suggest-modal', false);
    render();
    showToast('Thanks for sharing a spot. It’s visible to everyone for 24 hours.');
  } catch (error) {
    console.error('Could not save suggestion:', error);
    showToast('Could not save this suggestion. Please try again.');
  } finally {
    button.disabled = false;
  }
});

$$('[data-close-modal]').forEach((button) => button.addEventListener('click', () => setModal(button.closest('.modal-backdrop').id, false)));
$$('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) setModal(backdrop.id, false); }));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') $$('.modal-backdrop:not([hidden])').forEach((modal) => setModal(modal.id, false));
});

render();
loadSharedData();
