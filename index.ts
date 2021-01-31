import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import dotenv from 'dotenv';
import passport from 'passport';
import hpp from 'hpp';
import helmet from 'helmet';

dotenv.config();
const prod = process.env.NODE_ENV === 'production';
const app = express();
app.set('port', prod ? process.env.PORT : 3065);

if (prod) {
  app.use(hpp());
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(cors({ origin: /nodebird\.com$/, credentials: true }));
} else {
  app.use(morgan('dev'));
  app.use(cors({ origin: true, credentials: true }));
}
app.use('/', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET as string,
    cookie: {
      httpOnly: true,
      secure: false, // https -> true
      domain: prod ? '.wongeun.com' : undefined,
    },
    name: 'rnbck',
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.send('react node');
});

app.listen(8000, () => {
  console.log(`server is running on ${8000}`);
});
