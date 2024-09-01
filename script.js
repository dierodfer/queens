import { tableros } from './boards.js';

document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const winnerPopup = document.getElementById('winner-popup');
    const sizeMenu = document.getElementById("size-menu");
    const popupOverlay = document.getElementById("popup-overlay");
    const menuButton = document.getElementById("menu-button");


    // Mostrar el menú popup al cargar la página
    showPopup();

    let size;  // No hay tamaño predeterminado
    let queens = [];
    const clicks = {}; // Para rastrear los clics en cada celda
    let gameWon = false; // Indica si el juego ha sido ganado
    let tablero = []
    let ultimoTablero = null;

    const colors = [
            '#77DD77', // pastel green
            '#AEC6CF', // pastel blue
            '#F6D7A7', // pastel apricot
            '#FFB7B2', // pastel pink
            '#B39EB5', // pastel purple
            '#FF6961', // pastel red
            '#FFD1DC', // pastel peach
            '#CFCFC4', // pastel gray
            '#C1E1C1', // pastel mint
            '#F7CAC9'  // pastel rose
    ];

    // Mostrar el popup automáticamente al cargar la página
    function showPopup() {
        sizeMenu.classList.add("show");
        popupOverlay.classList.add("show");
    }

    // Ocultar el popup
    function hidePopup() {
        sizeMenu.classList.remove("show");
        popupOverlay.classList.remove("show");
    }

    function obtenerTablero(dim) {
        let seleccion = tableros[dim];
        let tableroAleatorio;
    
        // Si solo hay un tablero, devolverlo directamente
        if (seleccion.length === 1) {
            tableroAleatorio = seleccion[0];
        } else {
            // Intentar hasta que el tablero sea diferente al último
            do {
                tableroAleatorio = seleccion[Math.floor(Math.random() * seleccion.length)];
            } while (JSON.stringify(tableroAleatorio) === JSON.stringify(ultimoTablero));
        }
    
        // Guardar el tablero generado como último tablero
        ultimoTablero = tableroAleatorio;
    
        return tableroAleatorio.flat().map(index => colors[index]); // Convertir índices a colores
    }
    

    function createBoard() {
        queens = []; // Limpiar las reinas actuales
        updateQueenVisuals(); // Actualizar visualización inicial

        board.innerHTML = ''; // Limpiar el tablero
        board.style.gridTemplateColumns = `repeat(${size}, 50px)`;
        board.style.gridTemplateRows = `repeat(${size}, 50px)`;

        tablero = obtenerTablero(size);

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            cell.style.backgroundColor = tablero[i]; // Asignar color de grupo a cada celda
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
            clicks[i] = 0; // Inicializar el contador de clics para cada celda
        }

        board.classList.remove('board-disabled'); // Habilitar el tablero
        gameWon = false; // Reiniciar estado del juego
    }

    function updateQueenVisuals() {
        const rowCount = Array(size).fill(0);
        const colCount = Array(size).fill(0);
    
        // Contar el número de reinas en cada fila, columna y diagonal
        queens.forEach(q => {
            rowCount[q.y]++;
            colCount[q.x]++;
        });
    
        let allWhite = true; // Variable para verificar si todas las reinas son blancas
    
        // Aplicar imágenes a las reinas
        queens.forEach(q => {
            const cellIndex = q.y * size + q.x;
            const cell = board.children[cellIndex];
            const isDiagonalConflict = queens.find(q2 => 
                (q.x+1 === q2.x && q.y+1 === q2.y)
                || (q.x+1 === q2.x && q.y-1 === q2.y)
                || (q.x-1 === q2.x && q.y+1 === q2.y)
                || (q.x-1 === q2.x && q.y-1 === q2.y)
            ) != undefined;
            const isColorConflict = queens.filter(q2 => q2.color === q.color).length >= 2;
            if (rowCount[q.y] >= 2 || 
                colCount[q.x] >= 2 || 
                isDiagonalConflict ||
                isColorConflict) {
                cell.style.backgroundImage = 'url("queen-new.webp")'; // Imagen para restricción
                allWhite = false; // Si hay alguna reina roja, no todas son blancas
            } else {
                cell.style.backgroundImage = 'url("queen-white.png")'; // Imagen normal de la reina
            }
            cell.style.backgroundSize = 'cover'; // Asegura que la imagen cubra la celda
        });
    
        // Mostrar el popup solo si todas las reinas son blancas
        if (queens.length === size && allWhite) {
            if (!gameWon) { // Solo mostrar el popup si no se ha mostrado antes
                gameWon = true; // Marcar el juego como ganado
                showWinnerPopup();
                board.classList.add('board-disabled'); // Desactivar el tablero
            }
        }
    }
    
    function showWinnerPopup() {
        winnerPopup.style.display = 'flex'; // Mostrar el popup
    }

    function handleCellClick(event) {
        if (gameWon) return; // No hacer nada si el juego ya ha sido ganado

        const cell = event.target;
        const index = parseInt(cell.dataset.index);
        const x = index % size;
        const y = Math.floor(index / size);
        const color = tablero[index];

        clicks[index] = (clicks[index] + 1) % 3; // Círculo entre 0, 1 y 2 clics

        if (clicks[index] === 0) {
            // Tercer clic: Limpiar la celda
            cell.style.backgroundImage = 'none';
            // Eliminar la reina si estaba en esta celda
            queens = queens.filter(q => !(q.x === x && q.y === y));
        } else if (clicks[index] === 1) {
            // Primer clic: Añadir una "X"
            cell.textContent = 'X';
        } else if (clicks[index] === 2) {
            // Segundo clic: Colocar una reina
            cell.textContent = '';
            queens = queens.filter(q => !(q.x === x && q.y === y)); // Eliminar reina existente si hay
            queens.push({ x, y, color});
        }

        updateQueenVisuals(); // Actualizar visualización después de cada acción
    }

    // Función para manejar la selección de tamaño
    function handleSizeSelection(button) {
        size = parseInt(button.getAttribute("data-size"));

        // Indicar visualmente qué tamaño está seleccionado
        document.querySelectorAll(".size-btn").forEach(btn => btn.classList.remove("selected"));
        button.classList.add("selected");

        // Ocultar el menú después de seleccionar
        hidePopup();

        // Inicializar el tablero con valores predeterminados
        createBoard();
    }

    // Manejar el clic en el botón del menú
    menuButton.addEventListener("click", showPopup);

    // Asignar evento de clic a todos los botones de tamaño
    document.querySelectorAll(".size-btn").forEach(button => {
        button.addEventListener("click", () => handleSizeSelection(button));
    });

    // Cerrar el popup al hacer clic fuera de él
    winnerPopup.addEventListener('click', () => {
        winnerPopup.style.display = 'none';
    });
});