/**
 * Shared test helper functions and utilities
 * Use these helpers across all frontend tests for consistency
 */

import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Test helper for user interactions
 */
export const userInteraction = userEvent.setup();

/**
 * Helper to wait for element to be removed from DOM
 */
export const waitForElementToBeRemoved = async (element: HTMLElement | null) => {
  if (element) {
    await waitFor(() => expect(element).not.toBeInTheDocument());
  }
};

/**
 * Helper to find element by test-id with better error messages
 */
export const getByTestId = (testId: string, container?: HTMLElement) => {
  const element = container ?
    within(container).getByTestId(testId) :
    screen.getByTestId(testId);

  if (!element) {
    throw new Error(`Element with test-id "${testId}" not found`);
  }
  return element;
};

/**
 * Helper to simulate typing with realistic delays
 */
export const typeText = async (element: HTMLElement, text: string) => {
  await userInteraction.clear(element);
  await userInteraction.type(element, text, { delay: 10 });
};

/**
 * Helper to simulate form submission
 */
export const submitForm = async (form: HTMLElement) => {
  await userInteraction.click(within(form).getByRole('button', { name: /submit|save|create/i }));
};

/**
 * Helper to check if element has specific CSS class
 */
export const hasClass = (element: HTMLElement, className: string): boolean => {
  return element.classList.contains(className);
};

/**
 * Helper to get computed style property
 */
export const getComputedStyleProperty = (element: HTMLElement, property: string): string => {
  return window.getComputedStyle(element).getPropertyValue(property);
};

/**
 * Assertion helper for accessibility
 */
export const expectToBeAccessible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
  // Add more a11y checks as needed
};

/**
 * Mock localStorage for tests
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

/**
 * Mock console methods for cleaner test output
 */
export const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

/**
 * Test data factory functions
 */
export const createMockSong = (overrides = {}) => ({
  id: 'test-song-id',
  title: 'Test Song',
  content: '[Verse 1]\nTest lyrics here',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  user_id: 'test-user-id',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Helper to mock API responses
 */
export const mockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
});
