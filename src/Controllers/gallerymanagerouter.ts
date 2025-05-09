import  express  from "express";
import {Request, Response} from "express";
import {sql_db_pool_promise} from "../db/mysql";
import { ValidatePhotosRequest } from "../../validators/photos-validator";
import {validationResult } from 'express-validator';
import { authenticationfilter } from "../../security/auth-filter"; 
import {authorizeRole} from "../../security/auth-filter";

const imgRouter = express();

// Ajouter des photos à une salle de gym (OWNER uniquement)
imgRouter.post("/photos", authenticationfilter, authorizeRole(['owner']), ValidatePhotosRequest, async (req: Request, res: Response) => {
    const { gym_id, photos } = req.body;
    const ownerId = req.userId;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         res.status(400).json({ errors: errors.array() });
         return;
    }

    try {
        // Vérifions que la salle de gym appartient bien à ce propriétaire
        const sqlVerify = "SELECT id FROM gyms WHERE id = ? AND id_owner = ?";
        const [result] = await sql_db_pool_promise.execute(sqlVerify, [gym_id, ownerId]) as any[];

        if (result.length === 0) {
          res.status(403).json({ message: "Vous n'êtes pas propriétaire de cette salle de gym ou elle n'existe pas." });
          return;
        }

        // Ajoutons les photos
        const values = photos.map((url: string) => [gym_id, url]);

        const sqlRequest  = "INSERT INTO gyms_photos (gym_id, url) VALUES ?";

        const [result1] = await sql_db_pool_promise.query(sqlRequest, [values]);

        res.status(201).json({ message: "Photos ajoutées avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de l'ajout des photos." });
    }
});

// Supprimer des photos d'une salle de gym (OWNER uniquement)
imgRouter.delete("/photos", authenticationfilter, authorizeRole(['owner']),   ValidatePhotosRequest, async (req: Request, res: Response) => {
    const { gym_id, photos } = req.body;
    const ownerId = req.userId;

    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         res.status(400).json({ errors: errors.array() });
         return;
    }

    try {
        // Vérifions que la salle de gym appartient bien à ce propriétaire
        const sqlRequest = "SELECT id FROM gyms WHERE id = ? AND id_owner = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [gym_id, ownerId]) as any[];

        if (result.length === 0) {
            res.status(403).json({ message: "Vous n'êtes pas propriétaire de cette salle de gym ou elle n'existe pas." });
            return;
        }

        // Supprimer les photos
        const sqlRequest1 = "DELETE FROM gyms_photos WHERE gym_id = ? AND url IN (?)";
        await sql_db_pool_promise.query(sqlRequest, [gym_id, photos]);

        res.status(200).json({ message: "Photos supprimées avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la suppression des photos." });
    }
});


export const apiimgRouter = imgRouter ;