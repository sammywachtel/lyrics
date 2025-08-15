/**
 * Mock Supabase client for testing
 */

export const supabase = {
  auth: {
    getSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}
