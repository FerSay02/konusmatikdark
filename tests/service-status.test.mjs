import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { classifyReadiness, fetchServiceStatus, createStatusMonitor } from '../src/lib/serviceStatus.js';

console.log('--- Testing Service Status & Maintenance Notice ---');

// 1. classifyReadiness tests
// 1.1 200 ok → up
assert.equal(
  classifyReadiness({
    ok: true,
    status: 200,
    body: { status: 'ok', services: { database: 'ok', redis: 'ok' } },
  }),
  'up',
  'classifyReadiness: 200 ok must return up'
);

// 1.2 503 degraded → down
assert.equal(
  classifyReadiness({
    ok: false,
    status: 503,
    body: { status: 'degraded', services: { database: 'ok' } },
  }),
  'down',
  'classifyReadiness: 503 degraded must return down'
);

// 1.3 200 with a service "warming_up" but status "degraded" → down
assert.equal(
  classifyReadiness({
    ok: true,
    status: 200,
    body: {
      status: 'degraded',
      services: {
        database: 'ok',
        redis: 'ok',
        tts_engine: 'warming_up',
      },
    },
  }),
  'down',
  'classifyReadiness: 200 with warming_up service and degraded status must return down'
);

// 1.4 200 with status: "ok" → up
assert.equal(
  classifyReadiness({
    ok: true,
    status: 200,
    body: { status: 'ok' },
  }),
  'up',
  'classifyReadiness: 200 with status ok must return up'
);

// 1.5 network error → down
assert.equal(
  classifyReadiness({
    error: new Error('Failed to fetch'),
  }),
  'down',
  'classifyReadiness: network error must return down'
);

// 1.6 non-JSON 502 → down
assert.equal(
  classifyReadiness({
    ok: false,
    status: 502,
    body: null,
  }),
  'down',
  'classifyReadiness: non-JSON 502 must return down'
);

// 1.7 missing body → down
assert.equal(
  classifyReadiness({
    ok: true,
    status: 200,
    body: null,
  }),
  'down',
  'classifyReadiness: missing body must return down'
);

// Extra safety: any service not ok must yield down
assert.equal(
  classifyReadiness({
    ok: true,
    status: 200,
    body: {
      status: 'ok',
      services: {
        database: 'ok',
        tts_engine: 'unavailable',
      },
    },
  }),
  'down',
  'classifyReadiness: any service not ok must return down'
);

// 1.8 404 → unknown
assert.equal(
  classifyReadiness({
    ok: false,
    status: 404,
    body: { detail: 'Not Found' },
  }),
  'unknown',
  'classifyReadiness: 404 must return unknown'
);

// 1.9 401, 403, 429 → unknown
for (const status of [401, 403, 429]) {
  assert.equal(
    classifyReadiness({
      ok: false,
      status,
      body: null,
    }),
    'unknown',
    `classifyReadiness: ${status} must return unknown`
  );
}

console.log('✓ classifyReadiness tests passed');

// 2. fetchServiceStatus tests with fake fetchImpl
// 2.1 correct URL without double slash when base ends with /
{
  const recorded = [];
  const fakeFetch = async (url, options) => {
    recorded.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    };
  };

  const res1 = await fetchServiceStatus({ baseUrl: 'https://api.example.com/', fetchImpl: fakeFetch });
  assert.equal(res1, 'up');
  assert.equal(recorded[0].url, 'https://api.example.com/ready', 'URL should not have double slash');
  assert.equal(recorded[0].options.cache, 'no-store', 'cache must be no-store');

  const res2 = await fetchServiceStatus({ baseUrl: 'https://api.example.com', fetchImpl: fakeFetch });
  assert.equal(res2, 'up');
  assert.equal(recorded[1].url, 'https://api.example.com/ready', 'URL without trailing slash must match');

  const res3 = await fetchServiceStatus({ baseUrl: '', fetchImpl: fakeFetch });
  assert.equal(res3, 'up');
  assert.equal(recorded[2].url, '/ready', 'empty baseUrl should produce /ready');
}

// 2.2 timeout aborts and yields "down" (use a fetch that never resolves and timeoutMs: 50)
{
  let aborted = false;
  const neverResolvingFetch = (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      if (signal.aborted) {
        aborted = true;
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
        return;
      }
      signal.addEventListener('abort', () => {
        aborted = true;
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });

  const status = await fetchServiceStatus({
    baseUrl: 'https://api.example.com',
    fetchImpl: neverResolvingFetch,
    timeoutMs: 50,
  });
  assert.equal(status, 'down', 'timed out fetch must yield down');
  assert.equal(aborted, true, 'timeout must trigger abort');
}

// 2.3 a throwing fetch yields "down"
{
  const throwingFetch = () => {
    throw new Error('Connection refused');
  };

  const status = await fetchServiceStatus({
    baseUrl: 'https://api.example.com',
    fetchImpl: throwingFetch,
  });
  assert.equal(status, 'down', 'throwing fetch must yield down');
}

// 2.4 non-JSON response yields "down"
{
  const nonJsonFetch = async () => ({
    ok: false,
    status: 502,
    json: async () => {
      throw new Error('Unexpected token < in JSON at position 0');
    },
  });

  const status = await fetchServiceStatus({
    baseUrl: 'https://api.example.com',
    fetchImpl: nonJsonFetch,
  });
  assert.equal(status, 'down', 'non-JSON 502 must yield down');
}

// 2.5 404 yields "unknown"
{
  const notFoundFetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ detail: 'Not Found' }),
  });

  const status = await fetchServiceStatus({
    baseUrl: 'https://api.example.com',
    fetchImpl: notFoundFetch,
  });
  assert.equal(status, 'unknown', '404 fetch must yield unknown');
}

// 2.6 401/403/429 yield "unknown"
for (const code of [401, 403, 429]) {
  const httpErrorFetch = async () => ({
    ok: false,
    status: code,
    json: async () => ({ detail: 'Client error' }),
  });

  const status = await fetchServiceStatus({
    baseUrl: 'https://api.example.com',
    fetchImpl: httpErrorFetch,
  });
  assert.equal(status, 'unknown', `${code} fetch must yield unknown`);
}

// 2.7 503 degraded yields "down"
{
  const degradedFetch = async () => ({
    ok: false,
    status: 503,
    json: async () => ({ status: 'degraded' }),
  });

  const status = await fetchServiceStatus({
    baseUrl: 'https://api.example.com',
    fetchImpl: degradedFetch,
  });
  assert.equal(status, 'down', '503 degraded fetch must yield down');
}

console.log('✓ fetchServiceStatus tests passed');

// 3. createStatusMonitor behavioural & timing contract tests
function createFakeClock() {
  let currentTime = 0;
  let nextTimerId = 1;
  const timers = new Map();

  function setTimer(fn, delayMs) {
    const id = nextTimerId++;
    timers.set(id, {
      dueTime: currentTime + delayMs,
      callback: fn,
    });
    return id;
  }

  function clearTimer(id) {
    timers.delete(id);
  }

  function countPendingTimers() {
    return timers.size;
  }

  async function advanceTime(ms) {
    const targetTime = currentTime + ms;
    while (true) {
      let earliest = null;
      for (const [id, t] of timers.entries()) {
        if (t.dueTime <= targetTime) {
          if (!earliest || t.dueTime < earliest.dueTime) {
            earliest = { id, ...t };
          }
        }
      }
      if (!earliest) break;
      currentTime = earliest.dueTime;
      timers.delete(earliest.id);
      earliest.callback();
      await flushMicrotasks();
    }
    currentTime = targetTime;
  }

  return {
    getTime: () => currentTime,
    setTimer,
    clearTimer,
    countPendingTimers,
    advanceTime,
  };
}

function flushMicrotasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// 3.1 up at start → never shown
{
  const clock = createFakeClock();
  let noticeVisible = false;
  const monitor = createStatusMonitor({
    check: async () => 'up',
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { noticeVisible = visible; },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();

  assert.equal(noticeVisible, false, 'Notice must not be shown on up at start');
  assert.equal(clock.countPendingTimers(), 1, 'Should have 1 scheduled timer for next poll');

  await clock.advanceTime(60000);
  assert.equal(noticeVisible, false, 'Notice must stay hidden after next poll is up');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0, 'No timers remain after stop');
}

// 3.2 down→down → shown only after the 10 s confirm
{
  const clock = createFakeClock();
  const changes = [];
  let checkCount = 0;
  const monitor = createStatusMonitor({
    check: async () => {
      checkCount++;
      return 'down';
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { changes.push({ time: clock.getTime(), visible }); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();

  assert.equal(checkCount, 1, 'Initial check was executed');
  assert.equal(changes.length, 0, 'Notice must not be shown on first down blip');
  assert.equal(clock.countPendingTimers(), 1, 'Retry timer scheduled');

  await clock.advanceTime(9999);
  assert.equal(changes.length, 0, 'Notice still not shown before 10s');

  await clock.advanceTime(1);
  assert.equal(checkCount, 2, 'Confirm check was executed');
  assert.equal(changes.length, 1, 'Notice should now be shown');
  assert.deepEqual(changes[0], { time: 10000, visible: true }, 'Shown at 10s mark');
  assert.equal(clock.countPendingTimers(), 1, 'Scheduled 60s poll while shown');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0, 'No timers after stop');
}

// 3.3 shown then up → hidden
{
  const clock = createFakeClock();
  const changes = [];
  let status = 'down';
  const monitor = createStatusMonitor({
    check: async () => status,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { changes.push({ time: clock.getTime(), visible }); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();
  await clock.advanceTime(10000);
  assert.deepEqual(changes, [{ time: 10000, visible: true }], 'Notice shown after confirm');

  status = 'up';
  await clock.advanceTime(60000);
  assert.equal(changes.length, 2);
  assert.deepEqual(changes[1], { time: 70000, visible: false }, 'Notice hidden when check returns up');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0);
}

// 3.4 down→up → never shown
{
  const clock = createFakeClock();
  const changes = [];
  let call = 0;
  const monitor = createStatusMonitor({
    check: async () => {
      call++;
      return call === 1 ? 'down' : 'up';
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { changes.push(visible); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();
  assert.equal(changes.length, 0, 'First blip does not show notice');

  await clock.advanceTime(10000);
  assert.equal(changes.length, 0, 'Notice was never shown because 2nd check was up');
  assert.equal(clock.countPendingTimers(), 1, 'Scheduled 60s poll');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0);
}

// 3.5 hidden → no timers fire, visible → an immediate check
{
  const clock = createFakeClock();
  let isTabVisible = false;
  let checkCount = 0;
  const monitor = createStatusMonitor({
    check: async () => {
      checkCount++;
      return 'up';
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => isTabVisible,
    onChange: () => {},
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();
  assert.equal(checkCount, 0, 'No check on start if hidden');
  assert.equal(clock.countPendingTimers(), 0, 'No timers while hidden');

  await clock.advanceTime(100000);
  assert.equal(checkCount, 0, 'No timers fire while hidden');

  isTabVisible = true;
  monitor.onVisibilityChange();
  await flushMicrotasks();
  assert.equal(checkCount, 1, 'Immediate check when tab becomes visible');
  assert.equal(clock.countPendingTimers(), 1, 'Poll timer scheduled after check');

  isTabVisible = false;
  monitor.onVisibilityChange();
  assert.equal(clock.countPendingTimers(), 0, 'Timer cleared when tab becomes hidden');

  monitor.stop();
}

// 3.6 stop() while a check is in flight → its result is ignored and no timer remains
{
  const clock = createFakeClock();
  const d1 = createDeferred();
  const changes = [];
  let checkAborted = false;

  const monitor = createStatusMonitor({
    check: ({ signal }) => {
      signal?.addEventListener('abort', () => { checkAborted = true; });
      return d1.promise;
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { changes.push(visible); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();

  monitor.stop();
  assert.equal(checkAborted, true, 'In-flight check signal aborted on stop');

  d1.resolve('down');
  await flushMicrotasks();

  assert.equal(changes.length, 0, 'Result ignored after stop');
  assert.equal(clock.countPendingTimers(), 0, 'No timers remain');
}

// 3.7 start/stop/start (StrictMode) → exactly one polling chain (count pending timers)
{
  const clock = createFakeClock();
  const d1 = createDeferred();
  const d2 = createDeferred();
  let checkInvocation = 0;
  const changes = [];

  const monitor = createStatusMonitor({
    check: () => {
      checkInvocation++;
      return checkInvocation === 1 ? d1.promise : d2.promise;
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { changes.push(visible); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  monitor.stop();
  monitor.start();
  await flushMicrotasks();

  d1.resolve('down');
  await flushMicrotasks();
  assert.equal(clock.countPendingTimers(), 0, 'Stale check#1 does not schedule a retry timer');
  assert.equal(changes.length, 0, 'Stale check#1 does not trigger onChange');

  d2.resolve('up');
  await flushMicrotasks();
  assert.equal(clock.countPendingTimers(), 1, 'Exactly one polling chain active');
  assert.equal(changes.length, 0, 'Notice not shown for up');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0, 'No timers remain after stop');
}

// 3.8 a visibility change during an in-flight check → the stale result is ignored
{
  const clock = createFakeClock();
  const d1 = createDeferred();
  const changes = [];
  let isTabVisible = true;
  let checkAborted = false;

  const monitor = createStatusMonitor({
    check: ({ signal }) => {
      signal?.addEventListener('abort', () => { checkAborted = true; });
      return d1.promise;
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => isTabVisible,
    onChange: (visible) => { changes.push(visible); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();

  isTabVisible = false;
  monitor.onVisibilityChange();
  assert.equal(checkAborted, true, 'Check aborted when tab hidden');

  d1.resolve('down');
  await flushMicrotasks();

  assert.equal(changes.length, 0, 'Stale check ignored');
  assert.equal(clock.countPendingTimers(), 0, 'No timer scheduled while hidden');

  monitor.stop();
}

// 3.9 unknown at start and throughout → notice never shown
{
  const clock = createFakeClock();
  let noticeVisible = false;
  const monitor = createStatusMonitor({
    check: async () => 'unknown',
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { noticeVisible = visible; },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();

  assert.equal(noticeVisible, false, 'Notice must not be shown on unknown at start');
  assert.equal(clock.countPendingTimers(), 1, 'Should have 1 scheduled timer for next poll');

  await clock.advanceTime(60000);
  assert.equal(noticeVisible, false, 'Notice must stay hidden after next poll is unknown');

  await clock.advanceTime(60000);
  assert.equal(noticeVisible, false, 'Notice must stay hidden after multiple unknown polls');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0, 'No timers remain after stop');
}

// 3.10 shown notice is hidden by an unknown check
{
  const clock = createFakeClock();
  const changes = [];
  let status = 'down';
  const monitor = createStatusMonitor({
    check: async () => status,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { changes.push({ time: clock.getTime(), visible }); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();
  await clock.advanceTime(10000);
  assert.deepEqual(changes, [{ time: 10000, visible: true }], 'Notice shown after confirm');

  status = 'unknown';
  await clock.advanceTime(60000);
  assert.equal(changes.length, 2);
  assert.deepEqual(changes[1], { time: 70000, visible: false }, 'Shown notice must be hidden when check returns unknown');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0);
}

// 3.11 down then unknown on confirm retry → never shown
{
  const clock = createFakeClock();
  const changes = [];
  let call = 0;
  const monitor = createStatusMonitor({
    check: async () => {
      call++;
      return call === 1 ? 'down' : 'unknown';
    },
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    isVisible: () => true,
    onChange: (visible) => { changes.push(visible); },
    confirmDelayMs: 10000,
    pollMs: 60000,
  });

  monitor.start();
  await flushMicrotasks();
  assert.equal(changes.length, 0, 'First blip does not show notice');

  await clock.advanceTime(10000);
  assert.equal(changes.length, 0, 'Notice was never shown because retry check was unknown');
  assert.equal(clock.countPendingTimers(), 1, 'Scheduled 60s poll');

  monitor.stop();
  assert.equal(clock.countPendingTimers(), 0);
}

console.log('✓ createStatusMonitor timing contract tests passed');

// 4. Source-level checks
// 4.1 src/pages/Home.jsx renders MaintenanceNotice
const homeSource = fs.readFileSync(path.resolve('src/pages/Home.jsx'), 'utf8');
assert.ok(
  /import\s+MaintenanceNotice\s+from\s+['"][^'"]*MaintenanceNotice(\.jsx)?['"]/.test(homeSource),
  'Home.jsx must import MaintenanceNotice'
);
assert.ok(
  /<MaintenanceNotice\b[^>]*\/>/.test(homeSource),
  'Home.jsx must render <MaintenanceNotice />'
);
console.log('✓ Home.jsx renders MaintenanceNotice check passed');

// 4.2 both exact TR and EN texts appear in MaintenanceNotice.jsx
const noticeSource = fs.readFileSync(path.resolve('src/components/MaintenanceNotice.jsx'), 'utf8');

const trTitle = 'Bakım Çalışması';
const trText = 'Hizmetlerimizi size daha iyi sunabilmek için şu anda bakım çalışması yürütüyoruz. Bu süre içinde seslendirme ve deşifre hizmetlerimize erişimde geçici kesintiler yaşanabilir. En kısa sürede yeniden hizmetinizde olacağız; anlayışınız için teşekkür ederiz.';
const enTitle = 'Maintenance in Progress';
const enText = 'We are currently carrying out maintenance to serve you better. Text-to-speech and transcription services may be temporarily unavailable during this time. We will be back at your service as soon as possible. Thank you for your understanding.';

assert.ok(noticeSource.includes(trTitle), 'MaintenanceNotice.jsx must contain exact TR title');
assert.ok(noticeSource.includes(trText), 'MaintenanceNotice.jsx must contain exact TR text');
assert.ok(noticeSource.includes(enTitle), 'MaintenanceNotice.jsx must contain exact EN title');
assert.ok(noticeSource.includes(enText), 'MaintenanceNotice.jsx must contain exact EN text');
assert.ok(noticeSource.includes('role="status"') || noticeSource.includes("role='status'"), 'MaintenanceNotice.jsx must have role="status"');
assert.ok(noticeSource.includes('aria-live="polite"') || noticeSource.includes("aria-live='polite'"), 'MaintenanceNotice.jsx must have aria-live="polite"');

console.log('✓ MaintenanceNotice.jsx copy and accessibility check passed');

// 4.3 src/lib/serviceStatus.js contains no /api/v1/ready
const serviceStatusSource = fs.readFileSync(path.resolve('src/lib/serviceStatus.js'), 'utf8');
assert.ok(
  !serviceStatusSource.includes('/api/v1/ready'),
  'src/lib/serviceStatus.js must not contain /api/v1/ready anywhere'
);
console.log('✓ src/lib/serviceStatus.js contains no /api/v1/ready check passed');

// 4.4 vite.config.js proxies ^/ready$
const viteConfigSource = fs.readFileSync(path.resolve('vite.config.js'), 'utf8');
assert.ok(
  /'\^\\\/ready\$'|"\^\\\/ready\$"|'\^\/ready\$'|"\^\/ready\$"/.test(viteConfigSource),
  'vite.config.js must proxy ^/ready$'
);
console.log('✓ vite.config.js proxies ^/ready$ check passed');

console.log('All service status and maintenance notice tests passed successfully!');
