
const apiKey = 'AIzaSyAjSJ7OXNVxgXJEEqowXeHEhT1RINxmQyw';
let map, mapDiv;
const container = document.getElementById('cards');
const noticeEl = document.getElementById('notice');

function initApp() {
  mapDiv = document.createElement('div');
  mapDiv.style.display = 'none';
  document.body.appendChild(mapDiv);
  map = new google.maps.Map(mapDiv);
  document.getElementById('findBtn').addEventListener('click', getLocation);
  document.getElementById('showBtn').addEventListener('click', showSaved);
  console.log('initApp: Google Maps loaded');
}

function getLocation() {
  if (!window.google || !google.maps) {
    alert('Google Maps not loaded yet. Wait a moment (check console).');
    return;
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => useLocation(pos.coords.latitude, pos.coords.longitude),
      () => alert('Location access denied or unavailable.')
    );
  } else {
    alert('Geolocation not supported.');
  }
}

function useLocation(lat, lng) {
  const location = new google.maps.LatLng(lat, lng);
  const service = new google.maps.places.PlacesService(map);
  container.innerHTML = `<div class="location-card" style="position:static; transform:none;"><p class="small">Searching nearby cafes...</p></div>`;
  service.nearbySearch({ location, radius: 1500, type: ['cafe'] }, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length) {
      displayCards(results);
    } else {
      container.innerHTML = '';
      alert('No cafes found nearby or Places API returned: ' + status);
      console.warn('PlacesService status:', status);
    }
  });
}

function displayCards(cafes) {
  container.innerHTML = '';
  cafes.forEach((cafe, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'swipe-wrapper';
    wrapper.style.zIndex = cafes.length - i;
    wrapper.style.top = (i * 6) + 'px';
    const card = document.createElement('div');
    card.className = 'location-card';
    const imgUrl = (cafe.photos && cafe.photos.length) ? cafe.photos[0].getUrl({ maxWidth: 400 }) : 'https://via.placeholder.com/400x200?text=No+Image';
    const cafeData = { name: cafe.name, place_id: cafe.place_id, photo: imgUrl, rating: cafe.rating || 'N/A' };
    card.innerHTML = `
      <img src="${imgUrl}" alt="${escapeHtml(cafe.name)}" />
      <h3 style="margin:6px 0;">${escapeHtml(cafe.name)}</h3>
      <p class="small">⭐ ${cafe.rating || 'N/A'}</p>
      <p class="small">Swipe right to save</p>
    `;
    wrapper.appendChild(card);
    container.appendChild(wrapper);
    const hammertime = new Hammer(wrapper);
    hammertime.on('swipeleft', () => {
      wrapper.style.transform = 'translateX(-150%) rotate(-15deg)';
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 200);
    });
    hammertime.on('swiperight', () => {
      saveCafe(cafeData);
      wrapper.style.transform = 'translateX(150%) rotate(15deg)';
      wrapper.style.opacity = 0;
      setTimeout(() => wrapper.remove(), 200);
    });
    wrapper.addEventListener('click', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > rect.width * 0.6) { saveCafe(cafeData); wrapper.remove(); }
      else { wrapper.style.transform = 'translateX(-40px)'; setTimeout(()=>wrapper.remove(), 150); }
    });
  });
}

function saveCafe(cafe) {
  try {
    const saved = JSON.parse(localStorage.getItem('savedCafes') || '[]');
    if (!saved.find(c => c.place_id === cafe.place_id)) {
      saved.push(cafe);
      localStorage.setItem('savedCafes', JSON.stringify(saved));
      alert(`${cafe.name} saved!`);
    } else {
      alert(`${cafe.name} is already saved.`);
    }
  } catch (e) {
    console.error('saveCafe error', e);
    alert('Could not save cafe.');
  }
}

function showSaved() {
  container.innerHTML = '';
  const saved = JSON.parse(localStorage.getItem('savedCafes') || '[]');
  if (!saved.length) {
    container.innerHTML = '<div class="location-card" style="position:static; transform:none;"><p class="small">No saved cafes yet.</p></div>';
    return;
  }
  saved.forEach(cafe => {
    const card = document.createElement('div');
    card.className = 'location-card';
    card.style.position = 'static';
    card.style.transform = 'none';
    card.innerHTML = `
      <img src="${cafe.photo}" alt="${escapeHtml(cafe.name)}" />
      <h3 style="margin:6px 0;">${escapeHtml(cafe.name)}</h3>
      <p class="small">⭐ ${cafe.rating}</p>
    `;
    container.appendChild(card);
  });
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, function (m) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]; });
}

window._app = { getLocation, showSaved, displayCards, saveCafe };

