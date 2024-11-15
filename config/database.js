import pg from "pg";
import dotenv from 'dotenv';

await dotenv.config();

const {Client} = pg;

export const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

await client.connect().then(() => {
    console.log("Connected to database");
}).catch((err) => {
    console.log(err);
});
