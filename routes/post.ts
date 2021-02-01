import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';
import path from 'path';
import { isLoggedIn } from './middleware';
import Post from '../models/post';
import Hashtag from '../models/hashtag';
import Image from '../models/image';
import User from '../models/user';

const router = express.Router();

AWS.config.update({
  region: 'ap-northeast-2',
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});
const upload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: '스토리지 이름',
    key(req, file, cb) {
      cb(null, `original/${+new Date()}${path.basename(file.originalname)}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
});
router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  try {
    const hashtags: string[] = req.body.content.match(/#[^\s]+/g);
    const newPost = await Post.create({
      content: req.body.content,
      UserId: (req.user as User).id,
    });
    if (hashtags) {
      const promises = hashtags.map(tag =>
        Hashtag.findOrCreate({ where: { name: tag.slice(1).toLowerCase() } })
      );
      const result = await Promise.all(promises);
      await newPost.addHashtags(result.map(r => r[0]));
    }

    if (req.body.image) {
      if (Array.isArray(req.body.image)) {
        const promises: Promise<Image>[] = req.body.image.map((image: string) =>
          Image.create({ src: image })
        );
        const images = await Promise.all(promises);
        await newPost.addImages(images);
      } else {
        const image = await Image.create({ src: req.body.image });
        await newPost.addImage(image);
      }
      const fullPost = await Post.findOne({
        where: { id: newPost.id },
        include: [
          { model: User, attributes: ['id', 'nickname'] },
          { model: Image },
          { model: User, as: 'Likers', attributes: ['id'] },
        ],
      });
      return res.status(201).json(fullPost);
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});

export default router;
