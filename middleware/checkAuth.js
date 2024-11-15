import { TokenService } from '../service/token-service.js';

export default async (req, res, next) => {
    try {
        const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
        const decoded = await TokenService.validateAccessToken(token);
        req.id = decoded.id;
        req.role = decoded.role;
        next();
    } catch (e) {
        return res.status(403).json({message: 'Not authorized'});
    }
}