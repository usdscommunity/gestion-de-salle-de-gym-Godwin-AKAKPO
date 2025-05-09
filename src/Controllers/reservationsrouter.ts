import  express  from "express";
import {Request, Response} from "express";
import {sql_db_pool_promise} from "../db/mysql";
import { validateReservation } from "../../validators/reservations-validators";
import { validationResult } from 'express-validator';
import { authenticationfilter } from "../../security/auth-filter"; 
import {authorizeRole} from "../../security/auth-filter";

const resrouter = express()

resrouter.post("/", authenticationfilter, authorizeRole(['guest']), async (req: Request, res: Response) => {
    const { gym_id, date, time_start, time_end } = req.body;
    const user_id = req.userId;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return; 
    }
    try {
        // Vérifions si cette réservation ne coincident pas avec une autre qui a déja été faite 
        const sqlRequest1 = "SELECT * FROM reservations WHERE gym_id = ? AND date = ? AND ((time_start < ? AND time_end > ?) OR  (time_start < ? AND time_end > ?) OR(time_start >= ? AND time_end <= ?))";
        const [result1] = await sql_db_pool_promise.execute(sqlRequest1 , [gym_id, date, time_end, time_end,time_start, time_start, time_start, time_end]) as any[];
        if (result1.length > 0) {
            res.status(409).json({ message: "Conflit de réservation : cette salle est déjà réservée à ce créneau." });
            return;
        }
        //Si après cette vérification mtn on a un résultat positif alors on peut passer à ce qui suit la réservation 
        // Insérer la réservation dans notre bd
        const sqlRequest = "INSERT INTO reservations (gym_id, user_id, date, time_start, time_end) VALUES (?, ?, ?, ?, ?)";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [gym_id, user_id, date, time_start, time_end]);

        res.status(201).json({ message: "Réservation effectuée avec succès." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la réservation." });
    }
});

//Route pour permettre à un client de vois ses réservations 
resrouter.get("/my", authenticationfilter, authorizeRole(['guest']), async (req: Request, res: Response) => {
    const user_id = req.userId;

    try {

        const sqlRequest = "SELECT r.id, r.date, r.time_start, r.time_end, g.nom AS gym_name FROM reservations r JOIN gyms g ON r.gym_id = g.id WHERE r.user_id = ? ORDER BY r.date DESC, r.time_start";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [user_id]) as any[];

        res.status(200).json({message: "Liste de vos réservations:",  result : result});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la récupération des réservations." });
    }
});

export const apiReservationRouter = resrouter; 