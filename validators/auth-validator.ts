import { body } from 'express-validator';

export const ValidateRegister = [
    body('email')
        .notEmpty().withMessage('L’email est requis.')
        .isEmail().withMessage('Email invalide.'),

    body('password')
        .notEmpty().withMessage('Le mot de passe est requis.')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),

    body('name')
        .notEmpty().withMessage('Le nom est requis.')
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères.'),
];

export const ValidateLogin = [
    body('email')
        .notEmpty().withMessage('L’email est requis.')
        .isEmail().withMessage('Email invalide.'),

    body('password')
        .notEmpty().withMessage('Le mot de passe est requis.')
        .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.'),
];


