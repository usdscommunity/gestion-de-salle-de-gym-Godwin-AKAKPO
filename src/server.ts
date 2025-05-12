import express from 'express';
import {Request, Response} from "express";
import {apiauthrouter} from '../src/Controllers/authenticationrouter';
import {apigymRouter} from '../src/Controllers/gymsrouter';
import {apiabonRouter} from '../src/Controllers/abonnementrouter';
import {apiboutiquerouter} from '../src/Controllers/boutiquerouter';
import {apiReservationRouter} from '../src/Controllers/reservationsrouter'
import { authenticationfilter } from '../security/auth-filter'; // Import de ton middleware
import rateLimiter from './rate-limit';
import {apiimgRouter} from '../src/Controllers/gallerymanagerouter'
const helmet = require('helmet');
const cors = require('cors');
const appExpress = express();


import dotenv from "dotenv";
dotenv.config();
// Ajouton la Sécurité avec Helmet
appExpress.use(helmet());
// Ajoutons la sécurité avec CORS pour autoriser les requêtes de différents domaines
appExpress.use(cors());
appExpress.use(express.json());
//Limitation du nombre de requete par minute 
appExpress.use(rateLimiter);

appExpress.use('/auth', apiauthrouter);
appExpress.use('/gyms', apigymRouter);
appExpress.use('/subscriptions', apiabonRouter);
appExpress.use('/products', apiboutiquerouter);
appExpress.use('/photos',  apiimgRouter);
appExpress.use('/reservations', apiReservationRouter);

appExpress.get("/", async(req : Request, res : Response ) => {
  res.send("Bienvenue sur la gestion de salle de gym !");
});

//console.log("JWT_SECRET:", process.env.JWT_SECRET); ///Faisons démarrer le serveur 
//console.log(process.env.DB_NAME); 
appExpress.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});