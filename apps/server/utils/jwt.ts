require("dotenv").config();
import { Response } from "express";
import { redis } from "./redis";
import { User } from "@prisma/client";
import { SignAccessToken, SignRefreshToken } from "./SignTokens";

interface TokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure: boolean;
}

export const sendToken = (user: User, statusCode: number, res: Response) => {
  const accessToken = SignAccessToken(user.id);
  const refreshToken = SignRefreshToken(user.id);

  redis.set(user.id, JSON.stringify(user as any));

  const accessTokenExpire = parseInt(
    process.env.ACCESS_TOKEN_EXPIRE || "300",
    10
  );
  const refreshTokenExpire = parseInt(
    process.env.REFRESH_TOKEN_EXPIRES || "1200",
    10
  );

  const accessTokenOptions: TokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 1000),
    maxAge: accessTokenExpire * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  };

  const refreshTokenOptions: TokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 1000),
    maxAge: refreshTokenExpire * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  };

  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
  }

  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", refreshToken, refreshTokenOptions);

  return res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
