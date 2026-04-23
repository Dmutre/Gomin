export const ROUND_ROBIN_SERVICE_CONFIG = JSON.stringify({
  loadBalancingConfig: [{ round_robin: {} }],
});

export function toDnsUrl(url: string): string {
  return url.startsWith('dns:///') ? url : `dns:///${url}`;
}
