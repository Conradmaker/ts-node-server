import { Sequelize } from 'sequelize';
import config from '../config/config';

type envTypes = 'production' | 'test' | 'development';
const env = (process.env.NODE_ENV as envTypes) || 'development';

const { database, username, password } = config[env];
const sequelize = new Sequelize(database, username, password);
export { sequelize };
export default sequelize;
