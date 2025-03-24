import * as QRCode from "qrcode";

export class QRCodeUtils {
  static async generateQRCodeFromUrl(url: string): Promise<string> {
    const qrcode = await QRCode.toDataURL(url);
    return qrcode;
  }
}
