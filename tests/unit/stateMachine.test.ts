import { describe, it, expect } from 'vitest';
import { SessionManager } from '../../src/background/sessionManager';

describe('SessionManager runner state machine', () => {
  it('initializes in IDLE state', () => {
    const sm = new SessionManager();
    expect(sm.getState().state).toBe('IDLE');
  });

  it('updates allowed domains correctly', () => {
    const sm = new SessionManager();
    sm.setAllowedDomains(['localhost', 'staging.app.com']);
    expect(sm.getState().allowedDomains).toContain('staging.app.com');
  });

  it('transitions to STOPPED when user stops session', () => {
    const sm = new SessionManager();
    sm.stopSession();
    expect(sm.getState().state).toBe('STOPPED');
  });

  it('transitions state correctly upon detecting payment results', () => {
    const sm = new SessionManager();
    sm.handleResultDetected('SUCCESS', 1200);
    expect(sm.getState().state).toBe('SUCCESS');
    expect(sm.getState().elapsedMs).toBe(1200);

    sm.handleResultDetected('DECLINED', 800);
    expect(sm.getState().state).toBe('EXPECTED_DECLINE');
  });
});
