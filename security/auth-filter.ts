import { verifytoken } from "./jwt-auth";
import { NextFunction, Request, Response  } from "express";
import { sql_db_pool_promise } from "../src/db/mysql";

declare global {
    namespace Express {
      interface Request {
        userId?: number;
        userRole?: string;
      }
    }
}

//Je définis le middleware d'authentification 
export const authenticationfilter = async(req : Request, res : Response, next: NextFunction) : Promise<any> =>  {
    //Recuperons le header de la requete de l'utilisateur 
    const authHeader = req.headers['authorization'] as string;
    //Vérifions si la requete contient vraiment un header 
   

    if (!authHeader){
        return res.status(401).json({message : 'Unauthorised. Accès refusé'});
    }
    //S oui, alors je me charge de récuperer le token passé dans le token en retirant le préfixe Bearer 
    const token =   authHeader.replace("Bearer ", "");
    
    //Verifions si un token est vraiment passé dans le header 
    if (!token) {
        return res.status(401).json({message: "Unauthorizedd. Accè refusé"});
    }
    try {
        // Vérifions si le token est dans la base de données blacklistée
        const sqlRequest = "SELECT * FROM tokens_blacklist WHERE token = ?";
        const [result] = await sql_db_pool_promise.execute(sqlRequest, [token]) as any[];
        if (result.length > 0) {
            return res.status(401).json({ message: "Unauthorized. This token is blacklisted" });
        }
        const decoded = verifytoken(token);
       
        req.userId = decoded.userId;
        
        //Si tout est en règle elaors la requete continue 
        next();
    }catch(err){
        console.log(err);
        return res.status(401).json({message : "Erreur au niveau du filtre d'auth"});
    }
} 

// Je déifinis mtn le middelware pour les roles 
export const authorizeRole = (role: ('admin' | 'owner' | 'guest')[]) => {
    return async(req : Request, res : Response, next : NextFunction)  =>{
        const userId = req.userId
        
        if (!userId){
            res.status(401).json({message: "Unauthorizeddddddddd. Accès refusé"});
            return;
        }
        try {
             // Je récupère mtn le role de l'utilisateur 
             const sqlRequest = "SELECT role FROM users WHERE id = ?";
             const [result] = await sql_db_pool_promise.execute(sqlRequest, [userId]) as any[];
             if (result.length === 0) {
                res.status(404).json({ message: "Utilisateur non reconnu" });
                return;
            }
            const userRole = result[0].role;
            req.userRole = userRole;
            if (!role.includes(userRole)) {
                res.status(403).json({ message: "Attention vous n'avez pas les roles requis pour effectuer cet action" });
                return;
            }
            next();
        } catch (err) {
            console.log(err)
            res.status(500).json({message : "Echec"});
            
        }
    }
}