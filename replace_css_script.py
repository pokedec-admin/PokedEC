search_text = """.cat-toggle {
    font-size: 0.75rem;
    padding: 4px 8px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    user-select: none;
    flex-grow: 1;
    text-align: center;
}

.cat-toggle:hover {
    background: #f0f0f0;
}

.cat-toggle.active {
    background: #ffcb05;
    border-color: #ffcb05;
    color: #333;
    font-weight: bold;
}

.cat-toggle.shiny.active {
    background: linear-gradient(135deg, #ffcb05 0%, #f1c40f 100%);
    color: #333;
}

.cat-toggle.lucky.active {
    background: #90ee90;
    border-color: #90ee90;
}

.cat-toggle.obscure.active {
    background: #4b0082;
    border-color: #4b0082;
    color: white;
}

.cat-toggle.purified.active {
    background: #87ceeb;
    border-color: #87ceeb;
    color: white;
}

.cat-toggle.perfect.active {
    background: #ff4500;
    border-color: #ff4500;
    color: white;
}"""

replace_text = """.cat-toggle {
    font-size: 0.75rem;
    padding: 4px 8px;
    background: #e9ecef; /* Light grey for inactive */
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s;
    user-select: none;
    flex-grow: 1;
    text-align: center;
}

.cat-toggle:hover {
    background: #f0f0f0;
}

.cat-toggle.active {
    background: #d4edda !important; /* Light green for active */
    border-color: #c3e6cb !important;
    color: #155724 !important;
    font-weight: bold;
}

.cat-toggle.shiny.active {
    background: #d4edda;
}

.cat-toggle.lucky.active {
    background: #d4edda;
}

.cat-toggle.obscure.active {
    background: #d4edda;
}

.cat-toggle.purified.active {
    background: #d4edda;
}

.cat-toggle.perfect.active {
    background: #d4edda;
}"""

with open("frontend/src/app/pages/pokedex/pokedex.css", "r") as f:
    content = f.read()

content = content.replace(search_text, replace_text)

with open("frontend/src/app/pages/pokedex/pokedex.css", "w") as f:
    f.write(content)
