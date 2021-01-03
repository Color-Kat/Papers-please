import { Popuper } from "popuper";
import { EntryPermit } from "./papers/EntryPermit";
import { PersonalCard } from "./papers/PersonalCard";
import { Passport } from "./papers/Passport";

interface IPaperCoords {
	docType: string; // тип документа
	// Координаты документа
	x: number;
	y: number;
	// Высота, ширина документа, если не загружена картинка
	w: number;
	h: number;
	color: string; // цвет шрифта или цвет документа если нет картинки
	zIndex: number; // zIndex документа (определяет позицию документа относительно других документов)
	giveAnimation: boolean; // включена ли анимация
	visible: boolean; // видимый ли документ (когда true не отрисовывается)
	data: any; // данные о координатах личных данных в документе
	cover: HTMLImageElement; // картинка на обложке
	template: HTMLImageElement; // картинка развернутого документы
	// opened: boolean; // определяет размеры документа (на столе - размер template, на мини столе - размер cover)
}

export class RenderDesk {
	// Размеры окна документа
	private w: number = window.innerWidth; // ширина всего стола
	private h: number; // высота всего стола
	// Canvas
	private canvasDesk: HTMLCanvasElement; // элемент canvas стола
	private canvasPapers: HTMLCanvasElement; // элемент canvas документов
	public deskCtx: CanvasRenderingContext2D; // контекст самого стола
	private papersCtx: CanvasRenderingContext2D; // контекст канваса с документами
	private pixel: number; // размер игрового пикселя

	// Размеры столов (сам стол, окошко с посетителями, стол для сдачи документов)
	private deskWidth_w: number; // ширина оновного стола
	private deskWidth_h: number; // ширина оновного стола
	public visitWindow_w: number;
	private visitWindow_h: number;
	private miniDesk_w: number;
	private miniDesk_h: number;

	// Перетаскивание
	private docCoords: IPaperCoords[] = [];
	private lastIndex: number = 0;
	private mouse = { x: 0, y: 0 };
	private selected: IPaperCoords | boolean = false;

	// Если true, то разрешаем отдать документы
	public checked: boolean | null = null;

	// Окно для посетителей
	public person_h: number; // рост гражданина
	public _personPhoto: HTMLImageElement = new Image(); // фото посетителя
	private loaded: { [key: string]: boolean } = { photo: false, lattice: false }; // загружено ли фото
	set photo (scr: string) {
		this._personPhoto.src = scr;
	}
	get personPhoto () {
		return this._personPhoto;
	}
	private growthPoint: number; // расстояние от полосы до полосы (100cm)

	// Части информационной панели
	public weightKg: number = 0; // само число с весом
	public weight: { x: number; y: number } = { x: 0, y: 0 }; // координаты этого числа

	constructor (private date: Date) {
		// Размер одного игрового пикселя
		this.pixel = Math.round(this.w / 512);
		// Высота всего стола
		this.h = window.innerHeight - this.pixel * 60;

		// Окно с диалогом
		let dialog: HTMLElement = document.querySelector("#dialog");

		// canvas
		this.canvasDesk = document.querySelector("#desk");
		this.canvasPapers = document.querySelector("#papers");

		// Контекст
		this.deskCtx = this.canvasDesk.getContext("2d");
		this.papersCtx = this.canvasPapers.getContext("2d");

		// Размеры
		this.canvasDesk.width = this.canvasPapers.width = this.w;
		this.canvasDesk.height = this.canvasPapers.height = this.h;

		// -----------Задаем размеры "окон"-------------//
		// Основной стол
		this.deskWidth_w = this.w / 7 * 5; // ширина основного стола (2/3 от всего стола)
		this.deskWidth_h = this.h; // высота основного стола (во всю высоту)

		// Окно для посетителей
		this.visitWindow_w = this.w / 7 * 2; // ширина окна для посетителей (1/3 от всей ширины стола)
		this.visitWindow_h = this.h / 2; // высота окна для посетителей (половина высоты)
		this.growthPoint = this.visitWindow_h / 11;

		// Задаем размеры окна с диалогами равными окну для посетителей
		dialog.style.width = this.visitWindow_w + "px";
		dialog.style.height = this.visitWindow_h + "px";
		dialog.style.top = this.pixel * 60 + "px";

		// Мини столик для сдачи документов
		this.miniDesk_w = this.w / 7 * 2; // ширина мини столика (1/3 от всей ширины стола)
		this.miniDesk_h = this.h / 2; // высота мини столика (половина высоты)

		// ----------------- События для перетаскивания документов ----------------- //
		// Для ПК
		this.canvasPapers.onmousemove = e => {
			// при движении просто сохраняем координаты мыши
			this.mouse.x = e.pageX;
			this.mouse.y = e.pageY - (window.innerHeight - this.canvasPapers.height); // тк нужно координаты относительно canvas
		};
		// Для Мобильных устройств
		this.canvasPapers.ontouchmove = e => {
			this.mouse.x = e.changedTouches[0].pageX;
			this.mouse.y =
				e.changedTouches[0].pageY - (window.innerHeight - this.canvasPapers.height);
		};

		// ------------------------------------
		// ДОполнительный ненужный документ для тестов
		this.docCoords[3] = {
			docType: "cities",
			x: this.miniDesk_w / 2,
			y: this.canvasDesk.height - this.miniDesk_h,
			w: 70,
			h: 90,
			color: "black",
			zIndex: 3,
			giveAnimation: false,
			visible: true,
			data: false,
			cover: new Image(),
			template: new Image()
		};

		// Проверrf вхождения координат мыши в диапазон точек документа
		let isCursorInRect = (paper: IPaperCoords): boolean => {
			let mouse = this.mouse;

			return (
				mouse.x > paper.x &&
				mouse.x < paper.x + paper.w &&
				mouse.y > paper.y &&
				mouse.y < paper.y + paper.h
			);
		};

		// Реализация всплытия документа над остальными
		let zIndexChange = (zIndex: number) => {
			// Если zIndex выбранного документа самый большой, то он лежит выше всех, поднимать его вверх не надо
			if (zIndex == this.lastIndex) return;
			else {
				// Перебираем все документы
				for (let paperName in this.docCoords) {
					// Текущий перебираемый документ
					let paper = this.docCoords[paperName];

					// Если документы лежат ниже всплывающего документа, то их порядок не меняется
					if (paper.zIndex < zIndex) continue;
					else if (paper.zIndex == zIndex)
						// Если zIndex документа равен zIndex перетаскиваемого документа, то он должен всплыть наверх
						paper.zIndex = this.lastIndex; // zIndex максимальный
					else
						// Чтобы очистить максимальный zIndex для всплывающего документа,
						// смещаем zIndex всех выше лежащих документов на одну единицу вниз
						paper.zIndex--;
				}
			}
		};

		// При зажатии клавиши определяем находится ли какой-то документ под координатами мыши
		let isSelected = () => {
			if (!this.selected /*если какой-то элемент выбран - значит он перетаскивается*/) {
				// Перебираем все документы, которые лежат на столе
				Object.values(this.docCoords)
					// Сортируем их по уменьшению zIndex
					.sort((a, b) => (a.zIndex < b.zIndex ? 1 : a.zIndex == b.zIndex ? 0 : -1))
					.every(paper => {
						// Если курсор на документе с самым большим zIndex, то перетаскиваем его
						if (isCursorInRect(paper)) {
							this.selected = paper;
							zIndexChange(paper.zIndex);
							return false;
						} else
							// Берем документ с меньшим zIndex
							return true;
					});
			}
		};
		// Для ПК
		window.onmousedown = isSelected;
		// Для Мобильных устройств
		window.ontouchstart = isSelected;

		// Отпустили мышь - ничего не выбрано
		// Для Пк
		window.onmouseup = () => {
			this.selected = false;
		};

		// Для телефонов
		window.ontouchend = () => {
			this.selected = false;
		};
	}

	public render () {
		// Сокращение
		let ctx = this.deskCtx;

		// Отрисовываем окно для посетителей
		this.renderVisitWindow();

		// Отрисовываем основной стол для документов
		this.renderDesk();
	}

	private async renderVisitWindow (open = false, close = false) {
		let ctx = this.deskCtx;
		let state: "nobody" | "enter" | "stay" | "exitR" | "exitL" = "nobody";
		let x = open ? 0 : this.visitWindow_w / 2; // стартовая точка, откуда человек начнет идти

		// Запущенные анимации
		let animated = { lattice: false, enter: false, exitR: false, exitL: false };

		// Высота гражданина в пикселях исходя из его роста
		let personHeight = (this.person_h / 10 - 10) * this.growthPoint;

		// Если есть человек, то нужно подождать пока загрузится картинка
		if (this.personPhoto.src != "" && !this.loaded.photo) {
			// Ждем пока картинка загрузится
			await new Promise(resolve => {
				this.personPhoto.onload = () => {
					this.loaded.photo = true; // фото загружено, в след.раз его ждать не нужно

					this.scaling(personHeight, this.personPhoto);

					resolve();
				};
			});
		}

		// Картинка решетки
		let lattice = new Image();
		lattice.src = window.location.origin + "/static/desk/lattice.png";
		lattice.height = this.visitWindow_h + 1;

		// Ждем пока картинка загрузится
		if (!this.loaded.lttice) {
			await new Promise(resolve => {
				lattice.onload = () => {
					this.loaded.lattice = true; // фото загружено

					// Если решетку нужно закрыть, то стартовая высота решетки - 0
					if (close) lattice.height = 0;
					resolve();
				};
			});
		}

		let windowBg = async () => {
			// Задний фон окна для посетителей
			let bg = () => {
				ctx.fillStyle = "#1B1515";
				ctx.fillRect(0, 0, this.visitWindow_w, this.visitWindow_h + 1);

				// Отрисовываем полосы для определения роста
				ctx.fillStyle = "#110B0B";
				ctx.font = "bold " + 7 * this.pixel + "px  PixelFont";
				for (let i = 11; i >= 0; i--) {
					// Рисуем полосы
					ctx.fillRect(
						25 * this.pixel,
						i * this.growthPoint,
						this.visitWindow_w - 30 * this.pixel,
						2 * this.pixel
					);

					// Рисуем цифры
					ctx.fillText("1." + i, 10 * this.pixel, (11 - i) * this.growthPoint);
				}
			};

			bg(); // Отрисовываем фон

			// ------------ Анимируем человека ------------- //
			if (state == "enter" || animated.enter) {
				// анимация начинается, если кто-то зашел и пока animated2 не станет false
				// *** ЧЕЛОВЕК ВХОДИТ *** //
				animated.enter = true; // Запущена анимация, нужно дождаться ее завершения

				// Пока человек не дошел до центра
				if (x < Math.round(this.visitWindow_w / 2 - this.personPhoto.width / 2)) {
					ctx.drawImage(
						this.personPhoto,
						x,
						this.visitWindow_h - personHeight,
						this.personPhoto.width,
						personHeight
					);
					x += this.pixel / 2;
				} else {
					// *** ЧЕЛОВЕК СТОИТ *** //
					// высота гражданина в пикселях, исходя из его роста
					let personHeight =
						(this.person_h / 10 - 10) * this.growthPoint + this.growthPoint;
					this.scaling(personHeight, this.personPhoto);

					ctx.drawImage(
						this.personPhoto,
						this.visitWindow_w / 2 - this.personPhoto.width / 2,
						this.visitWindow_h - personHeight,
						this.personPhoto.width,
						personHeight
					);

					animated.enter = false; // конец анимации
				}
			} else if (state == "exitR") {
				// *** И ВЫХОДИТ *** //
				animated.exitR = true; // анимация запущена
				// Пока человек не дошел до края - просто двигаем его
				if (x < this.visitWindow_w - this.personPhoto.width) {
					ctx.drawImage(
						this.personPhoto,
						x,
						this.visitWindow_h - personHeight,
						this.personPhoto.width,
						personHeight
					);
					x += this.pixel / 2;
				} else if (x + this.personPhoto.width < this.visitWindow_w) {
					// когда дошел - двигаем и обрезаем (не вышло()

					// ctx.drawImage(
					// 	this.personPhoto,
					// 	0,
					// 	0,
					// 	// от ширины картинки отнять ширину вылезшего за пределы окна фрагмента картинки
					// 	this.personPhoto.naturalWidth -
					// 		(x + this.personPhoto.naturalWidth - this.visitWindow_w),
					// 	this.personPhoto.naturalHeight,
					// 	x,
					// 	this.visitWindow_h - personHeight,
					// 	this.personPhoto.width, // ширина картинки на холсте (временно)
					// 	this.personPhoto.height // высота картинки на холсте
					// );

					ctx.drawImage(
						this.personPhoto,
						// 0,
						// 0,
						// // от ширины картинки отнять ширину вылезшего за пределы окна фрагмента картинки
						// 150,
						// 150,
						x,
						this.visitWindow_h - personHeight,
						this.personPhoto.width,
						this.personPhoto.height
					);
					x += this.pixel / 2;
				} else animated.exitR = false;
			}
		};

		// Анимируем ВСЕ анимации в окне
		let winAnima = setInterval(() => {
			ctx.clearRect(0, 0, this.visitWindow_w, this.visitWindow_h); // Очищаем окно от предыдущего кадра

			windowBg(); // Отрисовываем фон

			// Если нужно открыть окно
			if (open) {
				// ----- АНИМАЦИЯ ОТКРЫТИЯ ОКНА ----- //
				animated.lattice = true; // Анимация открытия окна

				state = "enter"; // Окно еще закрыто, запускаем анимацию "заходящего" гражданина

				// Если решетка открылась, останавливаем анимацию
				if (lattice.height <= 0) {
					animated.lattice = false;
					// Отрисовываем мини столик для сдачи документов (чтобы окна не налазило на него)
					this.renderMiniDesk();

					// Окно открыто - останавливаем анимацию
					state = "stay";
					open = false;
				}
				// else {
				// Уменьшаем высоту решетки
				lattice.height -= this.pixel * 6;

				// Отрисовываем решетку с новой высотой
				ctx.drawImage(lattice, 0, 0, this.visitWindow_w, lattice.height);

				// Отрисовываем мини столик для сдачи документов
				// this.renderMiniDesk();
				// }
			} else if (close) {
				// ----- АНИМАЦИЯ ЗАКРЫТИЯ ОКНА ----- //
				animated.lattice = true; // анимация закрытия окна запущена

				state = "exitR"; // анимация выхода человека

				// Если решетка закрылась, останавливаем анимацию
				if (lattice.height >= this.visitWindow_h + 1) {
					animated.lattice = false;
					// Отрисовываем мини столик для сдачи документов
					this.renderMiniDesk();
					close = false;
				}
				// else {
				// Увеличиваем высоту решетки
				lattice.height += 6 * this.pixel;
				// Отрисовываем решетку с новой высотой
				ctx.drawImage(lattice, 0, 0, this.visitWindow_w, lattice.height);
				// }
			} else {
				// Окно закрыто (отрисовываем текстуру "решетки")
				ctx.drawImage(lattice, 0, 0, this.visitWindow_w, lattice.height);

				// Отрисовываем мини столик для сдачи документов
				this.renderMiniDesk();
			}

			// Проверяем завершились ли анимации
			if (!animated.lattice && !animated.enter && !animated.exitR && !animated.exitL)
				clearInterval(winAnima);
		}, 1000 / 60);
		this.renderMiniDesk();
	}

	private renderMiniDesk () {
		let ctx = this.deskCtx;

		// Закрашиваем задний фон стола
		ctx.fillStyle = "gray";
		ctx.fillRect(0, this.visitWindow_h, this.miniDesk_w, this.miniDesk_h);

		let desk_h = this.miniDesk_h / 1.5;

		let miniDesk = () => {
			// Чтобы изображение не было растянуто, я разрезал его на три части -
			// Две - это края, которые растягивать нельзя
			// А еще одна часть - это центр, который растягивается и компенсирует ширину
			let parts: { [key: string]: HTMLImageElement } = {
				right: new Image(),
				center: new Image(),
				left: new Image()
			};

			parts.right.src = window.location.origin + "/static/desk/miniDesk_right.png";
			parts.center.src = window.location.origin + "/static/desk/miniDesk_center.png";
			parts.left.src = window.location.origin + "/static/desk/miniDesk_left.png";

			let waiting = [
				new Promise(r => (parts.right.onload = r)),
				new Promise(r => (parts.center.onload = r)),
				new Promise(r => (parts.left.onload = r))
			];

			// Ожидаем пока ВСЕ картинки загрузятся
			Promise.all(waiting).then(() => {
				// Масштабируем все картинки
				for (let part in parts) {
					this.scaling(desk_h, parts[part]);
				}

				// ----Отрисовываем части так, чтобы они склеились---//
				ctx.drawImage(
					parts.left,
					0,
					this.visitWindow_h - 3 * this.pixel,
					parts.left.width,
					parts.left.height
				); // отрисовываем левую часть

				// Вычисляем шируну центра
				let center_w = this.miniDesk_w - parts.left.width - parts.right.width;

				ctx.drawImage(
					parts.right,
					parts.left.width + center_w,
					this.visitWindow_h - 3 * this.pixel,
					parts.right.width,
					parts.right.height
				); // отрисовываем правую часть

				ctx.drawImage(
					parts.center,
					parts.left.width,
					this.visitWindow_h - 3 * this.pixel,
					center_w,
					parts.center.height
				); // отрисовываем центральную часть
			});
		};

		let infoPanel = () => {
			// Закрашиваем основу панели, чтобы сгладить стыки между частями панели
			ctx.fillStyle = "#482515";
			ctx.fillRect(
				0,
				this.visitWindow_h + desk_h - 3 * this.pixel,
				this.miniDesk_w,
				this.miniDesk_h - desk_h + 3 * this.pixel
			);

			// Картинки частей панели
			let parts: { [key: string]: HTMLImageElement } = {
				date: new Image(),
				leftBook: new Image(),
				microphone: new Image(),
				rightBook: new Image(),
				weight: new Image()
			};
			parts.date.src = window.location.origin + "/static/desk/info_panel_date.png";
			parts.leftBook.src = window.location.origin + "/static/desk/info_panel_leftBook.png";
			parts.microphone.src =
				window.location.origin + "/static/desk/info_panel_microphone.png";
			parts.rightBook.src = window.location.origin + "/static/desk/info_panel_rightBook.png";
			parts.weight.src = window.location.origin + "/static/desk/info_panel_weight.png";

			let waiting = [
				new Promise(r => (parts.date.onload = r)),
				new Promise(r => (parts.leftBook.onload = r)),
				new Promise(r => (parts.microphone.onload = r)),
				new Promise(r => (parts.rightBook.onload = r)),
				new Promise(r => (parts.weight.onload = r))
			];

			let partWidth = this.miniDesk_w / 5; // Ширина одной части панели (чтобы вместились все)

			// Ожидаем пока ВСЕ картинки загрузятся
			Promise.all(waiting).then(() => {
				// Масштабируем по ширине с сохранением пропорций высоты
				for (let part in parts) {
					this.scalingW(partWidth, parts[part]);
				}

				// Отрисовываем картинку с часами и датой
				ctx.drawImage(
					parts.date,
					0,
					this.deskWidth_h - parts.date.height,
					parts.date.width,
					parts.date.height
				);
				// Форматирование даты
				let formattedDate = (d: Date) => {
					let month = String(d.getMonth() + 1);
					let day = String(d.getDate());
					const year = String(d.getFullYear());

					if (month.length < 2) month = "0" + month;
					if (day.length < 2) day = "0" + day;

					return `${day}.${month}.${year}`;
				};
				ctx.fillStyle = "#482515"; // цвет ткста
				ctx.font = 5 * this.pixel + "px PixelFont";
				ctx.textAlign = "center"; // выравниваем текст по центру
				// Отрисовываем текст в поле для даты
				ctx.fillText(
					formattedDate(this.date),
					parts.date.width / 2,
					this.deskWidth_h - 2 * this.pixel
				);

				// Отрисовываем картинку с "пазом" для первой книги
				ctx.drawImage(
					parts.leftBook,
					parts.date.width,
					this.deskWidth_h - parts.leftBook.height,
					parts.leftBook.width,
					parts.leftBook.height
				);

				// Отрисовываем картинку с микрофоном
				ctx.drawImage(
					parts.microphone,
					parts.date.width + parts.leftBook.width,
					this.deskWidth_h - parts.microphone.height,
					parts.microphone.width,
					parts.microphone.height
				);

				// Отрисовываем картинку со второй книгой
				ctx.drawImage(
					parts.rightBook,
					parts.date.width + parts.leftBook.width + parts.microphone.width,
					this.deskWidth_h - parts.rightBook.height,
					parts.rightBook.width,
					parts.rightBook.height
				);
				// Запоминаем координаты, чтобы потом выводить вес
				this.weight.x =
					parts.date.width +
					parts.leftBook.width +
					parts.microphone.width +
					parts.rightBook.width +
					parts.weight.width / 2;
				this.weight.y = this.deskWidth_h - parts.weight.height;

				// Отрисовываем картинку c dtcjv
				ctx.drawImage(
					parts.weight,
					this.weight.x - parts.weight.width / 2,
					this.weight.y,
					parts.weight.width,
					parts.weight.height
				);

				if (this.weightKg != 0) {
					this.deskCtx.fillStyle = "#482515"; // цвет текста
					this.deskCtx.font = 7 * this.pixel + "px PixelFont";
					this.deskCtx.textAlign = "center"; // выравниваем текст по центру

					this.deskCtx.fillText(
						String(this.weightKg),
						this.weight.x - 3 * this.pixel,
						this.weight.y + parts.weight.height / 2 + this.pixel
					);
				}
			});
		};

		// Отрисовываем ту часть, на которой сам стол
		miniDesk();
		// Отрисовываем ту часть, на которой панель с информацией
		infoPanel();
	}

	private renderDesk () {
		let ctx = this.deskCtx;

		// Пока картинка не загрузилась
		ctx.fillStyle = "#150A0A";
		ctx.fillRect(this.visitWindow_w, 0, this.deskWidth_w, this.deskWidth_h);

		let deskBG = new Image();
		deskBG.src = window.location.origin + "/static/desk/desk.png";
		deskBG.onload = () => {
			ctx.drawImage(
				deskBG,
				this.visitWindow_w - 1,
				0,
				this.deskWidth_w + 1,
				this.deskWidth_h
			);
		};
	}

	private async documentsPrepare (
		passport: Passport,
		entryPermit: EntryPermit,
		personalCard: PersonalCard
	) {
		// Обнуляем массив с данными о документах
		this.docCoords = [];

		// ------------- ПАСПОРТ -------------- //
		this.docCoords.push({
			docType: "passport",
			x: this.miniDesk_w / 2,
			y: this.canvasDesk.height - this.miniDesk_h,
			w: this.pixel * 45,
			h: this.pixel * 45,
			color: "#fff",
			zIndex: 2,
			giveAnimation: false,
			visible: true,
			data: {},
			cover: new Image(),
			template: new Image()
		});

		// Задаем обложку в паспорте, как картинку
		this.docCoords[0].cover.src =
			window.location.origin +
			"/static/papers/covers/passportCovers/passport_cover_" +
			passport.country +
			".png";
		// Масштабируем
		this.docCoords[0].cover.onload = () => {
			this.scaling(this.docCoords[0].h, this.docCoords[0].cover);
		};

		// Картинка открытого паспорта
		this.docCoords[0].template.src =
			window.location.origin + "/static/papers/passport_" + passport.country + ".png";

		// Ожидаем пока загрузится картинка, чтобы потом использовать ее параметры для расположения текста
		await new Promise(resolve => {
			// Масштабируем
			this.docCoords[0].template.onload = () => {
				this.scaling(this.pixel * 170, this.docCoords[0].template);
				resolve();
			};
		});

		// Задаём поля в паспорте (data) для дальнейшей отрисовки
		await this.passportSetData(passport);

		// -------------- ЛИЧНАЯ КАРТА ------------ //
		this.docCoords.push({
			docType: "personalCard",
			x: this.miniDesk_w / 2,
			y: this.canvasDesk.height - this.miniDesk_h,
			w: 150,
			h: 90,
			color: "#3E354D",
			zIndex: 0,
			giveAnimation: false,
			visible: true,
			data: {},
			cover: new Image(),
			template: new Image()
		});
		// Задаем текстуру "закрытой" личной карты
		this.docCoords[1].cover.src =
			window.location.origin + "/static/papers/covers/personalCard_cover.png";
		// Масштабируем
		this.docCoords[1].cover.onload = () => {
			this.scaling(this.pixel * 25, this.docCoords[1].cover);
		};

		// Загружаем текстуру открытой личной карты
		this.docCoords[1].template.src = window.location.origin + "/static/papers/personalCard.png";

		// Масштабируем
		await new Promise(resolve => {
			this.docCoords[1].template.onload = () => {
				this.scaling(this.pixel * 80, this.docCoords[1].template);
				resolve();
			};
		});

		// Заполняем поля в личной карте
		await this.personalCardSetData(personalCard);

		// ----------- РАЗРЕШЕНИЕ НА ВЪЕЗД --------- //
		this.docCoords.push({
			docType: "entryPermit",
			x: this.miniDesk_w / 2,
			y: this.canvasDesk.height - this.miniDesk_h,
			w: 30,
			h: 20,
			color: "#776B81",
			zIndex: 1,
			giveAnimation: false,
			visible: true,
			data: {},
			cover: new Image(),
			template: new Image()
		});

		await new Promise(resolve => {
			// Задаем обложку разрешения
			this.docCoords[2].cover.src =
				window.location.origin + "/static/papers/covers/entryPermit_cover.png";
			// Масштабируем
			this.docCoords[2].cover.onload = () => {
				this.scaling(this.pixel * 30, this.docCoords[2].cover);
				resolve();
			};
		});

		await new Promise(resolve => {
			// Картинка открытого разрешения
			this.docCoords[2].template.src =
				window.location.origin + "/static/papers/entryPermit.png";
			// Масштабируем
			this.docCoords[2].template.onload = () => {
				this.scaling(this.pixel * 180, this.docCoords[2].template);
				resolve();
			};
		});

		// Задаём поля в разрешении на въезд (data) для дальнейшей отрисовки
		await this.entryPermitSetData(entryPermit);
	}

	public async submitDocs (
		passport: Passport,
		entryPermit: EntryPermit,
		personalCard: PersonalCard
	): Promise<boolean> {
		this.renderVisitWindow(true);
		// Контекст canvas'a с документами
		let ctx = this.papersCtx;

		// Подготавливаем документы для отрисовки
		await this.documentsPrepare(passport, entryPermit, personalCard);

		// Записываем в lastIndex самый высокий zIndex
		this.lastIndex = Object.values(this.docCoords).length - 1;

		// Создаем промис
		let verification: Promise<boolean> = new Promise(resolve => {
			// 60 раз в секунду перерисовываем документы
			let papersFrame = setInterval(() => {
				// Очищаем холст
				ctx.clearRect(0, 0, this.canvasPapers.width, this.canvasPapers.height);

				// Перебираем все документы, которые лежат на столе
				this.docCoords
					// Сортируем их по возрастанию zIndex
					.sort((a, b) => (a.zIndex > b.zIndex ? 1 : a.zIndex == b.zIndex ? 0 : -1))
					.forEach(paper => {
						// Если документ отдали, то его отрисовывать не надо
						if (!paper.visible) return;

						// ---------------- Определяем позицию документа ----------------- //
						// --(на мини столе, в окне для посетителей, на основном столе)--- //

						// Документ лежит на маленьком столе или в окне для посетителей
						if (paper.x + paper.w / 2 < this.miniDesk_w) {
							// Проверяем есть ли у документа обложка
							if (paper.cover.getAttribute("src") != null) {
								// Отрисовываем обложку
								ctx.drawImage(
									paper.cover as HTMLImageElement,
									paper.x,
									paper.y,
									paper.cover.width,
									paper.cover.height
								);
								paper.w = paper.cover.width;
								paper.h = paper.cover.height;
							} else {
								// Рисуем прямоугольник цвета документа
								ctx.fillStyle = paper.color;
								ctx.fillRect(paper.x, paper.y, paper.w, paper.h);
							}

							// Документ находится в окне для посетителей и человек отпустил документ
							if (paper.y + paper.h + 10 < this.visitWindow_h && !this.selected)
								// Запускаем анимацию
								paper.giveAnimation = true;

							// ------АНИМАЦИЯ-------- //
							// (отдаем документ посетителю) если он проверин checked
							if (paper.giveAnimation && this.checked != null) {
								// Если низ документа еще не дошел до края окна, просто двигаем документ
								if (paper.y + paper.h < this.visitWindow_h)
									paper.y += 10 * this.pixel;
								else {
									// Иначе двигаем и уменьшаем высоту документа, чтобы он "скрылся" из вида
									paper.y += 10 * this.pixel;
									paper.h -= 10 * this.pixel;

									// Если документ скрылся, перестаем его анимировать и запрещаем отрисовываться
									if (paper.y >= this.visitWindow_h) {
										// Престаём анимировать документ
										paper.giveAnimation = false;
										// Скрываем документ, чтобы он не отрисовывался
										paper.visible = false;
									}
								}
								// Проверяем все ли документы сдали
								let end_of_verificate = Object.values(this.docCoords).every(
									// Если документ сдан, то он невидимый (visible = false)
									paper => !paper.visible
								);

								// Если все документы сдали, то завершаем промис
								if (end_of_verificate) {
									setTimeout(() => {
										resolve(true);
										clearInterval(papersFrame);
										// Закрываем окно
										this.renderVisitWindow(false, true);
									}, 100);
								}
							} else if (paper.giveAnimation) {
								// Если документы не проверены, но их пытаются отдать
								if (paper.y < this.canvasDesk.height - this.miniDesk_h)
									paper.y += 10 * this.pixel;
								else paper.giveAnimation = false;
							}
						} else {
							// Документ лежит на основном столе

							// Проверяем есть ли у открытого документа текстура
							if (paper.cover.getAttribute("src") != null) {
								// Если есть текстура, то отрисовываем ее
								ctx.drawImage(
									paper.template,
									paper.x,
									paper.y,
									paper.template.width,
									paper.template.height
								);

								// Задаём размеры документа, как размеры текстуры, чтобы корректно работало перетаскивание
								paper.w = paper.template.width;
								paper.h = paper.template.height;
							} else {
								// Если нет, рисуем прямоугольник цвета документа
								ctx.fillStyle = paper.color;
								ctx.fillRect(paper.x, paper.y, paper.w * 2, paper.h * 2);
							}

							// Отрисовываем текст в документе
							ctx.font = 8 * this.pixel + "px PixelFont";

							for (let field in paper.data) {
								if (field != "image") {
									// Задаем цвет текста
									ctx.fillStyle = paper.color;

									// Если у поля специальный цвет
									if (paper.data[field].color != undefined)
										ctx.fillStyle = paper.data[field].color;

									// Пишем
									ctx.fillText(
										field,
										paper.x + paper.data[field].x,
										paper.y + paper.data[field].y
									);
								} else {
									// Отрисовываем фото
									ctx.drawImage(
										paper.data[field].photo,
										paper.x + paper.data[field].x,
										paper.y + paper.data[field].y,
										paper.data[field].photo.width,
										paper.data[field].photo.height
									);
								}
							}
						}
					});

				// Если какой-то документ перетаскивается, то изменяем его координаты на координаты мыши
				if (this.selected) {
					(this.selected as IPaperCoords).x =
						this.mouse.x - (this.selected as IPaperCoords).w / 2;
					(this.selected as IPaperCoords).y =
						this.mouse.y - (this.selected as IPaperCoords).h / 2;
				}
			}, 1000 / 60);
		});

		return verification;
	}

	// Масштабирование картинки по высоте
	private scaling (height: number, image: HTMLImageElement) {
		// Процент увелечения
		let ratio = height / image.height;

		image.width = image.width * ratio;
		image.height = image.height * ratio;
	}
	// По ширине
	private scalingW (width: number, image: HTMLImageElement) {
		// Процент увелечения
		let ratio = width / image.width;

		image.width = image.width * ratio;
		image.height = image.height * ratio;
	}

	// Добавляем в паспорт текст и фотграфию
	private async passportSetData (passport: Passport) {
		// Индекс документа
		let docID = 0;

		// Перебираем поля в паспорте и вставляем их
		for (let field in passport) {
			// Удаляем лишние поля
			if (field == "constructor" || field == "country" || field == "type") continue;

			// Фото в паспорте
			if (field == "image") {
				// У Буржуазии и Печенегии фото слева
				if (passport.country == "Bourgeoisie" || passport.country == "Pechenegia") {
					// Задаём цвет шрифта (у Басурмании цвет другой)
					this.docCoords[docID].color = "#A99591";
					// this.docCoords[docID].color = "#956A67";

					// Задаём координаты и размер фотографии
					this.docCoords[docID].data.image = {
						photo: new Image(),
						x: 25 / 3 * this.pixel,
						y: 323 / 3 * this.pixel,
						h: 130 / 3 * this.pixel
					};
				} else if (passport.country == "Basurmania") {
					// Если паспорт Басурмании (фото справа)

					// Задаём цвет шрифта
					this.docCoords[docID].color = "#F2E1D9";

					// Координаты и размер фотографии
					this.docCoords[docID].data.image = {
						photo: new Image(),
						x: this.docCoords[docID].template.width - 18 / 3 * this.pixel,
						y: 336 / 3 * this.pixel,
						h: 120 / 3 * this.pixel
					};
				}

				// Устанавливаем путь к фото
				this.docCoords[docID].data.image.photo.src = passport[field];

				// Когда фото загрузится
				await new Promise(resolve => {
					this.docCoords[docID].data.image.photo.onload = () => {
						// Масштабируем его
						this.scaling(
							this.docCoords[docID].data.image.h,
							this.docCoords[docID].data.image.photo
						);
						resolve();
					};
				});

				// Изменяем расположение фото в паспорте басурмании, используя ширину масштабируемой картинки
				if (passport.country == "Basurmania") {
					// Если паспорт Басурмании (фото справа)
					// Координаты и размер фотографии
					this.docCoords[docID].data.image.x -= this.docCoords[
						docID
					].data.image.photo.width;
				}
			} else if (field == "fullName") {
				// Добавляем имя, фамилию в паспорт

				// У Буржуазии и Печенегии
				if (passport.country == "Bourgeoisie" || passport.country == "Pechenegia") {
					this.docCoords[docID].data[passport[field]] = {
						x: 25 / 3 * this.pixel,
						y: 290 / 3 * this.pixel
					};
				} else if (passport.country == "Basurmania") {
					// Если паспорт Басурмании (имя чуть ниже)
					this.docCoords[docID].data[passport[field]] = {
						x: 25 / 3 * this.pixel,
						y: 325 / 3 * this.pixel,
						color: "#A79591"
					};
				}
			} else if (field == "passportID") {
				// Номер паспорта
				this.docCoords[docID].data[passport[field]] = {
					x: this.docCoords[docID].template.width / 2 + 5 * this.pixel,
					y: 480 / 3 * this.pixel
				};
			} else if (field == "brithday") {
				// День рождения
				if (passport.country == "Bourgeoisie" || passport.country == "Pechenegia") {
					this.docCoords[docID].data[passport[field]] = {
						x: this.docCoords[docID].template.width / 2 + 5 * this.pixel,
						y: 325 / 3 * this.pixel
					};
				} else if (passport.country == "Basurmania") {
					this.docCoords[docID].data[passport[field]] = {
						x: 35 * this.pixel,
						y: 369 / 3 * this.pixel
					};
				}
			} else if (field == "gender") {
				// День рождения
				if (passport.country == "Bourgeoisie" || passport.country == "Pechenegia") {
					this.docCoords[docID].data[passport[field]] = {
						x: this.docCoords[docID].template.width / 2 + 5 * this.pixel,
						y: 350 / 3 * this.pixel
					};
				} else if (passport.country == "Basurmania") {
					this.docCoords[docID].data[passport[field]] = {
						x: 35 * this.pixel,
						y: 394 / 3 * this.pixel
					};
				}
			} else if (field == "city") {
				// День рождения
				if (passport.country == "Bourgeoisie" || passport.country == "Pechenegia") {
					this.docCoords[docID].data[passport[field]] = {
						x: this.docCoords[docID].template.width / 2 + 5 * this.pixel,
						y: 375 / 3 * this.pixel
					};
				} else if (passport.country == "Basurmania") {
					this.docCoords[docID].data[passport[field]] = {
						x: 35 * this.pixel,
						y: 419 / 3 * this.pixel
					};
				}
			} else if (field == "expired") {
				// День рождения
				if (passport.country == "Bourgeoisie" || passport.country == "Pechenegia") {
					this.docCoords[docID].data[passport[field]] = {
						x: this.docCoords[docID].template.width / 2 + 5 * this.pixel,
						y: 400 / 3 * this.pixel
					};
				} else if (passport.country == "Basurmania") {
					this.docCoords[docID].data[passport[field]] = {
						x: 35 * this.pixel,
						y: 444 / 3 * this.pixel
					};
				}
			}
		}
	}

	// Добавляем в разрешение на въезд текст
	private entryPermitSetData (entryPermit: EntryPermit) {
		let docID = 2;
		for (let field in entryPermit) {
			// Удаляем лишние поля
			if (field == "constructor" || field == "type") continue;

			// Имя фамилия
			if (field == "fullName") {
				this.docCoords[docID].data[entryPermit[field]] = {
					x: 15 * this.pixel,
					y: 85 * this.pixel
				};
			} else if (field == "passportID") {
				// Номер паспорта
				this.docCoords[docID].data[entryPermit[field]] = {
					x: 15 * this.pixel,
					y: 115 * this.pixel
				};
			} else if (field == "purpose") {
				// Цель поездки
				this.docCoords[docID].data[entryPermit[field]] = {
					x: this.docCoords[docID].template.width / 2,
					y: 130 * this.pixel
				};
			} else if (field == "duration") {
				// Цель поездки
				this.docCoords[docID].data[entryPermit[field]] = {
					x: this.docCoords[docID].template.width / 2,
					y: 144 * this.pixel
				};
			} else if (field == "enterBy") {
				// Цель поездки
				this.docCoords[docID].data[entryPermit[field]] = {
					x: this.docCoords[docID].template.width / 2,
					y: 157 * this.pixel
				};
			}
		}
	}

	// Добавляем в личную карту
	private async personalCardSetData (personalCard: PersonalCard) {
		let docID = 1;
		for (let field in personalCard) {
			// Удаляем лишние поля
			if (field == "constructor" || field == "country" || field == "type") continue;

			if (field == "image") {
				// Задаём координаты и размер фотографии
				this.docCoords[docID].data.image = {
					photo: new Image(),
					x: 8 * this.pixel,
					y: this.docCoords[docID].template.height - 45 * this.pixel,
					h: 40 * this.pixel
				};

				// Устанавливаем путь к фото
				this.docCoords[docID].data.image.photo.src = personalCard[field];

				// Когда фото загрузится
				await new Promise(resolve => {
					this.docCoords[docID].data.image.photo.onload = () => {
						// Масштабируем его
						this.scaling(
							this.docCoords[docID].data.image.h,
							this.docCoords[docID].data.image.photo
						);
						resolve();
					};
				});
			} else if (field == "fullName") {
				// Имя фамилия (на разных строках)

				// Разделяем строку на имя и фамилию
				let fullName = personalCard[field].split(" ");

				// Отрисовываем имя
				this.docCoords[docID].data[fullName[0] + ","] = {
					x: this.docCoords[docID].template.width / 2 - 19 * this.pixel,
					y: 30 * this.pixel
				};
				// Отрисовываем фамилию
				this.docCoords[docID].data[fullName[1]] = {
					x: this.docCoords[docID].template.width / 2 - 19 * this.pixel,
					y: (30 + 8 + 1) * this.pixel
				};
			} else if (field == "districkt") {
				this.docCoords[docID].data[personalCard[field]] = {
					x: 5 * this.pixel,
					y: 18 * this.pixel,
					color: "#E5BBF9"
				};
			} else if (field == "brithday") {
				this.docCoords[docID].data[personalCard[field]] = {
					x: this.docCoords[docID].template.width / 2 + 15 * this.pixel,
					y: 51 * this.pixel
				};
			} else if (field == "height") {
				this.docCoords[docID].data[personalCard[field]] = {
					x: this.docCoords[docID].template.width / 2 + 14 * this.pixel,
					y: 62 * this.pixel
				};
			} else if (field == "weight") {
				this.docCoords[docID].data[personalCard[field]] = {
					x: this.docCoords[docID].template.width / 2 + 14 * this.pixel,
					y: 73 * this.pixel
				};
			}
		}
	}

	public getFine (message: string) {
		// Создаем всплывающее окно, которое уведомляет о новом штрафе
		let fine = new Popuper(message).create("info");

		let fineLayout: string = `<div class="{selector} popupInfo">
									<div class="line"></div>
									<div class="fineText">{fineText}</div>
								</div>`;
		fine.layout = fineLayout;
		fine.variables = { selector: "fine", fineText: message };

		fine.errorReporting = false;

		fine.onOpen(elem => {
			(elem as HTMLElement).style.right = "-300px";
			(elem as HTMLElement).style.transition = "all .5s ease-in-out";
			setTimeout(() => {
				(elem as HTMLElement).style.right = "0px";
			}, 500);
		});
		fine.onClose(elem => {
			setTimeout(() => {
				(elem as HTMLElement).style.right = "-300px";
			}, 500);
		});

		// Выводим окно
		fine.alert("main", "beforeend");

		// Через 5 секунд закрываем окно
		setTimeout(() => {
			fine.close();
		}, 5000);
	}
}
