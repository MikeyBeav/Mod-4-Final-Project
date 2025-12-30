const publicKey = "4b6575ac2bebc7d2d579a9aedde904c3";
const privateKey = "48f32d6c87bde6a335345755b60d84a2f137e191";
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

function getApiUrl(searchTerm = "") {
  const timestamp = new Date().getTime().toString();
  const hash = md5(timestamp + privateKey + publicKey);
  let url = `${CORS_PROXY}https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
  if (searchTerm) {
    url += `&nameStartsWith=${encodeURIComponent(searchTerm)}`;
  }
  return url;
}

const avengers = [
  "Iron Man",
  "Captain America",
  "Thor",
  "Hulk",
  "Black Widow",
  "Hawkeye",
  1009610,
  "Doctor Strange",
  "Black Panther",
  1010802,
];

async function fetchAvengers() {
  showSpinner();
  const characterListEl = document.querySelector(".character-list");
  const requests = avengers.map(item => {
    if (typeof item === "number") {
      const timestamp = new Date().getTime().toString();
      const hash = md5(timestamp + privateKey + publicKey);
      const url = `${CORS_PROXY}https://gateway.marvel.com/v1/public/characters/${item}?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;
      return fetch(url).then(res => res.json());
    } else {
      return fetch(getApiUrl(item)).then(res => res.json());
    }
  });
  const results = await Promise.all(requests);
  const allAvengers = results
    .map(data => Array.isArray(data.data.results) ? data.data.results[0] : null)
    .filter(Boolean);
  characterListEl.innerHTML = allAvengers
    .map((character) => characterHTML(character))
    .join("");
  hideSpinner();
}

document.querySelector(".searchInput").addEventListener("input", async (e) => {
  showSpinner();
  const inputValue = normalize(e.target.value.trim());
  if (inputValue.length > 0) {
    const apiSearchTerm = inputValue.slice(0, 3);
    const apiUrl = getApiUrl(apiSearchTerm);
    const response = await fetch(apiUrl);
    const data = await response.json();
    let characters = data.data.results;
    characters = characters.filter((character) =>
      normalize(character.name).includes(inputValue)
    );
    characters.sort((a, b) => {
      const aName = normalize(a.name);
      const bName = normalize(b.name);
      const aStarts = aName.startsWith(inputValue) ? 0 : 1;
      const bStarts = bName.startsWith(inputValue) ? 0 : 1;
      return aStarts - bStarts;
    });
    characters = characters.slice(0, 10);
    const characterListEl = document.querySelector(".character-list");
    characterListEl.innerHTML = characters
      .map((character) => characterHTML(character))
      .join("");
  } else {
    document.querySelector(".character-list").innerHTML = "";
  }
  hideSpinner();
});
fetchAvengers();

function characterHTML(character) {
  const detailObj = character.urls.find((urlObj) => urlObj.type === "detail");
  const detailUrl = detailObj ? detailObj.url : "#";
  const name = character.name || "Unknown Character";
  const description =
    character.description && character.description.trim().length > 0
      ? character.description
      : "No description available.";
  return `
    <div class="characters__container">
        <div class="character-card">
            <img src="${character.thumbnail.path}/standard_medium.${character.thumbnail.extension}" alt="${name}" />
            <div class="character-card__container">
                <h3 class="red">${name}</h3>
                <p><b>Description:</b> ${description}</p>
                <p><b><span class="red">Site:</span></b> <a class="red" href="${detailUrl}" target="_blank">View Site</a></p>
            </div>
        </div>
    </div>`;
}

function showSpinner() {
  document.getElementById("spinner").style.display = "block";
}
function hideSpinner() {
  document.getElementById("spinner").style.display = "none";
}
