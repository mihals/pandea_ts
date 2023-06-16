import * as Phaser from 'phaser';

export default class Demo extends Phaser.Scene
{
    /**
     * ссылка на объект-редактор вирусов и волкеров
     */
    editorPnt : any
    /**
     * Загружен ли (импортирован) редактор вирусов и волкеров
     */
    isEditorLoaded:boolean = false
    /**
     * массив сеток, если при движении сеток вниз, верхний край
     * последней сетки опускается ниже верхней границы канваса, то
     * добавляется ещё одна сетка, каждая в объекте data содержит  значение
     * index, равное её индексу в массиве. Для вирусов и волкеров разные
     * сетки и движутся они с разной скоростью.
     */
    virGridArr:Phaser.GameObjects.Grid[]
    /**
     * Аналог virGridArr массива для волкеров, они отличаются скоростью
     */
    walkGridArr:Phaser.GameObjects.Grid[]
    /**
     * массив контактных групп, каждая контактная группа - это набор волкеров,
     * которые инфицируются при заражении хотя бы одного из волкеров группы
     */
    contactGroupArr:Phaser.Structs.Set<{ x:number,y:number}>[] 
    /**
     * Шаблонный размер для каждой сетки
     */
    gridRect:Phaser.Geom.Rectangle
    /**
     * Размер ячейки в сетках
     */
    cellSize:number
    /**
     * Высота сетки в ячейках
     */
    gridCellHeight:number
    /**
     * Зона для редактирования вирусов и волкеров
     */
    editZone:Phaser.GameObjects.Zone
    /**
     * Группа, содержащая вирусы
     */
    virGroup:Phaser.GameObjects.Group
    /**
     * Группа, содержащая волкеры
     */
    walkGroup:Phaser.GameObjects.Group
    /**
     * Группа, содержащая прямоугольники(Rectangle), составляющие 
     * инфицированную область
     */
    infectedGrp:Phaser.GameObjects.Group
    /**
     * Если редактор вирусов и волкеров загрузился значение = true
     */
    isEditorInit:boolean = false
    /**
     * Объект, содержащий горячие клавиши для движения вверх и вниз
     */
    keys:any
    /**
     * количество клеток, которое отмотала сетка вирусов
     */
    numVirCells:number
    /**
     * количество клеток, которое отмотала сетка волкеров
     */
    numWalkCells:number
    /**
     * y-координата самой нижней точки самой нижней сетки редактора, 
     * перемещается вместе с перемещением сетки
     */
    anchorY:number
    /**
     * x-координата левой границы сеток редактора
     */
    anchorX:number
    /**
     * Скорость движения вирусов и сеток в пикселях/сек
     */
    velocity:number = 48

    constructor ()
    {
        super('demo');
        this.virGroup = new Phaser.GameObjects.Group(this)
        this.walkGroup = new Phaser.GameObjects.Group(this)
        this.gridRect = new Phaser.Geom.Rectangle(100,0,600,700)
        this.cellSize = 50
        this.gridCellHeight = Math.round(this.gridRect.height/this.cellSize)
        this.virGridArr = []
        this.walkGridArr = []
        this.contactGroupArr=[]
        this.infectedGrp = new Phaser.GameObjects.Group(this)
        //this.testSet()
    }    

    preload ()
    {
        //this.load.image('logo', 'assets/phaser3-logo.png');
        this.load.image('none', 'assets/none.png');
        this.load.image('virOn', 'assets/virOn.png');
        //this.load.image('virOff', 'assets/virOff.png');
        this.load.image('walkOn', 'assets/walkOn.png');
        //this.load.image('walkOff', 'assets/walkOff.png');
    }

    create ()
    {
        //const logo = this.add.image(400, 70, 'logo');

        this.walkGridArr.push(this.add.grid(100, -100, this.gridRect.width,
            this.gridRect.height, this.cellSize, this.cellSize, undefined, undefined,
            0xffff00).setOrigin(0, 0).setData({ "index": 0 }))
        this.virGridArr.push(this.add.grid(100, -100, this.gridRect.width,
            this.gridRect.height, this.cellSize, this.cellSize, undefined, undefined,
            0xff0000).setOrigin(0, 0).setData({ "index": 0 }).setZ(1))
        
        this.editZone = this.add.zone(100, 0, 600, this.game.canvas.height).setOrigin(0, 0)
        this.editZone.name = "editZone"
        this.input.on('gameobjectdown', this.onZoneClick, this);
        this.keys = this.input.keyboard.addKeys('Q, A');
        this.numVirCells = 0 
        this.numWalkCells =0 
        //this.map = this.make.tilemap({key: "map"})
        //const tiles = this.map.add
    }

    update(time: number, delta: number): void {
        if(!this.isEditorInit && !this.isEditorLoaded && window["myEditor"] !== null){
            this.editorPnt = window["myEditor"]
            this.editorPnt.setGameWnd(this)
            this.isEditorLoaded = true
            this.editZone.setInteractive()
            this.input.keyboard.on('keydown-Q', this.keyQDown)
            this.isEditorInit =true
        }

        let newNumVirCells = Math.floor(this.virGridArr[0].y-
            this.game.canvas.height)/this.cellSize
        // если сетка вирусов прокрутилась на ячейку, то перс мог столкнуться
        // с вирусом
        if (newNumVirCells != this.numVirCells) {

        }

        let newNumWalkCells = Math.floor(this.walkGridArr[0].y-
            this.game.canvas.height)/this.cellSize
        // если сетка волкеров прокрутилась на ячейку, то перс мог столкнуться
        // с волкером
        if (newNumWalkCells != this.numWalkCells) {

        }

        if(this.keys.A.isDown) this.moveUnits(delta*this.velocity/1000)
        if(this.keys.Q.isDown) this.moveUnits(-delta*this.velocity/1000) 
    }

    onZoneClick(pointer: Phaser.Input.Pointer){
        
        // если поле движется, то добавление невозможно
        if(this.keys.Q.isDown || this.keys.A.isDown) return

        if (this.editorPnt.buttonState == "none"){
            this.markInfectedArea(pointer)
        } 

        if (this.editorPnt.buttonState == "virOn") {
            // находим расстояние от нижней границы самой первой (и самой
            // нижней сетки) в массиве, для этого сначала находим сетку,
            // на которой щелкнули
            let grid = this.virGridArr.filter(item => item.getBounds().
                contains(pointer.x, pointer.y))[0]
            let xCell = Math.floor((pointer.x - grid.getBounds().left) / this.cellSize)
            // получаем номер ячейки, считая от нижнего края самой нижней сетки
            // (grid.getBounds().bottom -pointer.y) - расстояние от нижнего края сетки,
            // в которую попал юнит, к нему надо добавить высоту всех нижележащих сеток
            // чтобы получить globalCellY
            let globalCellY = Math.floor((grid.getBounds().bottom - pointer.y) / this.cellSize) +
                grid.getData("index") * this.gridCellHeight
            // В имени зашифрованы координаты в ячейках
            let virName = "V_" + xCell + "_" + globalCellY
            // если на месте, где щёлкнули в режиме virOn уже находится
            // вирус , то удаляем его и выходим
            let virArr = this.virGroup.getMatching("name", virName)
            if (virArr.length != 0) {
                this.virGroup.remove(virArr[0], true)
                return
            }
            // если на месте, где щёлкнули в режиме virOn уже находится
            // волкер, то удаляем его и выходим
            let walkArr = this.walkGroup.getMatching("name", "W_" + xCell + "_" +globalCellY)
            if (walkArr.length != 0) {
                this.walkGroup.remove(walkArr[0], true)
                return
            }

            this.virGroup.create(this.gridRect.left + xCell * this.cellSize +
                Math.round(this.cellSize / 2), this.virGridArr[0].getBounds().bottom -
                globalCellY * this.cellSize - Math.round(this.cellSize / 2),
                this.editorPnt.buttonState).setDisplaySize(48, 48).setName(virName).
                setData({
                    "type": "V", "X": xCell * 50 + 25,
                    "Y": globalCellY * 50 + 25,
                    "xCell" : xCell, "yCell" : globalCellY
                })
        }

        if (this.editorPnt.buttonState == "walkOn") {
            // находим расстояние от нижней границы самой первой (и самой
            // нижней сетки) в массиве, для этого сначала находим сетку,
            // на которой щелкнули
            let grid = this.walkGridArr.filter(item => item.getBounds().
                contains(pointer.x, pointer.y))[0]
            let xCell = Math.floor((pointer.x - grid.getBounds().left) / this.cellSize)
            // получаем номер ячейки, считая от нижнего края самой нижней сетки
            // (grid.getBounds().bottom -pointer.y) - расстояние от нижнего края сетки,
            // в которую попал юнит, к нему надо добавить высоту всех нижележащих сеток
            // чтобы получить globalCellY
            let globalCellY = Math.floor((grid.getBounds().bottom - pointer.y) / 
                this.cellSize) + grid.getData("index") * this.gridCellHeight
            // В имени зашифрованы координаты в ячейках
            let walkName = "W_" + xCell + "_" + globalCellY
            // если на месте, где щёлкнули в режиме  walkOn уже находится
            // волкер, то удаляем его из группы, пересчитываем контакты и выходим
            let walkArr = this.walkGroup.getMatching("name", walkName)
            if (walkArr.length != 0) {
                this.walkGroup.remove(walkArr[0], true)
                this.removeContactWalker(xCell,globalCellY)
                return
            }
            // если на месте, где щёлкнули в режиме walkOn уже находится
            // вирус , то удаляем его и выходим
            let virArr = this.virGroup.getMatching("name", "V_" + xCell + "_" + globalCellY)
            if (virArr.length != 0) {
                this.virGroup.remove(virArr[0], true)
                return
            }

            this.walkGroup.create(this.gridRect.left + xCell * this.cellSize +
                Math.round(this.cellSize / 2), this.walkGridArr[0].getBounds().bottom -
                globalCellY * this.cellSize - Math.round(this.cellSize / 2),
                this.editorPnt.buttonState).setDisplaySize(48, 48).setName(walkName).
                setData({
                    "type": "W", "X": xCell * 50 + 25,
                    "Y": globalCellY * 50 + 25,
                    "xCell" : xCell, "yCell" : globalCellY
                })
            this.addContactWalker(xCell,globalCellY)
        }
    }

    moveUnits(pixels: number) {
        //если движемся вверх
        if (pixels < 0) {
            // если при движении вверх нижний край нижней сетки может оказаться
            // выше нижнего края канваса, то чтобы предотвратить это, выравниваем
            // края сетки и канваса
            if (this.virGridArr[0].getBounds().bottom + pixels <
                this.game.canvas.height) {
                let del = this.virGridArr[0].getBounds().bottom -
                    this.game.canvas.height
                this.virGridArr.forEach(item => item.y -= del)
                this.virGroup.incY(-del)

                // для волкеров и сетки делаем тоже самое
                del = this.walkGridArr[0].getBounds().bottom -
                    this.game.canvas.height
                this.walkGridArr.forEach(item => item.y -= del)
                this.walkGroup.incY(-del)
                return
            }
            this.virGridArr.forEach(item => item.y += pixels)
            this.walkGridArr.forEach(item => item.y += pixels/2)
            this.virGroup.incY(pixels)
            this.walkGroup.incY(pixels/2)
            return
        }

        this.virGridArr.forEach(item => item.y += pixels)
        this.walkGridArr.forEach(item => item.y += pixels/2)
        this.virGroup.incY(pixels)
        this.walkGroup.incY(pixels/2)
        // если самая верхняя сетка (последняя в массиве) опустилась ниже
        // верхнего края канваса, добавляем сверху ещё одну сетку
        if (this.walkGridArr[this.walkGridArr.length - 1].getBounds().top > 0) {
            // определяем индекс новой сетки
            let numNextGrid = this.walkGridArr.length
            // определяем y-координату новой сетки
            let nextGridY = this.walkGridArr[numNextGrid - 1].getBounds().top -
                this.gridRect.height
            this.walkGridArr.push(this.add.grid(100, nextGridY, this.gridRect.width,
                this.gridRect.height, this.cellSize, this.cellSize, undefined, undefined,
                0xffff00).setOrigin(0, 0).setData({ "index": numNextGrid }))
        }
        if (this.virGridArr[this.virGridArr.length - 1].getBounds().top > 0) {
            // определяем индекс новой сетки
            let numNextGrid = this.virGridArr.length
            // определяем y-координату новой сетки
            let nextGridY = this.virGridArr[numNextGrid - 1].getBounds().top -
                this.gridRect.height
            this.virGridArr.push(this.add.grid(100, nextGridY, this.gridRect.width,
                this.gridRect.height, this.cellSize, this.cellSize, undefined, undefined,
                0xff0000).setOrigin(0, 0).setData({ "index": numNextGrid }).setDepth(1))
        }
    }

    /**
     * добавляет в сформированные массивы контактных групп, где
     * каждая группа - это волкеры, все из которых инфицируются при заражении
     * одного из волкеров группы, нового волкера с номерами ячейки x и y 
     */
    addContactWalker(x:number,y:number){
        if(this.contactGroupArr.length == 0){
            this.contactGroupArr.push(new Phaser.Structs.Set([{x,y}]))
            return
        }
        // в массиве наборов контактных групп проверяем находится ли по
        // соседству с добавляемым волкером другой волкер - тогда они
        // в одной контактной группе. Индексы групп, для которых данный
        // волкер оказался контактным, заносим в массив
        let contactIndArr:Array<number> =[]

        for (let i = 0; i < this.contactGroupArr.length; i++) {
            // проверяем все девять соседних ячейки на наличие там другого волкера
            // из набора this.contactGroupArr[i]
            this.contactGroupArr[i].iterate((entry) => {
                if (((x == entry.x) && (y == entry.y - 1)) ||
                    ((x == entry.x - 1) && (y == entry.y - 1)) ||
                    ((x == entry.x - 1) && (y == entry.y)) ||
                    ((x == entry.x - 1) && (y == entry.y + 1)) ||
                    ((x == entry.x) && (y == entry.y + 1)) ||
                    ((x == entry.x + 1) && (y == entry.y + 1)) ||
                    ((x == entry.x + 1) && (y == entry.y)) ||
                    ((x == entry.x + 1) && (y == entry.y - 1))) {
                    contactIndArr.push(i)
                    return false
                }
            })
        }
        // если контактных наборов не найдено, значит добавленный волкер
        // образует новую группу
        if(contactIndArr.length==0){
            this.contactGroupArr.push(new Phaser.Structs.Set([{x,y}]))
            return
        }
        // если волкер контактирует лишь с одной группой, добавляем его
        // в этот набор
        if(contactIndArr.length==1){
            this.contactGroupArr[contactIndArr[0]].set({x,y})
            return
        }
        // если добавленный волкер контактирует с несколькими группами,
        // то они все объединяются в одну контактную группу.
        // В contactIndArr находятся индексы, по которым в массиве contactGroupArr
        // располагаются наборы, с которыми контактирует добавляемый волкер,
        // все эти наборы объединяем в один набор с наименьшим индексом,
        // равным contactIndArr[0]
        if (contactIndArr.length > 1) {
            for (let i = 1; i < contactIndArr.length; i++) {
                this.contactGroupArr[contactIndArr[0]] =
                    this.contactGroupArr[contactIndArr[0]].union(
                        this.contactGroupArr[contactIndArr[i]]
                    )
                // вместо добавленных в общую группу наборов вставляем null
                this.contactGroupArr.splice(contactIndArr[i],1,null)
            }
            // добавляем и сам новый волкер
            this.contactGroupArr[contactIndArr[0]].set({x,y})
            // фильтруем contactGroupArr, чтобы избавиться от ячеек с null
            let tmpArr = this.contactGroupArr.filter((elem) =>{
                if(elem === null) return false
                return true
            })
            this.contactGroupArr = tmpArr
        }
    }
    /**
     * Удаляет волкера с номерами ячейки x и y из контактных групп,
     * из this.walkGroup волкер уже удалён
     * @param x номер ячейки
     * @param y номер ячейки
     */
    // при удалении волкера, входящего в какую-либо контактную группу,
    // сама группа может распасться на несколько контактных групп
    removeContactWalker(x:number, y:number){
        //console.log(x+y)
        //alert(x)
        // ищем контактную группу, в которую входит волкер с такими
        // координатами, индекс, по которому находится набор с этим
        // волкером заносим в ind 
        let ind:number
        for(let i=0; i< this.contactGroupArr.length; i++){
            this.contactGroupArr[i].iterate((entry)=>{
                if((entry.x == x)&&(entry.y == y)){
                    ind = i
                    return false
                }
            })
        }

        // удаляем волкер
        this.contactGroupArr[ind].each((entry) => {
            if((entry.x == x)&&(entry.y==y)){
                this.contactGroupArr[ind].delete(entry)
                return false
            }})
        
        // если волкер был единственным в контактной группе, удаляем
        // всю группу
        if(this.contactGroupArr[ind].size == 0){
            this.contactGroupArr.splice(ind,1)
            return
        }
        // если остался один волкер, то он один и образует контактную группу
        if(this.contactGroupArr[ind].size == 1){
            return
        }
        // если в наборе осталось несколько волкеров, определяем контактные
        // группы, которые они образуют, для этого создаём временный массив,
        // содержащий наборы по одному волкеру из contactGroupArr[ind] в каждом
        let tmpArr: Phaser.Structs.Set<{ x:number,y:number}>[] = [] 
        // массив волкеров, для каждого из которых будем искать контакты
        let tmpWalkArr = this.contactGroupArr[ind].getArray() 
        this.contactGroupArr[ind].iterate((item) => {
            tmpArr.push((new Phaser.Structs.Set([{'x':item.x, 'y':item.y}])))
            return true
        })
        // в Set не все методы работают с объектами {x,y}, поэтому для начала
        // преобразуем все координаты в строки вида "x_y"
        let tmpStrWalkArr:Phaser.Structs.Set<string>[] = []
        // для единственного волкера в каждом наборе ищем всех контактных с ним
        // и добавляем к нему в набор
        for (let i = 0; i < tmpArr.length; i++) {
            let x = tmpWalkArr[i].x
            let y = tmpWalkArr[i].y
            tmpStrWalkArr.push(new Phaser.Structs.Set([x+"_"+y]))
            for (let j = i + 1; j < tmpArr.length; j++) {
                if (((x == tmpWalkArr[j].x) && (y == tmpWalkArr[j].y - 1)) ||
                    ((x == tmpWalkArr[j].x - 1) && (y == tmpWalkArr[j].y - 1)) ||
                    ((x == tmpWalkArr[j].x - 1) && (y == tmpWalkArr[j].y)) ||
                    ((x == tmpWalkArr[j].x - 1) && (y == tmpWalkArr[j].y + 1)) ||
                    ((x == tmpWalkArr[j].x) && (y == tmpWalkArr[j].y + 1)) ||
                    ((x == tmpWalkArr[j].x + 1) && (y == tmpWalkArr[j].y + 1)) ||
                    ((x == tmpWalkArr[j].x + 1) && (y == tmpWalkArr[j].y)) ||
                    ((x == tmpWalkArr[j].x + 1) && (y == tmpWalkArr[j].y - 1))) {
                    tmpArr[i].set({ 'x': tmpWalkArr[j].x, 'y': tmpWalkArr[j].y })
                    tmpStrWalkArr[i].set(tmpWalkArr[j].x + "_" + tmpWalkArr[j].y)
                }
            }
        }
        // ищем пересечения в наборах в tmpStrWalkArr, т.е. общие для двух
        // наборов элементы и объединяем наборы, если такие элементы есть
        // вместо набора, влившегося в другой, вставляем null
        for (let i = 0; i < tmpStrWalkArr.length; i++) {
            for (let j = i+1; j < tmpStrWalkArr.length; j++) {
                if ((tmpStrWalkArr[i] != null) && (tmpStrWalkArr[j] != null) &&
                    (tmpStrWalkArr[i].intersect(tmpStrWalkArr[j]).size!=0)) {
                        let a = tmpStrWalkArr[i].intersect(tmpStrWalkArr[j])
                        console.log(a)
                    tmpStrWalkArr[i] = tmpStrWalkArr[i].union(tmpStrWalkArr[j])
                    tmpStrWalkArr[j] = null
                }
            }
        }
        // удаляем предыдущий набор из contactGroupArr
        this.contactGroupArr.splice(ind,1)
        // вставляем образовавшиеся после удаления волкера наборы в contactGroupArr
        for(let i=0; i<tmpStrWalkArr.length; i++){
            if(tmpStrWalkArr[i]!=null){
                this.contactGroupArr.push(new Phaser.Structs.Set([]))
                tmpStrWalkArr[i].iterate((entry) => {
                    const coord: string[] = entry.split("_")
                    this.contactGroupArr[this.contactGroupArr.length-1].set(
                        {'x':Number(coord[0]),'y': Number(coord[1])}
                    )
                    return true
                })
            }
        }
    }

    /**
     * Метод, закрашивающий или удаляющий инфицированную область
     * @param pointer объект, содержащий координаты мыши
     * @returns 
     */
    markInfectedArea(pointer: Phaser.Input.Pointer){
        if (this.infectedGrp.children.size != 0) {
            this.infectedGrp.clear(true,true)
            return
        }

        let grid = this.virGridArr.filter(item => item.getBounds().
            contains(pointer.x, pointer.y))[0]
        let xCell = Math.floor((pointer.x - grid.getBounds().left) / this.cellSize)
        let globalCellY = Math.floor((grid.getBounds().bottom - pointer.y) / this.cellSize) +
            grid.getData("index") * this.gridCellHeight
        let walkArr = this.walkGroup.getMatching("name", "W_" + xCell + "_" + globalCellY)
        
        if(walkArr.length ==0) return

        let contactGroupInd: number
        // находим в какой контактной группе находится волкер, по которому щёлкнули
        if (walkArr.length != 0) {
            this.contactGroupArr.forEach((item, index) => {
                item.iterate((entry) => {
                    if (entry.x == Number(walkArr[0].name.split("_")[1]) &&
                        entry.y == Number(walkArr[0].name.split("_")[2])) {
                        contactGroupInd = index
                        return false
                    }
                    return true
                })
            })
        }
        // для волкеров из контактной группы формируем зараженную область -
        // это восемь квадратов, окружающих каждый инфицированный волкер и
        // квадрат с самим волкером, заносим в набор infectedArea строковыми
        // значения номеров y и x значения, набор выбран для того, чтобы не
        // заносились повторяющиеся значения
        /**
         * набор, содержащий инфицированную область для контактной группы
         */
        let infectedArea : Phaser.Structs.Set<string> = new Phaser.Structs.Set()
        this.contactGroupArr[contactGroupInd].iterate((entry) => {
            infectedArea.set(entry.x + "_" + (entry.y)).
                set(entry.x + "_" + (entry.y-1)).
                set((entry.x-1) + "_" + (entry.y-1)).
                set((entry.x-1) + "_" + (entry.y)).
                set((entry.x-1) + "_" + (entry.y+1)).
                set((entry.x) + "_" + (entry.y+1)).
                set((entry.x+1) + "_" + (entry.y+1)).
                set((entry.x+1) + "_" + (entry.y)).
                set((entry.x+1) + "_" + (entry.y-1))
            return true
        })

        this.infectedGrp = new Phaser.GameObjects.Group(this)
        infectedArea.iterate((item) => {
            let paire = item.split("_")
            this.infectedGrp.add(new Phaser.GameObjects.Rectangle(this,
                this.virGridArr[0].x + 
                Number(paire[0])*this.cellSize, this.game.canvas.height -
                (Number(paire[1]) + 1)*this.cellSize, this.cellSize, this.cellSize,
                0xff0000,0.3).setOrigin(0,0), true)
            return true
        })
        

        console.log(infectedArea.size)
        
    }

    keyQDown(pointer: Phaser.Input.Pointer){

    }
}

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#125555',
    width: 800,
    height: 600,
    parent: 'gameContainer',
    scene: Demo
};

const game = new Phaser.Game(config);
