import express from 'express';
import { Request, Response } from "express";
import { authenticationfilter } from "../../security/auth-filter"; 
import {authorizeRole} from "../../security/auth-filter";
import { ProductValidator} from "../../validators/product-validator";
import {Product} from "../models/product";
import {sql_db_pool_promise} from "../db/mysql";
import { validationResult } from 'express-validator';
import {reviewValidator} from '../../validators/product-validator'
import {reviews} from '../models/reviews';

const BoutiqueRouter = express()

BoutiqueRouter.post('/', authenticationfilter, authorizeRole(['owner']), ProductValidator, async(req : Request, res : Response) => {
    const Pro = req.body as Product;
    const Id  = req.userId;
    //Récupérons les erreurs et affichons les si elle existe 
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }
    try {
        //Vérifions si la salle de gym auquel l'ajout du produit veut etre faire est vraiment celui du propriétaire qui esaie de réaliserl'action 
        const sqlRequest1 = "SELECT id_owner FROM gyms WHERE id = ?";
        const [gymOwnerResult] = await sql_db_pool_promise.execute(sqlRequest1, [Pro.gymId]) as any[];
        const id_owner = gymOwnerResult[0].id_owner 
        if (id_owner !== Id){
            res.status(403).json({ message: "Vous ne pouvez pas ajouter un produit à cette salle. Elle ne vous appartient pas." });
            return;
        }
        const sqlRequest = "INSERT INTO products (name, description, price, stock, category, gym_id) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [Pro.name, Pro.description, Pro.price, Pro.stock, Pro.category, Pro.gymId]);
        res.status(201).json({ message: 'Produit créé avec succès.',  result : result});
    
    }catch (err) {
        console.error( err);
        res.status(500).json({ message: 'Erreur lors de la création du produit.' });
    }
});

BoutiqueRouter.get('/gym/:id', authenticationfilter, async(req: Request, res : Response) =>{
    const gymId = req.params['id'];

    try {
         //Vérifions d'abord si l'id entré dans le route de la requete correpond vraiment à celle d'une salle de gym 
        const sqlRequest1 = "SELECT * FROM gyms WHERE id = ?";
        const [gymResult] = await sql_db_pool_promise.execute(sqlRequest1, [gymId]) as any[];

        if (gymResult.length === 0) {
            res.status(404).json({ message: "La salle de gym spécifiée n'existe pas." });
            return;
        }
        const sqlRequest = "SELECT * FROM products WHERE gym_id = ?";
        const [result] = await sql_db_pool_promise.execute( sqlRequest, [gymId])as any[];
        //Verifions si des produits existent vraiment pour cette salle
        if (result.length === 0){
            res.status(404).json({message : "Aucun produit n'existe pour cette salle"});
            return;
        }
        res.status(200).json({message : "Liste des produits de cette salle:", result: result});
    }catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Erreur lors de la récupération des produits.' });
    }
});

BoutiqueRouter.post('/review', authenticationfilter, authorizeRole(['guest']), reviewValidator, async (req: Request, res: Response) =>{
    const reviews = req.body as reviews 
    const user_id = req.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         res.status(400).json({ errors: errors.array() });
         return;
    }
    try {
        // Vérifier  d'abord si le produit existe 
        const sqlRequest1 =  "SELECT id FROM products WHERE id = ?";
        const [product] = await sql_db_pool_promise.execute(sqlRequest1, [reviews.product_id]) as any[];
        if (product.length === 0) {
            res.status(404).json({ message: "Produit introuvable." });
            return;
        }
        const sqlRequest2= " INSERT INTO avis (product_id, user_id, note, commentaire) VALUES (?, ?, ?, ?)";
        const [result] = await sql_db_pool_promise.execute(sqlRequest2, [reviews.product_id, user_id, reviews.note, reviews.commentaire])as any [];
        res.status(201).json({ message: "Avis ajouté avec succès.", result : result  });
        
    } catch (err) {
        console.log(err);
        res.status(500).json({message : "Erreur lors de la soumission de l'avis"})
    }
}); 

export const apiboutiquerouter = BoutiqueRouter;