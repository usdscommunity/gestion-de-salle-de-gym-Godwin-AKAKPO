import { body } from "express-validator";

export const ValidatePhotosRequest = [
  body("gym_id")
    .exists().withMessage("L'ID de la salle de gym est requis.")
    .isInt({ gt: 0 }).withMessage("L'ID de la salle de gym doit être un entier positif."),

  body("photos")
    .exists().withMessage("La liste des photos est requise.")
    .isArray({ min: 1 }).withMessage("La liste des photos doit contenir au moins une URL."),

  body("photos.*")
    .isString().withMessage("Chaque photo doit être une chaîne de caractères.")
    .isURL().withMessage("Chaque élément de la liste doit être une URL valide."),
];