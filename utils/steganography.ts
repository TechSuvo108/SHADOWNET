/**
 * Simple Symmetric Encryption (XOR with Passphrase)
 * In a real production environment, use WebCrypto API (AES-GCM).
 */
const crypt = (text: string, passphrase?: string): string => {
  if (!passphrase) return text;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(text.charCodeAt(i) ^ passphrase.charCodeAt(i % passphrase.length));
  }
  return out;
};

const MAGIC_HEADER = "SN_V2:";

interface SecurePayload {
  m: string; // real message (encrypted with magic header)
  d?: string; // fake/decoy message (plain)
  s?: boolean; // self-destruct flag
  a?: boolean; // anonymous flag
}

/**
 * Encodes a secure payload into an image.
 */
export const encodeMessage = (
  imageSrc: string, 
  message: string, 
  passphrase?: string, 
  decoy?: string, 
  selfDestruct: boolean = false,
  anonymous: boolean = false
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Canvas context failed"));
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Add magic header to message for verification during decode
      const payloadObj: SecurePayload = {
        m: crypt(MAGIC_HEADER + message, passphrase),
        d: decoy,
        s: selfDestruct,
        a: anonymous
      };

      const payloadStr = JSON.stringify(payloadObj);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(payloadStr);
      const length = bytes.length;

      const requiredBits = (4 + length) * 8;
      const availableBits = (canvas.width * canvas.height) * 3;

      if (requiredBits > availableBits) {
        return reject(new Error("Image capacity exceeded. Choose a larger carrier."));
      }

      let bitIdx = 0;
      const setBit = (idx: number, bit: number) => {
        if (bit) data[idx] |= 1; else data[idx] &= ~1;
      };

      // 1. Encode Length (32 bits)
      for (let i = 0; i < 32; i++) {
        const bit = (length >> i) & 1;
        setBit(Math.floor(bitIdx / 3) * 4 + (bitIdx % 3), bit);
        bitIdx++;
      }

      // 2. Encode JSON Payload
      for (let i = 0; i < length; i++) {
        const byte = bytes[i];
        for (let b = 0; b < 8; b++) {
          const bit = (byte >> b) & 1;
          setBit(Math.floor(bitIdx / 3) * 4 + (bitIdx % 3), bit);
          bitIdx++;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageSrc;
    img.onerror = () => reject(new Error("Image failed to load"));
  });
};

export interface DecodedResult {
  message: string;
  isDecoy: boolean;
  selfDestruct: boolean;
  anonymous: boolean;
}

/**
 * Decodes and decrypts a secure payload.
 */
export const decodeMessage = (imageSrc: string, passphrase?: string): Promise<DecodedResult | null> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Context failed"));
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let bitIdx = 0;
      const getBit = (idx: number) => data[idx] & 1;

      // 1. Decode Length
      let length = 0;
      for (let i = 0; i < 32; i++) {
        length |= (getBit(Math.floor(bitIdx / 3) * 4 + (bitIdx % 3)) << i);
        bitIdx++;
      }

      if (length <= 0 || length > 2000000) return resolve(null);

      // 2. Decode Payload
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        let byte = 0;
        for (let b = 0; b < 8; b++) {
          byte |= (getBit(Math.floor(bitIdx / 3) * 4 + (bitIdx % 3)) << b);
          bitIdx++;
        }
        bytes[i] = byte;
      }

      try {
        const payloadStr = new TextDecoder().decode(bytes);
        const payload: SecurePayload = JSON.parse(payloadStr);
        
        // Decryption logic
        let decrypted = crypt(payload.m, passphrase);
        let message = "";
        let isDecoy = false;

        // Verification logic
        if (decrypted.startsWith(MAGIC_HEADER)) {
          // Success: Correct key
          message = decrypted.substring(MAGIC_HEADER.length);
          isDecoy = false;
        } else {
          // Failure: Incorrect key or no key
          message = payload.d || "[ENCRYPTED_SIGNAL_NO_DECOY]";
          isDecoy = true;
        }

        resolve({
          message,
          isDecoy,
          selfDestruct: !!payload.s,
          anonymous: !!payload.a
        });
      } catch {
        resolve(null);
      }
    };
    img.src = imageSrc;
    img.onerror = () => reject(new Error("Image error"));
  });
};