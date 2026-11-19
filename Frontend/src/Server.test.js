import test from 'node:test';
import assert from 'node:assert/strict';
import { getApiBaseUrl } from './Server.js';

test('uses the default backend URL when no override is configured', () => {
  assert.equal(getApiBaseUrl({}), 'http://localhost:5183');
});

test('uses the configured frontend API base URL when provided', () => {
  assert.equal(getApiBaseUrl({ VITE_API_BASE_URL: 'http://localhost:8080' }), 'http://localhost:8080');
});

test('uses the current IP origin in production', () => {
  globalThis.window = { location: { origin: 'http://203.0.113.10', hostname: '203.0.113.10' } };
  assert.equal(getApiBaseUrl({ VITE_API_BASE_URL: 'https://ItsYourSchool.com' }), 'http://203.0.113.10');
  delete globalThis.window;
});

test('uses the current domain origin in production', () => {
  globalThis.window = { location: { origin: 'https://ItsYourSchool.com', hostname: 'ItsYourSchool.com' } };
  assert.equal(getApiBaseUrl({ VITE_API_BASE_URL: 'http://localhost:5183' }), 'https://ItsYourSchool.com');
  delete globalThis.window;
});
