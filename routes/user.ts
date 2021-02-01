import express from 'express';
import bcrypt from 'bcrypt';
import { isLoggedIn, isNotLoggedIn } from './middleware';
import User from '../models/user';
import passport from 'passport';
import Post from '../models/post';
import Image from '../models/image';

const router = express.Router();

router.get('/', isLoggedIn, (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const user = req.user!.toJSON() as Partial<User>;
  delete user.password;
  return res.json(user);
});

router.post('/', async (req, res, next) => {
  try {
    const exUser = await User.findOne({ where: { userId: req.body.userId } });
    if (exUser) return res.status(403).send('이미 사용중인 아이디입니다.');
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const newUser = await User.create({
      nickname: req.body.nickname,
      userId: req.body.userId,
      password: hashedPassword,
    });
    return res.status(201).json(newUser);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.post('/login', isNotLoggedIn, async (req, res, next) => {
  passport.authenticate(
    'local',
    (err: Error, user: User, info: { message: string }) => {
      if (err) {
        console.error(err);
        return next(err);
      }
      if (info) {
        return res.status(401).send(info.message);
      }
      return req.login(user, async (loginErr: Error) => {
        try {
          if (loginErr) {
            return next(loginErr);
          }
          const fullUser = await User.findOne({
            where: { id: user.id },
            include: [
              { model: Post, as: 'Posts', attributes: ['id'] },
              { model: User, as: 'Followings', attributes: ['id'] },
              { model: User, as: 'Followers', attributes: ['id'] },
            ],
            attributes: ['id', 'nickname', 'userId'],
            //attributes:{exclude:['password']}
          });
          return res.json(fullUser);
        } catch (e) {
          console.error(e);
          return next(e);
        }
      });
    }
  )(req, res, next);
});

router.post('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy(() => {
    res.send('logout 성공');
  });
});

interface IUser extends User {
  PostCount: number;
  FollowingCount: number;
  FollowerCount: number;
}
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: parseInt(req.params.id) },
      include: [
        { model: Post, as: 'Posts', attributes: ['id'] },
        { model: User, as: 'Followings', attributes: ['id'] },
        { model: User, as: 'Followers', attributes: ['id'] },
      ],
    });
    if (!user) {
      return res.status(404).send('no user');
    }
    const jsonUser = user?.toJSON() as IUser;
    jsonUser.PostCount = jsonUser.Posts ? jsonUser.Posts.length : 0;
    jsonUser.FollowingCount = jsonUser.Followings
      ? jsonUser.Followings.length
      : 0;
    jsonUser.FollowerCount = jsonUser.Followers ? jsonUser.Followers.length : 0;
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.get('/:id/followings', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: parseInt(req.params.id) || (req.user && req.user.id) || 0 },
    });
    if (!user) return res.status(404).send('no user');
    const followings = await user.getFollowings({
      attributes: ['id', 'nickname'],
      limit: parseInt(req.query.limit as string),
      offset: parseInt(req.query.offset as string),
    });
    return res.json(followings);
  } catch (e) {
    console.error(e);
    next(e);
  }
});
function isUser(target: User | undefined): target is User {
  return (target as User).id !== undefined;
}
router.get('/:id/follower', isLoggedIn, async (req, res, next) => {
  try {
    if (isUser(req.user)) {
      const me = await User.findOne({
        where: { id: req.user.id },
      });
      await me?.removeFollowers(parseInt(req.params.id));
      res.send(req.params.id);
    } else {
      res.status(404);
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.post('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    if (isUser(req.user)) {
      const me = await User.findOne({
        where: { id: req.user.id },
      });
      await me?.addFollowing(parseInt(req.params.id));
      res.send(req.params.id);
    } else {
      res.status(404);
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.delete('/:id/follow', isLoggedIn, async (req, res, next) => {
  try {
    if (isUser(req.user)) {
      const me = await User.findOne({
        where: { id: req.user.id },
      });
      await me?.removeFollowing(parseInt(req.params.id));
      res.send(req.params.id);
    } else {
      res.status(404);
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.get('/:id/posts', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      where: {
        UserId: parseInt(req.params.id) || (req.user && req.user.id) || 0,
      },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname'],
        },
        { model: Image },
        { model: User, as: 'Likers', attributes: ['id'] },
      ],
    });
    res.json(posts);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

router.patch('/nickname', isLoggedIn, async (req, res, next) => {
  try {
    if (isUser(req.user)) {
      await User.update(
        {
          nickname: req.body.nickname,
        },
        { where: { id: req.user.id } }
      );
      res.send(req.body.nickname);
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
});
export default router;
