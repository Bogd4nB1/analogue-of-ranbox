import { client } from '../config/database.js';
import { BoxService } from '../service/box-service.js';

export class BoxController {
    // GET
    static async getAllBoxes(req, res) {
        try {
            const result = await client.query(`SELECT box.id, box.name, box.price, box.image_url, box.isachieve, box.product_ids, box.category_id, category_of_box.name AS category FROM box
                                            JOIN category_of_box
                                            on category_of_box.id = box.category_id`);
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.json({success: false})
        }
    }
    // GET
    static async getOneBox(req, res) {
        // GET
        try {
            const { boxID } = req.query;
            const result = await client.query(`SELECT box.id, box.name, box.price, box.image_url, box.isachieve, box.product_ids, box.category_id, category_of_box.name AS category FROM box 
                                            JOIN category_of_box on category_of_box.id = box.category_id
                                                WHERE box.id = ${boxID}`);
            const result2 = await client.query(`SELECT p.*, r.name AS rarity FROM box b
                                                JOIN item_in_box p ON p.id = ANY(b.product_ids)
                                                JOIN rarity r ON r.id = p.rarity
                                                WHERE b.id = ${boxID};`);
            res.json({box: result.rows[0], items: result2.rows});
        } catch (err) {
            console.error(err);
            res.json({success: false})
        }
    }
    // POST
    static async openBox(req, res) {
        // POST
        try {
            const { box_id, quantity } = req.body;
            const user_id = req.id;
            if(quantity > 10) {
                return res.json({success: false, message: "Можно открыть не более 10 ящиков за раз"});
            }
            BoxService.openTheBox(box_id, quantity, client, user_id).then(result => {
                res.json({items: result})
            }).catch(err => {
                console.error(err);
                res.json({success: false})
            })
        } catch (err) {
            console.error(err);
            res.json({success: false})
        }
    }
    // GET
    static async getAllItemsInBox(req, res) {
        try {
            const items = await client.query('SELECT * FROM item_in_box');
            res.json(items.rows);
        } catch (err) {
            console.error(err);
            res.json({success: false})
        }
    }

    static async getRaritys(req, res) {
        try {
            const rarities = await client.query('SELECT * FROM rarity');
            res.json(rarities.rows);
        } catch (err) {
            console.error(err);
            res.json({success: false})
        }
    }

    static async category(req, res) {
        try {
            const cat = await client.query('select * from category_of_box')
            res.status(200).json({success: true, items: cat.rows})
        } catch (err) {
            console.log(err)
            res.status(500).json({success: false, message: 'Error while get category'})
        }
    }

    static async getItemsByCategory(req, res) {
        try {
            const cat = await client.query('select * from shop_category')
            res.status(200).json({success: true, items: cat.rows})
        } catch (err) {
            console.log(err)
            res.status(500).json({success: false, message: 'Error while get category'})
        }
    }

    static async shop(req, res) {
        try {
            const allshop = await client.query(`SELECT 
                                    c.id AS category_id,
                                    c.name AS category_name,
                                    JSON_AGG(i.*) AS items
                                    FROM 
                                    shop_category c
                                    LEFT JOIN item_in_box i ON c.id = i.shop_cat_id
                                    GROUP BY 
                                    c.id, c.name`)
            res.status(200).json({success: true, items: allshop.rows})
        } catch (err) {
            console.log(err)
            res.status(500).json({success: false, message: 'Error while get category'})
        }
    }
}