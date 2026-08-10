import { PaymentResultStatus } from './checkout';

export interface DatabaseProject {
  id: string;
  user_id: string;
  name: string;
  environment: string;
  created_at: string;
}

export interface DatabaseTestCase {
  id: string;
  project_id: string;
  name: string;
  description: string;
  provider: string;
  expected_result: PaymentResultStatus;
  test_reference: string;
  created_at: string;
}

export interface DatabaseTestSession {
  id: string;
  project_id: string;
  started_at: string;
  finished_at?: string;
  status: string;
}

export interface DatabaseTestResult {
  id: string;
  session_id: string;
  test_case_id: string;
  result: PaymentResultStatus;
  duration_ms: number;
  error_code?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface DatabaseAuthorizedDomain {
  id: string;
  project_id: string;
  domain: string;
  enabled: boolean;
  created_at: string;
}
