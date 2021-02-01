import passport from 'passport';
import User from '../../models/user';

function isUser(target: Express.User | User): target is User {
  return (target as User).id !== undefined;
}
export default (): void => {
  passport.serializeUser((user: Express.User | User, done) => {
    if (!isUser(user)) return null;
    done(null, user.id);
  });

  passport.deserializeUser<number>(async (id, done) => {
    try {
      const user = await User.findOne({
        where: { id },
      });
      return done(null, user as User);
    } catch (e) {
      console.error(e);
      return done(e);
    }
  });

  local();
};
