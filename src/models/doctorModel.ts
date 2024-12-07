import { Model, DataTypes } from "sequelize";
import { db } from "../config";

class Doctor extends Model {
  public id!: string;
  public userId!: string;
  public firstName!: string;
  public lastName!: string;
  public phone!: string;
  public email!: string;
  public website!: string | null;
  public address!: string;
  public specialization!: any;
  public experience!: string;
  public feesPerConsultation!: number;
  public status!: string;
  public timings!: any;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Doctor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Must be a valid email",
        },
      },
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    specialization: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    experience: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    feesPerConsultation: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    timings: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: "Doctor",
    tableName: "doctors",
    timestamps: true,
  }
);

export default Doctor;
