// Pokemon reference tables models
const createClassificationsTable = async (pool) => {
    const query = `
        CREATE TABLE IF NOT EXISTS classifications (
            id SERIAL PRIMARY KEY,
            name_key VARCHAR(50) UNIQUE NOT NULL,
            name_fr VARCHAR(50) NOT NULL,
            name_en VARCHAR(50) NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0
        )
    `;
    return pool.query(query);
};

const createRegionsTable = async (pool) => {
    const query = `
        CREATE TABLE IF NOT EXISTS regions (
            id SERIAL PRIMARY KEY,
            name_key VARCHAR(50) UNIQUE NOT NULL,
            name_fr VARCHAR(50) NOT NULL,
            name_en VARCHAR(50) NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0,
            is_custom BOOLEAN DEFAULT false
        )
    `;
    return pool.query(query);
};

const createTypesTable = async (pool) => {
    const query = `
        CREATE TABLE IF NOT EXISTS types (
            id SERIAL PRIMARY KEY,
            name_key VARCHAR(50) UNIQUE NOT NULL,
            name_fr VARCHAR(50) NOT NULL,
            name_en VARCHAR(50) NOT NULL,
            color_hex VARCHAR(7)
        )
    `;
    return pool.query(query);
};

const syncInitialData = async (pool) => {
    console.log('ℹ️ syncInitialData: No new reference data to sync.');
    return Promise.resolve();
};

module.exports = {
    createClassificationsTable,
    createRegionsTable,
    createTypesTable,
    syncInitialData
};
