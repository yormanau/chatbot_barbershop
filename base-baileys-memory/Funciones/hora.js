function detectar_hora(texto) {
    
    // regex comprueba una hora entre 1 y 12, opcionalmente los minutos y el sufijo am/pm
    const regex = /\b(0?[1-9]|1[0-2])(:([0-5][0-9]))?\s*([AaPp][Mm])?\b/g;
    const todasLasCoincidencias = [...texto.matchAll(regex)];
    texto = String(texto);
    // Validar que la hora ingresada sea posterior a la actual
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutosActual = ahora.getMinutes();

    const match = todasLasCoincidencias[0];

    // Comprobamos la cantidad de coincidencias (horas en la cadena)
    if (todasLasCoincidencias.length > 1) {
        // Solo se admite una hora dentro de la cadena
        // Ej: 'Hay reunión a las 8:00 PM'
        return {
            valido: false,
            motivo: "Por favor, indique una hora válida.",
            coincidencias: todasLasCoincidencias.map(c => c[0]),
            textoOriginal: texto.trim(),
            match : match
        };
    }


    
    // Comprueba si no hay coincidencias
    if (!match) {
        // Si no hay coincidencias pero si existe alguna palabra clave en la cadena
        if (texto.toLowerCase().includes("turno") || 
            texto.toLowerCase().includes("reservar") || 
            texto.toLowerCase().includes("agendar") ||
            texto.toLowerCase().includes("horario"))
             {
            return {
                valido: false,
                motivo: "No escribiste una hora. ¿Podrías indicarla?",
                textoOriginal: texto.trim(),
                match : match
            };
        } else {
            // Si no hay coincidencias
            return {
                valido: false,
                motivo: "No escribiste una hora. ¿Podrías indicarla?",
                textoOriginal: texto.trim(),
                match : match
            };
        }
    }

    const horaNum = parseInt(match[1]);
    const minutos = match[3] ? parseInt(match[3]) : 0; // Si hay minutos lo pasa a INT y sino coloca 0 
    let sufijo = match[4] ? match[4].toLowerCase() : ""; // Acá similar a lo de arriba

    // Si en la cadena solo existe el '9', se realiza esta comprobación
    // Si en la cadena solo existe el '9', sin minutos ni sufijo AM/PM
    if (horaNum === 9 && !match[3] && !match[4]) {

        // Si la hora actual ya pasó las 9 AM (es decir, es >=9 y minutos > 0)
        if (horaActual > 9 || (horaActual === 9 && minutosActual > 0)) {
            // Ya pasó la 9 AM, y como no aceptamos 9 PM, rechazamos
            return {
                valido: false,
                motivo: "No se manejan turnos a las 9 PM.",
                hora: "9 PM",
                textoOriginal: texto.trim(),
                match : match
            };
        } else {
            // Todavía no son las 9 AM, pide aclarar que sea 9 AM
            return {
                valido: false,
                motivo: "Por favor, escriba 9 AM.",
                hora: "9",
                textoOriginal: texto.trim(),
                match : match
            };
        }
    }


    // Si no especifica AM o PM, asumimos PM por defecto
    if (!sufijo) {
        sufijo = "pm";
    }

    // Para decir que no se admiten turnos despues de las 9PM
    if (horaNum === 9 && sufijo === "pm") {
        return {
            valido: false,
            motivo: "No se manejan turnos a las 9 PM.",
            hora: "9 PM",
            textoOriginal: texto.trim(),
            match : match
        };
    }

    // Se comprueba la hora para convertirla a formato 24H
    const hora24 =  sufijo === "pm" && horaNum !== 12 ? horaNum + 12 :
                    sufijo === "am" && horaNum === 12 ? 0 : horaNum;

    


    // Comprobar la hora ingresada para saber si está en el horario de trabajo
    if (hora24 < 9 || hora24 > 20 || (hora24 === 20 && minutos > 0)) {
        return {
            valido: false,
            motivo: "Nuestro horario es de *9 AM* a *8 PM*.\nIndique un horario válido. ",
            hora: `${horaNum}:${minutos.toString().padStart(2, "0")} ${sufijo.toUpperCase()}`,
            textoOriginal: texto.trim(),
            match : match,
            
        };
    }

    return {
        valido: true,
        mensaje: `Turno registrado a las ${horaNum}:${minutos.toString().padStart(2, "0")} ${sufijo.toUpperCase()}.`,
        hora: `${horaNum}:${minutos.toString().padStart(2, "0")} ${sufijo.toUpperCase()}`,
        textoOriginal: texto.trim(),
        match : match,
        hora24: `${hora24.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`
    };
};
function validar_hora_turno(texto, fechaStr) {
    const resultado = detectar_hora(texto);

    if (!resultado.valido) {
        return {
            valido: false,
            motivo: resultado.motivo
        };
    }

    // Aquí corregimos el orden: dd/mm/aaaa
    const [dia, mes, anio] = fechaStr.split('/').map(Number);
    const fechaTurno = new Date(anio, mes - 1, dia, resultado.hora24, resultado.minutos);
    const ahora = new Date();

    if (fechaTurno <= ahora) {
        return {
            valido: false,
            motivo: 'Ya la hora pasó y no se puede agendar.'
        };
    }

    return {
        valido: true,
        mensaje: `Hora válida para el ${fechaStr}: ${resultado.hora}`,
        hora: resultado.hora,
        hora24: resultado.hora24,
        minutos: resultado.minutos,
        fechaTurno
    };
}

function esta_en_tramos(horaUsuario, tramos) {
  return tramos.some(tramo => {
    if (tramo.includes(' a ')) {
      const [inicio, fin] = tramo.split(' a ');
      return horaUsuario >= inicio && horaUsuario <= fin;
    } else {
      // Caso de hora única (por ejemplo "20:00")
      return tramo === horaUsuario;
    }
  });
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}



//Esta función solo se usará si la fecha dada por el usuario es igual a la actual
function validar_rangos(rango_horas) {
        /*Función que valida un rango de horas con la hora actual
        Recibe como parametros un iterable (rango de horas) y la hora actual
        */
        const ahora = new Date();
        const hora_actual = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
        
        const rangos = [];

        // Recorrer cada índice del rango
        for (let i = 0; i < rango_horas.length; i++) {

        //Guarda cada valor del rango
        const item = rango_horas[i];

        /* Si en el rango existe la letra "a", se divide por esta letra
        y se filtra cada hora y se compara con la hora actual*/
        if (item.includes('a')) {
            const partes = item.split('a').map(h => h.trim());
            const posteriores = partes.filter(hora => hora > hora_actual);

            if (posteriores.length === 2) {
                rangos.push(item); // ambas horas mayores
            } else if (posteriores.length === 1) {
                rangos.push(posteriores[0]); // solo una hora es mayor
            }

        } else {
        // No tiene 'a', evaluar directamente
            if (item > hora_actual) {
                rangos.push(item);
            }
        }
    }
    
    if (rangos.length === 0) {
        return {valido: false, motivo: 'No hay horas disponibles.'}
    }
        return rangos
    }
module.exports = { detectar_hora, validar_hora_turno, esta_en_tramos, validar_rangos };