import healthData from '../data/health-status.json';
import type { HealthStatus } from '../types';

export function useHealthStatus(): HealthStatus {
  return healthData as HealthStatus;
}
