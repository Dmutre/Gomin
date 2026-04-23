export const GRPC_ROUND_ROBIN_OPTIONS = {
  'grpc.service_config': JSON.stringify({
    loadBalancingConfig: [{ round_robin: {} }],
  }),
};

export function toDnsUrl(url: string): string {
  return url.startsWith('dns:///') ? url : `dns:///${url}`;
}
