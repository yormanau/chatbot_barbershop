const temporizadores = new Map();

function iniciar_temporizador(numero, onFinish, segundos = 60) {
  if (temporizadores.has(numero)) return false; // Ya hay un temporizador

  const ms = segundos * 1000;
  let segundosTranscurridos = 0;

  //process.stdout.write(`⏳ [${numero}] Tiempo restante: ${segundos}s\r`);

  const intervalo = setInterval(() => {
    segundosTranscurridos++;
    const restantes = segundos - segundosTranscurridos;
    //process.stdout.write(`⏳ [${numero}] Tiempo restante: ${restantes}s\r`);
  }, 1000);

  const timer = setTimeout(() => {
    clearInterval(intervalo);
    temporizadores.delete(numero);
    //process.stdout.write(`\n⏰ [${numero}] Tiempo agotado.\n`);
    onFinish(true); // Notifica que el tiempo se agotó
  }, ms);

  temporizadores.set(numero, { timer, intervalo });
  return true;
}


function cancelar_temporizador(numero) {
  const datos = temporizadores.get(numero);
  if (datos) {
    clearTimeout(datos.timer);
    clearInterval(datos.intervalo);
    temporizadores.delete(numero);
    //console.log(`✅ ${numero} → Temporizador cancelado.`);
  }
}

module.exports = { iniciar_temporizador, cancelar_temporizador };
