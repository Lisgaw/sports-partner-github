import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  scenarios: {
    users_10: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      exec: 'homepage',
    },
    users_50: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      exec: 'homepage',
      startTime: '1m',
    },
    users_100: {
      executor: 'constant-vus',
      vus: 100,
      duration: '1m',
      exec: 'homepage',
      startTime: '2m',
    },
    users_200: {
      executor: 'constant-vus',
      vus: 200,
      duration: '1m',
      exec: 'homepage',
      startTime: '3m',
    },
    listings_10: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      exec: 'listings',
      startTime: '4m',
    },
    listings_50: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      exec: 'listings',
      startTime: '5m',
    },
    listings_100: {
      executor: 'constant-vus',
      vus: 100,
      duration: '1m',
      exec: 'listings',
      startTime: '6m',
    },
    listings_200: {
      executor: 'constant-vus',
      vus: 200,
      duration: '1m',
      exec: 'listings',
      startTime: '7m',
    },
  },
};

const BASE_URL = 'https://sports-partner-github.vercel.app';

export function homepage() {
  http.get(`${BASE_URL}/`);
  sleep(1);
}

export function listings() {
  http.get(`${BASE_URL}/api/listings`);
  sleep(1);
}
