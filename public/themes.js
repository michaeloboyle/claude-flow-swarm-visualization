/**
 * Theme System for Claude Flow Swarm Visualization
 * Supports popular Obsidian and VSCode themes
 */

const THEMES = {
  // VSCode Themes
  'vscode-dark': {
    name: 'VSCode Dark',
    type: 'dark',
    background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%)',
    panel: 'rgba(37, 37, 38, 0.95)',
    panelBorder: 'rgba(69, 69, 69, 0.3)',
    text: '#cccccc',
    textSecondary: '#969696',
    accent: '#007acc',
    success: '#89d185',
    warning: '#ffcc02',
    error: '#f44747',
    network: 'rgba(30, 30, 30, 0.8)',
    nodes: {
      GlobalAgent: '#569cd6',      // Blue
      Workspace: '#4ec9b0',        // Teal
      CoordinationHub: '#f97583',  // Pink
      Task: '#ffab70',             // Orange
      File: '#b5cea8',             // Green
      Analysis: '#c586c0'          // Purple
    },
    edges: {
      default: '#616161',
      active: '#007acc',
      collaboration: '#c586c0'
    }
  },

  'vscode-light': {
    name: 'VSCode Light',
    type: 'light',
    background: 'linear-gradient(135deg, #ffffff 0%, #f3f3f3 100%)',
    panel: 'rgba(255, 255, 255, 0.95)',
    panelBorder: 'rgba(0, 0, 0, 0.1)',
    text: '#333333',
    textSecondary: '#6c6c6c',
    accent: '#005a9e',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    network: 'rgba(248, 248, 248, 0.9)',
    nodes: {
      GlobalAgent: '#0451a5',
      Workspace: '#0e8174',
      CoordinationHub: '#d73a49',
      Task: '#e36209',
      File: '#22863a',
      Analysis: '#6f42c1'
    },
    edges: {
      default: '#586069',
      active: '#005a9e',
      collaboration: '#6f42c1'
    }
  },

  'github-dark': {
    name: 'GitHub Dark',
    type: 'dark',
    background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
    panel: 'rgba(22, 27, 34, 0.95)',
    panelBorder: 'rgba(48, 54, 61, 0.5)',
    text: '#f0f6fc',
    textSecondary: '#7d8590',
    accent: '#238636',
    success: '#2ea043',
    warning: '#fb8500',
    error: '#f85149',
    network: 'rgba(13, 17, 23, 0.8)',
    nodes: {
      GlobalAgent: '#58a6ff',
      Workspace: '#39d353',
      CoordinationHub: '#f85149',
      Task: '#ffab70',
      File: '#7c3aed',
      Analysis: '#d2a8ff'
    },
    edges: {
      default: '#30363d',
      active: '#238636',
      collaboration: '#d2a8ff'
    }
  },

  // Obsidian Themes
  'obsidian-default': {
    name: 'Obsidian Default',
    type: 'dark',
    background: 'linear-gradient(135deg, #202020 0%, #2a2a2a 100%)',
    panel: 'rgba(30, 30, 30, 0.95)',
    panelBorder: 'rgba(66, 66, 66, 0.4)',
    text: '#dcddde',
    textSecondary: '#a2a3a5',
    accent: '#7c3aed',
    success: '#00b894',
    warning: '#fdcb6e',
    error: '#e17055',
    network: 'rgba(32, 32, 32, 0.9)',
    nodes: {
      GlobalAgent: '#7c3aed',
      Workspace: '#00b894',
      CoordinationHub: '#fd79a8',
      Task: '#fdcb6e',
      File: '#74b9ff',
      Analysis: '#a29bfe'
    },
    edges: {
      default: '#484848',
      active: '#7c3aed',
      collaboration: '#fd79a8'
    }
  },

  'obsidian-minimal': {
    name: 'Obsidian Minimal',
    type: 'light',
    background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
    panel: 'rgba(255, 255, 255, 0.95)',
    panelBorder: 'rgba(0, 0, 0, 0.08)',
    text: '#2e3338',
    textSecondary: '#6c7680',
    accent: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    network: 'rgba(248, 250, 252, 0.9)',
    nodes: {
      GlobalAgent: '#6366f1',
      Workspace: '#10b981',
      CoordinationHub: '#f43f5e',
      Task: '#f59e0b',
      File: '#8b5cf6',
      Analysis: '#06b6d4'
    },
    edges: {
      default: '#d1d5db',
      active: '#6366f1',
      collaboration: '#f43f5e'
    }
  },

  'catppuccin-mocha': {
    name: 'Catppuccin Mocha',
    type: 'dark',
    background: 'linear-gradient(135deg, #1e1e2e 0%, #11111b 100%)',
    panel: 'rgba(30, 30, 46, 0.95)',
    panelBorder: 'rgba(88, 91, 112, 0.3)',
    text: '#cdd6f4',
    textSecondary: '#a6adc8',
    accent: '#89b4fa',
    success: '#a6e3a1',
    warning: '#f9e2af',
    error: '#f38ba8',
    network: 'rgba(17, 17, 27, 0.9)',
    nodes: {
      GlobalAgent: '#89b4fa',  // Blue
      Workspace: '#a6e3a1',   // Green
      CoordinationHub: '#f38ba8', // Pink
      Task: '#fab387',         // Peach
      File: '#94e2d5',         // Teal
      Analysis: '#cba6f7'      // Mauve
    },
    edges: {
      default: '#585b70',
      active: '#89b4fa',
      collaboration: '#f38ba8'
    }
  },

  'dracula': {
    name: 'Dracula',
    type: 'dark',
    background: 'linear-gradient(135deg, #282a36 0%, #1e1f29 100%)',
    panel: 'rgba(40, 42, 54, 0.95)',
    panelBorder: 'rgba(68, 71, 90, 0.4)',
    text: '#f8f8f2',
    textSecondary: '#6272a4',
    accent: '#bd93f9',
    success: '#50fa7b',
    warning: '#f1fa8c',
    error: '#ff5555',
    network: 'rgba(30, 31, 41, 0.9)',
    nodes: {
      GlobalAgent: '#bd93f9',  // Purple
      Workspace: '#50fa7b',    // Green
      CoordinationHub: '#ff79c6', // Pink
      Task: '#ffb86c',         // Orange
      File: '#8be9fd',         // Cyan
      Analysis: '#ff79c6'      // Pink
    },
    edges: {
      default: '#44475a',
      active: '#bd93f9',
      collaboration: '#ff79c6'
    }
  },

  'nord': {
    name: 'Nord',
    type: 'dark',
    background: 'linear-gradient(135deg, #2e3440 0%, #1f2329 100%)',
    panel: 'rgba(46, 52, 64, 0.95)',
    panelBorder: 'rgba(76, 86, 106, 0.4)',
    text: '#eceff4',
    textSecondary: '#d8dee9',
    accent: '#88c0d0',
    success: '#a3be8c',
    warning: '#ebcb8b',
    error: '#bf616a',
    network: 'rgba(31, 35, 41, 0.9)',
    nodes: {
      GlobalAgent: '#5e81ac',  // Blue
      Workspace: '#a3be8c',    // Green
      CoordinationHub: '#b48ead', // Purple
      Task: '#d08770',         // Orange
      File: '#88c0d0',         // Cyan
      Analysis: '#b48ead'      // Purple
    },
    edges: {
      default: '#4c566a',
      active: '#88c0d0',
      collaboration: '#b48ead'
    }
  }
};

class ThemeManager {
  constructor() {
    this.currentTheme = 'vscode-dark';
    this.themes = THEMES;
  }

  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`Theme ${themeName} not found`);
      return false;
    }

    const theme = this.themes[themeName];
    this.currentTheme = themeName;

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--bg-gradient', theme.background);
    root.style.setProperty('--panel-bg', theme.panel);
    root.style.setProperty('--panel-border', theme.panelBorder);
    root.style.setProperty('--text-color', theme.text);
    root.style.setProperty('--text-secondary', theme.textSecondary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--success-color', theme.success);
    root.style.setProperty('--warning-color', theme.warning);
    root.style.setProperty('--error-color', theme.error);
    root.style.setProperty('--network-bg', theme.network);

    // Update visualization colors if it exists
    if (window.swarmVis) {
      this.updateVisualizationTheme(theme);
    }

    // Save preference
    localStorage.setItem('swarm-viz-theme', themeName);

    console.log(`Applied theme: ${theme.name}`);
    return true;
  }

  updateVisualizationTheme(theme) {
    // Update node colors
    if (window.swarmVis.nodeColors) {
      Object.assign(window.swarmVis.nodeColors, theme.nodes);
    }

    // Update network options
    if (window.swarmVis.network) {
      window.swarmVis.network.setOptions({
        nodes: {
          font: { color: theme.text }
        },
        edges: {
          color: {
            color: theme.edges.default,
            highlight: theme.edges.active
          }
        }
      });

      // Redraw to apply changes
      window.swarmVis.network.redraw();
    }
  }

  getAvailableThemes() {
    return Object.keys(this.themes).map(key => ({
      id: key,
      name: this.themes[key].name,
      type: this.themes[key].type
    }));
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  loadSavedTheme() {
    const saved = localStorage.getItem('swarm-viz-theme');
    if (saved && this.themes[saved]) {
      this.applyTheme(saved);
    } else {
      this.applyTheme('vscode-dark'); // Default
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { THEMES, ThemeManager };
} else {
  window.THEMES = THEMES;
  window.ThemeManager = ThemeManager;
}