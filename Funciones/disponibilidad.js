const { connection } = require('./mysql.js');


function obtener_horas_ocupadas(empleado_id, fecha) {
  // Consulta en la db si hay horas ocupadas para x empleado en x hora y fecha
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT hora 
    FROM reservas 
    WHERE empleado_id = ? 
      AND fecha = ? 
      AND estado != 'CANCELADO'
    ORDER BY hora`;
    connection.query(sql, [empleado_id, fecha], (err, results) => {
      if (err) return reject(err);
      const horas = results.map(row => row.hora.slice(0, 5));
      resolve(horas);
    });
  });
}

function restar_hora(hora, minutos) {
  const [h, m] = hora.split(':').map(Number);
  const totalMin = h * 60 + m - minutos;
  const newH = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const newM = String(totalMin % 60).padStart(2, '0');
  return `${newH}:${newM}`;
}

function sumar_hora(hora, minutos) {
  const [h, m] = hora.split(':').map(Number);
  const totalMin = h * 60 + m + minutos;
  const newH = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const newM = String(totalMin % 60).padStart(2, '0');
  return `${newH}:${newM}`;
}


function generar_disponibilidad(horaInicio, horasOcupadas) {
  // Devuelve un listado de rangos de tiempo donde un empleado sí está disponible para agendar una cita
  const horaFin= '20:00'
  const resultado = [];
  let inicio = horaInicio;


  for (let i = 0; i < horasOcupadas.length; i++) {
    const hora = horasOcupadas[i];

    const fin_disponible = restar_hora(hora, 45);
    if (inicio <= fin_disponible) {
      if (sumar_hora(inicio, 15) >= fin_disponible) {
        resultado.push(fin_disponible); // solo la última hora
      } else {
        resultado.push(`${inicio} a ${fin_disponible}`);
      }
    }

    // Siguiente inicio será una hora después de la hora ocupada
    inicio = sumar_hora(hora, 45);
  }

  // Tramo final: si el último bloque es una única hora
  if (inicio <= horaFin) {
    if (sumar_hora(inicio, 15) >= horaFin) {
      resultado.push(horaFin); // solo la última hora
    } else {
      resultado.push(`${inicio} a ${horaFin}`);
    }
  }

  return resultado;
}


function formato12Horas(tramos24) {
  // Recibe un lista con rangos de tiempo en formato 24horas y los transforma a 12horas
  if (!Array.isArray(tramos24)) {
    console.error('❌ tramos24 no es un array:', tramos24); // Log útil para debugging
    return [];
  }
  return tramos24.map(tramo => {
    const convertir = hora => {
      const [h, m] = hora.split(':').map(Number);
      const sufijo = h >= 12 ? 'PM' : 'AM';
      const hora12 = h % 12 === 0 ? 12 : h % 12;
      return `${hora12}:${m.toString().padStart(2, '0')} ${sufijo}`;
    };

    if (tramo.includes(' a ')) {
      const [inicio, fin] = tramo.split(' a ');
      return `${convertir(inicio)} a ${convertir(fin)}`;
    } else {
      return convertir(tramo);
    }
  });
}



function obtener_hora_inicio(fechaIngresada, horaInicioPorDefecto = '09:00') {
  // Devuelve la hora más proxima disponible
  const hoy = new Date();
  const fechaActualStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  if (fechaIngresada === fechaActualStr) {
    const ahora = new Date();
    let minutos = ahora.getMinutes();
    let horas = ahora.getHours();

    // Redondear a los próximos 15 minutos
    minutos = Math.ceil(minutos / 15) * 15;
    if (minutos === 60) {
      minutos = 0;
      horas += 1;
    }

    const h = String(horas).padStart(2, '0');
    const m = String(minutos).padStart(2, '0');
    return `${h}:${m}`;
  }

  return horaInicioPorDefecto;
}

function filtrarTramosFuturos(tramos, fechaIngresada = null) {
  const hoy = new Date();
  const fechaActualStr = hoy.toISOString().slice(0, 10);

  // Si la fecha no es hoy, retornar todos los tramos
  if (fechaIngresada && fechaIngresada !== fechaActualStr) {
    return tramos;
  }

  // Obtener hora actual redondeada a los próximos 15 minutos
  let horas = hoy.getHours();
  let minutos = hoy.getMinutes();
  minutos = Math.ceil(minutos / 15) * 15;
  if (minutos === 60) {
    minutos = 0;
    horas += 1;
  }
  
  const horaActual = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

  // Filtrar tramos posteriores
  const tramosFiltrados = tramos.filter(tramo => {
    if (tramo.includes(' a ')) {
      const [inicio, _] = tramo.split(' a ');
      return inicio >= horaActual;
    } else {
      return tramo >= horaActual;
    }
  });

  return tramosFiltrados;
}

function convertirA12Horas(hora24) {
  // Recibe una sola hora en formato 24 horas y los transforma a 12horas
  const [hora, minutos, segundos] = hora24.split(':').map(Number);
  const periodo = hora >= 12 ? 'PM' : 'AM';
  const hora12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${hora12.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')} ${periodo}`;
}

module.exports = { generar_disponibilidad, obtener_horas_ocupadas, formato12Horas, obtener_hora_inicio, filtrarTramosFuturos, convertirA12Horas };