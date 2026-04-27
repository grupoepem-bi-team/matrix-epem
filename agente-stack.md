# 📦 Agente Stack - matrix-epem

Documentación de todas las herramientas, librerías y servicios utilizados en el proyecto con su justificación.

---

## 🔧 Stack Principal

| Herramienta | Versión | Justificación | Referencia |
|-------------|---------|--------------|------------|
| **React** | 18.3.1 | Framework UI principal con componentes y estado | - |
| **TypeScript** | 5.6.2 | Tipado estático para mejor DX y menos errores | - |
| **Vite** | 6.0.0 | Build tool rápido con HMR optimizado para React | - |

---

## 📊 State Management

| Herramienta | Versión | Justificación | Referencia |
|-------------|---------|--------------|------------|
| **Zustand** | 5.0.2 | State management minimalista, mejor que Context para este caso | [Context7: /zustand/zustand-docs](https://context7.com) |

---

## 🎨 Estilización

| Herramienta | Versión | Justificación | Referencia |
|-------------|---------|--------------|------------|
| **Tailwind CSS** | 4.0.0 | Utilidades CSS para estilo rápido y consistente | [Context7: /tailwindcss/tailwindcss-docs](https://context7.com) |
| **@tailwindcss/vite** | 4.0.0 | Integración de Tailwind con Vite | - |

---

## 🖼️ Iconografía

| Herramienta | Versión | Justificación | Referencia |
|-------------|---------|--------------|------------|
| **Lucide React** | 0.460.0 | Iconos modernos y consistentes con React | - |

---

## 🧪 Testing

| Herramienta | Versión | Justificación | Referencia |
|-------------|---------|--------------|------------|
| **Vitest** | 4.1.5 | Test runner rápido compatible con Vite | [Context7: /vitest/vitest-docs](https://context7.com) |
| **@testing-library/react** | 16.3.2 | Testing de componentes React | [Context7: /testing-library/react-testing-library-docs](https://context7.com) |
| **@testing-library/jest-dom** | 6.9.1 | Matchers adicionales para Jest/DOM | - |
| **jsdom** | 29.0.2 | DOM virtual para testing | - |
| **Playwright MCP** | latest | Testing E2E automatizado | [GitHub: microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) |

---

## 🔍 Linting & Formato

| Herramienta | Versión | Justificación | Referencia |
|-------------|---------|--------------|------------|
| **ESLint** | 10.2.1 | Linting de código JS/TS | - |
| **Prettier** | 3.8.3 | Formateo de código consistente | - |
| **typescript-eslint** | 8.59.0 | ESLint para TypeScript | - |
| **eslint-plugin-react-hooks** | 7.1.1 | Validación de hooks de React | - |
| **eslint-plugin-react-refresh** | 0.5.2 | Hot reload para React | - |
| **eslint-config-prettier** | 10.1.8 | Desactivar reglas conflictivas de ESLint | - |

---

## 🌐 MCP Servers (Model Context Protocol)

| Herramienta | Tipo | Justificación | Referencia |
|-------------|------|--------------|------------|
| **Playwright MCP** | local (npx) | Automatización de browser para testing E2E de la aplicación React | [GitHub: microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) ⭐31.5k |
| **Context7 MCP** | http | Documentación actualizada de libraries (React, Zustand, Tailwind, Vitest) | [GitHub: upstash/context7](https://github.com/upstash/context7) ⭐53.9k |
| **GitHub MCP** | http (remote) | Operaciones con repositorio (commits, branches, PRs) | [GitHub: github/github-mcp-server](https://github.com/github/github-mcp-server) ⭐29.3k |

### Configuración de MCPs

```json
{
  "playwright": {
    "type": "local",
    "command": ["npx", "@playwright/mcp@latest"],
    "enabled": true
  },
  "context7": {
    "type": "http",
    "url": "https://mcp.context7.com/mcp",
    "headers": {
      "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
    },
    "enabled": true
  },
  "github": {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    "headers": {
      "Authorization": "Bearer ${GITHUB_TOKEN}"
    },
    "enabled": true
  }
}
```

> ⚠️ **Nota**: Para desarrollo local, reemplazar `${CONTEXT7_API_KEY}` y `${GITHUB_TOKEN}` con las claves reales.

---

## 📁 Estructura del Proyecto

```
matrix-epem/
├── src/
│   ├── components/     # Componentes React
│   ├── hooks/          # Custom hooks
│   ├── store/          # Zustand store
│   ├── types/          # Tipos TypeScript
│   ├── utils/          # Utilidades (tree, layout, search)
│   ├── test/           # Configuración de tests
│   ├── styles/          # Estilos globales
│   └── registry/        # Registro de componentes
├── dist/               # Build de producción
├── node_modules/       # Dependencias
└── *.md                # Documentación del proyecto
```

---

## 🚫 Herramientas Descartadas

| Herramienta | Razón |
|-------------|-------|
| **E2B MCP** | Archivado por el maintainer (Abr 2026) - no mantenido |

---

## 📋 Reglas del Agente Stack

1. **Antes de agregar una dependencia**, verificar que no duplica funcionalidad existente
2. **Para libraries desconocidas**, consultar Context7 MCP para documentación actualizada
3. **Para testing E2E**, siempre usar Playwright MCP
4. **Para cambios en el repo**, usar GitHub MCP

---

## 🔗 Recursos

- [Documentación React](https://react.dev)
- [Documentación Zustand](https://zustand.docs.pmnd.rs)
- [Documentación Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación Vitest](https://vitest.dev/guide)
- [Playwright Docs](https://playwright.dev)
- [Context7 - Docs para LLMs](https://context7.com)

---

*Última actualización: 27/04/2026*