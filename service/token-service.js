import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { client } from '../config/database.js';

dotenv.config();

export class TokenService {
    static generateTokens(payload){
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: '30m'});
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '30d'});
        return {
            accessToken,
            refreshToken
        }
    }

    static async validateAccessToken(token){
        try {
            const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            return userData;
        } catch (err) {
            return null;
        }
    }

    static async validateRefreshToken(token){
        try {
            const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
            return userData;
        } catch (err) {
            return null;
        }
    }

    static async findToken(refreshToken){
        const tokenData = await client.query('SELECT * FROM token WHERE token = $1', [refreshToken]);
        if(tokenData.rows.length > 0) {
            return tokenData;
        } else {
            return false;
        }
    }

    static async saveToken(userID, refreshToken){
        const tokenData = await client.query('SELECT * FROM token WHERE user_id = $1', [userID]);

        if (tokenData.rows.length > 0) {
            await client.query('UPDATE token SET token = $1 WHERE user_id = $2', [refreshToken, userID]);
        } else {
            await client.query('INSERT INTO token (user_id, token) VALUES ($1, $2)', [userID, refreshToken]);
        }
    }

    static async removeToken(refreshToken){
        await client.query('delete from token where token = $1', [refreshToken]);
        console.log('Refresh token deleted');
    }
}