import {
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  DataTypes,
  Model,
} from 'sequelize/types';
import { dbType } from '.';
import Hashtag from './hashtag';
import Image from './image';
import sequelize from './sequelize';
import User from './user';

class Post extends Model {
  public readonly id!: number;
  public content!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public UserId!: number;
  public readonly Retweet?: Post;
  public RetweetId?: number;

  public addHashtags!: BelongsToManyAddAssociationsMixin<Hashtag, number>;
  public addImages!: BelongsToManyAddAssociationsMixin<Image, number>;
  public addImage!: BelongsToManyAddAssociationMixin<Image, number>;
  public addLiker!: BelongsToManyAddAssociationMixin<User, number>;
  public removeLiker!: BelongsToManyRemoveAssociationMixin<User, number>;
}

Post.init(
  {
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Post',
    tableName: 'post',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  }
);
export const associate = (db: dbType): void => {
  db.Post.belongsTo(db.User);
  db.Post.hasMany(db.Comment);
  db.Post.hasMany(db.Image);
  db.Post.belongsTo(db.Post, { as: 'Retweet' });
  db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
  db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' });
};

export default Post;
