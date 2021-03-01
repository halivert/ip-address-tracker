function debounce(func, timeout = 500) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, timeout);
	};
}

function initMap() {
	let publicAccessToken =
		"pk.eyJ1IjoiaGFsaXZlcnQiLCJhIjoiY2tscWE4cW1sMWIwZzJvcDQzcXZ2eGh1MSJ9.s9NegXLJh4STVD_pv_JrGQ";

	let map = L.map("map", {
		zoomControl: false,
	});

	L.tileLayer(
		"https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
		{
			attribution:
				'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: "mapbox/streets-v11",
			tileSize: 512,
			zoomOffset: -1,
			accessToken: publicAccessToken,
		}
	).addTo(map);

	return map;
}

function setPin(map, { lat, lng, zoom } = {}) {
	let desiredZoom = zoom || 13;
	map.setView([lat, lng], desiredZoom);

	let markerIcon = L.icon({
		iconUrl: "./images/icon-location.svg",
	});

	L.marker([lat, lng], { icon: markerIcon }).addTo(map);
}

async function getLocation({ ip, domain } = {}) {
	let publicApiKey = "at_Dqb8czJnF6eJv1boozQ83c4gRnucp";

	let urlBuilder = `https://geo.ipify.org/api/v1?apiKey=${publicApiKey}`;

	if (domain) {
		urlBuilder += `&domain=${domain}`;
	} else if (ip) {
		urlBuilder += `&ipAddress=${ip}`;
	}

	let fetchResponse = await fetch(urlBuilder);
	let response = await fetchResponse.json();

	if (response.code) {
		if (response.code >= 400) {
			return {
				ip: "Error",
				coordinates: "Error",
				location: "Error",
				timezone: "Error",
				isp: "Error",
			};
		}
	}

	return {
		ip: response.ip,
		coordinates: { lat: response.location.lat, lng: response.location.lng },
		location: `${response.location.city}, ${response.location.region}`,
		timezone: `UTC ${response.location.timezone}`,
		isp: response.isp,
	};
}

function fillData(data) {
	keys = ["ip", "location", "timezone", "isp"];

	keys.forEach((key) => {
		let element = document.getElementById(key);
		if (!element) return;

		element.childNodes.forEach((c) => {
			element.removeChild(c);
		});

		element.appendChild(document.createTextNode(data[key] || ""));
	});
}

function isIp(possible) {
	let val = possible.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/);

	if (!val || val.length !== 1) return false;

	let segments = val[0].split(".");
	if (segments.length !== 4) return false;

	for (let i = 0; i < segments.length; i++) {
		let val = parseInt(segments[i], 10);
		if (val > 255 || val < 0) return false;
	}

	return true;
}

const searchDebounced = debounce((map, query) => {
	let result;
	if (isIp(query)) {
		result = getLocation({ ip: query });
	} else {
		result = getLocation({ domain: query });
	}

	result.then(({ ip, coordinates, location, timezone, isp }) => {
		if (coordinates !== "Error") setPin(map, coordinates);
		fillData({ ip, location, timezone, isp });
	});
});

document.addEventListener("DOMContentLoaded", () => {
	const map = initMap();

	const ipForm = document.getElementById("ip-form");

	getLocation().then(({ ip, coordinates, location, timezone, isp }) => {
		setPin(map, coordinates);
		fillData({ ip, location, timezone, isp });
	});

	ipForm.addEventListener("submit", (e) => {
		e.preventDefault();

		searchDebounced(map, e.target.querySelector("[name='ip']").value);
	});
});
