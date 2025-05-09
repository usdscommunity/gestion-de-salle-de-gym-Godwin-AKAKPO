const jwtAuth = require('jsonwebtoken');
import dotenv from 'dotenv';
dotenv.config(); 

const jwtSecret = process.env.JWT_SECRET; 

// Je vais créer une fonction pour générer le token  d'une durée d'espiration de 1h que je vais exporter 
export const generateToken = (userId: number) => {
    return jwtAuth.sign(
        {userId},
        jwtSecret,
        {
            expiresIn: '1h',
        }
    );
}
//Je vais ensuite créer une fonction pour verifier un token que je vais aussi exporter 
export const verifytoken = (token: string) => {
    
    return jwtAuth.verify(token, jwtSecret);
}
