import Comment, { associate as associateComment } from './comment';
import Hashtag, { associate as associateHashtag } from './hashtag';
import Image, { associate as associateImage } from './image';
import Post, { associate as associatePost } from './post';
import User, { associate as associateUser } from './user';
export * from './sequelize';
const db = {
  Post,
  Comment,
  Hashtag,
  Image,
  User,
};
export type dbType = typeof db;
associateUser(db);
associateComment(db);
associateHashtag(db);
associateImage(db);
associatePost(db);
