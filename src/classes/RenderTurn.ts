const faker = require("faker");
export class RenderTurn {
	// Массив с кадрами и отступами человечков
	public humans: { [key: number]: { [key: string]: any } } = {};
	private ctx: CanvasRenderingContext2D; // context
	private w: number = window.innerWidth; // ширина окна
	private pixel: number; // размер пикселя
	private hw: number; // ширина человечка (human width)
	private hh: number; // высота человечка (human height)
	private turnWidth: number; // ширина дорожки для очереди
	private canvasTurn: HTMLCanvasElement; // сам canvas

	private turnGo = false;
	private animation: number | boolean = false; // Переменая с таймером анимации
	private frameRange: {} = { min: 1, max: 7 }; // диапазон кадров, с учетом того, что от frame будет отниматься или прибавляться еденица;
	private frameX: {} = { min: 0, max: 11 };
	private frameY: {} = { min: 0, max: 5 };

	constructor (private turnRoute: { [key: string]: number }[]) {
		// Размеры
		this.pixel = Math.round(this.w / 512); // задаем размер пикселю
		this.turnWidth = this.pixel * 10; // задаем ширину дорожки

		this.canvasTurn = <HTMLCanvasElement>document.getElementById("turn");

		// Задаем размеры холсту
		this.canvasTurn.style.height = this.pixel * 60 + "px";
		this.canvasTurn.style.width = this.w + "px";
		this.canvasTurn.width = this.w;
		this.canvasTurn.height = this.pixel * 60;

		// Получаем контекст
		this.ctx = this.canvasTurn.getContext("2d");
	}

	public turn (): void {
		// Сокращения
		let ctx = this.ctx;

		// Картинка со спрайтом
		let turn = new Image(); // Загружаем спрайт
		turn.src = window.location.origin + "/static/sprites/turn.png";
		turn.height = this.pixel * 20;
		ctx.imageSmoothingEnabled = false; // Убираем эффект размытия (картинка маленького размера, и она размывается)

		// Парметры очереди
		let firstRender = true; // Если true человечки отрсовываются, если false перерисовываются
		this.hw = this.pixel * 6; // ширина человека
		this.hh = this.pixel * 16; // высота человека
		let human = 0; // Номер отрисовыемого человека
		let frame = 0; // кадры анимации
		let frameX = 0;
		let frameY = 0;
		let direction = 48; // анимация того, как человек топчится (кол-во пикселей до линии с анимацией)

		// Случайное растояние между людими в очереди
		let spaces = faker.random.number({
			min: this.hw - this.pixel,
			max: this.hw + this.pixel
		});

		// Если анимация уже шла, то очищаем ее
		if (typeof this.animation !== "boolean") {
			clearInterval(this.animation);
		}

		turn.onload = () => {
			// При загрузке картинки отрисовываем очередь один раз, а затем с некоторым интервалом
			turnRender();
			// Сохраняем анимацию для того, чтобы потом остановить
			this.animation = window.setInterval(turnRender, 500);
		};

		let turnRender = () => {
			human = 0; // обнуляем номер отрисовыемого человека

			let rotate = 0; // текущий поворот

			// Текущие координаты последнего человека
			let lastCoords = { x: this.turnRoute[rotate].x + 1, y: this.turnRoute[rotate].y }; // для обычной отрисовки
			let lCoords: { x: number; y: number } = { x: 0, y: 0 }; // для отрисовки анимации очереди, когда ушел человек

			// Очищаем холст
			ctx.clearRect(0, 0, this.turnRoute[6].x, this.canvasTurn.height);

			// Отрисовываем очередь, пока последний человек не дойдет до конца очереди
			while (
				lastCoords.x - this.turnRoute[5].x <= 0 ||
				lastCoords.y - this.turnRoute[5].y <= 0
			) {
				// При первом запуске задаем позу (frame) и координаты человечка
				if (firstRender) {
					if (
						// Если x координата последнего человека
						// меньше координаты x следущей точки маршрута, то двигаем человека по x вправо
						this.turnRoute[rotate + 1].x - spaces - lastCoords.x > 0 &&
						this.turnRoute[rotate + 1].x + spaces - lastCoords.x > 0
					) {
						// Увеличиваем координату x с небольшим смешением (для хаотичности) с интервалом space
						lastCoords.x +=
							spaces +
							faker.random.number({
								min: -2 * this.pixel,
								max: 2 * this.pixel
							});

						// Добавляем смещние по y
						lastCoords.y += faker.random.number({
							min: -1.5 * this.pixel,
							max: this.pixel
						});
						// Задаем случайную позу (стоящий человек)
						frame = faker.random.number(this.frameRange);
					} else if (
						// Если x координата последнего человека
						// больше координаты x следущей точки маршрута, то двигаем человека по x влево
						this.turnRoute[rotate + 1].x - spaces - lastCoords.x < 0 &&
						this.turnRoute[rotate + 1].x + spaces - lastCoords.x < 0
					) {
						// Уменьшаем координату x с интервалом space и небольшим отклонением
						lastCoords.x -=
							spaces +
							faker.random.number({
								min: -2 * this.pixel,
								max: 2 * this.pixel
							});
						// Небольшое отклонение по y
						lastCoords.y += faker.random.number({
							min: -1.5 * this.pixel,
							max: this.pixel
						});
						// Поза
						frame = faker.random.number(this.frameRange);
					} else if (
						// Если y координата последнего человека меньше
						// селдующий точки y маршрута, то двигем человечка вниз по y
						lastCoords.y - this.turnRoute[rotate + 1].y <
						0
					) {
						// Увеличиваем y
						lastCoords.y +=
							spaces +
							faker.random.number({
								min: -2 * this.pixel,
								max: this.pixel
							});
						// И x для небольшого смещения
						lastCoords.x += faker.random.number({
							min: -3 * this.pixel,
							max: 3 * this.pixel
						});
						// И задаем позу
						frame = faker.random.number(this.frameRange);
					} else
						// И если все координаты совпадают меняем точку маршрута
						rotate++;

					// Отрисовываем очередь до пятой точки маршрута (конец дорожки для человечков)
					if (rotate > 5) break;

					// Инициализируем человека в массиве
					this.humans[human] = {};
					// Записываем кадр и координаты отрисовыемого человека
					this.humans[human].frame = frame;
					this.humans[human].lastCoords = { ...lastCoords };
				} else if (
					// Если последний человек ушел
					this.turnGo
				) {
					let hLength = Object.keys(this.humans).length - 1; // Кол-во людей в очереди
					// Берем координаты перерисовываемого человека в отдельную переменную,
					// чтобы не было проблем с преждевременным окончанием цикла
					lCoords = this.humans[human].lastCoords;

					// Заполняем данные о человеке, исходя из его координат и след. точки маршрута
					if (
						// Если x координата последнего отрисовываемого человека
						// меньше координаты x следущей точки маршрута, то двигаем человека вправо
						this.turnRoute[rotate + 1].x - this.pixel - lCoords.x > 0 &&
						this.turnRoute[rotate + 1].x + this.pixel - lCoords.x > 0
					) {
						// Увеличиваем координату x
						lCoords.x += this.pixel; // идет вправо

						// Задаем позу
						direction = 0;
					} else if (
						// Если x координата последнего человека
						// больше координаты x следущей точки маршрута, то двигаем человека по x влево
						this.turnRoute[rotate + 1].x - this.pixel - lCoords.x < 0 &&
						this.turnRoute[rotate + 1].x + this.pixel - lCoords.x < 0
					) {
						// Уменьшаем координату x с интервалом space и небольшим отклонением
						lCoords.x -= this.pixel;

						// Задаем позу
						direction = 16;
					} else if (
						// Если y координата последнего человека меньше
						// селдующий точки Y маршрута, то двигем человечка вниз
						lCoords.y - this.turnRoute[rotate + 1].y <
						0
					) {
						// Увеличиваем y
						lCoords.y += this.pixel;

						// Задаем позу
						direction = 48;
					} else
						// И если все координаты совпадают меняем точку маршрута
						rotate++;

					// Отрисовываем очередь до пятой точки маршрута (конец дорожки для человечков)
					if (rotate > 5) break;

					// неважно
					if (frameX != 11) {
						frame = frameX;
						frameX++;
					} else frameX = 0;

					if (frameY != 5) {
						frame = frameY;
						frameY++;
					} else frameY = 0;

					// Отрисовываем последнего человека
					if (human == hLength) {
						// Если этот последний человек дошел до конца...
						if (
							this.turnRoute[5].x - this.pixel - this.humans[hLength].lastCoords.x <
								0 &&
							this.turnRoute[5].x + this.pixel - this.humans[hLength].lastCoords.x < 0
						) {
							// ...Больше не двигаем очередь
							this.turnGo = false;
							lastCoords = lCoords;
							break;
						}
					}
				} else if (
					// C некоторым шансом меняем позу человека
					faker.random.number({ min: 0, max: 30 }) == 0
				) {
					// Очищаем холст только под одним человеком
					frame = faker.random.number(this.frameRange);
					lastCoords = this.humans[human].lastCoords;

					// Записываем кадр и координаты отрисовыемого человека
					this.humans[human].frame = frame;
				} else {
					// С большим шансом вместо новых параметров человека берем старые
					// (нужно для того, чтобы при перерисовке человека, не стирались старые)
					frame = this.humans[human].frame;
					lastCoords = this.humans[human].lastCoords;
				}

				// Отрисовываем человека через спрайт
				if (!this.turnGo) {
					ctx.drawImage(
						turn,
						frame * 7,
						direction,
						6,
						16,
						lastCoords.x,
						lastCoords.y - this.hh / 2 - this.pixel * 3,
						this.hw,
						this.hh
					);
				} else {
					ctx.drawImage(
						turn,
						frame * 7,
						direction,
						6,
						16,
						lCoords.x,
						lCoords.y - this.hh / 2 - this.pixel * 3,
						this.hw,
						this.hh
					);
				}

				// Если в массиве есть человек с таким номером, отрисовываем следующего
				if (Object.keys(this.humans).length - 1 != human || firstRender) {
					human++;
				} else {
					// Если люди закончились останавливаемся
					break;
				}
			}
			// Все параметры человечком сохранены, нужно отключить полную генерацию новых параметров
			firstRender = false;
		};
	}

	public next () {
		let ctx = this.ctx; // Получаем контекст

		// Загружаем спрайт
		let turn = new Image();
		turn.src = window.location.origin + "/static/sprites/turn.png";
		turn.height = this.pixel * 20;

		let humans = this.humans;
		let hLength = Object.keys(humans).length - 1; // Кол-во людей в очереди (-1 тк начинается с нуля)
		let human = this.humans[hLength]; // Берем последнего человека для того, чтобы с ним взаимодействовать полсе удаления

		delete humans[hLength]; // Удаляем последнего человека из очереди, тк он пошел на проверку

		hLength--; // Уменьшаем длину очереди, тк минус один человек

		let direction = 0; // Задаём ряд кадров анимации (Идет вправо)
		let frame = 0; // Кадр анимации

		let end = new Promise(resolve => {
			let walk = setInterval(() => {
				// Двигаем последнего человека в будку инспектора
				if (human.lastCoords.x + this.hw - this.turnRoute[6].x < 0) {
					// Стираем предыдущий кадр
					ctx.clearRect(
						human.lastCoords.x,
						human.lastCoords.y - this.hh,
						this.hw,
						this.hh
					);

					human.lastCoords.x += this.pixel;

					ctx.drawImage(
						turn,
						frame * 7,
						direction,
						6,
						16,
						human.lastCoords.x,
						human.lastCoords.y - this.hh,
						this.hw,
						this.hh
					);

					frame++;

					// Всего 11 кадров анимации
					if (frame == 11) frame = 0;
				} else {
					clearInterval(walk);
					resolve(true);
				}

				// Сдвигаем саму очередь
			}, 100);
		});

		// Берем предпоследнего человека и отрисовываем его до последней точки маршрута (6)

		this.turnGo = true;
		return end;
	}

	public allow (start: number, scaner: number, edge: number): Promise<boolean> {
		let ctx = this.ctx; // Получаем контекст

		// Загружаем спрайт
		let turn = new Image();
		turn.src = window.location.origin + "/static/sprites/turn.png";
		turn.height = this.pixel * 20;

		let direction: 0 | 32 = 0; // Задаём ряд кадров анимации (Идет вправо)
		let frame = 0; // Кадр анимации

		// Координаты
		let y = this.turnRoute[6].y - this.hh;
		let x = start;

		let out: Promise<boolean> = new Promise(resolve => {
			let walk = setInterval(() => {
				// Стираем предыдущий кадр
				ctx.clearRect(x, y, this.hw, this.hh);

				// Двигаем человек влево почти до бордюра
				if (x < edge) {
					// Передвигаем человечка
					x += this.pixel;

					// Отрисовываем новый кадр
					ctx.drawImage(turn, frame * 7, direction, 6, 16, x, y, this.hw, this.hh);

					// Следующий кадр (шаг)
					frame++;

					// Всего 11 кадров анимации
					if (frame > 11) frame = 0;

					// Проверяем прошел ли человек через сканер
					if (x > scaner) resolve(true);
				} else if (y < this.canvasTurn.height) {
					// Меняем анимацию
					direction = 32;

					// Передвигаем человечка (делаем шаг)
					y += this.pixel;

					// Отрисовываем новый кадр
					ctx.drawImage(turn, frame * 7, direction, 6, 16, x, y, this.hw, this.hh);

					// Следующий кадр (шаг)
					frame++;
					// Всего 11 кадров анимации
					if (frame > 5) frame = 0;
				} else {
					// Конец анимации
					clearInterval(walk);
				}

				// Сдвигаем саму очередь
			}, 100);
		});
		return out;
	}

	public refuse (start: number): Promise<boolean> {
		let ctx = this.ctx; // Получаем контекст

		// Загружаем спрайт
		let turn = new Image();
		turn.src = window.location.origin + "/static/sprites/turn.png";
		turn.height = this.pixel * 20;

		let direction: 16 | 32 = 16; // Задаём ряд кадров анимации (16 - влево или 32 - вниз)
		let frame = 0; // Кадр анимации

		// Координаты человвека
		let y: number = this.turnRoute[6].y - this.hh;
		let x: number = start;

		let leaveRotate = (start - this.turnRoute[5].x) / 2 + this.turnRoute[5].x;

		let out: Promise<boolean> = new Promise(resolve => {
			// Запускаем анимацию через интервал
			let walk = setInterval(() => {
				// Стираем предыдущий кадр
				ctx.clearRect(x, y, this.hw, this.hh);

				if (x > leaveRotate) {
					// Передвигаем человечка (делаем шаг)
					x -= this.pixel;

					// Отрисовываем новый кадр
					ctx.drawImage(turn, frame * 7, direction, 6, 16, x, y, this.hw, this.hh);

					// Следующий кадр (шаг)
					frame++;

					// Всего 11 кадров анимации
					if (frame > 11) frame = 0;
				} else if (y < this.canvasTurn.height) {
					// Меняем анимацию
					direction = 32;

					// Передвигаем человечка (делаем шаг)
					y += this.pixel;

					// Отрисовываем новый кадр
					ctx.drawImage(turn, frame * 7, direction, 6, 16, x, y, this.hw, this.hh);

					// Следующий кадр (шаг)
					frame++;
					// Всего 11 кадров анимации
					if (frame > 5) frame = 0;

					// Человек ушел, можно выписывать штраф, если он есть
					resolve(true);
				} else {
					// Конец анимации
					clearInterval(walk);
				}

				// Сдвигаем саму очередь
			}, 100);
		});

		return out;
	}
}

// Если x координата последнего человека не равна координатам по x следущей точки маршрута
// то двигаем человека по x
// if (
// 	this.turnRoute[rotate + 1].x - spaces - lastCoords.x > 0 &&
// 	this.turnRoute[rotate + 1].x + spaces - lastCoords.x > 0
// ) {
// 	lastCoords.x += spaces;
// 	direction = 0;
// 	frame = faker.random.number(frameX);
// } else if (
// 	this.turnRoute[rotate + 1].x - spaces - lastCoords.x < 0 &&
// 	this.turnRoute[rotate + 1].x + spaces - lastCoords.x < 0
// ) {
// 	lastCoords.x -= spaces;
// 	direction = 16;
// 	frame = faker.random.number(frameX);
// } else if (lastCoords.y - this.turnRoute[rotate + 1].y < 0) {
// 	// по y
// 	lastCoords.y += spaces;
// 	direction = 32;
// 	frame = faker.random.number(frameY);
// } else
// 	// И если все координаты совпадают меняем точку маршрута
// 	rotate++;

// if (rotate > 5) break;

// // Отрисовываем человека через спрайт
// if (faker.random.boolean() && faker.random.boolean()) {
// 	// c шансом 25%у человека меняется поза
// 	ctx.drawImage(
// 		turn,
// 		frame * 7,
// 		direction,
// 		6,
// 		16,
// 		lastCoords.x,
// 		lastCoords.y - hh / 2 - this.pixel * 3,
// 		hw,
// 		hh
// 	);
// } else {
// 	// человек стоит как есть
// 	ctx.drawImage(
// 		turn,
// 		(frame - faker.random.number({ min: 0, max: 1 })) * 7,
// 		direction,
// 		6,
// 		16,
// 		lastCoords.x,
// 		lastCoords.y - hh / 2 - this.pixel * 3,
// 		hw,
// 		hh
// 	);
// }
