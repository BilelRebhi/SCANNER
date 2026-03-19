# 🛡️ AI-Powered Web Vulnerability Scanner (Backend)

Bienvenue dans le dépôt du backend de la plateforme intelligente de scan de vulnérabilités web. Ce projet a été développé dans le cadre d'un Projet de Fin d'Études (PFE). 

L'objectif de cette API est de scanner automatiquement des applications web à la recherche de failles courantes (XSS, SQL Injection) et d'utiliser l'Intelligence Artificielle (Machine Learning) pour classifier les réponses du serveur et réduire drastiquement les faux positifs inhérents aux scanners classiques.

---

## ✨ Fonctionnalités Principales

*   **Authentification Sécurisée** : Inscription et connexion basées sur des tokens JWT (JSON Web Tokens).
*   **Moteur de Scan Actif** : Crawling des URL cibles, détection automatique des formulaires HTML et injection de "payloads" malveillants.
*   **Moteur IA Intégré** : Utilisation de Scikit-Learn (Random Forest) pour évaluer la vulnérabilité d'une requête HTTP en fonction de son code de statut, son temps de réponse, sa taille, et la réflexion des payloads.
*   **Historique et Rapports** : Sauvegarde complète des résultats de scan (Scores IA, failles détectées, recommandations de correction) dans une base de données relationnelle.

---

## 🛠️ Stack Technologique

*   **Framework API** : Python 3 / Flask
*   **Base de Données** : SQLAlchemy (SQLite par défaut, compatible PostgreSQL / MySQL)
*   **Intelligence Artificielle** : Scikit-Learn, Pandas, Numpy
*   **Sécurité & Auth** : Flask-JWT-Extended, Flask-Bcrypt, Flask-Cors
*   **Web Scraping** : BeautifulSoup4, Requests

---

## 🚀 Guide d'Installation et de Démarrage

Suivez ces instructions étape par étape pour faire fonctionner le projet sur votre machine locale.

### 1. Prérequis
- Avoir [Python 3.8+](https://www.python.org/downloads/) installé sur votre machine.
- Avoir `git` installé (optionnel, pour cloner le repo).

### 2. Cloner et préparer l'environnement
Ouvrez un terminal et naviguez dans le dossier `backend` :

```bash
cd backend
```

Il est fortement recommandé de créer un environnement virtuel (venv) pour isoler les dépendances Python :

```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel (Windows)
.\venv\Scripts\activate

# Activer l'environnement virtuel (Mac / Linux)
source venv/bin/activate
```

### 3. Installer les dépendances
Une fois l'environnement activé, installez les paquets requis :

```bash
pip install -r requirements.txt
```

### 4. Initialisation du projet (Base de données et IA)

Avant de lancer le serveur, vous devez initialiser la base de données SQLite et entraîner le modèle d'Intelligence Artificielle.

**A. Créer et populer la base de données :**
Exécutez le script d'insertion (Seed) qui va générer le fichier de base de données `instance/scanner.db` et y insérer les Payloads d'attaque standards (XSS, SQLi) :
```bash
python seed.py
```
*(Vous devriez voir un message indiquant le nombre de payloads insérés)*

**B. Entraîner le Modèle IA :**
Générez le modèle d'apprentissage automatique (`RandomForest`) qui servira à classifier les failles :
```bash
python ai/train_model.py
```
*(Ce script va simuler un jeu de données, entraîner le modèle, afficher sa précision, et sauvegarder le fichier `vulnerability_model.pkl` nécessaire au fonctionnement du scanner).*

### 5. Lancer le serveur d'API

Une fois la configuration terminée, vous pouvez démarrer votre instance Flask :

```bash
python app.py
```

L'API sera accessible localement à l'adresse : **`http://localhost:5000`**

---

## 📡 Liste des Endpoints (API Routes)

Toutes les requêtes vers l'API (sauf `/register` et `/login`) nécessitent d'inclure le header HTTP : `Authorization: Bearer <votre_token_jwt>`.

### Authentification (`/api/auth`)
| Méthode | Endpoint | Description | Body / Payload requis |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Créer un compte utilisateur | `{ "fullname": "...", "email": "...", "password": "..." }` |
| `POST` | `/api/auth/login` | Se connecter et obtenir un token | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Obtenir les infos du compte actuel | *Aucun (Header requis)* |

### Scans de vulnérabilités (`/api/scans`)
| Méthode | Endpoint | Description | Body / Payload requis |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/scans/` | Lancer un nouveau scan (tâche de fond) | `{ "url": "http://cible.com", "scanType": "XSS" }` (Les types: `XSS`, `SQLi`, `BOTH`) |
| `GET` | `/api/scans/` | Lister l'historique des scans | *Aucun* |
| `GET` | `/api/scans/<id>` | Obtenir le rapport détaillé d'un scan avec les scores IA | *Aucun* |
| `DELETE` | `/api/scans/<id>` | Supprimer un scan de l'historique | *Aucun* |

---

## 🏗️ Structure du Code / Architecture

- **`app.py`** : Point d'entrée de l'application Flask et initialisation des extensions (CORS, JWT, DB).
- **`config.py`** : Fichier de configuration (clés secrètes, variables d'environnement).
- **`models.py`** : Définition des schémas de la base de données (Users, Scans, Vulnerabilities, Results, etc.) en utilisant SQLAlchemy.
- **`routes/`** : Contient les contrôleurs d'API (les "Blueprints" Flask) pour l'authentification et les scans.
- **`services/scanner.py`** : Le **cœur du moteur de scan**. Il s'occupe de scrapper le site cible, d'injecter les requêtes, et de récupérer les métriques HTTP.
- **`ai/`** : Contient le code relatif à l'Intelligence Artificielle. `train_model.py` pour générer le modèle analytique, et `predictor.py` qui exploite le modèle pour prendre des décisions en temps réel pendant un scan.

---

## 📝 Auteurs
Projet PFE - Conçu pour automatiser et fiabiliser la sécurité des applications Web grâce à l'Intelligence Artificielle.
