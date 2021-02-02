import express from 'express';
import Sequelize from 'sequelize/types';
import Hashtag from '../models/hashtag';
import Image from '../models/image';
import Post from '../models/post';
import User from '../models/user';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    let where = {};
    if (parseInt(req.query.lastId as string)) {
      where = {
        id: {
          [Sequelize.Op.lt]: parseInt(req.query.lastId as string),
        },
      };
    }

    const posts = await Post.findAll({
      where,
      include: [
        {
          model: Hashtag,
          where: { name: decodeURIComponent(req.params.tag as string) },
        },
        {
          model: User,
          attributes: ['id', 'nickname'],
        },
        {
          model: Image,
        },
        {
          model: User,
          as: 'Likers',
          attributes: ['id'],
        },
        {
          model: Post,
          as: 'Retweet',
          include: [
            { model: User, attributes: ['id', 'nickname'] },
            { model: Image },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(req.query.limit as string),
    });
    res.status(200).json(posts);
  } catch (e) {
    console.error(e);
    next(e);
  }
});
export default router;
