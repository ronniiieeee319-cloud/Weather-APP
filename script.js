/* ===================================
   OpenWeatherMap API Configuration
   =================================== */
const API_KEY = '84a1089e4492101a3ec91ceb7ef66f7d'; // Get free API key from: https://openweathermap.org/api
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/* ===================================
   Global Variables
   =================================== */
let isCelsius = true;
let currentWeatherData = null;

/* ===================================
   DOM Elements
   =================================== */
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingContainer = document.getElementById('loadingContainer');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const weatherContainer = document.getElementById('weatherContainer');
const backgroundContainer = document.getElementById('backgroundContainer');
const tempToggle = document.getElementById('tempToggle');

/* ===================================
   Weather Icon Mapping (OpenWeatherMap codes)
   =================================== */
const weatherIcons = {
    '01d': 'fa-sun',           // clear sky day
    '01n': 'fa-moon',          // clear sky night
    '02d': 'fa-cloud-sun',     // few clouds day
    '02n': 'fa-cloud-moon',    // few clouds night
    '03d': 'fa-cloud',         // scattered clouds
    '03n': 'fa-cloud',
    '04d': 'fa-cloud',         // broken clouds
    '04n': 'fa-cloud',
    '09d': 'fa-cloud-rain',    // shower rain
    '09n': 'fa-cloud-rain',
    '10d': 'fa-cloud-showers-heavy', // rain day
    '10n': 'fa-cloud-showers-heavy', // rain night
    '11d': 'fa-cloud-bolt',    // thunderstorm
    '11n': 'fa-cloud-bolt',
    '13d': 'fa-snowflake',     // snow
    '13n': 'fa-snowflake',
    '50d': 'fa-smog',          // mist/fog
    '50n': 'fa-smog'
};

/* ===================================
   Service Worker Registration (PWA)
   =================================== */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

/* ===================================
   Initialize Application
   =================================== */
function init() {
    // Update date and time initially
    updateDateTime();

    // Update date and time every minute
    setInterval(updateDateTime, 60000);

    // Check if API key is set
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError('Please add your OpenWeatherMap API key in script.js');
        return;
    }

    // Load last searched city from localStorage
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        fetchWeatherByCity(lastCity);
    } else {
        // Try to get user's location
        getCurrentLocationWeather();
    }

    // Add event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', getCurrentLocationWeather);

    // Allow search with Enter key
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Temperature toggle button
    tempToggle.addEventListener('click', toggleTemperature);
}

/* ===================================
   Update Date and Time Display
   =================================== */
function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('dateTime').textContent = now.toLocaleDateString('en-US', options);
}

/* ===================================
   Get Current Location Weather
   =================================== */
function getCurrentLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    showLoading();

    navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByCoords(latitude, longitude);
        },
        // Error callback
        (error) => {
            showError('Unable to get your location. Please search manually.');
            console.error('Geolocation error:', error);
        }
    );
}

/* ===================================
   Handle City Search
   =================================== */
function handleSearch() {
    const city = cityInput.value.trim();

    // Don't search if input is empty
    if (city === '') {
        return;
    }

    fetchWeatherByCity(city);
    cityInput.value = ''; // Clear input
}

/* ===================================
   Fetch Weather by City Name
   =================================== */
async function fetchWeatherByCity(city) {
    showLoading();

    try {
        const url = `${API_BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('City not found. Please check the spelling.');
            } else if (response.status === 401) {
                throw new Error('Invalid API key. Please check your configuration.');
            } else {
                throw new Error('Unable to fetch weather data.');
            }
        }

        const data = await response.json();
        displayWeather(data);
        localStorage.setItem('lastCity', city);

    } catch (error) {
        showError(error.message);
        console.error('Fetch error:', error);
    }
}

/* ===================================
   Fetch Weather by Coordinates
   =================================== */
async function fetchWeatherByCoords(lat, lon) {
    showLoading();

    try {
        const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Unable to fetch weather data for your location.');
        }

        const data = await response.json();
        displayWeather(data);
        localStorage.setItem('lastCity', data.name);

    } catch (error) {
        showError(error.message);
        console.error('Fetch error:', error);
    }
}

/* ===================================
   Show Loading Animation
   =================================== */
function showLoading() {
    weatherContainer.classList.remove('active');
    errorMessage.classList.remove('active');
    loadingContainer.classList.add('active');
}

/* ===================================
   Show Error Message
   =================================== */
function showError(message) {
    loadingContainer.classList.remove('active');
    weatherContainer.classList.remove('active');
    errorText.textContent = message;
    errorMessage.classList.add('active');

    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}

/* ===================================
   Display Weather Information
   =================================== */
function displayWeather(data) {
    currentWeatherData = data;

    // Hide loading and error
    loadingContainer.classList.remove('active');
    errorMessage.classList.remove('active');

    // Extract weather data
    const temperature = data.main.temp;
    const feelsLike = data.main.feels_like;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;
    const visibility = data.visibility / 1000; // Convert to km
    const weatherMain = data.weather[0].main.toLowerCase();
    const weatherDescription = data.weather[0].description;
    const weatherIcon = data.weather[0].icon;
    const cityName = data.name;
    const country = data.sys.country;

    // Update city and country
    document.getElementById('cityName').textContent = cityName;
    document.getElementById('country').textContent = country;

    // Update weather description
    document.getElementById('weatherDescription').textContent = weatherDescription;

    // Update weather details
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(windSpeed * 3.6)} km/h`; // Convert m/s to km/h
    document.getElementById('visibility').textContent = `${visibility.toFixed(1)} km`;

    // Store temperature values
    currentWeatherData.temperature = temperature;
    currentWeatherData.feelsLike = feelsLike;

    // Update temperature display
    updateTemperatureDisplay();

    // Update weather icon based on OpenWeatherMap icon code
    updateWeatherIcon(weatherIcon);

    // Update background gradient based on main weather condition
    updateBackground(weatherMain);

    // Show weather container with fade-in animation
    weatherContainer.classList.add('active');
}

/* ===================================
   Update Temperature Display
   =================================== */
function updateTemperatureDisplay() {
    if (!currentWeatherData) return;

    let temp = currentWeatherData.temperature;
    let feelsLike = currentWeatherData.feelsLike;

    // Convert to Fahrenheit if needed
    if (!isCelsius) {
        temp = celsiusToFahrenheit(temp);
        feelsLike = celsiusToFahrenheit(feelsLike);
    }

    // Update display with appropriate unit
    const unit = isCelsius ? '°C' : '°F';
    document.getElementById('temperature').textContent = `${Math.round(temp)}${unit}`;
    document.getElementById('feelsLike').textContent = `${Math.round(feelsLike)}${unit}`;
}

/* ===================================
   Toggle Temperature Unit (C/F)
   =================================== */
function toggleTemperature() {
    isCelsius = !isCelsius;

    // Update button text
    tempToggle.textContent = isCelsius ? '°F' : '°C';

    // Update temperature display
    updateTemperatureDisplay();
}

/* ===================================
   Convert Celsius to Fahrenheit
   =================================== */
function celsiusToFahrenheit(celsius) {
    return (celsius * 9 / 5) + 32;
}

/* ===================================
   Update Weather Icon
   =================================== */
function updateWeatherIcon(iconCode) {
    const iconContainer = document.getElementById('weatherIconContainer');
    const iconClass = weatherIcons[iconCode] || 'fa-sun';

    // Update icon with animation class
    iconContainer.innerHTML = `<i class="fas ${iconClass} weather-icon"></i>`;
}

/* ===================================
   Update Background Gradient
   =================================== */
function updateBackground(condition) {
    // Remove all condition classes
    backgroundContainer.className = 'background-container';

    // Map weather conditions to background classes
    const conditionMap = {
        'clear': 'clear',
        'clouds': 'clouds',
        'rain': 'rain',
        'drizzle': 'drizzle',
        'thunderstorm': 'thunderstorm',
        'snow': 'snow',
        'mist': 'mist',
        'fog': 'fog',
        'haze': 'haze'
    };

    const backgroundClass = conditionMap[condition] || 'clear';
    backgroundContainer.classList.add(backgroundClass);
}

/* ===================================
   Start Application When DOM Loads
   =================================== */
document.addEventListener('DOMContentLoaded', init);