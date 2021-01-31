import * as dotenv from 'dotenv-flow';

dotenv.config();
type ConfigType = {
  username: string;
  password: string;
  database: string;
  host: string;
  [key: string]: string;
};
interface IConfigGroup {
  development: ConfigType;
  test: ConfigType;
  production: ConfigType;
}

const config: IConfigGroup = {
  development: {
    username: 'root',
    password: process.env.DB_PASSWORD as string,
    database: 'react-node',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  test: {
    username: 'root',
    password: process.env.DB_PASSWORD as string,
    database: 'react-node',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
  production: {
    username: 'root',
    password: process.env.DB_PASSWORD as string,
    database: 'react-node',
    host: '127.0.0.1',
    dialect: 'mysql',
  },
};

export default config;
