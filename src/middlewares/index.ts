import { JwtPayload, verify } from "jsonwebtoken";
import { Response, NextFunction } from "express";
import Doctor from "../models/doctorModel";
import User from "../models/userModel";

export const AuthSign = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    verify(token, process.env.JWT_SECRET!, (err: any, decode: any) => {
      if (err) {
        return res.status(401).send({
          message: "Not Authorized",
          success: false,
        });
      } else {
        req.user = decode.id;
        next();
      }
    });
  } catch (error: any) {
    console.log(error.message);
    res.status(401).send({
      message: "Authorization Failed, Please login",
      success: false,
    });
  }
};

export const AdminAuthSign = (
  req: JwtPayload,
  res: Response,
  next: NextFunction
): any => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).send({
        message: "Authorization token missing",
        success: false,
      });
    }

    verify(token, process.env.JWT_SECRET!, (err: any, decode: any) => {
      if (err) {
        return res.status(401).send({
          message: "Not Authorized",
          success: false,
        });
      }

      if (decode.role !== "admin") {
        return res.status(403).send({
          message: "Access Denied, Admins only",
          success: false,
        });
      }

      req.user = decode.id;
      next();
    });
  } catch (error: any) {
    console.log(error.message);
    res.status(401).send({
      message: "Authorization Failed, Please login",
      success: false,
    });
  }
};

export const DoctorAuthSign = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Authorization token missing",
        success: false,
      });
    }

    const decoded: any = verify(token, process.env.JWT_SECRET!);

    const userId = decoded.id;

    const doctor = await Doctor.findOne({ where: { id: userId } });
    if (!doctor || doctor.status !== "approved") {
      return res.status(403).json({
        message: "Doctor profile is not approved.",
        success: false,
      });
    }

    req.user = decoded;

    next();
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: "Authorization failed",
      success: false,
    });
  }
};
