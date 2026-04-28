# Implementación del Panel de Control para Aliados

El objetivo es crear un panel privado para que los dueños de negocios (Aliados) puedan gestionar su propio menú, manteniendo un estricto control de seguridad para que nadie pueda registrarse y operar como Aliado sin la aprobación del Administrador.

## User Review Required

> [!IMPORTANT]
> **Aprobación del Flujo de Registro:** Necesito tu confirmación sobre el flujo exacto de registro (explicado en la sección "Flujo de Registro y Seguridad"). El método propuesto requiere que el usuario se registre normalmente y el admin lo "ascienda" a Aliado manualmente para garantizar 100% de seguridad. ¿Estás de acuerdo con este enfoque?

## Open Questions

> [!NOTE]
> 1. ¿Deseas que los Aliados también puedan ver los pedidos que les corresponden en tiempo real en su panel, o por ahora solo gestión de menú?
> 2. En el panel del Administrador, ¿te gustaría buscar al usuario por su Correo Electrónico para asignarlo como dueño del negocio?

## Propuesta: Flujo de Registro y Seguridad

Para evitar que cualquier persona se registre como aliado y empiece a subir cosas sin control, implementaremos el siguiente flujo:

1. **Registro Inicial:** El dueño del negocio entra a la app y se registra **normalmente como Cliente** (ya sea con Google o con Correo/Contraseña). Este es el método más seguro porque delegamos la autenticación a Firebase, pero el usuario no tiene poderes especiales aún.
2. **Solicitud:** El dueño llena el formulario de "Registra tu Negocio" (que ya envía un WhatsApp al admin).
3. **Verificación y Asignación (El paso clave):** El Administrador, desde su Panel de Control (`AliadosAdmin`), seleccionará el comercio y tendrá un nuevo campo: **"Asignar Dueño (Email)"**. Al ingresar el correo del dueño, el sistema internamente:
   - Cambiará el rol de ese usuario de `cliente` a `aliado`.
   - Agregará el `uid` (ID de usuario) de esa persona al documento del Comercio en la base de datos (campo `ownerId`).
4. **Acceso Concedido:** La próxima vez que el dueño inicie sesión, el sistema detectará que su rol es `aliado` y lo enviará a su **Panel de Control Exclusivo** en lugar de la vista de cliente.

**Ventajas de este método:**
- Puedes usar Login con Google sin riesgo, ya que entrar por Google solo crea un usuario "Cliente".
- El Admin tiene control absoluto. Nadie es Aliado hasta que el Admin lo vincula manualmente.

## Proposed Changes

### Database Layer (Firestore)
- **Colección `aliados`**: Se agregará un nuevo campo opcional llamado `ownerId` (string). Esto vinculará el negocio con la cuenta de Firebase del dueño.
- **Reglas de Seguridad**: Se actualizarán las reglas para que:
  - Solo los Admins puedan crear o borrar comercios.
  - Los Admins puedan editar cualquier comercio.
  - **Los Aliados solo puedan editar el comercio donde `ownerId` coincida con su propio UID.**

### UI Components

#### [NEW] src/components/AliadoView.tsx
Se creará una nueva vista principal (similar a `ClienteView` o `AdminView`).
- Tendrá su propio menú lateral/inferior.
- Al cargar, buscará en la base de datos el comercio que le pertenece (`ownerId == currentUser.uid`).
- Reutilizará la lógica de gestión de productos (añadir, editar, eliminar, imagen) que ya existe en el admin, pero **restringida únicamente a su propio menú**.

#### [MODIFY] src/App.tsx
- Actualizar el enrutador principal para que, si `userData.rol === 'aliado'`, renderice el nuevo componente `<AliadoView />`.

#### [MODIFY] src/components/AliadosAdmin.tsx
- **No se eliminará nada.** El admin seguirá teniendo el poder de editar los menús.
- Se añadirá una pequeña sección al editar un aliado llamada "Acceso del Propietario", con un campo para ingresar el Email del dueño y un botón "Vincular Usuario".
- Lógica para buscar el UID del usuario por email y actualizar el documento del Aliado y el rol del usuario.

## Verification Plan

### Manual Verification
1. Registrar un usuario de prueba como cliente (ej. `dueno@prueba.com`).
2. Entrar con la cuenta de Administrador.
3. Ir a "Comercios", editar uno, y vincularlo con `dueno@prueba.com`.
4. Cerrar sesión y entrar como `dueno@prueba.com`.
5. Verificar que la interfaz cambie al panel de Aliado.
6. Añadir un producto al menú y comprobar que funciona.
7. Intentar modificar otro comercio distinto y verificar que el sistema lo rechaza por seguridad.
