// Funcion para colocar mayuscula la primera letra de un string
const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/;


function Mayus(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
}

function validar_nombres(texto) {
  const entrada = texto.toLowerCase().trim().split(' ', 2);

  if (entrada.length < 2) {
    return { valido: false, mensaje: 'Ingrese nombre y apellido.' };
  }

  const [name, lastName] = entrada;

  const esNombreValido = soloLetras.test(name) && name.length > 2;
  const esApellidoValido = soloLetras.test(lastName) && lastName.length > 1;

  if (!esNombreValido || !esApellidoValido) {
    return { valido: false, mensaje: 'Ingrese nombre y apellido válidos.' };
  }

  const nombres = Mayus(name) + ' ' + Mayus(lastName);

  return {
    valido: true,
    nombres,
    name: Mayus(name),
    lastName: Mayus(lastName)
  };
}

const numero_emoji = (num) => {
    const mapa = {
        '0': '0️⃣',
        '1': '1️⃣',
        '2': '2️⃣',
        '3': '3️⃣',
        '4': '4️⃣',
        '5': '5️⃣',
        '6': '6️⃣',
        '7': '7️⃣',
        '8': '8️⃣',
        '9': '9️⃣',
    }

    return num.toString().split('').map(digito => mapa[digito] || '').join('');
};

function validar_celular(numero) {
  // Elimina espacios y caracteres no numéricos
  const limpio = numero.replace(/\s+/g, '').replace(/[^\d]/g, '');

  // Expresión regular para validar número celular colombiano
  const regex = /^(?:57)?(3\d{9})$/;

  const match = limpio.match(regex);
  if (match) {
    const numeroFormateado = '57' + match[1];
    return {
      valido: true,
      numero: numeroFormateado,
      mensaje: 'Número celular válido'
    };
  } else {
    return {
      valido: false,
      numero: null,
      mensaje: 'Número no válido.'
    };
  }
}


module.exports = { Mayus, validar_nombres, numero_emoji, validar_celular };