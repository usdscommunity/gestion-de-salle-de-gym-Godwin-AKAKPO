import express from 'express';
import {Request, Response} from 'express';
import {Gym} from '../models/gyms';
import {sql_db_pool_promise} from "../db/mysql";
import { ValidateGym } from '../../validators/gym-validator';
import { validationResult } from 'express-validator';
import {authenticationfilter} from "../../security/auth-filter";
import {authorizeRole} from "../../security/auth-filter";
//const appExpress = express();
const gymRouter = express.Router();

//Ajouter une salle de gym
gymRouter.post("", authenticationfilter, authorizeRole(['admin']), ValidateGym,  async(req : Request, res :Response)  =>{
    const gym = req.body as Gym & { photos?: string[] };
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }
    try {
        //Vérifions d'abors si l'id_owner correpond réellement à celui d'un propriétaire dans la table users
        const sqlR =  "SELECT id FROM users WHERE id = ? AND role = 'OWNER'";
        const [owners] = await sql_db_pool_promise.execute(sqlR, [gym.id_owner]);
        const verif = owners as any[];
        if (verif.length === 0) {
            res.status(400).json({ message: "L'identifiant du propriétiare n'existe pas ou n'a surement pas le role owner " });
            return;
        };
        const sqlRequest : string = "INSERT INTO gyms(nom, adress, capacite, statut, equipement, id_owner) values(?, ?, ?, ?, ?, ?)";
        const [result] = await sql_db_pool_promise.execute(
            sqlRequest,
            [gym.nom, gym.adress, gym.capacite, gym.statut, gym.equipement, gym.id_owner]
        ) as any[];
        //Enregistrons mtn la gallerie de la salle de gym qui a été créer 
        const gymId = result.insertId;
        if (Array.isArray(gym.photos)) {
            const sqlRe = "INSERT INTO gyms_photos (gym_id, url) VALUES ?";
            //Transformons le tableau d'url en un tableau de tableau pour permettre de faire l'insertion de chaque url du tableau comme un enregostrement 
            const photoValues = gym.photos.map((url) => [gymId, url]);
            //Si le tableau n'est pas vide alors on exécute 
            if (photoValues.length > 0) {
              await sql_db_pool_promise.query(sqlRe, [photoValues]);
            }
          }

        res.status(201).json({message: "Salle crée avec succès !", gym: gym, result:result});
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la creation de la salle"});
        return;
    }

});

//RETRIEVE : Récupérer toutes les salles de gym

gymRouter.get("", authenticationfilter,  async(req : Request, res :Response)  =>{
    try {
        const sqlRequest = `SELECT g.id, g.nom, g.adress, g.capacite, g.equipement, g.statut, u.name AS users, GROUP_CONCAT(p.url) AS photos FROM gyms g
        INNER JOIN users u ON g.id_owner = u.id LEFT JOIN gyms_photos p ON g.id = p.gym_id GROUP BY g.id `;
        const [result] = await sql_db_pool_promise.execute(sqlRequest);
        res.status(200).json(result);
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la récupération des salles de gym "})
    }
});

//RETRIEVE : Récupérer une salle de gym par son ID   i
gymRouter.get("/:id", authenticationfilter, async(req : Request, res :Response)  =>{
    const id = req.params['id'];

    try {
        const sqlRequest: string = `SELECT g.id, g.nom, g.adress, g.capacite, g.equipement, g.statut, u.name AS users, GROUP_CONCAT(p.url) AS photos FROM gyms g
        INNER JOIN users u ON g.id_owner = u.id LEFT JOIN gyms_photos p ON g.id = p.gym_id WHERE g.id = ? AND g.statut = 'ouvert' GROUP BY g.id `;
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [id])as any[];
        if (result['length'] === 0){
            res.status(404).json({message : "Salla de gym non retrouvé "})
        }
        res.status(200).json(result);

    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la récupération de la salle de gym "})
    }
});

//Mettre à jour une salle de gym
gymRouter.put("/:id", authenticationfilter, authorizeRole(['admin', 'owner']), ValidateGym,  async(req : Request, res :Response)  =>{
    const id = req.params['id'];
    const gym = req.body as Gym;
    const role = req.userRole;
    const Id  = req.userId;
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        return;
    }
    try {
        //Vérifions d'abors si l'id_owner correpond réellement à celui d'un propriétaire dans la table users
        const sqlR =  "SELECT id FROM users WHERE id = ? AND role = 'OWNER'";
        const [owners] = await sql_db_pool_promise.execute(sqlR, [gym.id_owner]);
        const verif = owners as any[];
        if (verif.length === 0) {
            res.status(400).json({ message: "L'identifiant du propriétiare n'existe pas ou n'a surement pas le role owner " });
            return;
        };
        
        //Dans le cas celui qui essaie de faire la mise à jour est un owner vérifions si la salle lui appartient vraiemnt 
        if (role === 'owner'){
            const sqlRequest1 = "SELECT id_owner FROM gyms WHERE id = ?";
            const [gymOwnerResult] = await sql_db_pool_promise.execute(sqlRequest1, [id]) as any[];
            const id_owner = gymOwnerResult[0].id_owner 
            if (id_owner !== Id){
                res.status(403).json({ message: "Vous ne pouvez pas modifier cette salle. Elle ne vous appartient pas." });
                return;
            }
        }

        const sqlRequest : string = "UPDATE gyms SET nom = ?, adress = ?,  capacite = ?, statut = ?, equipement = ?, id_owner = ? WHERE id = ?";
        const [result] = await sql_db_pool_promise.execute(
            sqlRequest,
            [gym.nom, gym.adress, gym.capacite, gym.statut, gym.equipement, gym.id_owner, id]
        )as any[];
        if (result['affectedRows'] == 0){
            res.status(404).json({message : "Salle de gym non retrouvé "})
        } 
        res.status(201).json({message: "Salle de gym mis à jour avec succès !", gym: gym, result:result});
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la mis à jour de la categorie"})
    }
});

//Supprimer une salle gym 
gymRouter.delete("/:id", authenticationfilter, authorizeRole(['admin']), async(req : Request, res :Response)  =>{
    const id = req.params['id'];
    const gym = req.body as Gym;
    try {
       
        const sqlRequest  = "DELETE FROM gyms WHERE id_gym = ?";
        const [result] = await sql_db_pool_promise.execute(
            sqlRequest,
            [id]
        )as any[];
        if (result['affectedRows'] === 0){
            res.status(404).json({message : "Salle de gym non retrouvé "})
        } 
        res.status(201).json({message: "Salle de gym supprimé avec succès !", gym: gym, result:result});
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Echec lors de la suppression de la salle de gym "})
    }
});


//Afficher les statistiques d'une salle de gym 
gymRouter.get('/:id/stats', authenticationfilter, authorizeRole(['owner']), async (req: Request, res: Response) => {
    const gymId = req.params['id'];
    const Id  = req.userId;
    try {
      // Vérifions d'abord que la salle existe
      const sqlRequest = "SELECT * FROM gyms WHERE id = ?"
      const [gymsResult] = await sql_db_pool_promise.execute(sqlRequest,[gymId]) as any[];
      if (gymsResult.length === 0) {
        res.status(404).json({ message: "Salle de gym introuvable." });
        return
      }
      //vérifions si la salle lui appartient vraiemnt 
      const sqlRequest2 = "SELECT id_owner FROM gyms WHERE id = ?";
      const [gymOwnerResult] = await sql_db_pool_promise.execute(sqlRequest2, [gymId]) as any[];
      const id_owner = gymOwnerResult[0].id_owner 
      if (id_owner !== Id){
          res.status(403).json({ message: "Vous ne pouvez pas voir les statistiques de cette salle. Elle ne vous appartient pas." });
          return;
        }
      // Statistiques d’abonnement pour cette salle
      const sqlRequest1 = " SELECT COUNT(*) AS total_abonnements, COUNT(DISTINCT s.user_id) AS utilisateurs_uniques, ROUND(AVG(DATEDIFF(s.date_fin, s.date_debut)), 1) AS duree_moy_abonnement,SUM(p.prix) AS montant_total, MAX(s.date_debut) AS derniere_souscription FROM subscriptions s INNER JOIN packs p ON s.pack_id = p.id WHERE p.gym_id = ?"
      const [stats] = await sql_db_pool_promise.execute(sqlRequest1,[gymId]) as any[];
      res.status(200).json({message : "Statistiques de votre salle de gym:", gym_id: gymId, stats: stats[0]});
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors du calcul des statistiques." });
    }
});

export const apigymRouter = gymRouter