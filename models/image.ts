import { DataTypes, Model } from 'sequelize/types';
import { dbType } from '.';
import sequelize from './sequelize';

class Image extends Model {
  public readonly id!: number;
  public src!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Image.init(
  {
    src: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Image',
    tableName: 'image',
    charset: 'utf8',
    collate: 'utf8_general_ci',
  }
);

export const associate = (db: dbType): void => {};

export default Image;
