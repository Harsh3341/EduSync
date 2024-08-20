require("dotenv").config();
import jwt from "jsonwebtoken";

export const SignAccessToken = (id: string) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN || "");
};

export const SignRefreshToken = (id: string) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN || "");
};
