[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/s5Nbbx31)

# Builder l'image 
docker build -t mon-api-gym-backend 

# Lancer le conteneur 
docker run -d -p \ 3000:3000 --name mon-api-gym mon-api-gym-backend

# Lister les containeurs 
docker ps-a

# Supprimer le conteneur 
docker rm mon-api-gym  

# Stoper le conteneur 
docker stop mon-api-gym   
