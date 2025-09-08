import jwt, { SignOptions } from "jsonwebtoken";
import { JWTPayload } from "../types";

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
};

const getJWTRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }
  return secret;
};

export const generateToken = (
  payload: Omit<JWTPayload, "iat" | "exp">
): string => {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: "7d" });
};

export const generateRefreshToken = (
  payload: Omit<JWTPayload, "iat" | "exp">
): string => {
  return jwt.sign(payload, getJWTRefreshSecret(), { expiresIn: "30d" });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, getJWTSecret()) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, getJWTRefreshSecret()) as JWTPayload;
};

export const generateTokens = (payload: Omit<JWTPayload, "iat" | "exp">) => {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
