import sys

search_text = """        const form_name = req.query.form || 'Normal';
        const query = `UPDATE pokedex
                 SET ${field} = NOT ${field}
                 WHERE user_id = $1 AND pokemon_id = $2 AND form_name = $3
                 RETURNING * `;
        const params = [req.user.id, pokemon_id, form_name];"""

replace_text = """        const form_name = req.query.form || 'Normal';
        const query = `INSERT INTO pokedex (user_id, pokemon_id, form_name, ${field})
                 VALUES ($1, $2, $3, true)
                 ON CONFLICT (user_id, pokemon_id, form_name)
                 DO UPDATE SET ${field} = NOT pokedex.${field}
                 RETURNING *`;
        const params = [req.user.id, pokemon_id, form_name];"""

with open("backend/src/routes/pokedex.js", "r") as f:
    content = f.read()

# Since I don't know if it's spaces or tabs, I'll do a more flexible match or just use simple string replace if I'm sure
content = content.replace(search_text, replace_text)

with open("backend/src/routes/pokedex.js", "w") as f:
    f.write(content)
