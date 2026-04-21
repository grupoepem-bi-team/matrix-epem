# 📌 Proyecto: Navegador de Documentos BI - EPEM

## 1. Propósito

Este documento define el objetivo canónico del proyecto y actúa como la fuente única de verdad durante todo el desarrollo.

Cualquier decisión técnica, de diseño o funcional debe validarse contra este documento.

---

## 2. Objetivo Principal

Construir una aplicación web que permita:

> Organizar, visualizar y navegar documentos del Departamento de BI de EPEM mediante una estructura jerárquica clara, utilizando una interfaz moderna con estética inspirada en n8n.

---

## 3. Definición Correcta del Producto

El sistema ES:

- Un explorador de documentos
- Un gestor visual de información BI
- Una estructura jerárquica (tipo árbol)

El sistema NO ES:

- Un workflow engine
- Un sistema tipo n8n funcional
- Un canvas libre con conexiones
- Un sistema de automatización

---

## 4. Principio Clave (Regla de Oro)

> La estructura es un árbol.  
> El estilo visual es tipo n8n.  
> El comportamiento NO es n8n.

---

## 5. Modelo Mental Correcto

Comparación conceptual:

| Concepto | Sistema |
|--------|--------|
| Estructura | Google Drive / Explorador de archivos |
| Estética | n8n (solo visual) |
| Comportamiento | Navegación jerárquica |

---

## 6. Alcance Funcional

El sistema debe permitir:

- Navegar una jerarquía de carpetas y archivos
- Expandir y colapsar nodos
- Visualizar información de cada nodo
- Crear, editar y eliminar elementos
- Buscar nodos en tiempo real
- Persistir información localmente

---

## 7. Restricciones (CRÍTICO)

Queda explícitamente prohibido:

- Implementar conexiones entre nodos
- Crear flujos tipo workflow
- Usar canvas libre tipo drag & drop global
- Convertir el sistema en un editor tipo n8n

---

## 8. Uso de n8n (Correcto)

n8n se utiliza exclusivamente como referencia visual:

- Tarjetas (cards)
- Bordes redondeados
- Sombras suaves
- Iconografía moderna
- Microinteracciones

NO se utiliza como referencia funcional.

---

## 9. Riesgos de Desviación

El proyecto se considera desviado si ocurre alguno de los siguientes:

- Se agregan conexiones entre nodos
- Se pierde la estructura jerárquica
- Se convierte en un sistema de workflows
- Se prioriza estética sobre navegabilidad

---

## 10. Criterio de Validación

Antes de implementar cualquier feature, validar:

1. ¿Esto mejora la navegación de documentos?
2. ¿Mantiene la estructura jerárquica?
3. ¿Evita comportamientos tipo workflow?
4. ¿Respeta el objetivo principal?

Si alguna respuesta es "no" → NO implementar.

---

## 11. Resumen Ejecutivo

Este proyecto es:

> Un sistema de navegación de documentos BI con estructura tipo árbol y estética moderna inspirada en n8n.

---

## 12. Frase Canónica (para recordar siempre)

> “No estamos construyendo n8n.  
> Estamos construyendo un explorador de documentos con apariencia de n8n.”