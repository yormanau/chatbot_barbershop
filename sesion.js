const mysql = require('mysql2/promise');

class MySQLAdapter {
    constructor(config = {}) {
        this.pool = mysql.createPool({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            port: config.port
        });
    }

    async read(key) {
        const [rows] = await this.pool.query(
            'SELECT data FROM sessions WHERE id = ?',
            [key]
        );
        return rows.length ? JSON.parse(rows[0].data) : null;
    }

    async write(key, data) {
        const json = JSON.stringify(data);
        await this.pool.query(
            `
            INSERT INTO sessions (id, data)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE data = VALUES(data)
            `,
            [key, json]
        );
    }

    async delete(key) {
        await this.pool.query(
            'DELETE FROM sessions WHERE id = ?',
            [key]
        );
    }

    async clear() {
        await this.pool.query('DELETE FROM sessions');
    }
}

module.exports = MySQLAdapter;
