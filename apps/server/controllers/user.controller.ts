require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import { PrismaClient, User } from "@prisma/client";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import jwt, { Secret } from "jsonwebtoken";
import ejs from "ejs";
import { RegisterUser, ActivateUser, LoginUser } from "../types";
import path from "path";
import sendMail from "../utils/sendMail";
import { compare, encrypt } from "../utils/encrypt";
import { sendToken } from "../utils/jwt";

const prisma = new PrismaClient();

export const registerUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { success } = RegisterUser.safeParse(req.body);

      if (!success) {
        return next(new ErrorHandler("Invalid data", 400));
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

export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { success } = LoginUser.safeParse(req.body);

      if (!success) {
        return next(new ErrorHandler("Invalid data", 400));
      }

      const { email, password }: LoginUser = req.body;

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          passwordHash: true,
        },
      });

      if (!user) {
        return next(new ErrorHandler("Invalid credentials", 400));
      }

      const isPasswordMatch = await compare({
        password,
        passwordHash: user.passwordHash,
      });

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid credentials", 400));
      }

      sendToken(user as User, 200, res);
    } catch (error) {}
  }
);

export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("accessToken", "", { maxAge: 1 });
      res.cookie("refreshToken", "", { maxAge: 1 });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
