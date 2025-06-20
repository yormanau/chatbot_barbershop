const fs = require('fs');
const path = require('path');
const { text } = require('stream/consumers');

function leerTxtComoObjetos() {
  // Subir un nivel y entrar a la carpeta "textos"
  const carpeta = path.join(__dirname, '..', 'mensajes');
  const archivos = fs.readdirSync(carpeta);
  const objetosTxt = {};

  archivos.forEach((archivo) => {
    if (archivo.endsWith('.txt')) {
      const rutaCompleta = path.join(carpeta, archivo);
      const contenido = fs.readFileSync(rutaCompleta, 'utf8');
      objetosTxt[archivo] = contenido;
    }
  });

  return objetosTxt;
}

const mensajes = leerTxtComoObjetos();

function Mensaje(nombreArchivo) {
  if (mensajes[nombreArchivo]) {
    return mensajes[nombreArchivo]
  } else {
    return `El archivo "${nombreArchivo}" no existe.`;
  }
}

module.exports = { Mensaje };