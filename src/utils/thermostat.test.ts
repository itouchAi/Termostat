import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRelayStatus,
  calculateFlameModulation,
  estimateGasConsumption,
  calculateEstimatedCost,
  evaluateActiveSchedule,
  calculateComfortIndex
} from './thermostatRules.ts';
import { encryptData, decryptData } from './crypto.ts';

test('thermostatRules: calculateRelayStatus respects hysteresis deadband', () => {
  // When cold, relay turns ON
  assert.equal(calculateRelayStatus(19.0, 22.0, false, 0.4), true);

  // When warm, relay turns OFF
  assert.equal(calculateRelayStatus(22.5, 22.0, true, 0.4), false);

  // In deadband (21.8°C with target 22.0°C and delta < 0.4): retains previous state
  assert.equal(calculateRelayStatus(21.8, 22.0, true, 0.4), true);
  assert.equal(calculateRelayStatus(21.8, 22.0, false, 0.4), false);
});

test('thermostatRules: calculateFlameModulation scales proportionally', () => {
  // Relay OFF -> 0%
  assert.equal(calculateFlameModulation(20, 22, false), 0);

  // Large delta (>2.5°C) -> 100% full blast
  assert.equal(calculateFlameModulation(18.0, 22.0, true), 100);

  // Small delta -> moderate modulation
  const mod = calculateFlameModulation(21.5, 22.0, true);
  assert.ok(mod >= 20 && mod <= 60, `Modulation should be between 20 and 60, got ${mod}`);
});

test('thermostatRules: estimateGasConsumption and calculateEstimatedCost', () => {
  // 120 minutes running
  const gasM3 = estimateGasConsumption(120, 50, 24);
  assert.ok(gasM3 > 0, 'Gas consumption should be positive');

  const cost = calculateEstimatedCost(2.0, 8.5);
  assert.equal(cost, 17.0);
});

test('thermostatRules: evaluateActiveSchedule picks correct time slot', () => {
  const schedules = [
    { id: '1', name: 'Gece', enabled: true, time: '23:00', targetTemp: 19 },
    { id: '2', name: 'Sabah', enabled: true, time: '06:30', targetTemp: 23 },
    { id: '3', name: 'İş', enabled: true, time: '08:30', targetTemp: 18 }
  ];

  // At 07:15 -> Sabah schedule is active
  const activeMorning = evaluateActiveSchedule(schedules, 7, 15);
  assert.ok(activeMorning);
  assert.equal(activeMorning?.name, 'Sabah');

  // At 02:00 -> wraps to Gece schedule
  const activeNight = evaluateActiveSchedule(schedules, 2, 0);
  assert.ok(activeNight);
  assert.equal(activeNight?.name, 'Gece');
});

test('thermostatRules: calculateComfortIndex produces score and label', () => {
  const result = calculateComfortIndex(22.0, 50.0);
  assert.equal(result.score, 100);
  assert.equal(result.label, 'Mükemmel Konfor');
});

test('crypto: encryptData and decryptData roundtrip correctly', async () => {
  const sampleData = {
    targetTemp: 22.5,
    customPin: '1234',
    telegramToken: 'bot123456:secretToken',
    widgets: ['gauge', 'controls']
  };

  const encrypted = await encryptData(sampleData, 'secretMasterKey99');
  assert.ok(encrypted.ciphertext.length > 10);
  assert.ok(encrypted.iv.length > 5);
  assert.ok(encrypted.salt.length > 5);

  const decrypted = await decryptData<typeof sampleData>(encrypted, 'secretMasterKey99');
  assert.deepEqual(decrypted, sampleData);
});

test('weather: mapWmoCodeToCondition maps rainy, sunny and snow correctly', async () => {
  const { mapWmoCodeToCondition, formatDayName } = await import('./weather.ts');
  assert.equal(mapWmoCodeToCondition(0).condition, 'sunny');
  assert.equal(mapWmoCodeToCondition(61).condition, 'rainy');
  assert.equal(mapWmoCodeToCondition(73).condition, 'snowy');
  assert.equal(mapWmoCodeToCondition(45).condition, 'fog');
  assert.equal(formatDayName('2026-10-15', 0), 'Bugün');
  assert.equal(formatDayName('2026-10-16', 1), 'Yarın');
});
