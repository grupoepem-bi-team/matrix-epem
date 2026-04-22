# 🧠 Architecture QA Checklist – matrix-epem

Este documento define un marco de análisis para detectar:
- Bugs estructurales
- Incoherencias de diseño
- Problemas de lógica
- Riesgos de escalabilidad
- Oportunidades de mejora

---

# 1. 🏗️ Arquitectura General

## 1.1 Separación de responsabilidades
- [ ] ¿Las capas están claramente definidas? (domain, application, infra, UI)
- [ ] ¿Hay lógica de negocio en controladores o servicios externos?
- [ ] ¿Existen módulos con múltiples responsabilidades (God classes)?

## 1.2 Acoplamiento
- [ ] ¿Los módulos dependen directamente entre sí sin abstracciones?
- [ ] ¿Se usan interfaces/ports para desacoplar?
- [ ] ¿Hay imports cruzados entre capas (violación de arquitectura)?

## 1.3 Cohesión
- [ ] ¿Cada módulo hace una sola cosa bien?
- [ ] ¿Hay funciones demasiado largas o con múltiples responsabilidades?

---

# 2. 🔁 Flujo de Datos y Lógica

## 2.1 Flujo claro
- [ ] ¿El flujo request → procesamiento → respuesta es trazable?
- [ ] ¿Existen side-effects ocultos?

## 2.2 Estado
- [ ] ¿Se maneja estado mutable global?
- [ ] ¿Se pueden producir race conditions?

## 2.3 Validación
- [ ] ¿Las entradas están validadas en el boundary?
- [ ] ¿Hay validaciones duplicadas o inconsistentes?

---

# 3. 🧩 Dominio (Business Logic)

## 3.1 Modelado
- [ ] ¿El dominio está representado explícitamente (entities, value objects)?
- [ ] ¿Hay lógica dispersa en lugar de centralizada?

## 3.2 Reglas de negocio
- [ ] ¿Las reglas están hardcodeadas?
- [ ] ¿Hay lógica duplicada en distintos servicios?

## 3.3 Casos borde
- [ ] ¿Se contemplan null/undefined?
- [ ] ¿Se manejan errores de negocio correctamente?

---

# 4. ⚠️ Manejo de Errores

## 4.1 Consistencia
- [ ] ¿Hay un patrón uniforme de manejo de errores?
- [ ] ¿Se mezclan exceptions con returns silenciosos?

## 4.2 Observabilidad
- [ ] ¿Los errores se loguean correctamente?
- [ ] ¿Se pierde contexto del error?

---

# 5. 📦 Infraestructura

## 5.1 Dependencias
- [ ] ¿Dependencias innecesarias o pesadas?
- [ ] ¿Versiones desactualizadas o inseguras?

## 5.2 Configuración
- [ ] ¿Configuración hardcodeada?
- [ ] ¿Uso correcto de variables de entorno?

---

# 6. 🚀 Performance

## 6.1 Complejidad
- [ ] ¿Algoritmos innecesariamente complejos?
- [ ] ¿Loops anidados evitables?

## 6.2 IO / DB
- [ ] ¿Queries redundantes?
- [ ] ¿N+1 queries?

## 6.3 Caching
- [ ] ¿Se aprovecha caching donde corresponde?

---

# 7. 🔐 Seguridad

- [ ] ¿Validación de inputs (SQL, XSS, etc)?
- [ ] ¿Se exponen datos sensibles?
- [ ] ¿Hay manejo adecuado de autenticación/autorización?

---

# 8. 🧪 Testing

## 8.1 Cobertura
- [ ] ¿Hay tests para lógica crítica?
- [ ] ¿Se testean edge cases?

## 8.2 Calidad
- [ ] ¿Tests frágiles o acoplados a implementación?
- [ ] ¿Mocks excesivos?

---

# 9. 🧹 Code Smells

- [ ] Código duplicado
- [ ] Nombres poco claros
- [ ] Funciones largas (>50 líneas)
- [ ] Alta complejidad ciclomática
- [ ] Comentarios que explican código malo

---

# 10. 🧭 Evolución y Escalabilidad

## 10.1 Extensibilidad
- [ ] ¿Agregar features rompe código existente?
- [ ] ¿Se sigue Open/Closed Principle?

## 10.2 Modularidad
- [ ] ¿Se puede extraer módulos fácilmente?
- [ ] ¿Existen boundaries claros?

---

# 11. 🔎 Heurísticas rápidas (Red Flags)

🚨 Si ves esto, hay problemas:

- Servicios llamando directamente a DB sin repositorios
- Lógica en controllers
- Uso excesivo de "any" (TypeScript)
- Falta de tipado estricto
- Archivos > 500 líneas
- Imports relativos profundos (`../../../`)
- Funciones con más de 3 niveles de indentación

---

# 12. 🧠 Score de Arquitectura (opcional)

| Área              | Score (1-5) |
|------------------|------------|
| Diseño           |            |
| Desacoplamiento  |            |
| Testabilidad     |            |
| Escalabilidad    |            |
| Mantenibilidad   |            |

---

# 13. 📌 Conclusión

- Principales problemas detectados:
- Riesgos a corto plazo:
- Recomendaciones prioritarias:
