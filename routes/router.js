import { Router } from "express";
import { UserController } from "../controllers/user.js";
import {body} from 'express-validator';
import checkAuth from "../middleware/checkAuth.js";
import { BoxController } from "../controllers/box.js";
import { AdminController } from "../controllers/admin.js";
import upload from "../config/multer.js";
import { UpgradeController } from "../controllers/upgrade.js";

const router = Router();

router.post('/register',body('email', 'Некорректный email').isEmail(), 
                        body('password', 'Должен содержать минимум 8 символов').isLength({min: 8}), UserController.register);
router.post('/login', body('email', 'Некорректный email').isEmail(), UserController.login);
router.post('/logout', UserController.logout);
router.post('/open', checkAuth, BoxController.openBox);
router.post('/sold', checkAuth, UserController.soldItem);
router.post('/uploadfile', checkAuth, upload.single('file'), UserController.uploadFile);
router.post('/ref', body('email', 'Некорректный email').isEmail(), 
                        body('password', 'Должен содержать минимум 8 символов').isLength({min: 8}), UserController.registerWithRef);
router.post('/upgrade', checkAuth, UpgradeController.upgrade);
router.post('/buyitem', checkAuth, UserController.buyItemInShop);

router.put('/update', checkAuth, UserController.updateUser);


router.get('/refresh', UserController.refresh);
router.get('/userinfo', checkAuth, UserController.getUserInfo);
router.get('/boxes', BoxController.getAllBoxes);
router.get('/onebox', BoxController.getOneBox);
router.get('/achievements', checkAuth, UserController.getAchievements);
router.get('/items', BoxController.getAllItemsInBox);
router.get('/raritys', BoxController.getRaritys);
router.get('/historybalance', checkAuth, UserController.getHistoryBalance);
router.get('/checkreferal', checkAuth, UserController.checkReferal);
router.get('/category', BoxController.category);
router.get('/shopcategory', BoxController.getItemsByCategory);
router.get('/shop', BoxController.shop);

// Admin's routes
router.post('/createadmin', AdminController.createAdmin);
router.post('/createbox', checkAuth, AdminController.createBox);
router.post('/createitem', checkAuth, AdminController.createItemInBox);

router.put('/editbox', checkAuth, AdminController.editBox);

router.delete('/deletebox', checkAuth, AdminController.deleteBox);



export default router;