import { body } from 'express-validator';

export const ValidatePacks = [
  body('gym_id')
    .notEmpty().withMessage('gym_id est requis')
    .isInt({ min: 1 }).withMessage('gym_id doit être un entier positif'),

  body('nom')
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ max: 255 }).withMessage('Le nom doit faire au maximum 255 caractères'),

  body('type')
    .notEmpty().withMessage('Le type est requis')
    .isIn(['Mensuel', 'Trimestriel', 'Annuel']).withMessage('Type invalide'),

  body('prix')
    .notEmpty().withMessage('Le prix est requis')
    .isDecimal({ decimal_digits: '0', force_decimal: false }).withMessage('Le prix doit être un nombre entier'),

  body('acces')
    .notEmpty().withMessage("L'accès est requis")
    .isIn(['illimité', 'limité']).withMessage("Valeur d'accès invalide"),

  body('description')
    .notEmpty().withMessage('La description est requise')
];
