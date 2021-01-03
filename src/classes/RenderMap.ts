const faker = require("faker");
export class RenderMap {
	private ctx: CanvasRenderingContext2D; //контекст
	private w: number = window.innerWidth; // ширина окна
	private h: number = window.innerHeight; // высота экрана
	private pixel: number; // размер пикселя
	private wall1_w: number; // длина первого участка стены
	private wall2_w: number; // длина второго участка стены
	private pass: number; // ширину прохода между стенами
	private wallH: number; // высота стены
	private borderW: number; // ширина пограничной стены
	private turnWidth: number; // ширина дорожки для очереди
	private turnLength: number; // длина одного участка дорожки
	private borderMargin: number; // ширина линий около пограничной стены? (я не помню что это, хехе)
	private securityPost: number; // кол-во пикселей до полосы, где стоят охраники
	private canvasBorder: HTMLCanvasElement; // сам canvas
	public turnRoute: { [key: string]: number }[] = []; // массив из координат точек маршрута очереди
	public startOfGatehouse: number; // координаты начала сторожки (используются когда человека не пропускают)
	public endOfGatehouse: number; // координаты конца сторожки (используются когда человека пропускают)
	public edge: number;
	public scaner: number; // кол-вво пикселей до сканера

	constructor () {
		// Задаем координаты основных объектов
		this.pixel = Math.round(this.w / 512); // размер одного игрового пикселя
		this.wall1_w = this.pixel * 75; // длина первого участка стены
		this.pass = this.pixel * 25; // растояние между стенами
		this.wall2_w = this.w - this.wall1_w - this.pixel * 30 - this.pixel * 120; // длина второго участка стены
		this.wallH = this.pixel * 13; // высота стены
		this.borderW = this.pixel * 10; // ширина пограничной стены
		this.borderMargin = this.pixel * 20; // ширина полосок около пограничной стены
		this.securityPost = this.wall1_w + this.pass + this.wall2_w - 50 * this.pixel; // Координаты поста охраны

		// Координата сканера
		this.scaner =
			this.pixel * 7 +
			this.wall1_w +
			this.pass +
			(this.borderMargin - this.pixel * 4) * 2 +
			this.borderW +
			40 * this.pixel;

		// Данные для отрисовки дорожки
		this.turnLength = this.pixel * 50; // длина одного сегмента дорожки
		this.turnWidth = this.pixel * 8; // ширина сегмента дорожки

		this.canvasBorder = <HTMLCanvasElement>document.getElementById("border");

		this.canvasBorder.style.height = this.pixel * 60 + "px";
		this.canvasBorder.style.width = this.w + "px";

		this.canvasBorder.width = this.w;
		this.canvasBorder.height = this.pixel * 60;

		this.ctx = this.canvasBorder.getContext("2d");
	}

	public render () {
		// Закрашиваем основу
		this.ctx.fillStyle = "#8D8D8D";
		this.ctx.fillRect(0, 0, this.canvasBorder.width, this.canvasBorder.height);

		// Отрисовываем наклонные линии под пограничной стной
		this.renderBorderLine();
		// Отрисовываем заднюю стену
		this.renderWalls();
		// Отрисовываем пунктирную линию, покоторой будет идти гражданин
		this.renderDottedLine();
		// Отрисовываем пограничную стены
		this.renderBorderWall();
		// Отрисовываем будку инспектора
		this.renderGatehouse();
		// Отрисовываем очередь
		this.renderTurn();
		// Отрисовываем все ограждения
		this.renderDecor();
		// Отрисовываем сканер
		this.renderScaner();
		// Отрисовываем бордюр
		this.renderEdge();
	}

	private renderWalls () {
		let ctx = this.ctx;
		let wall1_w = this.wall1_w;
		let wallH = this.wallH;
		let wall2_w = this.wall2_w;

		// Стена 1 основа
		ctx.fillStyle = "#737373"; // цвет стен
		ctx.fillRect(0, 0, wall1_w, wallH);
		// Стена 2 основа
		ctx.fillRect(wall1_w + this.pass, 0, wall2_w, wallH);

		// Стена 1 трещены
		ctx.fillStyle = "#595959"; // цвет трещин
		for (let i = 0; i < wall1_w; i += this.pixel) {
			for (let j = 0; j < wallH; j += this.pixel) {
				if (
					(i == this.pixel * 17 && j == this.pixel * 3) ||
					(i == this.pixel * 18 && j == this.pixel * 3) ||
					(i == this.pixel * 19 && j == this.pixel * 3) ||
					(i == this.pixel * 19 && j == this.pixel * 4) ||
					(i == this.pixel * 20 && j == this.pixel * 4) ||
					(i == this.pixel * 20 && j == this.pixel * 4) ||
					(i == this.pixel * 1 && j == this.pixel * 0) ||
					(i == this.pixel * 37 && j == this.pixel * 8) ||
					(i == this.pixel * 38 && j == this.pixel * 8) ||
					(i == this.pixel * 39 && j == this.pixel * 7) ||
					(i == this.pixel * 1 && j == this.pixel * 0) ||
					(i == this.pixel * 1 && j == this.pixel * 8) ||
					(i == this.pixel * 2 && j == this.pixel * 8) ||
					(i == this.pixel * 3 && j == this.pixel * 8) ||
					(i == this.pixel * 4 && j == this.pixel * 8) ||
					(i == this.pixel * 5 && j == this.pixel * 8) ||
					(i == this.pixel * 4 && j == this.pixel * 7) ||
					(i == this.pixel * 5 && j == this.pixel * 7) ||
					(i == this.pixel * 5 && j == this.pixel * 6) ||
					(i == this.pixel * 4 && j == this.pixel * 6) ||
					(i == this.pixel * 39 && j == this.pixel * 2) ||
					(i == this.pixel * 39 && j == this.pixel * 3)
				) {
					ctx.fillRect(i - this.pixel, j - this.pixel, this.pixel, this.pixel);
				}
			}
		}

		// Стена 2 трещены
		for (let i = 0; i < wall2_w; i += this.pixel) {
			for (let j = 0; j < wallH; j += this.pixel) {
				if (
					(i == this.pixel * 2 && j == this.pixel * 6) ||
					(i == this.pixel * 3 && j == this.pixel * 6) ||
					(i == this.pixel * 3 && j == this.pixel * 7) ||
					(i == this.pixel * 4 && j == this.pixel * 6) ||
					(i == this.pixel * 136 && j == this.pixel * 14) ||
					(i == this.pixel * 137 && j == this.pixel * 14) ||
					(i == this.pixel * 136 && j == this.pixel * 13) ||
					(i == this.pixel * 137 && j == this.pixel * 13) ||
					(i == this.pixel * 138 && j == this.pixel * 15) ||
					(i == this.pixel * 135 && j == this.pixel * 10) ||
					(i == this.pixel * 44 && j == this.pixel * 9) ||
					(i == this.pixel * 44 && j == this.pixel * 4) ||
					(i == this.pixel * 44 && j == this.pixel * 3) ||
					(i == this.pixel * 100 && j == this.pixel * 5) ||
					(i == this.pixel * 100 && j == this.pixel * 6) ||
					(i == this.pixel * 100 && j == this.pixel * 7) ||
					(i == this.pixel * 100 && j == this.pixel * 7) ||
					(i == this.pixel * 99 && j == this.pixel * 7) ||
					(i == this.pixel * 120 && j == this.pixel * 8) ||
					(i == this.pixel * 119 && j == this.pixel * 8) ||
					(i == this.pixel * 120 && j == this.pixel * 9)
				) {
					ctx.fillStyle = "#595959"; // тк бывают светлые трещины, нужно обновлять цвет темных
					ctx.fillRect(
						wall1_w + this.pass + i - this.pixel,
						j - this.pixel,
						this.pixel,
						this.pixel
					);
				}
				if (
					(i == this.pixel * 2 && j == this.pixel * 10) ||
					(i == this.pixel * 3 && j == this.pixel * 11) ||
					(i == this.pixel * 3 && j == this.pixel * 12) ||
					(i == this.pixel * 5 && j == this.pixel * 9) ||
					(i == this.pixel * 5 && j == this.pixel * 10) ||
					(i == this.pixel * 5 && j == this.pixel * 11) ||
					(i == this.pixel * 5 && j == this.pixel * 12) ||
					(i == this.pixel * 7 && j == this.pixel * 9) ||
					(i == this.pixel * 7 && j == this.pixel * 10) ||
					(i == this.pixel * 7 && j == this.pixel * 11) ||
					(i == this.pixel * 7 && j == this.pixel * 12) ||
					(i == this.pixel * 90 && j == this.pixel * 10) ||
					(i == this.pixel * 90 && j == this.pixel * 11) ||
					(i == this.pixel * 90 && j == this.pixel * 12)
				) {
					ctx.fillStyle = "#8D8D8D"; // светлые трещины
					ctx.fillRect(wall1_w + this.pass + i - this.pixel, j, this.pixel, this.pixel);
				}
			}
		}

		// стена 1 боковая сторона
		for (let i = 0; i < 6; i++) {
			for (let j = 0; j < wallH; j += this.pixel) {
				if (i == 1) ctx.fillRect(wall1_w, 0, this.pixel, wallH);
				if (i == 2)
					ctx.fillRect(
						wall1_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
				if (i == 3)
					ctx.fillRect(
						wall1_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
				if (i == 4)
					ctx.fillRect(
						wall1_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
				if (i == 5)
					ctx.fillRect(
						wall1_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
			}
		}
		// стена 2 боковая сторона
		for (let i = 0; i < 6; i++) {
			for (let j = 0; j < wallH; j += this.pixel) {
				if (i == 1) ctx.fillRect(wall1_w + this.pass + wall2_w, 0, this.pixel, wallH);
				if (i == 2)
					ctx.fillRect(
						wall1_w + this.pass + wall2_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
				if (i == 3)
					ctx.fillRect(
						wall1_w + this.pass + wall2_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
				if (i == 4)
					ctx.fillRect(
						wall1_w + this.pass + wall2_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
				if (i == 5)
					ctx.fillRect(
						wall1_w + this.pass + wall2_w + this.pixel * (i - 1),
						0,
						this.pixel,
						wallH - this.pixel * (i - 1) * 3
					);
			}
		}

		// Стена 1 плакат
		ctx.fillStyle = "#B5B5B5";
		ctx.fillRect(wall1_w / 6, 0, wall1_w / 2 + 5 * this.pixel, wallH / 2);
		// Стена 2 плакат
		ctx.fillRect(wall1_w + this.pass + wall2_w / 2, 0, wall1_w / 2, wallH / 2);
		// Текст на плакатах
		ctx.fillStyle = "#595959";
		ctx.font = (wall1_w / 2 + 5 * this.pixel) / 5 * 2 + "px Pi";
		ctx.textBaseline = "middle";
	}

	private renderBorderWall () {
		// Просто сокращения
		let ctx = this.ctx; // получаем контекст
		let wall1_w = this.wall1_w; // получаем длину первой стены

		// Загружаем картинку
		let img = new Image();
		img.src = window.location.origin + "/static/map/wall.png";
		img.onload = () => {
			// Отрисовываем пограничную стену
			ctx.drawImage(
				img,
				wall1_w + this.pass + this.borderMargin + this.borderW / 4,
				0,
				this.borderW,
				this.canvasBorder.height
			);
		};
	}

	private renderBorderLine () {
		// Просто сокращения
		let ctx = this.ctx; // получаем контекст
		let wall1_w = this.wall1_w; // получаем длину первой стены
		let wallH = this.wallH; // получаем высоту стен

		// линии около пограничной стены

		ctx.fillStyle = "#595959"; // цвет линий
		// Количество линий
		for (let count = 0; count < 3; count++) {
			// длинна одной линии
			for (
				let i = 0;
				i < (this.borderMargin - this.pixel * 4) * 2 + this.borderW;
				i += this.pixel * 2
			) {
				ctx.fillRect(
					this.pixel * 7 + i + wall1_w + this.pass,
					this.pixel - i / 2 + (wallH + this.pixel * 4) + count * this.pixel * 16,
					this.pixel * 2,
					this.pixel * 8
				);
			}
		}
	}

	private renderGatehouse () {
		// Просто сокращения
		let ctx = this.ctx;
		let wall1_w = this.wall1_w;

		// Получаем картинку
		let img = new Image();
		img.src = window.location.origin + "/static/map/gatehouse.png";
		img.height = this.pixel * 30;

		// Координаты и размер сторожки
		let x = this.pixel * 7 + wall1_w + this.pass; // на расстоянии 7 пикселей от проема между первой и второй стенами
		let y = this.canvasBorder.height - img.height; // В самом низу
		let width = (this.borderMargin - this.pixel * 4) * 2 + this.borderW; // ширина сторожки

		img.onload = () => {
			// Отрисовываем сторожку
			ctx.drawImage(img, x, y + 1, width, img.height);
		};
		// Задаем координаты сторожки для дальнейшиго использования в анимация человечков
		this.startOfGatehouse = x;
		this.endOfGatehouse = x + width;
	}

	private renderDottedLine () {
		let ctx = this.ctx; // получаем контекст в сокращеении

		// Параметры линии для отрисовки белой дорожки
		ctx.strokeStyle = "#B5B5B5"; // цвет дорожки
		ctx.fillStyle = "#B5B5B5"; // цвет начала дорожки
		ctx.setLineDash([ this.pixel, this.pixel ]); // пунктирная линия
		ctx.lineWidth = this.pixel; // ширина линии в один игровой пиксель

		// Отрисовываем две линии
		for (let side = 0; side < 2; side++) {
			ctx.beginPath(); // начало пути
			// Линия начинается на 7 пикселей дальше середины прохода между стенами
			ctx.moveTo(
				this.pixel * 7 + this.wall1_w + this.pass / 2,
				this.canvasBorder.height - this.pixel * 15 + side * 10 * this.pixel
			);
			// Линия идет до конца второй стены
			ctx.lineTo(
				this.wall1_w + this.pass + this.wall2_w,
				this.canvasBorder.height - this.pixel * 15 + side * 10 * this.pixel
			);
			// Рисуем линию
			ctx.stroke();
		}

		// Рисуем прямоугольник перед дорожкой
		ctx.fillRect(
			this.pixel * 7 + this.wall1_w + this.pass / 2 - 5 * this.pixel,
			this.canvasBorder.height - this.pixel * 15,
			3 * this.pixel,
			10 * this.pixel
		);
	}

	private renderTurn () {
		let ctx = this.ctx; // контекст (сокращение для удобства)

		// Параметры линии дорожки
		ctx.strokeStyle = "#595959"; // цвет дорожки
		ctx.setLineDash([ this.pixel, this.pixel ]); // пунктирная линия
		ctx.lineWidth = this.pixel; // линия шириной один пиксель

		// Для отрисовки человечков на дорожке будем использовать массив из точек маршрута
		this.turnRoute[0] = { x: 0, y: this.turnWidth * 2 + this.turnWidth / 2 }; // Первая точка маршрута

		// ---------------------------------------------------------------------//
		// ----------------------Первая линия по горизонтали--------------------//
		ctx.beginPath();
		ctx.moveTo(0, this.turnWidth * 2); // Перемещаем линию в начало дорожки

		// Ведем линию на той же высоте, но x будет равен длине дорожки + ширине дорожки,
		// чтобы потом получилась дорожка вниз нужной ширины
		ctx.lineTo(this.turnLength + this.turnWidth, this.turnWidth * 2);

		// Записываем в маршрут отрисованную точку
		this.turnRoute[1] = {
			x: this.turnLength + this.turnWidth / 2,
			y: this.turnWidth * 2 + this.turnWidth / 2
		};

		ctx.stroke(); // Отрисовываем

		// ---------------------------------------------------------------------//
		// ----------------------Вторая линия горизонтали-----------------------//
		ctx.beginPath();

		ctx.moveTo(0, this.wallH + this.turnWidth * 2); // Перемещаем линию в начало дорожки
		// Ведем линию, но ее длина будет меньше пред.линии на ширину дорожки,
		// чтобы дорожка вниз была нужной ширины
		ctx.lineTo(this.turnLength, this.wallH + this.turnWidth * 2);
		ctx.stroke(); // отрисовываем

		// ---------------------------------------------------------------------//
		// ----------------------Третья линия по горизонтали--------------------//
		ctx.beginPath();
		ctx.moveTo(0, this.wallH + this.turnWidth * 2.5); // Перемещаем линию в в точку первой линии

		ctx.lineTo(this.turnLength, this.wallH + this.turnWidth * 2.5); // ведем ниже
		ctx.stroke(); // отрисовыаем

		// ---------Соединяем вторую и третью линии по горизонтали--------------//
		ctx.beginPath();
		ctx.moveTo(this.turnLength, this.wallH + this.turnWidth * 2);
		ctx.lineTo(this.turnLength, this.wallH + this.turnWidth * 2.5);
		ctx.stroke();

		// ------------------------------------------------------------------------//
		// ----------------------Четвертая линия по горизонтали--------------------//
		ctx.beginPath();
		ctx.moveTo(this.turnWidth, this.wallH + this.turnWidth * 4); // линия начинается не от края, а на расстоянии ширины прохода

		// короткая линия со смещением
		ctx.lineTo(this.turnLength + this.turnWidth, this.wallH + this.turnWidth * 4);

		// Записываем точку в маршрут
		this.turnRoute[2] = {
			x: this.turnLength + this.turnWidth / 2,
			y: this.wallH + this.turnWidth * 4 - this.turnWidth
		};

		ctx.stroke();

		// ---------Соединяем первую и четвертую линии по горизонтали--------------//
		ctx.beginPath();
		ctx.moveTo(this.turnLength + this.turnWidth, this.turnWidth * 2);

		ctx.lineTo(this.turnLength + this.turnWidth, this.wallH + this.turnWidth * 4);
		ctx.stroke(); // отрисовываем

		// Заносим в маршрут след. точку
		this.turnRoute[3] = {
			x: 0 + this.turnWidth / 2,
			y: this.wallH + this.turnWidth * 4 - this.turnWidth
		}; // маршрут

		// ------------------------------------------------------------------------//
		// ----------------------Пятая линия по горизонтали------------------------//
		ctx.beginPath();
		ctx.moveTo(this.turnWidth, this.wallH + this.turnWidth * 4.5); // на расстоянии ширины дорожки

		ctx.lineTo(this.turnLength + this.turnWidth, this.wallH + this.turnWidth * 4.5);

		// Заносим точку в маршрут
		this.turnRoute[4] = {
			x: 0 + this.turnWidth / 2,
			y: this.wallH + this.turnWidth * 5.5 - this.turnWidth / 2
		};

		ctx.stroke(); // отрисовыаем

		// ---------Соединяем четвертую и пятую линии по горизонтали--------------//
		ctx.beginPath();
		ctx.moveTo(this.turnWidth, this.wallH + this.turnWidth * 4);
		ctx.lineTo(this.turnWidth, this.wallH + this.turnWidth * 4.5);

		// Заносим точку в маршрут
		this.turnRoute[5] = {
			x: this.turnLength + this.turnWidth - this.turnWidth / 2,
			y: this.wallH + this.turnWidth * 5.5 - this.turnWidth / 2
		};

		ctx.stroke(); // отрисовываем

		// ---------------------------------------------------------------------------------//
		// ----------------------Шестая (последняя) линия по горизонтали--------------------//
		ctx.beginPath();
		ctx.moveTo(0, this.wallH + this.turnWidth * 5.5);

		ctx.lineTo(this.turnLength + this.turnWidth, this.wallH + this.turnWidth * 5.5);
		ctx.stroke();

		// В маршрут
		this.turnRoute[6] = {
			x: this.pixel * 7 + this.wall1_w + this.pass,
			y: this.wallH + this.turnWidth * 5.5 - this.turnWidth / 2
		};

		// Показать маршрут
		function showRoute () {
			ctx.strokeStyle = "red";
			ctx.beginPath();
			ctx.moveTo(this.turnRoute[0]["x"], this.turnRoute[0]["y"]);
			for (let turn = 1; turn < this.turnRoute.length; turn++) {
				ctx.lineTo(this.turnRoute[turn]["x"], this.turnRoute[turn]["y"]);
			}
			ctx.stroke();
		}
	}

	private renderDecor () {
		// Сокращения
		let ctx = this.ctx;
		let wall1_w = this.wall1_w;

		// заграждение перед пограничной стеной
		let fence_1 = new Image();
		fence_1.src = window.location.origin + "/static/map/fence_2.png";
		fence_1.height = this.pixel * 20;
		fence_1.onload = () => {
			ctx.drawImage(
				fence_1,
				wall1_w + this.pass - 5 * this.pixel,
				this.canvasBorder.height / 2 - this.pixel * 10,
				this.pixel * 10,
				this.pixel * 20
			);
		};

		// плакат после сканера
		let info = new Image();
		info.src = window.location.origin + "/static/map/infoPoster.png";
		info.height = this.pixel * 13;
		info.onload = () => {
			ctx.drawImage(
				info,
				this.scaner + 15 * this.pixel,
				this.canvasBorder.height - info.height - 17 * this.pixel,
				this.pixel * 7,
				this.pixel * 13
			);
		};

		// плакат перед постом охраны
		let info2 = new Image();
		info2.src = window.location.origin + "/static/map/infoPoster.png";
		info2.height = this.pixel * 13;
		info2.onload = () => {
			ctx.drawImage(
				info2,
				this.securityPost - 10 * this.pixel,
				this.canvasBorder.height - info.height - 17 * this.pixel,
				this.pixel * 7,
				this.pixel * 13
			);
		};

		// заграждение перед постом охраны
		let fence_2 = new Image();
		fence_2.src = window.location.origin + "/static/map/fence_2.png";
		fence_2.height = this.pixel * 20;
		fence_2.onload = () => {
			ctx.drawImage(
				fence_2,
				this.securityPost,
				this.canvasBorder.height / 2 - this.pixel * 10,
				this.pixel * 10,
				this.pixel * 20
			);
		};

		// урна перед ококло очереди
		let bin = new Image();
		bin.src = window.location.origin + "/static/map/bin.png";
		bin.height = this.pixel * 20;
		bin.onload = () => {
			ctx.drawImage(
				bin,
				this.wall1_w - 10 * this.pixel,
				this.wallH - this.pixel,
				this.pixel * 7,
				this.pixel * 12
			);
		};
	}

	private renderScaner () {
		// Сокращения
		let ctx = this.ctx;

		ctx.fillStyle = "red";
		ctx.fillRect(
			this.scaner,
			this.canvasBorder.height - this.pixel * 30,
			this.pixel,
			this.pixel * 30
		);
	}

	private renderEdge () {
		// Сокращение
		let ctx = this.ctx;

		let start = this.wall1_w + this.pass + this.wall2_w; // начало бордюра (там, где вторая стена закончилась)
		let x = (this.canvasBorder.width - start) / 2 + start; // находим край бордюра (растояние между концом участка и краем монитора)

		ctx.fillStyle = "#595959";
		ctx.fillRect(x, 0, this.pixel * 3, this.canvasBorder.height);

		// Нужно для отрисовки анимаци человека, когда он успешно прошел через границу
		this.edge = (x - start) / 2 + start;
	}

	// public morning (): boolean {
	// 	let ctx = this.ctx;
	// 	// Заполняем массив с очередью
	// 	for (let i = 0; i < 150; i++) {
	// 		this.turn.push(faker.random.number({ min: 0, max: 11 }));
	// 	}

	// 	let turn = new Image();
	// 	turn.src = window.location.origin + "/static/sprites/turn.png";
	// 	turn.height = this.pixel * 20;
	// 	ctx.imageSmoothingEnabled = false;

	// 	// let frame = 0;
	// 	let hw = this.pixel * 6; // ширина человека
	// 	let hh = this.pixel * 16; // высота человека

	// 	turn.onload = () => {
	// 		let relation: number[] = [];
	// 		// перебираем массив с координатами точек и находим по ним длины дорожек
	// 		for (let section = 0; section < this.turnRoute.length - 1; section++) {
	// 			// если
	// 			if (this.turnRoute[section].x == this.turnRoute[section + 1].x) {
	// 				let more = this.turnRoute[section + 1].y - this.turnRoute[section].y;
	// 				if (more > 0) {
	// 					relation.push(this.turnRoute[section + 1].y - this.turnRoute[section].y);
	// 				} else {
	// 					relation.push(this.turnRoute[section].y - this.turnRoute[section + 1].y);
	// 				}
	// 			} else if (this.turnRoute[section].y == this.turnRoute[section + 1].y) {
	// 				let more = this.turnRoute[section + 1].x - this.turnRoute[section].x;
	// 				if (more > 0) {
	// 					relation.push(this.turnRoute[section + 1].x - this.turnRoute[section].x);
	// 				} else {
	// 					relation.push(this.turnRoute[section].x - this.turnRoute[section + 1].x);
	// 				}
	// 			}
	// 		}
	// 	};

	// 	return true;
	// }
}
