# React + TypeScript + Vite

## Development role simulator

Run `npm run dev` and open the app through the Power Apps development host.
The **Development role simulator** above the page heading lets you choose Admin,
Product Manager, Location Manager, combined managers, Read-only, or No access.
Choose **My actual permissions** to stop simulating. Reloading the app resets
the selection; Refresh data keeps the selected role and rechecks actual grants.
Switching roles closes forms, discards unsaved changes, and reloads accessible data.

The Dataverse environment variable **App Mode** (`practmp_AppMode`) controls
availability at runtime. Set its value to `development` to enable the simulator.
Values `uat`, `production`, blank, missing, or unrecognized values disable it;
failed reads also disable it without blocking normal app access. Case and surrounding
whitespace are ignored. Startup, Refresh data, and role changes recheck the value.
Use `npm run build` for every environment. Local development and the legacy
`build:simulation` command cannot override App Mode.

Navigation displays App Mode in non-production environments, including `UAT`.
The label and value are hidden when the mode is `production` or still loading.
Missing configuration and failed reads display `Not configured` and `Unavailable`.

Presets follow the role policies documented in `solutions/README.md` and only
restrict your actual privileges. They apply to navigation, data loading, buttons,
and action handlers. They do not impersonate another user or test Dataverse
server-side role enforcement, ownership, or record-level access. Requests still
run as your school account, and saves/deletes change real environment data.

Verify with `node --test tests/*.test.ts`, `npm run build`, and `npm run lint`.

## Product change history

Open a Product to see its latest 50 Dataverse audit events, including who made
the change, when it happened, and field-level old and new values. The app loads
history only after the user opens a Product and has already passed the Product
read-permission gate. Dataverse also requires the user's security role to include
**View Audit History** and **View Audit Summary**; the app shows a permission
message when either server-side privilege is missing.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

It is preconfigured to work with Power Apps Code Apps.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
