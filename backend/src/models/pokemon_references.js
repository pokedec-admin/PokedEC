// Pokemon reference tables models
// These tables don't need pool require since they're called from index.js migration
// which already has pool access

module.exports = {
    // These are placeholder exports - actual table creation is done via SQL migration files
    // The models here are just to maintain consistency with other model files
    createClassificationsTable: () => {
        // Table created via migrations/create_classifications.sql
        return Promise.resolve();
    },
    createRegionsTable: () => {
        // Table created via migrations/create_regions.sql
        return Promise.resolve();
    },
    createTypesTable: () => {
        // Table created via migrations/create_types.sql
        return Promise.resolve();
    }
};
