document.getElementById('weather-btn').addEventListener('click', () => {
  document.getElementById('weather-modal').classList.remove('hidden');
  document.getElementById('weather-result').classList.add('hidden');
  autoDetectCity();
  document.getElementById('weather-city').focus();
});

document.getElementById('weather-modal-close').addEventListener('click', () => document.getElementById('weather-modal').classList.add('hidden'));
document.getElementById('weather-modal').addEventListener('click', (e) => { if (e.target === document.getElementById('weather-modal')) document.getElementById('weather-modal').classList.add('hidden'); });
document.getElementById('weather-fetch-btn').addEventListener('click', fetchWeather);
document.getElementById('weather-auto-btn').addEventListener('click', autoDetectCity);
document.getElementById('weather-city').addEventListener('keydown', (e) => { if (e.key === 'Enter') fetchWeather(); });

async function autoDetectCity() {
  try {
    const response = await fetch('/api/geolocate');
    const data = await response.json();
    if (data.city) {
      let c = data.city;
      const majorCities = ['jakarta','bandung','surabaya','medan','semarang','makassar','yogyakarta','palembang','denpasar','tangerang','bekasi','malang'];
      for (const city of majorCities) {
        if (c.toLowerCase().includes(city)) {
          c = city.charAt(0).toUpperCase() + city.slice(1);
          break;
        }
      }
      document.getElementById('weather-city').value = c;
      document.getElementById('weather-city').placeholder = c;
    }
  } catch {}
}

async function fetchWeather() {
  const city = document.getElementById('weather-city').value.trim() || document.getElementById('weather-city').placeholder || 'Jakarta';
  const weatherResult = document.getElementById('weather-result');
  weatherResult.classList.add('hidden');

  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await response.json();

    if (data.error || data.note) {
      document.getElementById('w-tip').textContent = data.note || data.error;
      document.querySelector('.weather-main').style.display = 'none';
      document.querySelector('.weather-details').style.display = 'none';
      weatherResult.classList.remove('hidden');
      return;
    }

    document.getElementById('w-temp').textContent = `${data.temp}°C`;
    document.getElementById('w-desc').textContent = data.description;
    document.getElementById('w-feels').textContent = `${data.feelsLike}°C`;
    document.getElementById('w-humidity').textContent = `${data.humidity}%`;
    document.getElementById('w-wind').textContent = `${data.windSpeed} m/s`;
    document.getElementById('w-tip').textContent = data.tip;

    document.querySelector('.weather-main').style.display = 'flex';
    document.querySelector('.weather-details').style.display = 'flex';
    weatherResult.classList.remove('hidden');
  } catch {
    document.getElementById('w-tip').textContent = '⚠️ ' + t('weather_failed');
    document.querySelector('.weather-main').style.display = 'none';
    document.querySelector('.weather-details').style.display = 'none';
    weatherResult.classList.remove('hidden');
  }
}
