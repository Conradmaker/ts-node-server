import express from 'express';
import userRouter from './user';
import postRouter from './post';
import postsRouter from './posts';
import hashtagRouter from './hashtag';

const router = express.Router();

router.use('/users', userRouter);
router.use('/products', postRouter);
router.use('/hashtag', hashtagRouter);
router.use('/posts', postsRouter);
export default router;
