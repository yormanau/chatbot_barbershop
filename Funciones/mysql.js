require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mysql = require('mysql2');
const cron = require('node-cron')
const {deleteEvent} = require('../Google Calendar/index.js')



const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.PORT,
  timezone: '+05:00', 
});


connection.connect(err => {
  if (err) {
    console.error('❌ Error de conexión a MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');
  console.log('Hora del servidor:', new Date().toISOString());

  //connection.query("ALTER TABLE reservas ADD COLUMN fecha_hora DATETIME")
});

function obtener_empleados() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY id) AS opcion,
        id,
        nombres,
        celular
      FROM empleados
      WHERE estado = 'ACTIVO'
    `;
    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function insertar_cliente_db(nombres, celular) {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO clientes (nombres, celular) VALUES (?, ?)';
    connection.query(query, [nombres, celular], (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return resolve({ insertado: false, mensaje: 'El cliente ya existe.' });
        }
        return reject('Error al insertar el cliente');
      }
      resolve({ insertado: true, id: results.insertId, nombres });
    });
  });
}


function buscar_numero_celular(celular) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, nombres FROM clientes WHERE celular = ?';
    connection.query(query, [celular], (err, results) => {
      if (err) return reject('Error al buscar el cliente');
      if (results.length === 0) return resolve(null); // No existe
      resolve(results[0]); // Devuelve { nombres: ... }
    });
  });
}

function generar_reserva({ fecha, hora, cliente_id, empleado_id, estado, fecha_hora }, callback) {
  // Verificar si ya existe una reserva con la misma fecha, hora y cliente
  const verificarQuery = `
    SELECT id FROM reservas
    WHERE fecha = ? AND hora = ? AND cliente_id = ? AND estado = ? AND fecha_hora = ?
  `;

  connection.query(verificarQuery, [fecha, hora, cliente_id, estado, fecha_hora], (err, results) => {
    if (err) {
      console.error('Error al verificar reserva:', err);
      return callback({ success: false, message: 'Error al verificar reserva', error: err });
    }

    if (results.length > 0) {
      return callback({
        success: false,
        message: 'Ya tienes una reserva registrada.'
      });
    }


    // Si no existe, insertamos la reserva
    const insertQuery = `
      INSERT INTO reservas (fecha, hora, cliente_id, empleado_id, estado, fecha_hora)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(insertQuery, [fecha, hora, cliente_id, empleado_id, estado, fecha_hora], (err, result) => {
      if (err) {
        console.error('Error al insertar la reserva:', err);
        return callback({ success: false, message: 'Error al registrar reserva', error: err });
      }

      return callback({
        success: true,
        message: 'Reserva registrada con éxito.',
        reserva_id: result.insertId
      });
    });
  });
}


function buscar_reservas_activas(celular) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.id AS reserva_id, 
        r.cliente_id, 
        r.estado, 
        r.fecha_hora, 
        r.event_id
      FROM reservas r
      JOIN clientes c ON r.cliente_id = c.id
      WHERE c.celular = ?
        AND r.fecha_hora > CONVERT_TZ(NOW(), 'UTC', 'America/Bogota')
        AND r.estado IN ('PENDIENTE', 'CONFIRMADO')
      ORDER BY r.fecha_hora ASC
    `;

    connection.query(query, [celular], (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

function buscar_reservas_num_celular(celular) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.id AS reserva_id, 
        r.cliente_id, 
        r.empleado_id, 
        r.fecha_hora, 
        r.estado
      FROM reservas r
      JOIN clientes c ON r.cliente_id = c.id
      WHERE c.celular = ?
        AND r.fecha_hora > CONVERT_TZ(NOW(), 'UTC', 'America/Bogota')
      ORDER BY r.fecha_hora ASC
    `;

    connection.query(query, [celular], (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

/*
async function estado_reserva(celular, estado) {
  try {
    const reservas = await buscar_reservas_num_celular(celular);
    
    if (!reservas || reservas.length === 0) {
      return { valido: false, mensaje: 'No se encontraron reservas para ese celular.' };
    }

    // Buscar la primera reserva válida (PENDIENTE o CONFIRMADO)
    const reservaValida = reservas.find(r => r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADO');

    if (!reservaValida) {
      return { valido: false, mensaje: 'No tienes reservas.' };
    }
    
    const respuesta = await new Promise((resolve) => {
      actualizarEstadoReserva(estado, reservaValida.reserva_id, reservaValida.cliente_id, (resultado) => {
        if (resultado.success) {
          resolve({
            valido: true,
            mensaje: resultado.message,
            datos: resultado.datos // Aquí pasamos los datos extra
          });
        } else {
          resolve({
            valido: false,
            mensaje: resultado.message || resultado.error
          });
        }
      });
    });

    return respuesta;

  } catch (err) {
    console.error('❌ Error en la consulta:', err);
    return { valido: false, mensaje: 'Ocurrió un error al procesar la reserva.' };
  }
}*/ 
async function estado_reserva(celular, estado) {
  try {
    const reservas = await buscar_reservas_num_celular(celular);
    
    if (!reservas || reservas.length === 0) {
      return { valido: false, mensaje: 'No se encontraron reservas para su número celular.' };
    }

    // Buscar la primera reserva válida (PENDIENTE o CONFIRMADO)
    const reservaValida = reservas.find(r => r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADO');

    if (!reservaValida) {
      return { valido: false, mensaje: 'No tienes reservas.' };
    }

    const respuesta = await new Promise((resolve) => {
      actualizarEstadoReserva(estado, reservaValida.reserva_id, reservaValida.cliente_id, (resultado) => {
        if (resultado.success) {
          resolve({
            valido: true,
            mensaje: resultado.message,
            datos: {
              ...resultado.datos,
              reserva_id: reservaValida.reserva_id
            }
          });
        } else {
          resolve({
            valido: false,
            mensaje: resultado.message || resultado.error
          });
        }
      });
    });

    // Si es cancelación y tiene event_id, eliminarlo
    if (respuesta.valido && estado === 'CANCELADO' && respuesta.datos?.event_id) {
      try {
        //await deleteEvent(respuesta.datos.event_id);
        //console.log('✅ Evento eliminado de Google Calendar.');

        const updateSql = 'UPDATE reservas SET event_id = NULL WHERE id = ?';
        connection.query(updateSql, [respuesta.datos.reserva_id], (err) => {
          if (err) {
            console.error('❌ Error al limpiar el event_id:', err);
          } /*else {
            console.log('✅ event_id eliminado de la base de datos.');
          }*/
        });

      } catch (error) {
        console.error('❌ Error al eliminar el evento de Google Calendar:', error);
      }
    }

    return respuesta;

  } catch (err) {
    console.error('❌ Error en la consulta:', err);
    return { valido: false, mensaje: 'Ocurrió un error al procesar la reserva.' };
  }
}

function actualizarEstadoReserva(nuevoEstado, reservaId, clienteId, callback) {
  const queryUpdate = `
    UPDATE reservas
    SET estado = ?
    WHERE id = ? AND cliente_id = ?
  `;

  connection.query(queryUpdate, [nuevoEstado, reservaId, clienteId], (error, results) => {
    if (error) {
      console.error('❌ Error al actualizar el estado:', error);
      return callback({ success: false, error });
    }

    if (results.affectedRows > 0) {
      // Luego de actualizar, consultamos los detalles
      const querySelect = `
        SELECT 
          r.id AS reserva_id,
          r.fecha_hora,
          r.event_id,
          c.nombres AS nombre_cliente,
          e.nombres AS nombre_empleado,
          e.celular AS celular_empleado
        FROM reservas r
        JOIN clientes c ON r.cliente_id = c.id
        JOIN empleados e ON r.empleado_id = e.id
        WHERE r.id = ? 
          AND r.cliente_id = ?
          AND r.fecha_hora > CONVERT_TZ(NOW(), 'UTC', 'America/Bogota')

      `;

      connection.query(querySelect, [reservaId, clienteId], (err, rows) => {
        if (err) {
          console.error('❌ Error al obtener detalles de la reserva:', err);
          return callback({ success: false, error: err });
        }

        const reserva = rows[0];

        let mensaje = '✅ Estado actualizado correctamente.';
        if (nuevoEstado === 'CONFIRMADO') {
          mensaje = '✅ Su reserva ha sido confirmada.';
        } else if (nuevoEstado === 'CANCELADO') {
          mensaje = '❌ Su reserva ha sido cancelada.';
        } else {
          mensaje = `ℹ️ Su reserva ha cambiado al estado: ${nuevoEstado}.`;
        }
        const fechaBogota = new Date(reserva.fecha_hora).toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour12: false
        });

        const [fecha, horaCompleta] = fechaBogota.split(', ').map(s => s.trim());
        const hora = horaCompleta.slice(0, 5); // Ejemplo: "14:30"



        callback({
          success: true,
          message: mensaje,
          datos: {
            nombre_cliente: reserva.nombre_cliente,
            nombre_empleado: reserva.nombre_empleado,
            celular_empleado: reserva.celular_empleado,
            hora, 
            fecha,
            event_id: reserva.event_id 
          }
        });
      });
    } else {
      callback({ success: false, message: '⚠️ No se encontró ninguna reserva con ese ID y cliente.' });
    }
  });
}

cron.schedule('* * * * *', () => {
  const sql = `
    SELECT id, event_id, estado
    FROM reservas
    WHERE estado IN ('PENDIENTE', 'CONFIRMADO')
      AND fecha_hora <= CONVERT_TZ(NOW(), 'America/Bogota', '+00:00') - INTERVAL 1 HOUR
      
  `;

  connection.query(sql, async (err, rows) => {
    if (err) {
      console.error('Error al consultar reservas expiradas:', err);
      return;
    } 

    for (const reserva of rows) {
      try {
        // 1. Elimina el evento en Google Calendar
        //await deleteEvent(reserva.event_id);

        // 2. Actualiza el estado en la base de datos
        const estadoNuevo = reserva.estado === 'CONFIRMADO' ? 'FINALIZADO' : 'CANCELADO';
        const updateSql = 'UPDATE reservas SET estado = ? WHERE id = ?';
        const valores = [estadoNuevo, reserva.id];

        connection.query(updateSql, valores, (err2) => {
          if (err2) {
            console.error('Error al actualizar estado:', err2);
          }/* else {
            console.log(`Reserva ${reserva.id} actualizada y evento eliminado.`);
          }*/
        });
      } catch (error) {
        console.error(`Error eliminando evento ${reserva.event_id}:`, error);
      }
    }
  });
});



// Enviar notificación al usuario y al empleado
function enviar_notificacion() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        r.id AS reserva_id, r.fecha_hora,
        c.nombres AS nombre_cliente,
        c.celular AS celular_cliente,
        e.nombres AS nombre_empleado,
        e.celular AS celular_empleado
      FROM reservas r
      JOIN clientes c ON r.cliente_id = c.id
      JOIN empleados e ON r.empleado_id = e.id
      WHERE r.estado = 'PENDIENTE'
        AND r.fecha_hora BETWEEN 
          CONVERT_TZ(NOW(), 'UTC', 'America/Bogota') - INTERVAL 1 HOUR AND 
          CONVERT_TZ(NOW(), 'UTC', 'America/Bogota') 
    `;

    connection.query(sql, (err, results) => {
      if (err) {
        reject('Error al obtener reservas: ' + err);
      } else {
        resolve(results);
      }
    });
  });
}



function agregar_empleado(nombres, celular) {
  return new Promise((resolve) => {
    const query = 'INSERT INTO empleados (nombres, celular, estado) VALUES (?,?,?)';
    connection.query(query, [nombres, celular, 'ACTIVO'], (error, results) => {
      if (error) {
        return resolve({
          valido: false,
          mensaje: 'Error al insertar al empleado en la base de datos, inténtelo de nuevo.'
        });
      }
      resolve({
        valido: true,
        mensaje: 'Empleado agregado correctamente.'
      });
    });
  });
}


function eliminar_empleado(id) {
  return new Promise((resolve) => {
    const query = 'UPDATE empleados SET estado = ? WHERE id = ?';
    connection.query(query, ['INACTIVO', id], (error, results) => {
      if (error) {
        return resolve({
          valido: false,
          mensaje: 'Error al eliminar al empleado, inténtelo de nuevo.'
        });
      }
      if (results.affectedRows === 0) {
        return resolve({
          valido: false,
          mensaje: 'No se encontró un empleado con ese ID.'
        });
      }
      resolve({
        valido: true,
        mensaje: 'Empleado eliminado correctamente.'
      });
    });
  });
}

function guardar_event_id(reserva_id, eventId) {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE reservas SET event_id = ? WHERE id = ?';
        const valores = [eventId, reserva_id];

        connection.query(sql, valores, (err, result) => {
            if (err) {
              //  console.error('❌ Error al guardar event_id:', err);
                return reject(err);
            }

           // console.log('✅ event_id guardado correctamente');
            resolve(result);
        });
    });
}


module.exports = {
  connection,
  obtener_empleados,
  insertar_cliente_db,
  buscar_numero_celular,
  generar_reserva,
  estado_reserva,
  buscar_reservas_activas,
  enviar_notificacion,
  agregar_empleado,
  eliminar_empleado,
  buscar_reservas_num_celular,
  guardar_event_id
};