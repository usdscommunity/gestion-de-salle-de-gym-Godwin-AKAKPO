import { body } from 'express-validator';

export const buySubscriptionValidator = [
  body('pack_id')
    .notEmpty().withMessage('Le champ pack_id est requis')
    .isInt({ gt: 0 }).withMessage('pack_id doit être un entier positif'),

  body('method')
    .notEmpty().withMessage('Le champ method est requis')
    .isString().withMessage('method doit être une chaîne de caractères')
];
