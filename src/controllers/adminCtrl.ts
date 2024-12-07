import { Request, Response } from "express";
import Doctor from "../models/doctorModel";
import User from "../models/userModel";

export const allUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await User.findAll({});
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      counts: users.length,
      data: users,
    });
  } catch (error: any) {
    console.error(`AllUsers Admin_Controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `AllUsers Admin_Controller: ${error.message}`,
    });
  }
};

export const allDoctors = async (req: Request, res: Response): Promise<any> => {
  try {
    const doctors = await Doctor.findAll({});
    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      counts: doctors.length,
      data: doctors,
    });
  } catch (error: any) {
    console.error(`AllDoctors Admin_Controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `AllDoctors Admin_Controller: ${error.message}`,
    });
  }
};

export const changeAccountStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { doctorId, status } = req.body;

    const doctor = await Doctor.findOne({ where: { id: doctorId } });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    if (doctor.status === "approved") {
      return res.status(404).json({
        success: false,
        message: "Doctor has been approved already",
      });
    }

    if (status === "rejected") {
      await doctor.destroy();
      const user = await User.findOne({ where: { id: doctor.userId } });
      if (user) {
        const notification = user.notification || [];
        notification.push({
          type: "doctor-account-request-rejected",
          message: `Your doctor account has been rejected.`,
          onClickPath: "/notification",
        });

        user.notification = notification;
        await user.save();
      }
      return res.status(200).json({
        success: true,
        message: "Doctor account has been rejected and deleted.",
      });
    } else if (status === "approved") {
      doctor.status = "approved";
      await doctor.save();

      const user = await User.findOne({ where: { id: doctor.userId } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const notification = user.notification || [];
      notification.push({
        type: "doctor-account-request-approved",
        message: `Your doctor account has been approved.`,
        onClickPath: "/notification",
      });

      user.notification = notification;
      user.isDoctor = true;
      user.role = "doctor";
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Doctor account has been approved.",
        data: doctor,
      });
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status provided. Status must be either 'approved' or 'rejected'.",
      });
    }
  } catch (error: any) {
    console.error(`ChangeAccountStatus Admin_Controller: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `ChangeAccountStatus Admin_Controller: ${error.message}`,
    });
  }
};
