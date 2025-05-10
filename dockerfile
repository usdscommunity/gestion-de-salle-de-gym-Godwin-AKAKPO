#Créons l'image de base 
FROM node:22.14.0-alpine

#Ensuite nous allos monter le dossier du travail 
WORKDIR /src

#Copions les fichiers de dependances 
COPY package*.json ./

#Installations des dependances 
RUN apk add --no-cache build-base python3
RUN npm install
RUN npm install -g nodemon ts-node typescript


#Copions le code source du  projet 
COPY . .

#On expose ensuite le port 
EXPOSE 3000

#Commande de demarrage 
CMD ["npm", "run", "dev"] 