/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MODO CLARO - Colores Corporativos BAP
        'bap': {
          green: '#80c398',
          'green-dark': '#6ab088',
          'green-hover': '#72b58d',
          'green-light': '#a8d5b8',
          yellow: '#fbe066',
          'yellow-hover': '#f0d55a',
          red: '#ea4c5b',
          'red-hover': '#d93a4a',
          blue: '#3b82f6',
          purple: '#a855f7',
          cyan: '#06b6d4',
          orange: '#f5a623',
        },
        
        // MODO OSCURO - Paleta de Grises Profesional
        'dark': {
          bg: '#121212',
          surface: '#1e1e1e',
          elevated: '#2a2a2a',
          hover: '#333333',
          border: '#404040',
          'border-light': '#525252',
          'text-primary': '#f5f5f5',
          'text-secondary': '#d4d4d4',
          'text-muted': '#a3a3a3',
          'text-disabled': '#737373',
          'btn-bg': '#333333',
          'btn-hover': '#404040',
          'input-bg': '#1a1a1a',
          'input-border': '#404040',
        },
        
        // Estados de Tickets (ambos modos)
        'status': {
          nuevo: { bg: '#fef3c7', text: '#92400e', darkBg: '#422006', darkText: '#fbbf24' },
          asignado: { bg: '#dbeafe', text: '#1e40af', darkBg: '#172554', darkText: '#60a5fa' },
          planificado: { bg: '#e0e7ff', text: '#3730a3', darkBg: '#1e1b4b', darkText: '#818cf8' },
          resuelto: { bg: '#d1fae5', text: '#065f46', darkBg: '#052e16', darkText: '#34d399' },
          cerrado: { bg: '#f3f4f6', text: '#374151', darkBg: '#1f2937', darkText: '#9ca3af' },
        },
        
        // Prioridades (ambos modos)
        'priority': {
          'muy_baja': { bg: '#f3f4f6', text: '#4b5563', darkBg: '#1f2937', darkText: '#9ca3af' },
          baja: { bg: '#dcfce7', text: '#166534', darkBg: '#052e16', darkText: '#4ade80' },
          media: { bg: '#dbeafe', text: '#1e40af', darkBg: '#172554', darkText: '#60a5fa' },
          alta: { bg: '#ffedd5', text: '#9a3412', darkBg: '#431407', darkText: '#fb923c' },
          'muy_alta': { bg: '#fee2e2', text: '#991b1b', darkBg: '#450a0a', darkText: '#f87171' },
        }
      },
    },
  },
  plugins: [],
  safelist: [
    // Badges de estado
    'bg-status-nuevo', 'text-status-nuevo-text',
    'bg-status-asignado', 'text-status-asignado-text',
    'bg-status-planificado', 'text-status-planificado-text',
    'bg-status-resuelto', 'text-status-resuelto-text',
    'bg-status-cerrado', 'text-status-cerrado-text',
    // Badges de prioridad
    'bg-priority-muy_baja', 'text-priority-muy_baja-text',
    'bg-priority-baja', 'text-priority-baja-text',
    'bg-priority-media', 'text-priority-media-text',
    'bg-priority-alta', 'text-priority-alta-text',
    'bg-priority-muy_alta', 'text-priority-muy_alta-text',
    // Clases de modo oscuro
    'dark:bg-dark-bg', 'dark:bg-dark-surface', 'dark:bg-dark-elevated',
    'dark:text-dark-text-primary', 'dark:text-dark-text-secondary',
    'dark:border-dark-border',
  ],
}