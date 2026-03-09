// listener for search
document.querySelector(`#btnSearch`).addEventListener("click", () => {
  document.querySelector("#txtError").classList.add("d-none");
  document.querySelector("#txtCity").classList.remove("is-invalid");
  const strCity = document.querySelector("#txtCity").value.trim();

  // validation if input is empty
  if (strCity === "") {
    showError("Please enter a city name.")
    return;
  }

  document.querySelector(`#divWeatherCard`).classList.add("d-none");
  getCoordinates(strCity);
});

// keydown listener to read "Enter" as a click on the button.
document.querySelector("#txtCity").addEventListener("keydown", (event) => {
  if(event.key === "Enter") {
    document.querySelector("#btnSearch").click();
  }
});


// listener for city selection btn
document.querySelector("#btnSelCity").addEventListener("click", () =>{
  const selector = document.querySelector("#selCity");
  const selected = JSON.parse(selector.value);
  document.querySelector("#divSelCity").classList.add("d-none");
  getWeather(selected.lat, selected.lon, selected.name);
})

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
  // base url for geocoding api
  const strGeoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${strCity}&count=10`;

  fetch(strGeoURL)
    .then((response) => response.json())
    .then((data) => {
      // if result doesn't return anything, call showError
      if (!data.results || data.results.length === 0) {
        showError("City not found. Please try again.");
        document.querySelector("#divWeatherCard").classList.add("d-none");
        return;
      }

      // if multiple cities, show dropdown
      if(data.results.length > 1) {
        // reset selection dropdown
        document.querySelector('#selCity').innerHTML = "";
        // grab information of each matching city
        data.results.forEach(city => {
          // stringify, then put city location info into each option
          const option = document.createElement("option");
          option.value = JSON.stringify({lat: city.latitude, lon: city.longitude, name: `${city.name}, ${city.admin1}, ${city.country}`})
          option.textContent = `${city.name}, ${city.admin1}, ${city.country}`;
          document.querySelector("#selCity").appendChild(option);
        });
        // show the dropdown if there are multiple matching city names
        document.querySelector("#divSelCity").classList.remove("d-none");
      } else {
        // hide dropdown for city selection if there is only one
        document.querySelector("#divSelCity").classList.add("d-none");
        // grab information on city location, then call getWeather
        const cityData = data.results[0];
        const numLat = data.results[0].latitude;
        const numLong = data.results[0].longitude;
        const strCityAPI = `${cityData.name}, ${cityData.admin1}, ${cityData.country}`;
        getWeather(numLat, numLong, strCityAPI);
      }
    })
    .catch((error) => {
      // throw error if city info can't be retrieved
      console.log("geocode error:", error);
      showError("Unable to find that city. Please try again.")
    });
}

// fetch weather data from open-meteo api
function getWeather(numLat, numLong, strCity) {
  // base url for weather data api
  const strWeatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${numLat}&longitude=${numLong}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

  fetch(strWeatherURL)
    .then((response) => response.json())
    .then((data) => {
      // call function to renderWeather info
      renderWeather(data.current, strCity);
    })
    .catch((error) => {
      // throw error if the fetching fails for some reason
      console.log("weather API error:", error);
      showError("An error has occurred while retrieving weather data.");
    });
}

// Update DOM with weather data
function renderWeather(objCurrentWeather, strCity) {
  // grab and set each relevant value to be displayed in card
  document.querySelector("#txtCityName").textContent = strCity;
  const numTemp = objCurrentWeather.temperature_2m;
  const numFeelsLike = objCurrentWeather.apparent_temperature;
  const numHumidity = objCurrentWeather.relative_humidity_2m;
  const numWind = objCurrentWeather.wind_speed_10m;
  const numRain = objCurrentWeather.precipitation_probability;
  const numWeatherCode = objCurrentWeather.weather_code;

  // apply information to respective elements in card
  document.querySelector("#txtTemp").textContent = `${numTemp}°F`;
  document.querySelector("#txtFeelsLike").textContent = `Feels Like ${numFeelsLike}°F`;
  document.querySelector("#txtHumidity").textContent = `${numHumidity}%`;
  document.querySelector("#txtWind").textContent = `${numWind} mph`;
  document.querySelector("#txtRain").textContent = `${numRain}%`;

  // update icon and advice sections via calls to helper functions
  updateWeatherIcon(numWeatherCode);
  updateAdvice(numFeelsLike, numWind, numRain);

  // show card
  document.querySelector("#divWeatherCard").classList.remove("d-none");
}

// change weather icon based on weather code
function updateWeatherIcon(numWeatherCode) {
  // grab icon element
  const icon = document.querySelector("#iconWeather");

  // set icon based on respective weather code in api
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
  // grab advice element
  const advice = document.querySelector("#txtAdvice");
  // create arr for msgs and "severity" of msg
  let arrAdviceMsgs = [];
  let strSeverity = "success";
  // based on wind, rain or temp, advise different things
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

  // create new elements for each snippet of advice,
  // and set the alert colors based on "severity".
  advice.innerHTML = arrAdviceMsgs.map((msg) => `<div>${msg}</div>`).join("");
  advice.classList.remove(
    "alert-success",
    "alert-warning",
    "alert-danger",
    "alert-info",
  );
  advice.classList.add(`alert-${strSeverity}`);
}
