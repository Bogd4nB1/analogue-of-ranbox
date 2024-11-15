import { createUser, createToken, createBox, createItemInBox, createBoxesOfUser, createAchievements, createHistoryOpenBoxUser, createRatity, createCategoryOfBox, createHistoryBalance, createReferalReward, createShopCategory, } from "./sqlquery.js";


export function initDB (client) {
    client.query(createShopCategory);
    client.query(createUser);
    client.query(createToken);
    client.query(createRatity);
    client.query(createCategoryOfBox);
    client.query(createBox);
    client.query(createItemInBox);
    client.query(createBoxesOfUser);
    client.query(createAchievements);
    client.query(createHistoryOpenBoxUser);
    client.query(createHistoryBalance);
    client.query(createReferalReward);
}