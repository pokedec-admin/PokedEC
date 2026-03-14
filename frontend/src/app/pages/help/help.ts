import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Feature {
    title: string;
    description: string;
    link: string;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-help',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './help.html',
    styleUrls: ['./help.css']
})
export class HelpComponent {
    features: Feature[] = [
        {
            title: 'Tableau de bord',
            description: 'Retrouvez une vue d\'ensemble de votre progression et accédez rapidement aux fonctionnalités principales.',
            link: '/home',
            icon: '🏠',
            color: '#0ea5e9' // Sky Blue
        },
        {
            title: 'Pokédex National',
            description: 'Suivez votre progression globale vers la complétion du Pokédex (formes de base).',
            link: '/tracking/pokedex',
            icon: '📖',
            color: '#f87171' // Red Ball
        },
        {
            title: 'Standard',
            description: 'Pokémon communs non légendaires, non fabuleux et non ultra-chimères.',
            link: '/tracking/normal',
            icon: '⭐',
            color: '#94a3b8' // Slate
        },
        {
            title: 'Légendaires',
            description: 'Suivez votre collection de Pokémon légendaires.',
            link: '/tracking/legendary',
            icon: '⚜️',
            color: '#fcd34d' // Amber
        },
        {
            title: 'Fabuleux',
            description: 'Suivez votre collection de Pokémon fabuleux.',
            link: '/tracking/mythical',
            icon: '✨',
            color: '#c084fc' // Purple
        },
        {
            title: 'Ultra-Chimères',
            description: 'Suivez votre collection d\'Ultra-Chimères venues d\'une autre dimension.',
            link: '/tracking/ultra-beast',
            icon: '👾',
            color: '#2dd4bf' // Teal
        },
        {
            title: 'Shiny',
            description: 'Suivez votre collection de Pokémon chromatiques (brillants).',
            link: '/shiny',
            icon: '✨',
            color: '#eab308' // Yellow
        },
        {
            title: 'Chanceux',
            description: 'Cochez les Pokémon chanceux obtenus lors de vos échanges.',
            link: '/lucky',
            icon: '🍀',
            color: '#22c55e' // Green
        },
        {
            title: 'XXL',
            description: 'Suivez les Pokémon de tailles exceptionnelles (Très grand).',
            link: '/xxl',
            icon: '📏',
            color: '#8b5cf6' // Purple
        },
        {
            title: 'XXS',
            description: 'Suivez les Pokémon de tailles exceptionnelles (Très petit).',
            link: '/xxs',
            icon: '🤏',
            color: '#a855f7' // Light Purple
        },
        {
            title: 'G-Max',
            description: 'Gérez vos Pokémon capables de gigamaxer.',
            link: '/gmax',
            icon: '🌋',
            color: '#be185d' // Dark Pink
        },
        {
            title: 'Dynamax',
            description: 'Gérez vos Pokémon capables de dynamaxer.',
            link: '/dynamax',
            icon: '🌀',
            color: '#fdba74' // Light Orange/Peach
        },
        {
            title: 'Méga',
            description: 'Gérez vos Pokémon capables de méga-évoluer.',
            link: '/mega',
            icon: '🧬',
            color: '#ec4899' // Pink
        },
        {
            title: 'Obscure',
            description: 'Suivez les Pokémon corrompus par la Team GO Rocket.',
            link: '/obscure',
            icon: '👻',
            color: '#4b5563' // Gray
        },
        {
            title: 'Purifié',
            description: 'Suivez les Pokémon sauvés et purifiés.',
            link: '/purifie',
            icon: '🌟',
            color: '#9ca3af' // Light Gray
        },
        {
            title: 'Parfait (4*)',
            description: 'La collection ultime : vos Pokémon avec 100% d\'IV.',
            link: '/parfait',
            icon: '💯',
            color: '#f97316' // Orange
        },
        {
            title: 'Régional',
            description: 'Identifiez les Pokémon exclusifs à certaines zones géographiques du globe.',
            link: '/regional',
            icon: '📍',
            color: '#d35400' // Pumpkin Orange
        },
        {
            title: 'Formes Spéciales',
            description: 'Gérez les variantes régionales (Alola, Galar...), les formes fusionnées et les transformations spéciales. Chaque forme (Méga, Gigamax, Dynamax) est traitée comme une entrée distincte pour un suivi précis de votre collection.',
            link: '/forms',
            icon: '🎭',
            color: '#8e44ad' // Wisteria Purple
        },
        {
            title: 'Échanges',
            description: 'Gérez vos Pokémon disponibles pour l\'échange.',
            link: '/trade',
            icon: '🤝',
            color: '#3b82f6' // Blue
        },
        {
            title: 'Recherchés',
            description: 'Identifiez les Pokémon que vous recherchez et trouvez-les dans la communauté.',
            link: '/wanted',
            icon: '🔍',
            color: '#14b8a6' // Teal
        },
        {
            title: 'Profil',
            description: 'Gérez vos infos, votre équipe et vos suggestions pour l\'application.',
            link: '/profile',
            icon: '👤',
            color: '#6366f1' // Indigo
        },
        {
            title: 'Performance & Offline',
            description: 'L\'application fonctionne hors ligne grâce à son Service Worker. Un indicateur réseau dans le header vous informe en temps réel de votre état de connexion.',
            link: '/help',
            icon: '⚡',
            color: '#fbbf24' // Yellow/Amber
        },
        {
            title: 'Monitoring & Logs',
            description: 'Le système utilise Winston et Morgan pour une journalisation structurée, permettant aux administrateurs de diagnostiquer rapidement tout incident technique.',
            link: '/help',
            icon: '📊',
            color: '#64748b' // Slate/Gray
        }
    ];
}
