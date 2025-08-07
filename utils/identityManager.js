const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');
const http = require('http');

class IdentityManager {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'chameleon.db');
        this.db = null;
        this.init();
    }

    init() {
        // Créer le dossier data s'il n'existe pas
        const fs = require('fs');
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('Erreur lors de l\'ouverture de la base de données:', err);
            } else {
                console.log('Base de données des identités connectée.');
                this.createTable();
            }
        });
    }

    createTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS identities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL UNIQUE,
                avatar_url TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        this.db.run(sql, (err) => {
            if (err) {
                console.error('Erreur lors de la création de la table:', err);
            }
        });
    }

    async validateAvatarUrl(url) {
        return new Promise((resolve) => {
            try {
                // Vérifier que l'URL est valide
                const urlObj = new URL(url);
                if (!['http:', 'https:'].includes(urlObj.protocol)) {
                    resolve(false);
                    return;
                }

                const client = urlObj.protocol === 'https:' ? https : http;
                
                const req = client.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
                    // Vérifier le code de statut
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        resolve(false);
                        return;
                    }

                    // Vérifier le type de contenu - seulement PNG, JPG/JPEG, et WebP
                    const contentType = res.headers['content-type'];
                    const allowedTypes = [
                        'image/png',
                        'image/jpeg',
                        'image/jpg',
                        'image/webp'
                    ];
                    
                    if (!contentType || !allowedTypes.includes(contentType.toLowerCase())) {
                        resolve(false);
                        return;
                    }

                    resolve(true);
                });

                req.on('error', () => {
                    resolve(false);
                });

                req.on('timeout', () => {
                    req.destroy();
                    resolve(false);
                });

                req.setTimeout(5000);
                req.end();

            } catch (error) {
                resolve(false);
            }
        });
    }

    async addIdentity(userId, name, avatarUrl) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO identities (user_id, name, avatar_url) VALUES (?, ?, ?)`;
            this.db.run(sql, [userId, name, avatarUrl], function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        reject(new Error('Une identité avec ce nom existe déjà.'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve({ id: this.lastID, userId, name, avatarUrl });
                }
            });
        });
    }

    async getIdentity(name) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM identities WHERE name = ?`;
            this.db.get(sql, [name], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getAllIdentities() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM identities ORDER BY name`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getAllIdentityNames() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT name FROM identities ORDER BY name`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.name));
                }
            });
        });
    }

    async deleteIdentity(name) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM identities WHERE name = ?`;
            this.db.run(sql, [name], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    async updateIdentity(name, newName, newAvatarUrl) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE identities SET name = ?, avatar_url = ? WHERE name = ?`;
            this.db.run(sql, [newName, newAvatarUrl, name], function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        reject(new Error('Une identité avec ce nom existe déjà.'));
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Erreur lors de la fermeture de la base de données:', err);
                } else {
                    console.log('Base de données fermée.');
                }
            });
        }
    }
}

module.exports = new IdentityManager();
