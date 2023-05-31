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
     * Если редактор вирусов и волкеров загрузился значение = true
     */
    isEditorInit:boolean = false
    /**
     * Объект, содержащий горячие клавиши для движения вверх и вниз
     */
    keys:any
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
    }    

    preload ()
    {
        this.load.image('logo', 'assets/phaser3-logo.png');
        this.load.image('none', 'assets/none.png');
        this.load.image('virOn', 'assets/virOn.png');
        this.load.image('virOff', 'assets/virOff.png');
        this.load.image('walkOn', 'assets/walkOn.png');
        this.load.image('walkOff', 'assets/walkOff.png');
    }

    create ()
    {
        const logo = this.add.image(400, 70, 'logo');

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
        if(this.keys.A.isDown) this.moveUnits(delta*this.velocity/1000)
        if(this.keys.Q.isDown) this.moveUnits(-delta*this.velocity/1000) 
    }

    onZoneClick(pointer: Phaser.Input.Pointer){
        // если поле движется, то добавление невозможно
        if(this.keys.Q.isDown || this.keys.A.isDown) return

        if (this.editorPnt.buttonState == "none") return;

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

            this.virGroup.create(this.gridRect.left + xCell * this.cellSize +
                Math.round(this.cellSize / 2), this.virGridArr[0].getBounds().bottom -
                globalCellY * this.cellSize - Math.round(this.cellSize / 2),
                this.editorPnt.buttonState).setDisplaySize(48, 48).setName(virName).
                setData({
                    "type": "V", "X": xCell * 50 + 25,
                    "Y": globalCellY
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
            let globalCellY = Math.floor((grid.getBounds().bottom - pointer.y) / this.cellSize) +
                grid.getData("index") * this.gridCellHeight
            // В имени зашифрованы координаты в ячейках
            let walkName = "W_" + xCell + "_" + globalCellY
            // если на месте, где щёлкнули в режиме  walkOn уже находится
            // волкер, то удаляем его и выходим
            let walkArr = this.walkGroup.getMatching("name", walkName)
            if (walkArr.length != 0) {
                this.walkGroup.remove(walkArr[0], true)
                return
            }

            this.walkGroup.create(this.gridRect.left + xCell * this.cellSize +
                Math.round(this.cellSize / 2), this.walkGridArr[0].getBounds().bottom -
                globalCellY * this.cellSize - Math.round(this.cellSize / 2),
                this.editorPnt.buttonState).setDisplaySize(48, 48).setName(walkName).
                setData({
                    "type": "W", "X": xCell * 50 + 25,
                    "Y": globalCellY
                })
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
