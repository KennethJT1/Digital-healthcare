import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken'; 
import Doctor from '../models/doctorModel';
import Appointment from '../models/doctorAppointmentModel';
import { updateDoctorSchema } from '../utils/validation';


export const doctorInfo = async (req: JwtPayload, res: Response): Promise<any> => {
  try {
    const doctor = await Doctor.findOne({ where: { userId: req.user } });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor info fetched successfully",
      data: doctor,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Error fetching doctor info: ${error.message}`,
    });
  }
};

export const updateInfo = async (req: JwtPayload, res: Response): Promise<any> => {
  const { error, value } = updateDoctorSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ 
      errors: error.details.map((err:any) => err.message)
    });
  }

  try {
    const { firstName, lastName, phone, email, website, address, specialization, experience, feesPerConsultation, status, timings } = value;

    const doctor = await Doctor.findOne({ where: { userId: req.user } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (email && email !== doctor.email) {
      const existingDoctor = await Doctor.findOne({ where: { email } });
      if (existingDoctor) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    doctor.firstName = firstName || doctor.firstName;
    doctor.lastName = lastName || doctor.lastName;
    doctor.phone = phone || doctor.phone;
    doctor.email = email || doctor.email;
    doctor.website = website || doctor.website;
    doctor.address = address || doctor.address;
    doctor.specialization = specialization || doctor.specialization;
    doctor.experience = experience || doctor.experience;
    doctor.feesPerConsultation = feesPerConsultation || doctor.feesPerConsultation;
    doctor.status = status || doctor.status;
    doctor.timings = timings || doctor.timings;

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "Doctor info updated successfully",
      data: doctor,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Error updating doctor info: ${err.message}`,
    });
  }
};


// export const updateInfo = async (req: JwtPayload, res: Response): Promise<any> => {
//   try {
//     const [updatedRows, updatedDoctor] = await Doctor.update(req.body, {
//       where: { userId: req.user },
//       returning: true, 
//     });

//     if (updatedRows === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Doctor not found or no changes made",
//       });
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Doctor info updated successfully",
//       data: updatedDoctor[0],
//     });
//   } catch (error: any) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: `Error updating doctor info: ${error.message}`,
//     });
//   }
// };

export const appointDoctor = async (req: JwtPayload, res: Response): Promise<any> => {
  try {
    const doctor = await Doctor.findOne({ where: { userId: req.user } });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const appointments = await Appointment.findAll({
      where: { doctorId: doctor.id },
    });

    return res.status(200).json({
      success: true,
      message: "Doctor appointments fetched successfully",
      counts: appointments.length,
      data: appointments,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: `Error fetching doctor appointments: ${error.message}`,
    });
  }
};
