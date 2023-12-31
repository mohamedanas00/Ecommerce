import userModel from "../../../../DB/models/user.model.js";
import { ErrorClass } from "../../../utils/errorClass.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import CryptoJS from "crypto-js";
import { hash, compare } from "../../../utils/hashing.js";
import { StatusCodes } from "http-status-codes";
import { sendEmail, emailHtml } from "../../../utils/email.js";
import { nanoid } from "nanoid";
import { generateToken } from "../../../utils/generateAndVerifyToken.js";
import cartModel from "../../../../DB/models/cart.model.js";
import { logIn } from "../../../utils/logInHelper.js";
// import {OAuth2Client} from 'google-auth-library';
// const client = new OAuth2Client();

export const signUp = asyncHandler(async (req, res, next) => {
  const isEmailExist = await userModel.findOne({ email: req.body.email });
  if (isEmailExist) {
    return next(
      new ErrorClass(
        `This email:"${req.body.email}" Already Exist!`,
        StatusCodes.CONFLICT
      )
    );
  }
  if (req.body.phone) {
    req.body.phone = CryptoJS.AES.encrypt(
      req.body.phone,
      process.env.encrypt_key
    ).toString();
  }
  if (req.body.password != req.body.cPassword) {
    return next(
      new ErrorClass(`Please check your cPassword`, StatusCodes.CONFLICT)
    );
  }
  req.body.password = hash(req.body.password);
  const code = nanoid(4);
  req.body.confirmCode = code;
  const html = emailHtml(code);
  //*sendEmail({ to: req.body.email, subject: "Confirm Email", html })
  const user = await userModel.create(req.body);
  if (user.role == "user") {
    await cartModel.create({ userId: user._id });
  }
  return res.status(StatusCodes.CREATED).json({ message: "Done", user });
});

export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { email, code } = req.body;
  const isEmailExist = await userModel.findOne({ email });
  if (!isEmailExist) {
    return next(
      new ErrorClass(`This email:"${email}" Not Found!`, StatusCodes.NOT_FOUND)
    );
  }
  if (isEmailExist.confirmEmail) {
    return next(
      new ErrorClass(`Email Already Confirmed!`, StatusCodes.NOT_ACCEPTABLE)
    );
  }
  if (code != isEmailExist.confirmCode) {
    return next(new ErrorClass(`In-Valid code`, StatusCodes.BAD_REQUEST));
  }
  const newCode = nanoid(4);
  await userModel.updateOne(
    { email },
    { confirmEmail: true, confirmCode: newCode }
  );
  return res.status(StatusCodes.ACCEPTED).json({ message: "Done" });
});

export const adminLogIn = logIn("admin");

export const userLogIn = logIn("user");

export const sendCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const isEmailExist = await userModel.findOne({ email });
  if (!isEmailExist) {
    return next(new ErrorClass(`This user not Exist!`, StatusCodes.NOT_FOUND));
  }
  const code = nanoid(4);
  const html = emailHtml(code);
  sendEmail({ to: email, subject: "Confirm Email", html });
  await userModel.updateOne(
    { email },
    {
      confirmCode: code,
    }
  );
  return res.status(StatusCodes.ACCEPTED).json({ message: "Done", code });
});

export const restPassword = asyncHandler(async (req, res, next) => {
  let { email, code, password } = req.body;
  const isEmailExist = await userModel.findOne({ email });
  if (!isEmailExist) {
    return next(new ErrorClass(`This user not Exist!`, StatusCodes.NOT_FOUND));
  }
  if (code != isEmailExist.confirmCode) {
    return next(new ErrorClass(`In-Valid code`, StatusCodes.BAD_REQUEST));
  }
  password = hash(password);
  const newCode = nanoid(4);
  await userModel.updateOne(
    { email },
    {
      password,
      confirmCode: newCode,
    }
  );
  return res.status(StatusCodes.ACCEPTED).json({ message: "Done" });
});

// export const socialLogin =asyncHandler( async (req,res,next)=>{
//     const {idToken} =req.body
//     console.log({message:idToken});

//     const ticket = await client.verifyIdToken({
//         idToken,
//         audience:process.env.Client_ID,
//     })
//     console.log("🚨🚨🚨🚨🚨");
//     const {email , name } =ticket.getPayload();
//     const isExist = await userModel.findOne({email})
//     if(!isExist){
//         const newUser =new userModel({
//             name,
//             email,
//             password:nanoid(6),
//             confirmEmail:true,
//             provider:'google',
//         })
//         await newUser.save()
//         await cartModel.create({userId: newUser._id})
//         const payload = {
//             id: newUser._id,
//             email: newUser.email
//         }
//         const token = generateToken(payload)
//         return res.status(StatusCodes.CREATED).json({message:"done",Token:token})
//     }else if(isExist && isExist.provider == 'google'){
//         const payload = {
//             id: isExist._id,
//             email: isExist.email
//         }
//         const token = generateToken(payload)
//         return res.status(StatusCodes.OK).json({message:"done",Token:token})
//     }else if(isExist&& isExist.provider == 'system' ){
//         return next(new ErrorClass('Please use system login'),StatusCodes.CONFLICT)
//     }
//     return next(new ErrorClass('Please SignUp in Google First Or using system SignUp!'),StatusCodes.CONFLICT)

// })
