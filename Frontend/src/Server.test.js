import test from 'node:test';
import assert from 'node:assert/strict';
import { getApiBaseUrl } from './Server.js';

test('uses the default backend URL when no override is configured', () => {
  assert.equal(getApiBaseUrl({}), 'http://localhost:5183');
});

test('uses the configured frontend API base URL when provided', () => {
  assert.equal(getApiBaseUrl({ VITE_API_BASE_URL: 'http://localhost:8080' }), 'http://localhost:8080');
});
