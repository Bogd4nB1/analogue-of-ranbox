import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import router from './routes/router.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDB } from './config/initDB.js';
import { client } from './config/database.js';
import path from 'path';
import fs from 'fs';


dotenv.config();
initDB(client);

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

export let total_url = process.env.DEV_URL || null
const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

app.listen(PORT, () => {
  console.log(`Сервер пашет на ${PORT} порте!`);
});

app.use(express.static(path.resolve(__dirname, 'uploads/')));
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(cors());
app.use('/api', router);