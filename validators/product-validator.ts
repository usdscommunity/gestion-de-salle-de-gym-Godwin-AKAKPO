import { body } from 'express-validator';

export const ProductValidator = [

    body('name')
        .notEmpty()
        .withMessage("Le nom est requis."),

    body('description')
        .isLength({ min: 5 })
        .withMessage("La description est trop courte."),

    body('price')
        .isFloat({ gt: 0 })
        .withMessage("Le prix doit être un nombre positif."),

    body('stock')
        .isInt({ min: 0 })
        .withMessage("Le stock doit être un entier positif."),

    body('category')
        .notEmpty()
        .withMessage("La catégorie est requise."),

    body('gymId')
        .isInt()
        .withMessage("L'identifiant de la salle (gymId) est requis."),
];

export const reviewValidator = [
    body("product_id")
      .notEmpty().withMessage("L'identifiant du produit est requis.")
      .isInt({ min: 1 }).withMessage("L'identifiant du produit doit être un entier positif."),
  
    body("note")
      .notEmpty().withMessage("La note est requise.")
      .isInt({ min: 1, max: 5 }).withMessage("La note doit être un entier entre 1 et 5."),
  
    body("commentaire")
      .notEmpty().withMessage("Le commentaire est requis")
      .isString().withMessage("Le commentaire doit être une chaîne de caractères.")
      .isLength({ max: 1000 }).withMessage("Le commentaire ne doit pas dépasser 1000 caractères.")
];