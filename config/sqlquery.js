export const createUser = `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL CHECK(email ilike '%@%'),
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    balance DECIMAL(100,2) NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    role VARCHAR(255) NOT NULL DEFAULT 'user',
    referral_code VARCHAR(10) NOT NULL UNIQUE,
    referred_by INTEGER NOT NULL DEFAULT 0,
    history_balance DECIMAL(100,2) NOT NULL DEFAULT 0,
    qty_open_box INTEGER NOT NULL DEFAULT 0,
    qty_upgrade INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`

export const createToken = `CREATE TABLE IF NOT EXISTS token (
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`

export const createCategoryOfBox = `CREATE TABLE IF NOT EXISTS category_of_box (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);`

export const createBox = `CREATE TABLE IF NOT EXISTS box (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(100,2) NOT NULL,
    isAchieve BOOLEAN NOT NULL DEFAULT false,
    product_ids INTEGER[],
    category_id INTEGER NOT NULL,
    image_url VARCHAR(255),
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES category_of_box(id)
);`

export const createRatity = `CREATE TABLE IF NOT EXISTS rarity (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);`

export const createItemInBox = `CREATE TABLE IF NOT EXISTS item_in_box (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(100,2) NOT NULL,
    image_url VARCHAR(255),
    rarity INTEGER NOT NULL,
    shop_cat_id INTEGER,
    CONSTRAINT fk_shop_cat FOREIGN KEY (shop_cat_id) REFERENCES shop_category(id),
    CONSTRAINT fk_rarity FOREIGN KEY (rarity) REFERENCES rarity(id)
);`

export const createBoxesOfUser = `CREATE TABLE IF NOT EXISTS items_of_user (
    user_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES item_in_box(id) ON DELETE CASCADE
);`

// Таблицы для достижений
export const createAchievements = `CREATE TABLE IF NOT EXISTS achievements (
    required_quantity INTEGER NOT NULL,
    reward DECIMAL(100,2) NOT NULL,
    user_id BIGINT NOT NULL,
    box_id BIGINT NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_box FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`

export const createHistoryOpenBoxUser = `CREATE TABLE IF NOT EXISTS history_open_box_user (
    user_id BIGINT NOT NULL,
    box_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_box FOREIGN KEY (box_id) REFERENCES box(id) ON DELETE CASCADE
);`

export const createHistoryBalance = `CREATE TABLE IF NOT EXISTS history_balance (
    user_id BIGINT NOT NULL,
    balance DECIMAL(100,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`

export const createReferalReward = `CREATE TABLE IF NOT EXISTS referal_reward (
    required_quantity INTEGER NOT NULL,
    reward DECIMAL(100,2) NOT NULL,
    user_id BIGINT NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`

export const createShopCategory = `CREATE TABLE IF NOT EXISTS shop_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);`
