import { body } from "express-validator";

export const validateReservation = [
  body("gym_id")
    .notEmpty().withMessage("Le champ 'gym_id' est requis.")
    .isInt().withMessage("Le champ 'gym_id' doit être un entier."),
  
  body("date")
    .notEmpty().withMessage("Le champ 'date' est requis.")
    .isISO8601().withMessage("Le champ 'date' doit être une date valide (YYYY-MM-DD)."),

  body("time_start")
    .notEmpty().withMessage("Le champ 'time_start' est requis.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Le champ 'time_start' doit être une heure valide au format HH:MM."),

  body("time_end")
    .notEmpty().withMessage("Le champ 'time_end' est requis.")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Le champ 'time_end' doit être une heure valide au format HH:MM."),
];
