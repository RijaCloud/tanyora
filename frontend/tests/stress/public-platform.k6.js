import http from "k6/http";
import { check, sleep } from "k6";

const profile = __ENV.PROFILE || "smoke";
const baseUrl = (__ENV.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

const profiles = {
  smoke: { stages: [{ duration: "20s", target: 2 }, { duration: "40s", target: 2 }, { duration: "20s", target: 0 }] },
  standard: { stages: [{ duration: "2m", target: 10 }, { duration: "5m", target: 25 }, { duration: "2m", target: 0 }] },
  intensive: { stages: [{ duration: "5m", target: 25 }, { duration: "10m", target: 75 }, { duration: "5m", target: 0 }] },
};

export const options = {
  ...(profiles[profile] || profiles.smoke),
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"],
  },
};

const scenarios = [
  "/",
  "/actualites",
  "/news",
  "/petites-annonces",
  "/petites-annonces?category=Immobilier",
  "/petites-annonces?location=Antananarivo",
  "/offres-emploi",
  "/offres-emploi?category=Informatique",
  "/appels-offres",
  "/appels-offres?category=Construction",
  "/annuaire",
  "/annuaire?search=recette",
];

export default function () {
  const path = scenarios[Math.floor(Math.random() * scenarios.length)];
  const response = http.get(`${baseUrl}${path}`, { tags: { page: path } });
  check(response, {
    "reponse HTTP publique valide": (entry) => entry.status >= 200 && entry.status < 400,
    "page non vide": (entry) => String(entry.body || "").length > 500,
  });
  if (/^\/(petites-annonces|offres-emploi|appels-offres)/.test(path)) {
    const detail = String(response.body || "").match(/href="(\/(?:petites-annonces|offres-emploi|appels-offres)\/[^"?#]+)"/);
    if (detail?.[1]) {
      const detailResponse = http.get(`${baseUrl}${detail[1]}`, { tags: { page: "listing-detail" } });
      check(detailResponse, { "fiche detail valide": (entry) => entry.status >= 200 && entry.status < 400 });
    }
  }
  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    "tests/stress/reports/latest-summary.json": JSON.stringify(data, null, 2),
    stdout: `\nStress test ${profile} termine contre ${baseUrl}. Consultez tests/stress/reports/latest-summary.json\n`,
  };
}
