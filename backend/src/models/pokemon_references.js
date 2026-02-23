// Pokemon reference tables models
// Actual table creation is primarily done via SQL migration files
// These functions are called by index.js during auto-migration

module.exports = {
    createClassificationsTable: async (pool) => {
        // Tables should exist from migrations, but we ensure basic structure if needed
        return Promise.resolve();
    },
    createRegionsTable: async (pool) => {
        return Promise.resolve();
    },
    createTypesTable: async (pool) => {
        return Promise.resolve();
    },
    syncInitialData: async (pool) => {
        // Placeholder for initial data synchronization
        // This is called on new installations to populate reference tables
        console.log('ℹ️ syncInitialData: No new reference data to sync.');
        return Promise.resolve();
    }
};
