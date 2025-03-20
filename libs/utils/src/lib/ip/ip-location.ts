import * as geoip from 'geoip-lite';

export class IPLocationService {
  static getUserLocation(ipAddress: string) {
    const geo = geoip.lookup(ipAddress);
    return geo;
  }
}