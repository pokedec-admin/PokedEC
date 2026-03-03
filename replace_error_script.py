search_text = """        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pokemon not found in pokedex' });
        }"""

replace_text = """        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Failed to toggle pokemon' });
        }"""

with open("backend/src/routes/pokedex.js", "r") as f:
    content = f.read()

content = content.replace(search_text, replace_text)

with open("backend/src/routes/pokedex.js", "w") as f:
    f.write(content)
