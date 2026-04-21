# 📌 Proyecto: Navegador de Documentos BI - EPEM

## 1. Propósito

Este documento define el objetivo canónico del proyecto y actúa como la fuente única de verdad durante todo el desarrollo.

Cualquier decisión técnica, de diseño o funcional debe validarse contra este documento.

---

## 2. Objetivo Principal

Construir una aplicación web que permita:

> Organizar, visualizar y navegar documentos del Departamento de BI de EPEM mediante una interfaz visual tipo canvas, con estética y comportamiento inspirado en n8n.

---

## 3. Definición Correcta del Producto

El sistema ES:

- Un explorador visual de documentos
- Un gestor de información BI con interfaz canvas
- Nodos posicionables libremente
- Conexiones visuales entre nodos relacionados
- Estética y UX idéntica a n8n

El sistema NO ES:

- Un sistema de automatización de workflows
- Un ejecutor de flujos (no ejecuta código)
- Un sistema de integración tipo iPaaS

---

## 4. Principio Clave (Regla de Oro)

> La interfaz ES tipo n8n (canvas + conexiones).  
> El propósito ES navegar documentos (NO ejecutar workflows).  
> Los nodos representan documentos/carpetas (NO acciones/nodos de automatización).

---

## 5. Modelo Mental Correcto

Comparación conceptual:

| Concepto | Sistema |
|--------|--------|
| Interfaz | n8n (canvas libre + conexiones) |
| Estética | n8n (tarjetas, colores, grid) |
| Propósito | Explorador de documentos BI |
| Datos | Jerarquía + relaciones visuales |

---

## 6. Alcance Funcional

El sistema debe permitir:

- Canvas infinito con pan & zoom
- Nodos posicionables con drag & drop
- Conexiones visuales entre nodos (líneas bezier)
- Navegar jerarquía de carpetas y archivos
- Expandir y colapsar nodos
- Visualizar información de cada nodo
- Crear, editar y eliminar elementos
- Buscar nodos en tiempo real
- Persistir información (posiciones + conexiones) localmente

---

## 7. Restricciones

Queda explícitamente prohibido:

- Ejecutar workflows o automatizaciones
- Conectar con APIs externas para ejecución
- Simular que es un sistema de automatización real

PERMITIDO:

- Conexiones VISUALES entre nodos (solo representación)
- Posicionamiento libre en canvas
- Estética idéntica a n8n

---

## 8. Uso de n8n (Correcto)

n8n se utiliza como referencia COMPLETA:

- Canvas con grid de puntos
- Tarjetas (cards) con bordes redondeados
- Conexiones curvas bezier entre nodos
- Iconografía moderna
- Microinteracciones
- Panel lateral para detalles
- Zoom & pan del canvas

---

## 9. Riesgos de Desviación

El proyecto se considera desviado si ocurre alguno de los siguientes:

- Se intenta ejecutar workflows (no es un motor de ejecución)
- Se pierde la capacidad de navegar documentos
- Se prioriza funcionalidad sobre navegabilidad visual

---

## 10. Criterio de Validación

Antes de implementar cualquier feature, validar:

1. ¿Esto mejora la experiencia visual de navegación?
2. ¿Mantiene la estética de n8n?
3. ¿Permite navegar documentos BI?
4. ¿Respeta que NO es un motor de ejecución?

Si alguna respuesta es "no" → NO implementar.

---

## 11. Resumen Ejecutivo

Este proyecto es:

> Un sistema de navegación visual de documentos BI con interfaz canvas tipo n8n, incluyendo posicionamiento libre y conexiones visuales entre nodos.

---

## 12. Frase Canónica (para recordar siempre)

> "Es n8n visualmente, pero es un explorador de documentos en propósito."