import  express  from "express";
import {Request, Response} from "express";
import {sql_db_pool_promise} from "../db/mysql";
import {ResultSetHeader} from 'mysql2';
import {packs} from "../models/packs";
import {ValidatePacks} from '../../validators/packs-validators';
import {buySubscriptionValidator} from "../../validators/subcription";
import {validationResult } from 'express-validator';
import { authenticationfilter } from "../../security/auth-filter"; 
import {authorizeRole} from "../../security/auth-filter";
import { subscription } from "../models/subcription";

const abonRouter = express();

//Route pour permettre à un propriétaire de créer un abonnement pour sa salle en y ajoutant les photos en meme temps 
abonRouter.post('/',  authenticationfilter, authorizeRole(['owner']), ValidatePacks, async(req : Request, res : Response) =>{
    const pack = req.body as packs;
    const Id = req.userId;
    //Récupérons les erreurs de validation et affichions les si elles existent 
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }
    try {
        //Vérifions si la salle de gym auquel l'ajout du pack veut etre faire est vraiment celui du propriétaire qui esaie de réaliserl'action 
        const sqlRequest1 = "SELECT id_owner FROM gyms WHERE id = ?";
        const [gymOwnerResult] = await sql_db_pool_promise.execute(sqlRequest1, [pack.gym_id]) as any[];
        const id_owner = gymOwnerResult[0].id_owner 
        if (id_owner !== Id){
            res.status(403).json({ message: "Vous ne pouvez pas ajouter un pack à cette salle. Elle ne vous appartient pas." });
            return;
        }
        const sqlRequest = "INSERT INTO packs(gym_id, nom, type, prix, acces, description) VALUES (?,?,?,?,?,?)"
        const [result1] = await sql_db_pool_promise.execute(sqlRequest, [pack.gym_id, pack.nom, pack.type, pack.prix, pack.acces, pack.description])
        res.status(200).json({message: "Le pack a été créer avec succès ", result1: result1})
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "Erreur lors de la création du pack d'abonnement "})  
    }
})

//Rooute public qui permet de récupérer les packs d'abonnement d'une salle de gym donné 
abonRouter.get('/gym/:id', authenticationfilter,  async(req : Request, res : Response) =>{
    const gym_id = req.params['id']

    try {
        const sqlRequest : string = "SELECT * FROM packs WHERE gym_id = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [gym_id])as any[];
        if (result['length'] === 0){
            res.status(404).json({message : "Aucun pack d'abonnement n'existe pour cette salle de gym"})
        }
        res.status(200).json({message : "Liste des packs d'abonnements de cette salle:",  result: result});
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors des packs d'abonnement de cette salle de gym "})
    }
})

abonRouter.post('/buy', authenticationfilter, authorizeRole(['guest']), buySubscriptionValidator, async (req: Request, res: Response) => {
    const sub = req.body as subscription;
    const id_user = req.userId; 
    // Récupérons les erreurs de validation et affichons-les si elles existent 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        // Vérifions d'abord si le pack que l'utilisateur essaie d'acheter existe dans notre base de données 
        const sqlRequest1 = 'SELECT prix, type FROM packs WHERE id = ?';
        const [packResult] = await sql_db_pool_promise.execute(sqlRequest1, [sub.pack_id]) as any[];

        if (packResult.length === 0) {
            res.status(404).json({ message: "Le pack d'abonnement que vous essayez d'acheter est introuvable" });
            return;
        }

        // Récupérons le prix et le type de l'abonnement
        const Packprix = packResult[0].prix;
        const Packtype = packResult[0].type;
        console.log(Packtype);
        //Implémentons un algorithme pour calculer la date de fin de l'abonnmeent en fonction du type d'abonnement 
        let date_du_jour = new Date();
        let date_de_fin = new Date(date_du_jour); 
        if (Packtype === 'mensuel') {
            date_de_fin.setMonth(date_de_fin.getMonth() + 1);
        } else if (Packtype === 'trimestriel') {
            date_de_fin.setMonth(date_de_fin.getMonth() + 3);
        } else if (Packtype === 'annuel') {
            date_de_fin.setFullYear(date_de_fin.getFullYear() + 1);
        }


        const sqlRequest2 = 'INSERT INTO payements (user_id, montant, method, status) VALUES (?, ?, ?, ?)';
        const [paymentResult] = await sql_db_pool_promise.execute<ResultSetHeader>(sqlRequest2, [id_user, Packprix, sub.method, 'validé']);
        const payment_id = paymentResult.insertId;
        const sqlRequest3 = "INSERT INTO subscriptions (user_id, pack_id, date_debut, date_fin, payement_id) VALUES (?, ?, ?, ?, ?)";
        const [abonResult] = await sql_db_pool_promise.execute(sqlRequest3, [id_user, sub.pack_id, date_du_jour, date_de_fin, payment_id]);

        res.status(201).json({ message: 'Abonnement acheté avec succès' });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Echec lors de l'achat de l'abonnement" });
    }
});


//Route pour permettre a un utilisateur de voir ses abonnements 
abonRouter.get('/my', authenticationfilter, authorizeRole(['guest']), async(req: Request, res: Response) => {
    const id_user = req.userId; 
    try {
        // Effectuons une requete avec jointure pour récupérer les abonnements de l'utilisateur avec des informations sur le pack
        const sqlRequest = " SELECT s.user_id, s.date_debut, s.date_fin, p.nom AS pack_nom, p.type AS pack_type, p.prix AS pack_prix FROM subscriptions s JOIN packs p ON s.pack_id = p.id WHERE s.user_id = ?";
        const [subscriptionsResult] = await sql_db_pool_promise.execute(sqlRequest, [id_user])as any[];

        // Si l'utilisateur n'a aucun abonnement alors on le lui signale 
        if (subscriptionsResult.length === 0) {
            res.status(404).json({ message: "Aucun abonnement trouvé pour cet utilisateur." });
            return;
        }
        // Retourner les abonnements des utilisateurs
        res.status(200).json({message : "Abonnement à votre actif :", subscriptionsResult : subscriptionsResult});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la récupération des abonnements." });
    }
});

export const apiabonRouter = abonRouter;