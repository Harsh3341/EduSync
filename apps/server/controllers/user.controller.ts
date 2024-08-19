require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import { RegisterUser, ActivateUser } from "../types";
import path from "path";
import sendMail from "../utils/sendMail";
import { encrypt } from "../utils/encrypt";

const prisma = new PrismaClient();

export const registerUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { success } = RegisterUser.safeParse(req.body);

      if (!success) {
        res.status(400).json({
          success: false,
          message: "Invalid data",
        });
        return;
      }

      const { name, email, password }: RegisterUser = req.body;

      const isEmailExist = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const activationToken = createActivationToken({ name, email, password });

      const activationCode = activationToken.activationCode;

      const data = { user: { name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activationMail.ejs"),
        data
      );

      try {
        await sendMail({
          email,
          subject: "Account Activation",
          template: "activationMail",
          data,
        });

        res.status(201).json({
          success: true,
          message: "Account activation email has been sent",
          activationToken: activationToken.token,
        });
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { success } = ActivateUser.safeParse(req.body);

      if (!success) {
        return next(new ErrorHandler("Invalid data", 400));
      }

      const { activationToken, activationCode }: ActivateUser = req.body;

      const newUser = jwt.verify(
        activationToken,
        process.env.JWT_SECRET as Secret
      ) as { user: RegisterUser; activationCode: string };

      if (newUser.activationCode !== activationCode) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;

      const encryptedPassword = await encrypt(password);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: encryptedPassword,
        },
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface ActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: RegisterUser): ActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: "10m",
    }
  );

  return { token, activationCode };
};
