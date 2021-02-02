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
import Comment from '../models/comment';

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

router.post('/images', upload.array('image'), (req, res) => {
  console.log(req.files);
  // if (Array.isArray(req.files)) {
  res.json(
    (req.files as Express.MulterS3.File[]).map(
      (v: Express.MulterS3.File) => v.location
    )
  );
  // }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname'],
        },
        {
          model: Image,
        },
        { model: User, as: 'Likers', attributes: ['id'] },
      ],
    });
    return res.status(200).json(post);
  } catch (e) {
    console.error(e);
    next(e);
  }
});
router.delete('/:id', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }
    await Post.destroy({ where: { id: req.params.id } });
    return res.send(req.params.id);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }
    const comments = await Comment.findAll({
      where: { PostId: req.params.id },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, attributes: ['id', 'nickname'] }],
    });
    return res.json(comments);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.post('/:id/comment', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }
    const newComment = await Comment.create({
      PostId: post.id,
      UserId: (req.user as User).id,
      content: req.body.content,
    });
    //await post.addComment(newComment.id);
    const comment = await Comment.findOne({
      where: {
        id: newComment.id,
      },
      include: [{ model: User, attributes: ['id', 'nickname'] }],
    });
    return res.json(comment);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.post('/:id/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }
    await post.addLiker((req.user as User).id);
    return res.json({ userId: (req.user as User).id });
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.delete('/:id/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }
    await post.removeLiker((req.user as User).id);
    return res.json({ userId: (req.user as User).id });
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.post('/:id/retweet', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id },
      include: [{ model: Post, as: 'Retweet' }],
    });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }
    if (
      (req.user as User).id === post.UserId ||
      (post.Retweet && post.Retweet.UserId === (req.user as User).id)
    ) {
      return res.status(403).send('자신의 글은 리트위 할 수 없습니다.');
    }
    const retweetTargetId = post.RetweetId || post.id;
    const exPost = await Post.findOne({
      where: { UserId: (req.user as User).id, RetweetId: retweetTargetId },
    });
    if (exPost) {
      return res.status(403).send('이미 리트윗 했습니다.');
    }
    const retweet = await Post.create({
      UserId: (req.user as User).id,
      RetweetId: retweetTargetId,
      content: 'retweet',
    });
    const retweetWithPrevPost = await Post.findOne({
      where: { id: retweet.id },
      include: [
        { model: User, attributes: ['id', 'nickname'] },
        {
          model: Post,
          as: 'Retweet',
          include: [
            { model: User, attributes: ['id', 'nickname'] },
            { model: Image },
          ],
        },
      ],
    });
    return res.json(retweetWithPrevPost);
  } catch (e) {
    console.error(e);
    next(e);
  }
});
export default router;
