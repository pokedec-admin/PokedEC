# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


Complete Pokedex Variant System Walkthrough
I have successfully implemented a comprehensive Pokemon variant tracking system with 9 different variant types, each with its own dedicated page.

Features Implemented
1. Pokedex Table with 9 Variant Columns
Location: http://localhost:4200/pokedex
9 Trackable Variants: Shiny, Lucky, XXL, XXS, G-MAX, Méga, Obscure, Purifié, Parfait
Horizontal Scrolling: Table accommodates all columns
Region Grouping: Pokemon organized by regions (Kanto through Paldea)
2. Dedicated Variant Pages
Each variant has its own page showing only Pokemon with that variant checked:

Variant	Page URL	Icon	Description
Shiny	/shiny	✨	Alternate color Pokemon
Lucky	/lucky	🍀	Lucky Pokemon (Chanceux)
XXL	/xxl	🔴	Extra large Pokemon
XXS	/xxs	🔵	Extra small Pokemon
G-MAX	/gmax	⚡	Gigantamax form
Méga	/mega	💎	Mega evolution
Obscure	/obscure	🌑	Shadow Pokemon
Purifié	/purifie	☀️	Purified Pokemon
Parfait	/parfait	🌟	Perfect IV (100%)
3. Header Navigation
All variant pages are accessible from the header navigation bar:

Home → Pokedex → Shiny → Chanceux → XXL → XXS → G-MAX → Méga → Obscure → Purifié → Parfait → Login/Logout
How to Test
Test 1: Navigate to Variant Pages
Login at http://localhost:4200/login
Click on any variant link in the header (e.g., "XXL")
Verify: Page loads with the variant title and empty state message
Try all 9 variant pages
Test 2: Mark Pokemon with Variants
Navigate to Pokedex
Add a Pokemon (e.g., Pikachu #25)
Check multiple variant boxes: Shiny, XXL, Parfait
Verify: Checkboxes stay checked
Test 3: View Pokemon on Variant Pages
After checking "Shiny" for Pikachu
Navigate to Shiny page
Verify: Pikachu appears in the Kanto section
Navigate to XXL page
Verify: Pikachu appears there too (if XXL was checked)
Navigate to Lucky page
Verify: Pikachu does NOT appear (Lucky wasn't checked)
Test 4: Multiple Pokemon Across Regions
Add Pokemon from different regions:
Pikachu (#25) - Kanto - Mark as Shiny, XXL
Chikorita (#152) - Johto - Mark as Lucky, Purifié
Treecko (#252) - Hoenn - Mark as Parfait, Méga
Visit each variant page
Verify: Pokemon appear in their respective region sections
Database Schema
All 9 variant flags are stored in the pokedex table:

has_shiny BOOLEAN DEFAULT FALSE
has_lucky BOOLEAN DEFAULT FALSE
has_xxl BOOLEAN DEFAULT FALSE
has_xxs BOOLEAN DEFAULT FALSE
has_gmax BOOLEAN DEFAULT FALSE
has_mega BOOLEAN DEFAULT FALSE
has_obscure BOOLEAN DEFAULT FALSE
has_purifie BOOLEAN DEFAULT FALSE
has_parfait BOOLEAN DEFAULT FALSE
API Endpoints
All variants have toggle endpoints:

PATCH /pokedex/:pokemon_id/shiny
PATCH /pokedex/:pokemon_id/lucky
PATCH /pokedex/:pokemon_id/xxl
PATCH /pokedex/:pokemon_id/xxs
PATCH /pokedex/:pokemon_id/gmax
PATCH /pokedex/:pokemon_id/mega
PATCH /pokedex/:pokemon_id/obscure
PATCH /pokedex/:pokemon_id/purifie
PATCH /pokedex/:pokemon_id/parfait
Color Themes
Each variant page has a unique color theme:

Shiny: Gold (#ffd700)
Lucky: Green (#4caf50)
XXL: Red (#e74c3c)
XXS: Blue (#3498db)
G-MAX: Purple (#9b59b6)
Méga: Teal (#16a085)
Obscure: Dark Gray (#34495e)
Purifié: Orange (#f39c12)
Parfait: Orange-Red (#e67e22)
Quick Reference
To mark a Pokemon as a variant:

Go to Pokedex
Find the Pokemon in the table
Check the corresponding variant checkbox
It saves automatically
To view all Pokemon of a specific variant:

Click the variant name in the header
View Pokemon grouped by region
To unmark a variant:

Go to Pokedex
Uncheck the variant checkbox
Pokemon disappears from that variant's page