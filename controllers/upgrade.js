import { client } from '../config/database.js';
import { UpgradeService } from '../service/upgrade-service.js';

export class UpgradeController {
    static async upgrade(req, res) {
        // s1 - id предмета из инвентаря, s2 - id предмета для улучшения из списка
        try {
            const { s1, s2 } = req.body;
            const isExists = await client.query('select item_id, quantity from items_of_user where user_id = $1 and item_id = $2', [req.id, s1]);
            if (isExists.rowCount == 0) {
                res.json({ success: false, error: 'У вас нет этого предмета' });
                return;
            }
            const price_s1 = await client.query('select price from item_in_box where id = $1', [s1]);
            const price_s2 = await client.query('select price from item_in_box where id = $1', [s2]);
            const final = await UpgradeService.transformItem(price_s1.rows[0].price, price_s2.rows[0].price);
            if(final == true) { // Если преобразование произошло
                if(isExists.rows[0].quantity == 1) {
                    // Удаляем предмет из инвентаря если его количество равно 1
                    await client.query('delete from items_of_user where user_id = $1 and item_id = $2', [req.id, s1]);
                } else {
                    // Уменьшаем количество предмета в инвентаре
                    await client.query('update items_of_user set quantity = quantity - 1 where user_id = $1 and item_id = $2', [req.id, s1]);
                }
                const isExists2 = await client.query('select item_id, quantity from items_of_user where user_id = $1 and item_id = $2', [req.id, s2]);
                if (isExists2.rowCount == 0) {
                    await client.query('insert into items_of_user (user_id, item_id, quantity) values ($1, $2, $3)', [req.id, s2, 1]);
                } else {
                    await client.query('update items_of_user set quantity = quantity + 1 where user_id = $1 and item_id = $2', [req.id, s2]);
                }
                res.json({ success: true, message: 'Предмет улучшен' });
                return;
            } else {
                // Если преобразование не произошло
                if(isExists.rows[0].quantity == 1) {
                    // Удаляем предмет из инвентаря если его количество равно 1
                    await client.query('delete from items_of_user where user_id = $1 and item_id = $2', [req.id, s1]);
                } else {
                    // Уменьшаем количество предмета в инвентаре
                    await client.query('update items_of_user set quantity = quantity - 1 where user_id = $1 and item_id = $2', [req.id, s1]);
                }
                res.json({ success: false, error: 'Предмет не был улучшен' });
            }
        } catch (err) {
            console.log(err);
            res.json({ success: false, error: 'Error while upgrade' });
        }
    }
}