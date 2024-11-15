import { client } from '../config/database.js';
import bcrypt from 'bcrypt';
import { TokenService } from '../service/token-service.js';
import { UserService } from '../service/user-service.js';

export class AdminController {
    static async createBox(req, res) {
        try {
            const isadmin = await client.query('select role from users where id = $1', [req.id]);
            if(isadmin.rows[0].role != 'admin') {
                res.json({success: false, message: 'Недостаточно прав'});
                return;
            }
            await client.query('insert into box (name, price, image_url, isachieve, product_ids, category_id) values ($1, $2, $3, $4, $5, $6)', [req.body.name, req.body.price, req.body.image_url, req.body.isachieve, req.body.product_ids, req.body.category_id]);
            res.json({success: true, message: 'Коробка создана'});
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while creating box'});
        }
    };
    
    static async deleteBox(req, res) {
        try {
            const isadmin = await client.query('select role from users where id = $1', [req.id]);
            if(isadmin.rows[0].role != 'admin') {
                res.json({success: false, message: 'Недостаточно прав'});
                return;
            }
            const del = await client.query('delete from box where id = $1', [req.body.box_id]);
            if(del.rowCount == 0) {
                res.json({success: false, message: 'Коробка не найдена'});
                return;
            }
            res.json({success: true, message: 'Коробка удалена'});
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while deleting box'});
        }
    };

    static async editBox(req, res) {
        try {
            const isadmin = await client.query('select role from users where id = $1', [req.id]);
            if(isadmin.rows[0].role != 'admin') {
                res.json({success: false, message: 'Недостаточно прав'});
                return;
            }
            const { box_id, name, price, image_url, isachieve, product_ids, category_id } = req.body;
            await client.query('update box set name = $1, price = $2, image_url = $3, isachieve = $4, product_ids = $5, category_id = $6 where id = $7', [name, price, image_url, isachieve, product_ids, category_id, box_id]);
            res.json({success: true, message: 'Коробка отредактирована'});
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while editing box'});
        }
    };

    static async createAdmin(req, res) {
        try {
            const info = await client.query('select email from users where email = $1', [req.body.email]);
            if (info.rows.length == 0) {
                const isUsernameExists = await client.query('select username from users where username = $1', [req.body.username]);
                if (isUsernameExists.rows.length > 0) {
                    return res.json({success: false, message: 'Пользователь с таким именем уже существует'});
                }
                const referralCode = await UserService.generateReferralCode()
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                await client.query('insert into users (email, password, role, username, referral_code) values ($1, $2, $3, $4, $5)', [req.body.email, hashedPassword, 'admin', req.body.username, referralCode]);
                console.log('Admin created');
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
    };

    static async createItemInBox(req, res) {
        try {
            const isadmin = await client.query('select role from users where id = $1', [req.id]);
            if(isadmin.rows[0].role != 'admin') {
                res.json({success: false, message: 'Недостаточно прав'});
                return;
            } 
            const { name, price, image_url, rarity, shop_cat_id } = req.body;
            await client.query('insert into item_in_box (name, price, image_url, rarity, shop_cat_id) values ($1, $2, $3, $4, $5)', [name, price, image_url, rarity, shop_cat_id]);
            res.json({success: true, message: 'Предмет создан!'});
        } catch (err) {
            console.log(err);
            res.json({error: 'Error while creating item'});
        }
    }
}