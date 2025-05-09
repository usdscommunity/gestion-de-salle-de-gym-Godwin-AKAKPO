import  express  from "express";
import {Request, Response} from "express";
import {sql_db_pool_promise} from "../db/mysql";
import {User} from "../models/User";
import {generateToken} from "../../security/jwt-auth";
import {ValidateRegister} from '../../validators/auth-validator';
import {ValidateLogin} from '../../validators/auth-validator';
import { validationResult } from 'express-validator';
const bcrypt = require('bcrypt');
import {insertToken} from "../models/tokens_blacklist";
import { authenticationfilter } from "../../security/auth-filter"; 
import {authorizeRole} from "../../security/auth-filter";

//Déclarons la constante de la route 

const authrouter = express.Router();
//Route pour l'inscription d'un invité 
authrouter.post('/register', ValidateRegister, async(req: Request, res : Response)=>{
    const users = req.body as User
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }
    //Vérifons si un utilisateur avec ce mail n'existe pas déjà 
    const sqlRequest1 = "SELECT * FROM users WHERE email = ?";
    const result1 = await sql_db_pool_promise.execute(sqlRequest1, [users.email])as any[];
    const user1 = result1[0]
    if (user1['length']> 0 ){
        res.status(401).json({message : "Ce mail est déjà associé à un compte "});
        return;
    }
    //Une fois les verifications préalables effectués enregistrons le users 
    try {
        //On va d'abord s'occuper de hasher les mots de passe 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(users.password, salt)
      
        const sqlRequest2 = "INSERT INTO users(email, password, name) VALUES (?,?,?)";
        const result2 = await sql_db_pool_promise.execute(sqlRequest2, [users.email, hashedPassword, users.name]);
        res.status(200).json({message : "L'invité a été créer avec succès", });
        return;
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Erreur lors de la création du l'utilisateur"});
        return;
    }
});

//Route pour initialiser un admin 
authrouter.post('/admin/init-admin', ValidateRegister,  async(req : Request, res : Response)=>{
    const users = req.body as User
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }
    //Vérifions si l'on essaie vraiment de créer le premier admin
    const x = 'admin'
    const sqlRequest1 = "SELECT * FROM users WHERE role = ?";
    const result1 = await sql_db_pool_promise.execute(sqlRequest1, [x])as any[];
    const user = result1[0];
    if (user.length > 0){
        res.status(406).json({message : "L'admin par défaut existe déja dans la base de donnés",});
        return;
    }

    //Vérifions si aucun compte n'est associé au mail
    const sqlRequest2 = "SELECT * FROM users WHERE email = ?";
    const result2 = await sql_db_pool_promise.execute(sqlRequest2, [users.email])as any[];
    const Userr = result2[0];
    if (Userr.length > 0 ){
        res.status(401).json({message : "Ce mail est déjà associé à un compte ", });
        return;
    }
    //Une fois chacun de ses vérifications effectué créons le premier admi n 
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(users.password, salt)
        const sqlRequest3 = "INSERT INTO users(email, password, name, role) VALUES (?,?,?,?)";
        const result3 = await sql_db_pool_promise.execute(sqlRequest3, [users.email, hashedPassword, users.name, 'admin'])as any[];
        res.status(200).json({message : "Le premier admin a été créer avec succès", result3});
        return;
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Erreur lors de la création du premier admin "});
        return;
    }
});
//Route pour la connexion 
authrouter.post('/login', ValidateLogin, async(req : Request, res : Response)=>{
    const users = req.body as User
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }
    try {
        //Vérifions si l'utilisateur squi essaie de se connester est vraiment dans notre base de donnés 
        const sqlRequest1 = "SELECT * FROM users WHERE email = ?";
        const result1 = await sql_db_pool_promise.execute(sqlRequest1, [users.email])as any[];
        const user1 = result1[0]
        if (user1['length'] == 0){
            res.status(404).json({message : "Aucun compte n'est associé à cet email"});
            return;
        }
         //Comparons mtn les mots de passe dans le cas ou l'utilisateur est  b vraiment inscris dans notre bd
        const user = user1[0];
        if (!(await bcrypt.compare(users.password, user.password))){
            res.status(401).json({message : "Mot de passe incorrect "});
            return;
        }
        const token = generateToken(user.id)
        res.status(200).json({"token": token})
       

    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Erreur lors de la conneciond de l'utilisateur"})
    }
}); 

//Route pour créer un propriétaire 
authrouter.post('/invite-owner', ValidateRegister, authenticationfilter, authorizeRole(['admin']), async (req: Request, res: Response) => {
    const users = req.body as User;

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }

    // Vérification de l'existence d'un utilisateur avec ce mail
    const sqlRequest1 = "SELECT * FROM users WHERE email = ?";
    const result1 = await sql_db_pool_promise.execute(sqlRequest1, [users.email]) as any[];
    const IfUsers = result1[0];
    if (IfUsers.length > 0) {
        res.status(409).json({ message: "Ce mail est déjà utilisé" });
        return;
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(users.password, salt);
        // Insérons avec le rôle OWNER
        const sqlRequest = "INSERT INTO users(email, password, name, role) VALUES (?, ?, ?, ?)";
        await sql_db_pool_promise.execute(sqlRequest, [users.email, hashedPassword, users.name, 'owner']);

        res.status(201).json({ message: "Compte OWNER créé avec succès" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la création du compte OWNER" });
    }
});

//Route pour regeneré le token d'un utilisateur d'un user connecté 
authrouter.post('/refresh-token', authenticationfilter, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
           res.status(401).json({ message: "Utilisateur non authentifié" });
           return
        }
        // Si l'utilisateur est authentifié alors un nouveau token sera généré ici 
        const newToken = generateToken(userId);
        // Retourner le nouveau token au client
        res.status(200).json({ token: newToken });
        return
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors du rafraîchissement du token" });
        return
    }
});



//Deconnexion des utilisateurs 
authrouter.post("/logout",  authenticationfilter,  async(req : Request, res : Response)=>{
    //Recuperons le header de la requete de l'utilisateur 
    const authHeader = req.headers['authorization'] as string;
    //Vérifions si la requete contient vraiment un header 
    if (!authHeader){
        console.log("auth")
        res.status(401).json({message : 'Unauthorised. Accès refusé'});
        return;
    }
    //S oui, alors je me charge de récuperer le token passé dans le token en retirant le préfixe Bearer 
    const token =   authHeader.replace("Bearer ", "");
    //Verifions si un token est vraiment passé dans le header 
    if (!token) {
        res.status(401).json({message: "Unauthorized. Accè refusé"});
        return;
    }
    try {
        await insertToken(token);  // Ici on procède à  l'enregistrement du token dans la base de données précisement dans la table token_blacklist
       
        res.status(200).json({ message: "Déconnexion réussie" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la déconnexion" });
    }
   
})

export const apiauthrouter = authrouter;