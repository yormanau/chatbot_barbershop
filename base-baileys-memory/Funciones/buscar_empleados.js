//Busca un empleado dentro de una lista

function buscar_empleados(empleados, opcionBuscada) {
    // Validad que hayan empleados dentro de la lista
    if(!Array.isArray(empleados) || empleados.length === 0) {
        return {error: 'No hay empleados cargados.'}
    }

     if (!/^\d+$/.test(opcionBuscada.trim())) { // Comprueba que la opcionBuscada sea sólo un número
        return { error: 'La opción ingresada no es un número válido.' };
    }

    const numero = parseInt(opcionBuscada.trim(), 10);
    // Busca dentro de lista la opción ingresada
    const encontrado = empleados.find(emp => emp.opcion === numero);

    if (!encontrado) {
        return { error: `No se encontró un empleado para la opción ${numero}.` };
    }
    return { empleado: encontrado };
}


module.exports = { buscar_empleados }