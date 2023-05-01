// Инициализация молальных окон
const myModal = new HystModal({
    linkAttributeName: 'data-hystmodal',
});

// Инициализация переменных
let graph;

/**
 * Отображает граф на странице с помощью библиотеки vivagraph.js
 * @param {Array<Array<number>>} graph - матрица смежности графа
 * @param {string} containerId - идентификатор контейнера, в котором будет отображаться граф
 */
function displayGraph(graph, containerId) {
  const graphContainer = document.querySelector(containerId);
  const graphData = {
    nodes: [],
    links: [],
  };

  // добавляем вершины в граф
  for (let i = 0; i < graph.length; i++) {
    graphData.nodes.push({ id: i });
  }

  // добавляем ребра в граф
  for (let i = 0; i < graph.length; i++) {
    for (let j = 0; j < graph[i].length; j++) {
      if (graph[i][j] !== Infinity) {
        graphData.links.push({ from: i, to: j, data: {connectionStrength: graph[i][j]} });
      }
    }
  }
  
    const graphUI = Viva.Graph.graph();
    for (var i = 0; i < graphData.nodes.length; ++i){
        graphUI.addNode(i, graphData.nodes[i]);
    }

    for (i = 0; i < graphData.links.length; ++i){
        const link = graphData.links[i];
        graphUI.addLink(link.from, link.to, link.data);
    }

  // создаем объект графа и отображаем его на странице
    
    graphData.nodes.forEach(node => {
        const nodeObj = graphUI.addNode(node.id);
    });
    graphData.links.forEach(link => graphUI.addLink(link.to, link.from));
    var svgGraphics = Viva.Graph.View.svgGraphics();

    svgGraphics.node(function(node){
        // const groupId = node.data.group;
        const ui = Viva.Graph.svg('g')
            .attr('id', `n-${node.id}`)
            .attr("pointer-events", "none"),
            svgText = Viva.Graph.svg('text')
            .attr('y', '-10px')
            .attr('x', '-4px')
            .attr('fill', '#5dff00')
            .attr('font-size', '24px')
            .attr('font-weight', '600')
            .text(String.fromCharCode(65 + node.id)),
            svgCircle = Viva.Graph.svg('circle')
            .attr('r', 7)
            .attr('stroke', '#fff')
            .attr('stroke-width', '1.5px')
            .attr("fill", '#fff');

        ui.append(svgText)
        ui.append(svgCircle)
        return ui;
    })
    .placeNode(function(nodeUI, pos){
        nodeUI.attr('transform', `translate(${pos.x}, ${pos.y})`)
        nodeUI.attr("cx", pos.x).attr("cy", pos.y);
    });

        // Задаем отображение ребер
    svgGraphics.link(function(link) {
        if ((!link.data) || (link.fromId == link.toId)) return null
        const g = Viva.Graph.svg('g');

        const line = Viva.Graph.svg('line')
        .attr('stroke', '#999999')
        .attr('id', `l-${link.fromId}-${link.toId}`)
        .attr('stroke-width', 2);
          // Добавляем стрелочку на конец линии:
        const arrowHead = Viva.Graph.svg('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#fff');
        
    
        const label = Viva.Graph.svg('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('fill', 'red');

        if (link.fromId > link.toId) label.attr('transform', 'translate(0, 10)')
    
        label.text(link.data.connectionStrength)

        g.append(line)
        g.append(arrowHead);
        g.append(label)
        return g;
    })
    .placeLink(function(linkUI, fromPos, toPos) {
        linkUI.querySelector('line')
            .attr('x1', fromPos.x)
            .attr('x2', toPos.x)
            .attr('y1', fromPos.y)
            .attr('y2', toPos.y);

        const dx = toPos.x - fromPos.x,
            dy = toPos.y - fromPos.y,
            distance = Math.sqrt(dx * dx + dy * dy);
            
            linkUI.querySelector('text')
                .attr('x', (fromPos.x + toPos.x) / 2)
                .attr('y', (fromPos.y + toPos.y) / 2)

                  // Вычисляем угол между начальной и конечной точками линии
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // Поворачиваем стрелочку на угол
        linkUI.querySelector('path')
            .attr('transform', `translate(${toPos.x},${toPos.y}) rotate(${angle}) translate(-17, 0)`)
            // .attr('transform', `translate(100px, 10px)`);
        // linkUI.querySelector('path').attr.;
    });

    const idealLength = 90;
    const getLayout = () => {
        const layout = Viva.Graph.Layout.forceDirected(graphUI, {
            springLength: idealLength,
            springCoeff : 0.0008,
            gravity : 0,
            springTransform: function (link, spring) {
                if (link.data) spring.length = link.data.connectionStrength;
            }
        });
        return layout;
    }
    let layout;
    const renderer = Viva.Graph.View.renderer(graphUI, {
        graphics: svgGraphics,
        container: graphContainer,
        layout: layout = getLayout(),
        renderLinks: true,
        prerender: 1600
    });
    renderer.run();
    
    // Zoom to fit hack
    const graphRect = layout.getGraphRect();
    const graphSize = Math.min(graphRect.x2 - graphRect.x1, graphRect.y2 - graphRect.y1) + 500;
    const screenSize = Math.min(document.body.clientWidth, document.body.clientHeight);

    const desiredScale = screenSize / graphSize;
    zoomOut(desiredScale, 1);

    function zoomOut(desiredScale, currentScale) {
        if (desiredScale < currentScale) {
            currentScale = renderer.zoomOut();
            setTimeout(function () {
                zoomOut(desiredScale, currentScale);
            }, 16);
        }
    }
}

/**
 * Заполняет матрицу смежности графа в таблице.
 */
const fillMatrixModal = () => {
    const $tableEl = document.createElement('div');
    $tableEl.className = 'modal-matrix__table';

    const createCell = (value = null) => {
        const $el = document.createElement('div');
        $el.className = 'modal-matrix__table-cell';
        if (value == null) {
            $el.classList.add('modal-matrix__table-cell--empty');
            return $el;
        }
        $el.textContent = (value == Infinity) ? '∞' : value;
        return $el;
    }

    const createRow = () => {
        const $el = document.createElement('div');
        $el.className = 'modal-matrix__table-row';
        return $el;
    }

    graph.forEach((row, i) => {
        const $rowEl = createRow();
        if (i == 0) {
            const $rowEl = createRow();
            $rowEl.insertAdjacentElement('beforeend', createCell());
            graph.forEach((item, s) => {$rowEl.insertAdjacentElement('beforeend', createCell(String.fromCharCode(65 + s)));}) 
            $tableEl.insertAdjacentElement('beforeend', $rowEl);
        }
        row.forEach((cellValue, j) => {
            if (j == 0) $rowEl.insertAdjacentElement('beforeend', createCell(String.fromCharCode(65 + i)));
            $rowEl.insertAdjacentElement('beforeend', createCell(cellValue));
        })
        $tableEl.insertAdjacentElement('beforeend', $rowEl);
    })
    const $matrixBody = document.querySelector('.modal-matrix__body');
    $matrixBody.querySelector('.modal-matrix__table').remove();
    $matrixBody.insertAdjacentElement('beforeend', $tableEl);
}

// Отрисовка перовго графа
displayGraph(graph = new RandomGraphGenerator(8, 1, 1000, 0.8).getMatrix(), '.graph-container');
fillMatrixModal();

/**
 * Показывает путь
 * @param {Array} way 
 */
const showWay = (way) => {
    let prevIndex = -1;

    // Показываем путь
    way.forEach(i => {
        if (prevIndex > -1) {
            const $line = document.querySelector(`svg line#l-${prevIndex}-${i}`);
            
            document.querySelector('.graph-container > svg > g').insertAdjacentElement('beforeend', $line.parentElement);
            $line.setAttribute('stroke', '#7d00ff');
            $line.parentElement.querySelector('path').setAttribute('fill', '#7d00ff');
            $line.parentElement.querySelector('text').setAttribute('fill', '#5dff00');
            $line.parentElement.setAttribute('data-shown-way', '');
        }
        const $vertex = document.querySelector(`svg g#n-${i}`);
        $vertex.querySelector('circle').setAttribute('fill', '#7d00ff');
        $vertex.setAttribute('data-shown-way', '');
        prevIndex = i;
    })

    // Делаем прозрачными элементы не относящиеся к пути
    document.querySelectorAll('svg > g > *:not([data-shown-way])').forEach($el => {
        $el.style.opacity = '0.3';
    })
}

/**
 * Скрывает показаный путь
 */
const hideWay = () => {
    // Возврщаем в обратное состояние(непрозрачное) элементы не относящиеся к пути
    document.querySelectorAll('svg > g > *:not([data-shown-way])').forEach($el => {
        $el.style.opacity = '';
    })
    document.querySelectorAll('svg [data-shown-way]').forEach($el => {
        let $line;
        if ($line = $el.querySelector('line')) {
            $line.setAttribute('stroke', '#999999');
            $el.querySelector('path').setAttribute('fill', '#999999');
            $el.querySelector('text').setAttribute('fill', 'red');
        } else {
            document.querySelector('.graph-container > svg > g').insertAdjacentElement('beforeend', $el);
            $el.querySelector('circle').setAttribute('fill', '#fff');
        }
        $el.removeAttribute('data-shown-way');
    })
}

// Вешаем событие на нажатие на кнопку генерации нового графа
document.querySelector('#buttonCreateRandomGraph').addEventListener('click', () => {
    document.querySelector('.graph-container svg').remove();
    displayGraph(graph = new RandomGraphGenerator(8, 1, 1000, 0.8).getMatrix(), '.graph-container');
    fillMatrixModal();
})

// Вешаем события на нажатия клавиш на поля ввода имени вершины
document.querySelectorAll('#inputNodeFrom, #inputNodeTo').forEach($input => {
    $input.addEventListener('keydown', e => {
        if (e.keyCode > 64 && e.keyCode < 91) {
            e.preventDefault();
            $input.value = String.fromCharCode(e.keyCode);
        }
    });
})

// Вешаем событие на нажатие кнопки поиска пути на графе
document.querySelector('#buttonFindPath').addEventListener('click', () => {
    const fromIndex = document.querySelector('#inputNodeFrom').value.charCodeAt(0) - 65;
    const toIndex = document.querySelector('#inputNodeTo').value.charCodeAt(0) - 65;
    const aStar = new AStar(graph, fromIndex, toIndex);
    const shortestPath = aStar.search();
    showWay(shortestPath)
    setTimeout(() => {
        hideWay();
    }, 4000)
})