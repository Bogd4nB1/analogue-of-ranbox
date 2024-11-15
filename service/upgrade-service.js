export class UpgradeService {
    static async calculateChance(s1, s2) {
        const ratio = s2 / s1; // Отношение стоимостей s2 к s1
        const logRatio = Math.log10(ratio); // Логарифм отношения стоимостей
        const chance = Math.max(0.01, Math.min(0.714, 0.714 - 0.7999 * logRatio));
        return chance;
      }
      
    static async transformItem(s1, s2) {
        const chance = await UpgradeService.calculateChance(s1, s2);
        const random = Math.random();
        if (random <= chance) {
          // Преобразование произошло
          return true;
        } else {
          // Преобразование не произошло
          return false;
        }
      }
}