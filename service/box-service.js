export class BoxService {
    static async openTheBox(box_id, quantity, client, user_id) {
        try {
            const user = await client.query('select * from users where id = $1', [user_id]);
            const box = await client.query('select * from box where id = $1', [box_id]);
            if(user.rows[0].balance < box.rows[0].price * quantity) {
                return {success: false, message: "Недостаточно средств"};
            }
            const status_box = box.rows[0].isachieve;
            await BoxService.checkAchievements(box_id, client, user_id, quantity, status_box);
            await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [box.rows[0].price * quantity, user_id]);
            var array = [];
            for(let i = 0; i < quantity; i++) {
                const result = await client.query(`SELECT product_id
                                                    FROM (
                                                    SELECT unnest(product_ids) AS product_id
                                                    FROM box
                                                    WHERE id = ${box_id}
                                                    ) AS subquery
                                                    ORDER BY RANDOM()
                                                    LIMIT 1;`);
                const repeatel = await client.query('SELECT * FROM items_of_user WHERE user_id = $1 AND item_id = $2', [user_id, result.rows[0].product_id]);
                if(repeatel.rows.length > 0) {
                    client.query('UPDATE items_of_user SET quantity = quantity + 1 WHERE user_id = $1 AND item_id = $2', [user_id, result.rows[0].product_id]);
                } else {
                    await client.query('INSERT INTO items_of_user (user_id, item_id, quantity) VALUES ($1, $2, $3)', [user_id, result.rows[0].product_id, 1]);
                }
                array.push(result.rows[0]);
            }
            await client.query('UPDATE users SET qty_open_box = qty_open_box + $1 WHERE id = $2', [quantity, user_id]);
            return array;
        } catch (err) {
            console.error(err); 
            return {success: false}
        }
    }

    static async checkAchievements(box_id, client, user_id, quantity, status_box) {
        try {
            const history = await client.query('select * from history_open_box_user where user_id = $1 and box_id = $2', [user_id, box_id]);
            if(status_box) {
                let qty;
                if(history.rows.length > 0) {
                    await client.query('UPDATE history_open_box_user SET quantity = quantity + $1 WHERE user_id = $2 AND box_id = $3', [quantity, user_id, box_id]);
                    qty = history.rows[0].quantity + quantity;
                } else {
                    await client.query('INSERT INTO history_open_box_user (user_id, box_id, quantity) VALUES ($1, $2, $3)', [user_id, box_id, quantity]);
                    qty = quantity;
                }
                const achievements = await client.query('SELECT * FROM achievements WHERE user_id = $1 AND box_id = $2', [user_id, box_id]);
                if(achievements.rows.length == 0) {
                    await client.query(`insert into achievements(required_quantity, reward, user_id, box_id) values 
                        (10, 10, ${user_id}, ${box_id}), (20, 20, ${user_id}, ${box_id}), (30, 30, ${user_id}, ${box_id}), (50, 50, ${user_id}, ${box_id}), (100, 100, ${user_id}, ${box_id}), 
                        (200, 200, ${user_id}, ${box_id}), (300, 300, ${user_id}, ${box_id});`)
                }
                const achievements2 = await client.query('SELECT * FROM achievements WHERE user_id = $1 AND box_id = $2', [user_id, box_id]);
                for (const achievement of achievements2.rows) {
                    if (qty >= achievement.required_quantity && !achievement.is_done) {
                        await client.query('UPDATE achievements SET is_done = true WHERE user_id = $1 AND box_id = $2 AND required_quantity <= $3', [ user_id, box_id, qty ]);
                        await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [achievement.reward, user_id]);
                    }
                }
            } else {
                return;
            }
        } catch (err) {
            console.error(err); 
            return {success: false, message: "Прогресс не обновлен"}
        }
    }
}