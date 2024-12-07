import { Model, DataTypes } from 'sequelize';
import { db } from '../config';

class User extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public address!: string;
  public medicalHistory!: string;
  public role!: 'user' | 'doctor' | 'admin';
  public notification!: Array<{ type: string; message: string; onClickPath: string }>;
  public seenNotification!: Array<{ type: string; message: string; onClickPath: string }>;
  public isAdmin!: boolean;
  public isDoctor!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    medicalHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('medicalHistory');
        return value ? JSON.parse(value) : null;
      },
      set(value: any) {
        if (Array.isArray(value)) {
          this.setDataValue('medicalHistory', JSON.stringify(value));
        } else if (typeof value === 'object') {
          this.setDataValue('medicalHistory', JSON.stringify(value));
        } else {
          this.setDataValue('medicalHistory', value);
        }
      },
    },
    role: {
      type: DataTypes.ENUM('user', 'doctor', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    notification: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    seenNotification: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isDoctor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
    modelName: 'User',
    tableName: 'users',
  }
);

export default User;
