import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Tech {
    name: string;
    description: string;
    url: string;
    icon: string;
}

@Component({
    selector: 'app-credits',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './credits.html',
    styleUrls: ['./credits.css']
})
export class CreditsComponent {
    technologies: Tech[] = [
        {
            name: 'Angular',
            description: 'Framework Frontend par Google',
            url: 'https://angular.io/',
            icon: '🅰️'
        },
        {
            name: 'Node.js',
            description: 'Runtime JavaScript Backend',
            url: 'https://nodejs.org/',
            icon: '🟢'
        },
        {
            name: 'PostgreSQL',
            description: 'Base de données relationnelle',
            url: 'https://www.postgresql.org/',
            icon: '🐘'
        },
        {
            name: 'Docker',
            description: 'Conteneurisation',
            url: 'https://www.docker.com/',
            icon: '🐳'
        },
        {
            name: 'Nginx',
            description: 'Serveur Web & Proxy',
            url: 'https://nginx.org/',
            icon: '🌐'
        },
        {
            name: 'PokéAPI',
            description: 'Source de données & Images',
            url: 'https://pokeapi.co/',
            icon: '⚡'
        },
        {
            name: 'Antigravity',
            description: 'L\'IDE du Futur',
            url: 'https://antigravity.google/',
            icon: '🚀'
        }
    ];
}
