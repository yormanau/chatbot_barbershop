function esDiaValido(input) {
    // Funcion que valida una fecha dada por el usuario
    const soloNumeros = /^\d+$/;
    const ahora = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    // const ahora = new Date();
    const horaActual = ahora.getHours();
    const diaActual = ahora.getDate();
    const ultimoDiaDelMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();

    // Función para formatear fecha a dd/mm/aaaa
    function formatearFecha(date) {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // Mes inicia en 0
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }
    // Función para formato SQL YYYY-MM-DD
    function fechaSQL(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }


    if (input.toLowerCase() === 'hoy') {
        if (horaActual > 20) {
            return {
                valido: false,
                motivo: 'No es posible agendar para hoy.'
            };
        }
        return {
            valido: true,
            fecha: formatearFecha(ahora),
            fechaSQL: fechaSQL(ahora),
            motivo: `Fecha válida: ${formatearFecha(ahora)}`
        };
    }

    if (input.toLowerCase() === 'mañana') {
        const manana = new Date(ahora);
        manana.setDate(manana.getDate() + 1);
        return {
            valido: true,
            fecha: formatearFecha(manana),
            fechaSQL: fechaSQL(manana),
            motivo: `Fecha válida: ${formatearFecha(manana)}`
        };
    }

    if (!soloNumeros.test(input)) {
        const mensaje = (horaActual >= 0 && horaActual < 20)
            ? 'Solo se permiten los números del mes o las palabras "hoy" o "mañana".'
            : 'Solo se permiten los números del mes o la palabra "mañana".';
        return { valido: false, motivo: mensaje };
    }

    const diaIngresado = parseInt(input, 10);

    if (diaIngresado <= diaActual) {
        return { valido: false, motivo: 'El día debe ser posterior al actual' };
    }


    if (diaIngresado > ultimoDiaDelMes) {
        return { valido: false, motivo: `El mes actual solo tiene ${ultimoDiaDelMes} días` };
    }

    let fechaIngresada = new Date(ahora.getFullYear(), ahora.getMonth(), diaIngresado);
    fechaIngresada.setHours(12, 0, 0, 0); // 👈 Esto soluciona el desfasaje

    return {
        valido: true,
        fecha: formatearFecha(fechaIngresada),
        fechaSQL: fechaSQL(fechaIngresada),
        motivo: `Fecha válida: ${formatearFecha(fechaIngresada)}`
    };
}

function formatear_fecha(fechaString) {
  const fecha = new Date(fechaString);

  const diasSemana = [
    'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
  ];

  const nombreDia = diasSemana[fecha.getDay()];
  const diaDelMes = fecha.getDate();

  return `${nombreDia} ${diaDelMes}`;
}

module.exports = { esDiaValido, formatear_fecha };
