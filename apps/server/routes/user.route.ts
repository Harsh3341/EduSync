import express from "express";
import {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/activate", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", logoutUser);

export default userRouter;
