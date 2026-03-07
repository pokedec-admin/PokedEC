const { getPool } = require('../index');

/**
 * Trade Engine Service
 * Handles calculation of trade matches between users based on what they have for trade
 * and what others are missing (wanted).
 */

/**
 * Finds users who have Pokémon that the specified user is missing.
 * @param {Object} pool - Postgres pool
 * @param {number} userId - The ID of the user seeking Pokémon
 * @returns {Promise<Array>} - List of matches
 */
const findMatchesForUser = async (pool, userId) => {
    // This query finds:
    // 1. Other users (B) who have a Pokémon flagged for trade
    // 2. That the current user (A) is missing in that specific category
    const query = `
        WITH user_seeking AS (
            -- Categories the current user is missing
            SELECT 
                pm.pokemon_id, 
                pm.form_name,
                pm.name_fr,
                pm.image_url,
                pca.can_be_shiny,
                pca.can_be_xxl,
                pca.can_be_xxs,
                pca.can_be_gmax,
                pca.can_be_dynamax,
                pca.can_be_mega,
                pca.can_be_purified,
                -- Flags for what user A is missing
                (p.pokemon_id IS NULL OR NOT p.has_normal) as needs_normal,
                (pca.can_be_shiny AND (p.pokemon_id IS NULL OR NOT p.has_shiny)) as needs_shiny,
                (pca.can_be_xxl AND (p.pokemon_id IS NULL OR NOT p.has_xxl)) as needs_xxl,
                (pca.can_be_xxs AND (p.pokemon_id IS NULL OR NOT p.has_xxs)) as needs_xxs,
                (pca.can_be_gmax AND (p.pokemon_id IS NULL OR NOT p.has_gmax)) as needs_gmax,
                (pca.can_be_dynamax AND (p.pokemon_id IS NULL OR NOT p.has_dynamax)) as needs_dynamax,
                (pca.can_be_mega AND (p.pokemon_id IS NULL OR NOT p.has_mega)) as needs_mega,
                (pca.can_be_purified AND (p.pokemon_id IS NULL OR NOT p.has_purifie)) as needs_purified
            FROM pokemon_master pm
            LEFT JOIN pokemon_category_availability pca ON pm.pokemon_id = pca.pokemon_id AND pm.form_name = pca.form_name
            LEFT JOIN pokedex p ON pm.pokemon_id = p.pokemon_id AND pm.form_name = p.form_name AND p.user_id = $1
            WHERE pm.is_available = true
        )
        SELECT 
            us.pokemon_id,
            us.form_name,
            us.name_fr as pokemon_name,
            us.image_url,
            u.id as trader_id,
            u.trainer_name as trader_username,
            u.email as trader_email,
            -- What specific category is matched
            CASE 
                WHEN us.needs_normal AND p_other.has_trade THEN 'Normal'
                WHEN us.needs_shiny AND p_other.trade_shiny THEN 'Shiny'
                WHEN us.needs_xxl AND p_other.trade_xxl THEN 'XXL'
                WHEN us.needs_xxs AND p_other.trade_xxs THEN 'XXS'
                WHEN us.needs_gmax AND p_other.trade_gmax THEN 'G-MAX'
                WHEN us.needs_dynamax AND p_other.trade_dynamax THEN 'Dynamax'
                WHEN us.needs_mega AND p_other.trade_mega THEN 'Méga'
                WHEN us.needs_purified AND p_other.trade_purified THEN 'Purifié'
            END as match_category
        FROM user_seeking us
        JOIN pokedex p_other ON us.pokemon_id = p_other.pokemon_id AND us.form_name = p_other.form_name
        JOIN trainers u ON p_other.user_id = u.id
        WHERE p_other.user_id != $1
        AND (
            (us.needs_normal AND p_other.has_trade) OR
            (us.needs_shiny AND p_other.trade_shiny) OR
            (us.needs_xxl AND p_other.trade_xxl) OR
            (us.needs_xxs AND p_other.trade_xxs) OR
            (us.needs_gmax AND p_other.trade_gmax) OR
            (us.needs_dynamax AND p_other.trade_dynamax) OR
            (us.needs_mega AND p_other.trade_mega) OR
            (us.needs_purified AND p_other.trade_purified)
        )
        ORDER BY us.pokemon_id ASC, u.trainer_name ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
};

/**
 * Finds "Double Cross-Matches" where User A has something B wants AND B has something A wants.
 * @param {Object} pool - Postgres pool
 * @param {number} userId - The ID of the current user
 * @returns {Promise<Array>} - List of mutual matches
 */
const findMutualMatches = async (pool, userId) => {
    // 1. Find who has what I want
    const myMatches = await findMatchesForUser(pool, userId);
    
    // 2. For each user who has what I want, check if I have what they want
    const mutualMatches = [];
    const uniqueTraders = [...new Set(myMatches.map(m => m.trader_id))];
    
    for (const traderId of uniqueTraders) {
        const traderMatches = await findMatchesForUser(pool, traderId);
        const iHaveWhatTheyWant = traderMatches.filter(m => m.trader_id === userId);
        
        if (iHaveWhatTheyWant.length > 0) {
            const whatIWant = myMatches.filter(m => m.trader_id === traderId);
            mutualMatches.push({
                trader_id: traderId,
                trader_username: whatIWant[0].trader_username,
                trader_email: whatIWant[0].trader_email,
                they_have: whatIWant,
                you_have: iHaveWhatTheyWant
            });
        }
    }
    
    return mutualMatches;
};

module.exports = {
    findMatchesForUser,
    findMutualMatches
};
