import User from '../models/user';

//export {}
// declare global {
//   namespace Express {
//     interface Request {
//       user?: User;
//     }
//   }
// }

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}
