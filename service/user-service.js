export class UserService {
    static async generateReferralCode() {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const referralCode = Array(10).fill(null).map(() => characters.charAt(Math.floor(Math.random() * characters.length))).join('').toLowerCase();
      return referralCode;
    }

    static async createDefaultReferalTable(client, user_id) {
       const info = await client.query('SELECT * FROM referal_reward WHERE user_id = $1', [user_id]);
       if (info.rows.length == 0) {
           await client.query(`INSERT INTO referal_reward (required_quantity, reward, user_id) VALUES 
	          (10, 50, ${user_id}), (20, 150, ${user_id}), (30, 250, ${user_id}), (50, 500, ${user_id}), (100, 1000, ${user_id})`);
       }
    }

    static async checkReferal(client, user_id, quantity) {
      const info = await client.query('SELECT * FROM referal_reward WHERE user_id = $1', [user_id]);
      if (info.rows.length > 0) {
          for (const reward of info.rows) {
              if (quantity >= reward.required_quantity && !reward.is_done) {
                  await client.query('UPDATE referal_reward SET is_done = true WHERE user_id = $1 AND required_quantity <= $2', [user_id, quantity]);
                  await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [reward.reward, user_id]);
              }
          }
      }
    }
}