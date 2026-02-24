import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import mermaid from 'mermaid';

interface Section {
    title: string;
    expanded: boolean;
    content: 'trainers' | 'pokedex' | 'pokemon_master' | 'references' | 'verification' | 'categories' | 'names' | 'suggestions' | 'logic' | 'relationships' | 'files';
}

@Component({
    selector: 'app-schema-help',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './schema-help.html',
    styleUrls: ['./schema-help.css']
})
export class SchemaHelpComponent implements OnInit, AfterViewInit {
    mermaidDiagram = `
erDiagram
    trainers ||--o{ pokedex : "owns"
    trainers ||--o{ suggestions : "submits"
    trainers ||--o{ pokemon_category_availability : "configures (admin)"
    trainers ||--o{ pokemon_master : "updates (admin)"
    trainers ||--o{ trade_requests : "initiates/receives"
    
    pokemon_master ||--o{ pokedex : "defines"
    pokemon_master }|--|| classifications : "has"
    pokemon_master }|--|| regions : "belongs to"
    pokemon_master }|--|| types : "has primary"
    pokemon_master }|--|| types : "has secondary"
    
    trainers {
        INT id PK
        VARCHAR email
        VARCHAR password
        VARCHAR trainer_name UK
        VARCHAR team
        TEXT[] contact_methods
        BOOLEAN email_verified
        BOOLEAN is_active
        BOOLEAN is_admin
        VARCHAR preferred_language
        UUID supabase_uid
        TIMESTAMP created_at
    }
    
    pokemon_master {
        INT pokemon_id PK
        VARCHAR name_fr
        VARCHAR name_en
        VARCHAR name_de
        VARCHAR name_it
        TEXT image_url
        BOOLEAN is_available
        INT classification_id FK
        INT region_id FK
        INT type_primary_id FK
        INT type_secondary_id FK
        VARCHAR trade_status
        INT updated_by FK
        TIMESTAMP updated_at
    }
    
    pokedex {
        INT id PK
        INT trainer_id FK
        INT pokemon_id FK
        VARCHAR name
        BOOLEAN has_shiny
        BOOLEAN has_lucky
        BOOLEAN has_xxl
        BOOLEAN has_xxs
        BOOLEAN has_trade
        TIMESTAMP created_at
    }
    
    email_verification_codes {
        INT id PK
        VARCHAR email
        VARCHAR code
        BOOLEAN verified
        INT attempts
        TIMESTAMP created_at
    }

    classifications {
        INT id PK
        VARCHAR name_key UK
        VARCHAR name_fr
        VARCHAR name_en
    }

    regions {
        INT id PK
        VARCHAR name_key UK
        VARCHAR name_fr
        VARCHAR name_en
        BOOLEAN is_custom
    }

    types {
        INT id PK
        VARCHAR name_key UK
        VARCHAR name_fr
        VARCHAR name_en
        VARCHAR color_hex
    }
    `;

    sections: Section[] = [
        { title: 'Table: trainers', expanded: false, content: 'trainers' },
        { title: 'Table: pokedex', expanded: false, content: 'pokedex' },
        { title: 'Table: pokemon_master', expanded: false, content: 'pokemon_master' },
        { title: 'Reference Tables (Classifications, Regions, Types)', expanded: false, content: 'references' },
        { title: 'Table: email_verification_codes', expanded: false, content: 'verification' },
        { title: 'Table: pokemon_category_availability', expanded: false, content: 'categories' },
        { title: 'Table: pokemon_names', expanded: false, content: 'names' },
        { title: 'Table: suggestions', expanded: false, content: 'suggestions' },
        { title: 'Key Business Logic', expanded: false, content: 'logic' },
        { title: 'Database Relationships', expanded: false, content: 'relationships' },
        { title: 'File Index', expanded: false, content: 'files' }
    ];

    ngOnInit() {
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Arial, sans-serif'
        });
    }

    ngAfterViewInit() {
        setTimeout(() => {
            mermaid.contentLoaded();
        }, 100);
    }

    toggleSection(index: number) {
        this.sections[index].expanded = !this.sections[index].expanded;
    }

    expandAll() {
        this.sections.forEach(s => s.expanded = true);
    }

    collapseAll() {
        this.sections.forEach(s => s.expanded = false);
    }
}
