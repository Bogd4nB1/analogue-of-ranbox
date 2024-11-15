import { client } from '../config/database.js';
import bcrypt from 'bcrypt';
import { TokenService } from '../service/token-service.js';
import { validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { UserService } from '../service/user-service.js';
import fs from 'fs';

dotenv.config();

export class UserController {
    static async register(req, res) {
        // POST
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }
            const info = await client.query('select email from users where email = $1', [req.body.email]);
            if (info.rows.length == 0) {
                const isUsernameExists = await client.query('select username from users where username = $1', [req.body.username]);
                if (isUsernameExists.rows.length > 0) {
                    return res.json({success: false, message: 'Пользователь с таким именем уже существует'});
                }
                const referralCode = await UserService.generateReferralCode()
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                await client.query('insert into users (email, password, referral_code, username) values ($1, $2, $3, $4)', [req.body.email, hashedPassword, referralCode, req.body.username]);
                console.log('User created');
                const infoUser = await client.query('select id, role from users where email = $1', [req.body.email]);
                const tokens = TokenService.generateTokens({email: req.body.email, id: infoUser.rows[0].id, role: infoUser.rows[0].role});
                await TokenService.saveToken(infoUser.rows[0].id, tokens.refreshToken);
                res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});
                res.json({success: true, 
                        message: 'Пользователь создан',
                        id: infoUser.rows[0].id,
                        email: req.body.email,
                        role: infoUser.rows[0].role,
                        accessToken: tokens.accessToken
                    });
            } else {
                console.log('User already exists');
                res.json({success: false, message: 'Пользователь с таким email уже существует'});
            }
        } catch (err) {
            console.log(err);
            res.json({error: 'Регистрация не удалась. Проверьте введенные данные'});
        }
    }

    static async login(req, res) {
        // POST
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }
            const {email, password} = req.body;
            const user = await client.query('select * from users where email = $1', [email]);
            if (user.rows.length == 0) {
                res.json({success: false, message: 'Пользователь не найден'});
                return;
            }
            const isPassEquals = await bcrypt.compare(password, user.rows[0].password);
            if(!isPassEquals) {
                res.json({success: false, message: 'Неверный пароль'})
                return;
            }
            const tokens = TokenService.generateTokens({email: email, id: user.rows[0].id, role: user.rows[0].role});
            await TokenService.saveToken(user.rows[0].id, tokens.refreshToken);
            res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});
            res.json({success: true, 
                        message: 'Логирование прошло успешно',
                        id: user.rows[0].id,
                        email: email,
                        role: user.rows[0].role,
                        accessToken: tokens.accessToken
                });
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while logging in user'});
        }
    }

    static async logout(req, res) {
        // POST
        try {
            const { refreshToken } = req.cookies;
            await TokenService.removeToken(refreshToken);
            res.clearCookie('refreshToken');
            res.json({success: true, message: 'Вы вышли из аккаунта'});
            // На стороне клиента удалять из хранилища AccessToken
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while logout user'});
        }
    }

    static async refresh(req, res) {
        // Get
        try {
            const { refreshToken } = req.cookies;
            if(!refreshToken) {
                res.json({success: false, message: 'Токен не найден'});
                return;
            }
            const userData = await TokenService.validateRefreshToken(refreshToken);
            const tokenFromDB = await TokenService.findToken(refreshToken);
            if(!tokenFromDB || !userData) {
                return res.json({success: false, message: 'Ошибка при обновлении токена'});
            }
            const user = await client.query('select * from users where id = $1', [tokenFromDB.rows[0].user_id]);
            const tokens = TokenService.generateTokens({email: user.rows[0].email, id: user.rows[0].id, role: user.rows[0].role});
            await TokenService.saveToken(user.rows[0].id, tokens.refreshToken);
            res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});
            res.json({success: true, message: 'Токен обновлен', accessToken: tokens.accessToken});
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while refreshing token'});
        }
    }

    static async getUserInfo(req, res) {
        // GET
        try {
            const user = await client.query('select * from users where id = $1', [req.id]);
            const items_of_user = await client.query(`select item_in_box.name, items_of_user.quantity, item_in_box.price, item_in_box.id, rarity.name as rarity, item_in_box.image_url from items_of_user join item_in_box on items_of_user.item_id = item_in_box.id join rarity on item_in_box.rarity = rarity.id where user_id = $1`, [req.id]);
            res.json({success: true, id: user.rows[0].id, username: user.rows[0].username, email: user.rows[0].email, role: user.rows[0].role, balance: user.rows[0].balance, image_url: user.rows[0].image_url, qty_open_box: user.rows[0].qty_open_box, qty_upgrade: user.rows[0].qty_upgrade, history_balance: user.rows[0].history_balance, referral_code: user.rows[0].referral_code, referred_by: user.rows[0].referred_by, created_at: user.rows[0].created_at, items: items_of_user.rows});
        } catch  (err) {
            console.log(err);
            res.json({success: false, error: 'Error while getting user info'});
        }
    }

    static async soldItem(req, res) {
        // Post
        const { item_id, quantity } = req.body;
        try {
            const item = await client.query(`select items_of_user.quantity, item_in_box.price, item_in_box.id 
                                            from items_of_user 
                                            join item_in_box
                                            on items_of_user.item_id = item_in_box.id
                                            where user_id = $1 and item_id = $2`, [req.id, item_id]);
            if(item.rows[0].quantity < quantity) {
                return res.json({success: false, message: "У вас нет стольких товаров"})
            }
            if(item.rows[0].quantity == quantity){
                const bal = quantity * item.rows[0].price
                await client.query('delete from items_of_user where user_id = $1 and item_id = $2', [req.id, item.rows[0].id]);
                await client.query('update users set balance = balance + $1 where id = $2', [bal, req.id]);
                return res.json({success: true})
            } else {
                const bal = item.rows[0].quantity - quantity;
                await client.query('update items_of_user set quantity = $1 where user_id = $2 and item_id = $3', [bal, req.id, item.rows[0].id]);
                await client.query('update users set balance = balance + $1 where id = $2', [quantity * item.rows[0].price, req.id]);
                return res.json({success: true})
            }
        } catch (err) {
            console.log(err);
            res.json({success: false});
        }
    }

    static async getAchievements(req, res) {
        // GET
        try {
            const achievements = await client.query('select * from achievements where user_id = $1', [req.id]);
            res.json({success: true, achievements: achievements.rows});
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while getting achievements'});
        }
    }

    static async uploadFile(req, res) {
        // POST
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
              }
            const filename = process.env.IMAGE_URL + req.file.filename;
            res.json({ success: true, filename: filename });
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while uploading file'});
        }
    }

    static async getHistoryBalance(req, res) {
        // GET
        try {
            const history_balance = await client.query('select * from history_balance where user_id = $1', [req.id]);
            res.json({success: true, history_balance: history_balance.rows});
        } catch (err ) {
            console.log(err);
            res.json({success: false});
        }
    }

    static async registerWithRef(req, res) {
        // POST
        try {
            const { ref_id } = req.query;
            const isRefId = await client.query('select * from users where referral_code = $1', [ref_id]);
            if (isRefId.rows.length == 0) {
                return res.json({success: false, message: 'Неверный код реферала'});
            }
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }
            const info = await client.query('select email from users where email = $1', [req.body.email]);
            if (info.rows.length == 0) {
                const isUsernameExists = await client.query('select username from users where username = $1', [req.body.username]);
                if (isUsernameExists.rows.length > 0) {
                    return res.json({success: false, message: 'Пользователь с таким именем уже существует'});
                }
                const referralCode = await UserService.generateReferralCode()
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                await client.query('insert into users (email, password, referral_code, username) values ($1, $2, $3, $4)', [req.body.email, hashedPassword, referralCode, req.body.username]);
                console.log('User created');
                await client.query('update users set referred_by = referred_by + 1 where id = $1', [isRefId.rows[0].id]);
                const infoUser = await client.query('select id, role from users where email = $1', [req.body.email]);
                await UserService.createDefaultReferalTable(client, isRefId.rows[0].id); // создание таблицы referal_reward
                const quantity = isRefId.rows[0].referred_by + 1; // количество рефералов
                await UserService.checkReferal(client, isRefId.rows[0].id, quantity); // проверка рефералов
                const tokens = TokenService.generateTokens({email: req.body.email, id: infoUser.rows[0].id, role: infoUser.rows[0].role});
                await TokenService.saveToken(infoUser.rows[0].id, tokens.refreshToken);
                res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});
                res.json({success: true, 
                        message: 'Пользователь создан',
                        id: infoUser.rows[0].id,
                        email: req.body.email,
                        role: infoUser.rows[0].role,
                        accessToken: tokens.accessToken
                    });
            } else {
                console.log('User already exists');
                res.json({success: false, message: 'Пользователь с таким email уже существует'});
            }
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while getting user info'});
        }
    }

    static async checkReferal(req, res) {
        // GET
        try {
            const info = await client.query('select * from referal_reward where user_id = $1', [req.id]);
            res.json({success: true, info: info.rows});
        } catch (err) {
            console.log(err);
            res.json({success: false});
        }
    }

    static async updateUser(req, res) {
        // PUT
        try {
            const { new_username, new_image_url } = req.body;
            if(new_username == null && new_image_url == null) {
                res.status(400).json({success: false, error: 'No data to update'});
                return;
            }
            if(new_username != null) {
                const existingUser = await client.query('SELECT * FROM users WHERE username = $1 AND id != $2', [new_username, req.id]);
                if (existingUser.rows.length > 0) {
                    res.status(400).json({ success: false, error: 'Username already exists' });
                    return;
                }
                await client.query('update users set username = $1 where id = $2', [new_username, req.id]);
            }
            if(new_image_url != null) {
                const old_image_url = await client.query('select image_url from users where id = $1', [req.id]);
                if(old_image_url.rows[0].image_url != null) {
                    const oldImagePath = `uploads/${old_image_url.rows[0].image_url.replace(process.env.IMAGE_URL, '')}`;
                        fs.unlink(oldImagePath, (err) => {
                        if (err) {
                            console.log(err);
                        }
                        });
                }
                await client.query('update users set image_url = $1 where id = $2', [new_image_url, req.id]);
            }
            res.status(200).json({success: true, message: 'User updated'});
        } catch (err) {
            console.log(err);
            res.status(500).json({success: false, error: 'Error while update user'});
        }
    }

    static async buyItemInShop(req, res) {
        // POST
        try {
            const { item_id } = req.body;
            const user = await client.query('select balance from users where id = $1', [req.id]);
            const item = await client.query('select price, shop_cat_id from item_in_box where id = $1', [item_id]);
            if(item.rows[0].shop_cat_id == null) {
                res.status(400).json({success: false, message: 'Not in shop'});
                return;
            }
            if(user.rows[0].balance >= item.rows[0].price) {
                await client.query('update users set balance = balance - $1 where id = $2', [item.rows[0].price, req.id]);
                const ifExistsItemOnUser = await client.query('select * from items_of_user where user_id = $1 and item_id = $2', [req.id, item_id]);
                if(ifExistsItemOnUser.rows.length == 0) {
                    await client.query('insert into items_of_user (user_id, item_id, quantity) values ($1, $2, 1)', [req.id, item_id], 1);
                } else {
                    await client.query('update items_of_user set quantity = quantity + 1 where user_id = $1 and item_id = $2', [req.id, item_id]);
                }
                res.status(200).json({success: true, message: 'Item bought'});
            } else {
                res.status(400).json({success: false, message: 'Not enough balance'});
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({success: false, error: 'Error while buying item'});
        }
    }
}