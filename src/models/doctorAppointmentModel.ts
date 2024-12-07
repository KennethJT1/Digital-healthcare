import { Model, DataTypes } from "sequelize";
import { db } from "../config";

class Appointment extends Model {
  public id!: string;
  public userId!: string;
  public doctorId!: string;
  public userInfo!: any;
  public doctorInfo!: any;
  public status!: string;
  public testType!: string[];
  public date!: Date;
  public time!: Date;
  public createdAt!: Date;
  public updatedAt!: Date;
}

Appointment.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    doctorInfo: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending",
    },
    testType: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: "Appointment",
    tableName: "appointments",
  }
);

export default Appointment;
