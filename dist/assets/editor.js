class Editor{
    /**
     * Редактор игрового поля
     */
    //let this.gameWnd; 
    constructor(){
        /**
         * Ссылка на объект Phaser для редактирования
         */
        this.gameWnd = null;
        /**
         * Определяет режим редактирования для волкеров и вирусов
         */
        this.buttonState = "none";
    }
    /**
     * Обработчик событий для кнопок редактора
     * @param {*} event 
     */
    handleEvent(event) {
        //document.getElementById("selectedTool").src = "assets/virOn.png"
        switch (event.currentTarget.id) {
            case 'virOnTd':
                document.getElementById("selectedTool").src = "assets/virOn.png"
                this.buttonState = "virOn"
                break;
            case 'walkOnTd':
                document.getElementById("selectedTool").src = "assets/walkOn.png"
                this.buttonState = "walkOn"
                break;
            case 'noneTd':
                document.getElementById("selectedTool").src = "assets/none.png"
                this.buttonState = "none"
                break;
            case 'moveOn':
                document.getElementById("selectedTool").src = "assets/moveOn.png"
                this.buttonState = "moveOn"
                break;
        }
    }

    /**
     * Запоминает в свойстве класса gameWnd ссылку на объект-сцену
     */
    setGameWnd(refDemo){
        this.gameWnd = refDemo;
    }
}
export default Editor