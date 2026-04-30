/**
 * Data Integrity — Unit Tests (4 tests)
 */
const fs = require('fs');
const path = require('path');

describe('Data Integrity', () => {
  test('election-data.json should be valid and contain zones', () => {
    const filePath = path.join(__dirname, '../../../data/election-data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(data.zones).toBeDefined();
    expect(data.zones.length).toBeGreaterThan(0);
  });

  test('All election zones should have FAQ arrays', () => {
    const gemini = require('../../../src/services/gemini');
    const data = gemini.loadElectionData();
    expect(data.zones).toBeDefined();
    data.zones.forEach(zone => {
      expect(Array.isArray(zone.faq)).toBe(true);
      expect(zone.faq.length).toBeGreaterThan(0);
    });
  });

  test('Design system should have core elite-primary variable', () => {
    const filePath = path.join(__dirname, '../../../public/css/design-system.css');
    const css = fs.readFileSync(filePath, 'utf8');
    expect(css).toContain('--elite-primary:');
    expect(css).toContain('--elite-accent:');
  });

  test('Assistant should classify registration questions correctly', () => {
    const { classifyIntent } = require('../../../src/services/gemini');
    const intent = classifyIntent('How do I register to vote?');
    expect(intent).toBe('registration');
  });
});
