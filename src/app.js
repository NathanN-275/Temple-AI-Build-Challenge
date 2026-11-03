import { amenityLabels, initialSuggestions, spots as seedSpots } from './data.js';
import { busynessLabel, formatDistance, freshness, getVisibleSpots, noiseLabel, REPORT_COOLDOWN_MS } from './domain.js';

const copy = (value) => JSON.parse(JSON.stringify(value));
const state = {
  spots: copy([...seedSpots, ...initialSuggestions]),
  tab: 'study',
  category: 'study',
  query: '',
  busyness: 5,
  noise: 5,
  group: 'any',
  amenities: [],
  outlets: false,
  selectedSpotId: 'charles-library',
  selectedFloors: { 'charles-library': 'charles-4' },
  userCoordinates: null,
  sortByDistance: false,
  reportCooldowns: {},
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const visibleEntries = () => getVisibleSpots(state.spots, {
  query: state.query, busyness: state.busyness, noise: state.noise, group: state.group,
  amenities: state.amenities, outlets: state.outlets, category: state.category,
}, { tab: state.tab, sortByDistance: state.sortByDistance, userCoordinates: state.userCoordinates });

function statusTone(value) {
  if (value === null || value === undefined) return 'unknown';
  if (value <= 2) return 'quiet';
  if (value === 3) return 'some';
  return 'busy';
}

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
  const reportFreshness = freshness(floor.updatedAt);
  const tone = statusTone(floor.busyness);
  const selected = state.selectedSpotId === spot.id ? ' is-selected' : '';
  const floorOptions = matchingFloors.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === floor.id ? 'selected' : ''}>${escapeHtml(item.label)} · ${escapeHtml(item.area)}</option>`).join('');
  const floorSelector = spot.floors.length > 1 || matchingFloors.length > 1
    ? `<div class="floor-row"><label for="floor-${escapeHtml(spot.id)}">Floor</label><select class="floor-select" id="floor-${escapeHtml(spot.id)}" data-floor-select="${escapeHtml(spot.id)}">${floorOptions}</select></div>`
    : `<div class="floor-row"><label>Area</label><span class="spot-building">${escapeHtml(floor.label)} · ${escapeHtml(floor.area)}</span></div>`;
  const status = floor.busyness === null
    ? '<span class="status-pill status-unknown"><i></i>No report yet</span>'
    : `<span class="status-pill status-${tone}"><i></i>${escapeHtml(busynessLabel(floor.busyness))}</span><span class="noise-label">Noise ${floor.noise}/5 · ${escapeHtml(noiseLabel(floor.noise))}</span>`;
  const count = floor.reportCount ? `<span class="report-count">${floor.reportCount} sample ${floor.reportCount === 1 ? 'report' : 'reports'}</span>` : '';
  const subline = floor.lastNote || floor.detail || spot.description;
  const updateText = cooldownText(floor.id);
  return `<article class="spot-card${selected}" data-spot-card="${escapeHtml(spot.id)}">
    <span class="spot-accent status-${tone}" aria-hidden="true"></span>
    <div class="spot-content">
      <div class="spot-topline"><div class="spot-title-wrap">
        <div class="spot-overline"><span class="spot-type">${escapeHtml(spot.type)}</span><span>·</span><span>${escapeHtml(spot.area)}</span></div>
        <button class="spot-title spot-title-button" data-select-spot="${escapeHtml(spot.id)}" type="button">${escapeHtml(spot.name)}</button>
        <p class="spot-building">${escapeHtml(spot.building)}${distance !== null ? ` · ${escapeHtml(formatDistance(distance))}` : ''}</p>
      </div><span class="freshness${reportFreshness.stale ? ' is-stale' : ''}${reportFreshness.unknown ? ' is-unknown' : ''}">${escapeHtml(reportFreshness.label)}</span></div>
      <div class="spot-status-row">${status}${count}</div>
      ${floorSelector}
      <div class="spot-tags">${tagsMarkup(floor, spot.community)}</div>
      <div class="spot-actions"><span class="spot-subline" title="${escapeHtml(subline)}">${escapeHtml(subline)}</span><button class="report-button" data-report="${escapeHtml(spot.id)}" type="button" ${remainingCooldown(floor.id) ? 'disabled' : ''}>${updateText ? escapeHtml(updateText) : 'Update this spot →'}</button></div>
    </div>
  </article>`;
}

function updateCategoryUi() {
  const community = state.tab === 'community';
  $('#category-tabs').hidden = community;
  $('#search-input').placeholder = community ? 'Search student suggestions' : 'Search spots, buildings, or amenities';
  $$('.primary-tab').forEach((button) => {
    const active = button.dataset.tab === state.tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  $$('.category-chip').forEach((button) => button.classList.toggle('is-active', button.dataset.category === state.category));
  $$('.category-chip').forEach((button) => {
    const count = state.spots.filter((spot) => !spot.community && spot.category === button.dataset.category).length;
    const countLabel = $('.chip-small', button);
    if (countLabel) countLabel.textContent = String(count);
  });
  $('#result-summary').textContent = community ? 'Hidden gems shared by students' : state.sortByDistance ? 'Sorted from your location' : 'Good places, close by';
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
    intro.innerHTML = '<strong>Local knowledge lives here.</strong> Student-submitted spaces can be useful little discoveries. Crowd reports and amenities may be unverified.';
    $('#search-input').parentElement.insertAdjacentElement('afterend', intro);
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
let mapMode = 'spots';
let campusMapFitted = false;

function selectMapSpot(spotId) {
  const spot = state.spots.find((item) => item.id === spotId);
  if (!spot) return;
  state.selectedSpotId = spot.id;
  state.tab = spot.community ? 'community' : 'study';
  state.category = spot.community ? 'all' : spot.category;
  render();
}

function initializeCampusMap() {
  const target = $('#campus-map');
  if (!target || !target.offsetWidth || !window.L || campusMap) return;
  campusMap = window.L.map(target, { scrollWheelZoom: false }).setView([39.98125, -75.15575], 16);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(campusMap);
  campusMarkerLayer = window.L.layerGroup().addTo(campusMap);
}

function renderCampusMarkers() {
  initializeCampusMap();
  if (!campusMap || !campusMarkerLayer) return;
  campusMarkerLayer.clearLayers();
  const foodGroups = new Map();
  const categoryIcons = { study: '⌂', food: '♨', recreation: '◉' };
  const addMarker = (spot, count = 1, selected = spot.id === state.selectedSpotId) => {
    if (!spot.coordinates) return;
    const icon = window.L.divIcon({
      className: 'campus-map-icon',
      html: `<span class="campus-map-pin pin-${escapeHtml(spot.category)}${count > 1 ? ' has-count' : ''}${selected ? ' is-selected' : ''}">${count > 1 ? count : categoryIcons[spot.category] ?? '⌖'}</span>`,
      iconSize: [38, 42],
      iconAnchor: [19, 39],
    });
    const marker = window.L.marker(spot.coordinates, { icon }).addTo(campusMarkerLayer);
    if (count === 1) {
      marker.bindTooltip(escapeHtml(spot.name));
      marker.on('click', () => selectMapSpot(spot.id));
    }
    return marker;
  };

  state.spots.filter((spot) => spot.coordinates).forEach((spot) => {
    if (spot.mapGroup) {
      if (!foodGroups.has(spot.mapGroup)) foodGroups.set(spot.mapGroup, []);
      foodGroups.get(spot.mapGroup).push(spot);
      return;
    }
    addMarker(spot);
  });

  foodGroups.forEach((spots) => {
    const marker = addMarker(spots[0], spots.length, spots.some((spot) => spot.id === state.selectedSpotId));
    const links = spots.map((spot) => `<li><button class="map-popup-spot" type="button" data-map-spot="${escapeHtml(spot.id)}">${escapeHtml(spot.name)}</button></li>`).join('');
    marker?.bindPopup(`<strong>${escapeHtml(spots[0].area)} · ${spots.length} vendors</strong><ul class="map-popup-list">${links}</ul>`);
    marker?.on('popupopen', ({ popup }) => popup.getElement()?.querySelectorAll('[data-map-spot]').forEach((button) => button.addEventListener('click', () => selectMapSpot(button.dataset.mapSpot))));
  });
  if (!campusMapFitted) {
    const locations = state.spots.filter((spot) => spot.coordinates).map((spot) => spot.coordinates);
    if (locations.length) campusMap.fitBounds(window.L.latLngBounds(locations), { padding: [30, 30], maxZoom: 16 });
    campusMapFitted = true;
  }
}

function renderMap(entries) {
  renderCampusMarkers();
  const selected = selectedEntry(entries);
  const panel = $('#selected-panel');
  if (!selected) {
    panel.innerHTML = '<div class="selected-empty">Choose a spot to see its details.</div>';
    return;
  }
  const floor = currentFloor(selected);
  const status = floor.busyness === null ? 'No crowd report yet' : `${busynessLabel(floor.busyness)} · Noise ${floor.noise}/5`;
  const pinNote = selected.spot.position ? `${selected.spot.area}${selected.distance !== null ? ` · ${formatDistance(selected.distance)}` : ''}` : 'Building entered by student · no map pin yet';
  const cooldown = cooldownText(floor.id);
  const floorControl = selected.matchingFloors.length > 1
    ? `<label class="selected-floor-control">Floor<select data-map-floor-select="${escapeHtml(selected.spot.id)}">${selected.matchingFloors.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === floor.id ? 'selected' : ''}>${escapeHtml(item.label)} · ${escapeHtml(item.area)}</option>`).join('')}</select></label>`
    : `<div class="selected-floor-control"><span>Floor</span><strong>${escapeHtml(floor.label)}</strong></div>`;
  panel.innerHTML = `<div class="photo-placeholder" aria-label="Photo placeholder"><span aria-hidden="true">▧</span><span>Photo preview placeholder · coming later</span></div>
    <div class="selected-heading"><div><h3>${escapeHtml(selected.spot.name)}</h3><p>${escapeHtml(selected.spot.building)}</p></div><span class="status-pill status-${statusTone(floor.busyness)}"><i></i>${escapeHtml(status)}</span></div>
    ${floorControl}
    <div class="selected-detail"><span aria-hidden="true">⌖</span><span>${escapeHtml(pinNote)}</span></div>
    <div class="selected-detail"><span aria-hidden="true">◷</span><span><strong>${escapeHtml(freshness(floor.updatedAt).label)}</strong>${floor.reportCount ? ` · ${floor.reportCount} sample reports` : ''}</span></div>
    <div class="selected-detail"><span aria-hidden="true">✳</span><span>${escapeHtml(floor.lastNote || floor.detail || selected.spot.description)}</span></div>
    <div class="selected-actions"><button class="button button-primary" data-report="${escapeHtml(selected.spot.id)}" type="button" ${cooldown ? 'disabled' : ''}>${cooldown ? escapeHtml(cooldown) : 'Update this spot'}</button></div>`;
}

function render() {
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
  renderMap(entries);
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
  $('#busyness-options').innerHTML = ratingButtons('report-busyness', floor.busyness ?? 3, ['Empty', 'Open', 'Some', 'Busy', 'Packed']);
  $('#noise-options').innerHTML = ratingButtons('report-noise', floor.noise ?? 2, ['Quiet', 'Soft', 'Talk', 'Lively', 'Loud']);
  $('#report-note').value = '';
  const remaining = remainingCooldown(floor.id);
  $('#cooldown-note').textContent = remaining
    ? `Guest report · You can update this floor again in ${Math.ceil(remaining / 60_000)} minutes.`
    : 'Guest report · One update per floor every 15 minutes in this demo. Not shared with other visitors.';
  $('.modal-submit', $('#report-modal')).disabled = remaining > 0;
  setModal('report-modal', true);
}

function openSuggest() {
  $('#suggest-form').reset();
  setModal('suggest-modal', true);
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
    const nearest = [...state.spots].map((spot) => ({ spot, distance: spot.coordinates ? getVisibleSpots([spot], { query: '', busyness: 5, noise: 5, group: 'any', amenities: [], outlets: false, category: 'all' }, { tab: spot.community ? 'community' : 'study', userCoordinates: state.userCoordinates })[0]?.distance : null }))
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
  state.busyness = 5;
  state.noise = 5;
  state.group = 'any';
  state.amenities = [];
  state.outlets = false;
  $('#search-input').value = '';
  $('#busyness-filter').value = '5';
  $('#noise-filter').value = '5';
  $('#group-filter').value = 'any';
  $$('.amenity-filter-options input', $('#amenity-filter')).forEach((input) => { input.checked = false; });
  $('#outlets-filter').checked = false;
  $('#busyness-caption').textContent = 'Any level';
  $('#noise-caption').textContent = 'Any level';
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

function updateRatingFilter(type, value) {
  const numericValue = Number(value);
  state[type] = numericValue;
  const captions = type === 'busyness'
    ? ['Nearly empty', 'Mostly open', 'Some people', 'Busy', 'Any level']
    : ['Very quiet', 'Soft', 'Conversational', 'Lively', 'Any level'];
  $(`#${type}-caption`).textContent = captions[numericValue - 1];
  render();
}

$('#search-input').addEventListener('input', (event) => { state.query = event.target.value; render(); });
$('#busyness-filter').addEventListener('input', (event) => updateRatingFilter('busyness', event.target.value));
$('#noise-filter').addEventListener('input', (event) => updateRatingFilter('noise', event.target.value));
$('#group-filter').addEventListener('change', (event) => { state.group = event.target.value; render(); });
$('#amenity-filter').addEventListener('change', (event) => {
  const option = event.target.closest('input[type="checkbox"]');
  if (!option) return;
  state.amenities = $$('.amenity-filter-options input:checked', $('#amenity-filter')).map((input) => input.value);
  render();
});
$('#outlets-filter').addEventListener('change', (event) => { state.outlets = event.target.checked; render(); });
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
$('#callout-share').addEventListener('click', openSuggest);

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

$$('[data-map-view]').forEach((button) => button.addEventListener('click', () => {
  mapMode = button.dataset.mapView;
  const trucksActive = mapMode === 'trucks';
  $('#campus-map').hidden = trucksActive;
  $('#truck-map').hidden = !trucksActive;
  $$('[data-map-view]').forEach((item) => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-selected', String(active));
  });
  if (!trucksActive) setTimeout(() => campusMap?.invalidateSize(), 0);
}));

$('#selected-panel').addEventListener('click', (event) => {
  const report = event.target.closest('[data-report]');
  if (report && !report.disabled) { openReport(report.dataset.report); return; }
});

$('#selected-panel').addEventListener('change', (event) => {
  const select = event.target.closest('[data-map-floor-select]');
  if (select) setSelectedFloor(select.dataset.mapFloorSelect, select.value);
});

$('#report-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const selection = selectedSpotAndFloor();
  if (!selection) return;
  const { spot, floor } = selection;
  if (remainingCooldown(floor.id)) return;
  const busyness = Number($('input[name="report-busyness"]:checked', event.currentTarget)?.value);
  const noise = Number($('input[name="report-noise"]:checked', event.currentTarget)?.value);
  if (!busyness || !noise) return;
  floor.busyness = busyness;
  floor.noise = noise;
  floor.updatedAt = new Date().toISOString();
  floor.reportCount += 1;
  floor.lastNote = $('#report-note').value.trim();
  state.reportCooldowns[floor.id] = Date.now() + REPORT_COOLDOWN_MS;
  setModal('report-modal', false);
  render();
  showToast(`Thanks for the check-in at ${spot.name}. It’s saved in this demo only.`);
});

$('#suggest-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#suggest-name').value.trim();
  const building = $('#suggest-building').value.trim();
  if (!name || !building) return;
  const amenities = $$('input[type="checkbox"]:checked', $('#suggest-form')).map((input) => input.value);
  const requestedFloor = $('#suggest-floor').value.trim();
  const details = $('#suggest-details').value.trim();
  const id = `suggestion-${Date.now()}`;
  const spotFloor = {
    id: `${id}-area`, label: requestedFloor || 'Building area', area: name,
    busyness: null, noise: null, groups: [], amenities, outlets: amenities.includes('outlets'),
    updatedAt: null, reportCount: 0, detail: details || 'Student-submitted spot; details have not been verified.',
  };
  state.spots.push({
    id, name, building, category: 'study', type: 'Student suggestion', community: true,
    description: details || 'A place shared by a member of the Temple community.', area: building,
    coordinates: null, position: null, floors: [spotFloor],
  });
  state.tab = 'community';
  state.category = 'all';
  state.query = '';
  $('#search-input').value = '';
  state.selectedSpotId = id;
  state.selectedFloors[id] = spotFloor.id;
  setModal('suggest-modal', false);
  render();
  showToast('Thanks for sharing a hidden gem. It’s visible in this demo session.');
});

$$('[data-close-modal]').forEach((button) => button.addEventListener('click', () => setModal(button.closest('.modal-backdrop').id, false)));
$$('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) setModal(backdrop.id, false); }));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') $$('.modal-backdrop:not([hidden])').forEach((modal) => setModal(modal.id, false));
});

$$('[data-mobile-view]').forEach((button) => button.addEventListener('click', () => {
  const showMap = button.dataset.mobileView === 'map';
  document.body.classList.toggle('mobile-map-active', showMap);
  $$('[data-mobile-view]').forEach((item) => item.classList.toggle('is-active', item === button));
  if (showMap) {
    $('#map-column')?.scrollIntoView({ block: 'start' });
    setTimeout(() => {
      if (!campusMap) renderCampusMarkers();
      else campusMap.invalidateSize();
    }, 0);
  }
}));
$('#map-expand').addEventListener('click', () => {
  if (window.matchMedia('(max-width: 720px)').matches) {
    document.body.classList.add('mobile-map-active');
    $$('[data-mobile-view]').forEach((item) => item.classList.toggle('is-active', item.dataset.mobileView === 'map'));
  } else {
    $('#map-canvas').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

render();
