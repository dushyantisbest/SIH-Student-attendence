import crypto from "crypto";
import QRCode from "qrcode";
import { QRData } from "../types";

const QR_SECRET = process.env.JWT_SECRET || "default-secret";
const QR_EXPIRE_SECONDS = parseInt(process.env.QR_CODE_EXPIRE_SECONDS || "20");

export const generateQRSecret = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateQRData = (sessionId: string, secret: string): QRData => {
  const timestamp = Date.now();
  const expiresAt = timestamp + QR_EXPIRE_SECONDS * 1000;

  return {
    sessionId,
    timestamp,
    secret,
    expiresAt,
  };
};

export const generateQRCode = async (qrData: QRData | string): Promise<string> => {
  try {
    const qrString = typeof qrData === 'string' ? qrData : JSON.stringify(qrData);
    const qrCode = await QRCode.toDataURL(qrString);
    return qrCode;
  } catch (error) {
    throw new Error("Failed to generate QR code");
  }
};

export const verifyQRData = (
  qrData: QRData,
  expectedSecret: string
): boolean => {
  const now = Date.now();

  // Check if QR code has expired
  if (now > qrData.expiresAt) {
    return false;
  }

  // Check if secret matches
  if (qrData.secret !== expectedSecret) {
    return false;
  }

  // Check if timestamp is not too old (additional security)
  const maxAge = QR_EXPIRE_SECONDS * 1000;
  if (now - qrData.timestamp > maxAge) {
    return false;
  }

  return true;
};

export const createQRPayload = (sessionId: string, secret: string): string => {
  const qrData = generateQRData(sessionId, secret);
  return JSON.stringify(qrData);
};
