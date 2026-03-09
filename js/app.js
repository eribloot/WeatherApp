// listner for search
document.querySelector(`#btnSearch`).addEventListener("click", () => {
  document.querySelector("#txtError").classList.add("d-none");
  document.querySelector("#txtCity").classList.remove("is-invalid");
  const strCity = document.querySelector("#txtCity").value.trim();

  if (strCity === "") {
    showError("Please enter a city name.")
    return;
  }

  document.querySelector(`#divWeatherCard`).classList.add("d-none");

  // keydown listener to read "Enter" as a click on the button.
  document.querySelector("#txtCity").addEventListener("keydown", (event) => {
    if(event.key === "Enter") {
      document.querySelector("#btnSearch").click();
    }
  });

  getCoordinates(strCity);
});

// helper function to display error
function showError(msg) {
  const error = document.querySelector("#txtError");
  const input = document.querySelector("#txtCity");
  error.textContent = msg;
  error.classList.remove("d-none");
  input.classList.add("is-invalid");
}

// fetch coordinates for given city using open meteo geocoding api.
function getCoordinates(strCity) {
  const strGeoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${strCity}&count=1`;

  fetch(strGeoURL)
    .then((response) => response.json())
    .then((data) => {
      if (!data.results || data.results.length === 0) {
        showError("City not found. Please try again.");
        document.querySelector("#divWeatherCard").classList.add("d-none");
        return;
      }

      const cityData = data.results[0];
      const numLat = data.results[0].latitude;
      const numLong = data.results[0].longitude;
      const strCityAPI = `${cityData.name}${cityData.country ? ', ' + cityData.country : ''}`;
      getWeather(numLat, numLong, strCityAPI);
    })
    .catch((error) => {
      console.log("geocode error:", error);
      showError("Unable to find that city. Please try again.")
    });
}

// fetch weather data from open-meteo api
function getWeather(numLat, numLong, strCity) {
  const strWeatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${numLat}&longitude=${numLong}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

  fetch(strWeatherURL)
    .then((response) => response.json())
    .then((data) => {
      renderWeather(data.current, strCity);
    })
    .catch((error) => {
      console.log("weather API error:", error);
      showError("An error has occurred while retrieving weather data.");
    });
}

// Update DOM with weather data
function renderWeather(objCurrentWeather, strCity) {
  document.querySelector("#txtCityName").textContent = strCity;

  const numTemp = objCurrentWeather.temperature_2m;
  const numFeelsLike = objCurrentWeather.apparent_temperature;
  const numHumidity = objCurrentWeather.relative_humidity_2m;
  const numWind = objCurrentWeather.wind_speed_10m;
  const numRain = objCurrentWeather.precipitation_probability;
  const numWeatherCode = objCurrentWeather.weather_code;

  document.querySelector("#txtTemp").textContent = `${numTemp}°F`;
  document.querySelector("#txtFeelsLike").textContent =
    `Feels Like ${numFeelsLike}°F`;
  document.querySelector("#txtHumidity").textContent = `${numHumidity}%`;
  document.querySelector("#txtWind").textContent = `${numWind} mph`;
  document.querySelector("#txtRain").textContent = `${numRain}%`;

  // update icon and advice sections via functions
  updateWeatherIcon(numWeatherCode);
  updateAdvice(numFeelsLike, numWind, numRain);

  // show card
  document.querySelector("#divWeatherCard").classList.remove("d-none");
}

// change weather icon based on weather code
function updateWeatherIcon(numWeatherCode) {
  const icon = document.querySelector("#iconWeather");

  if (numWeatherCode === 0) {
    icon.className = "bi bi-sun-fill display-1";
  } else if (numWeatherCode >= 1 && numWeatherCode <= 3) {
    icon.className = "bi bi-cloud-sun display-1";
  } else if (numWeatherCode >= 51 && numWeatherCode <= 67) {
    icon.className = "bi bi-cloud-rain display-1";
  } else if (numWeatherCode >= 71 && numWeatherCode <= 77) {
    icon.className = "bi bi-snow display-1";
  } else {
    icon.className = "bi bi-cloud display-1";
  }
}

// change suggestion/advice based on weather conditions
function updateAdvice(numFeelsLike, numWind, numRain) {
  const advice = document.querySelector("#txtAdvice");

  let arrAdviceMsgs = [];
  let strSeverity = "success";
  if (numRain > 60) {
    arrAdviceMsgs.push(
      "High chance of rain. Pack waterproof gear accordingly.",
    );
    strSeverity = "danger";
  }
  if (numWind > 25) {
    arrAdviceMsgs.push("Strong winds expected.");
    strSeverity = "danger";
  }
  if (numFeelsLike < 40) {
    arrAdviceMsgs.push("Temperatures are low. Dress in layers.");
    strSeverity = "warning";
  }
  if (numFeelsLike > 85) {
    arrAdviceMsgs.push("Temperatures are high. Remember to hydrate!");
    strSeverity = "warning";
  }

  // if no warning messages were triggered
  if (arrAdviceMsgs.length === 0) {
    arrAdviceMsgs.push("Great conditions for a hike.");
  }

  advice.innerHTML = arrAdviceMsgs.map((msg) => `<div>${msg}</div>`).join("");
  advice.classList.remove(
    "alert-success",
    "alert-warning",
    "alert-danger",
    "alert-info",
  );
  advice.classList.add(`alert-${strSeverity}`);
}
