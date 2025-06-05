const { generateSessionKey } = require('../app');

test('generated keys have length 6 by default', () => {
  const key = generateSessionKey();
  expect(key).toHaveLength(6);
});

test('multiple calls return unique values', () => {
  const keys = new Set();
  for (let i = 0; i < 100; i++) {
    keys.add(generateSessionKey());
  }
  expect(keys.size).toBe(100);
});
