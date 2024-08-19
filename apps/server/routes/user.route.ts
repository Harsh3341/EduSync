import express from "express";
import { registerUser, activateUser } from "../controllers/user.controller";
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/activate", activateUser);

export default userRouter;
