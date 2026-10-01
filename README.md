# 🍰 DulceArte — Apuntes personales

> 📌 Este README es para uso personal. Contiene comandos, configuraciones y datos útiles del proyecto.

---

## 📂 Proyecto

**Carpeta local:**

```text
~/Desktop/cosas de samuel/DulceArte
```

**Repositorio:**

```text
Sameiflovi/Dulcearte
```

**Rama principal:**

```text
main
```

**Repositorio privado:** ✅

---

# 🐙 GitHub

### Comprobar sesión

```bash
gh auth status
```

### Ver información del repositorio

```bash
gh repo view Sameiflovi/Dulcearte
```

### Abrir el repositorio en el navegador

```bash
gh repo view --web
```

### Cambiar a público

```bash
gh repo edit Sameiflovi/Dulcearte --visibility public --accept-visibility-change-consequences
```

### Volver a privado

```bash
gh repo edit Sameiflovi/Dulcearte --visibility private --accept-visibility-change-consequences
```

---

# 📦 Git

### Ver estado

```bash
git status
```

### Ver cambios

```bash
git diff
```

### Preparar cambios

```bash
git add .
```

### Guardar cambios

```bash
git commit -m "Descripción del cambio"
```

### Subir a GitHub

```bash
git push
```

### Descargar cambios

```bash
git pull
```

### Ver últimos commits

```bash
git log --oneline -10
```

---

# 🔄 Flujo normal

Cuando termine de hacer cambios:

```bash
git status
git add .
git commit -m "Descripción del cambio"
git push
```

💡 Si solo quiero revisar qué cambió:

```bash
git status
git diff
```

---

# 🟢 Node.js / npm

### Ver versión de Node

```bash
node --version
```

### Ver versión de npm

```bash
npm --version
```

### Actualizar npm

```bash
npm install -g npm@latest
```

### Instalar dependencias

```bash
npm install
```

---

# ☁️ Wrangler / Cloudflare

### Ver versión

```bash
npx wrangler@latest --version
```

### Ejecutar Wrangler

```bash
npx wrangler
```

---

# 🔥 Firebase

### Ver versión

```bash
firebase --version
```

### Iniciar sesión

```bash
firebase login
```

### Publicar todo

```bash
firebase deploy
```

### Publicar solamente Hosting

```bash
firebase deploy --only hosting
```

**Proyecto Firebase:**

```text
dulcearte-29
```

**Hosting:**

https://dulcearte-29.web.app/

---

# 🌐 URLs

### Firebase

https://dulcearte-29.web.app/

### GitHub

https://github.com/Sameiflovi/Dulcearte

### GitHub Pages — objetivo

https://sameiflovi.github.io/DulceArte/

---

# 📝 Comandos que uso más

### Git

```bash
git status
git add .
git commit -m "..."
git push
```

### GitHub

```bash
gh auth status
gh repo view Sameiflovi/Dulcearte
gh repo view --web
```

### Node

```bash
node --version
npm --version
npm install -g npm@latest
```

### Wrangler

```bash
npx wrangler@latest --version
```

### Firebase

```bash
firebase --version
firebase deploy --only hosting
```

---

# 💻 Terminal

Uso principalmente:

**VS Code → Terminal integrada → Git Bash**

Ruta habitual:

```text
~/Desktop/cosas de samuel/DulceArte
```

---

# ⚠️ Recordatorios

- No pegar tokens de GitHub en chats.
- Antes de hacer cambios importantes:

```bash
git status
```

- Antes de un commit grande, revisar:

```bash
git diff
```

- Después de hacer `git push`, comprobar que el commit llegó a GitHub.
- No ejecutar comandos destructivos sin comprobar primero qué hacen.

---

# 📌 Notas

Aquí puedo ir agregando comandos nuevos que vaya aprendiendo.

También puedo guardar aquí soluciones a problemas que ya haya tenido para no volver a buscarlas.
