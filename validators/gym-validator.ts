import { body } from 'express-validator';

export const ValidateGym = [
    body('nom')
        .notEmpty().withMessage('Le nom est requis.')
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères.'),

    body('adress')
        .notEmpty().withMessage('L’adresse est requise.')
        .isLength({ min: 5 }).withMessage('L’adresse doit contenir au moins 5 caractères.'),

    body('capacite')
        .notEmpty().withMessage('La capacité est requise.')
        .isInt({ min: 1 }).withMessage('La capacité doit être un entier supérieur à 0.'),

    body('statut')
        .notEmpty().withMessage('Le statut est requis.')
        .isIn(['ouvert', 'fermé']).withMessage('Le statut doit être "ouvert" ou "fermé".'),

    body('id_owner')
        .notEmpty().withMessage("L'identifiant du propriétaire est requis.")
        .isInt({ min: 1 }).withMessage("L'identifiant du propriétaire doit être un entier positif."),

    body('equipement')
        .notEmpty().withMessage("L'équipement est requis.")
        .isString().withMessage("L'équipement doit être une chaîne de caractères.")
];
