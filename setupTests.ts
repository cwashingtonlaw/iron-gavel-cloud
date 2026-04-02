import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
