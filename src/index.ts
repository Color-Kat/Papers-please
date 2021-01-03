import { RenderMap } from "./classes/RenderMap";
import { RenderTurn } from "./classes/RenderTurn";
import { RenderDesk } from "./classes/RenderDesk";
import { Сitizen } from "./classes/Сitizen";
import "./style.css";
let faker = require("faker");

// Текущая дата
let currentDate: Date = new Date(1984, 6, 1);
// Кнопки
const nextDayBtn: HTMLElement = document.querySelector("#day");
const nextBtn: HTMLElement = document.querySelector("#next");
const allowBtn: HTMLElement = document.querySelector("#allow");
const refuseBtn: HTMLElement = document.querySelector("#refuse");
const dialog: HTMLElement = document.querySelector("#dialog");

// Высота, ширина окна
const w = window.innerWidth;
const h = window.innerHeight;

// Переменные состояния
let verification = false;

// Кол-во штрафов
let mistakes = 0;

// Получаем все города
async function getCities () {
	return fetch(window.location.origin + "/static/cities.json")
		.then(response => {
			return response.json();
		})
		.then(data => {
			return data;
		});
}

// Объекты для отрисовки
const map: RenderMap = new RenderMap();
const turn: RenderTurn = new RenderTurn(map.turnRoute);
const desk: RenderDesk = new RenderDesk(currentDate); // Передаем дату, она будет изменяться автоматически

async function init () {
	// Проверяем соотношение сторон
	if (Math.abs(w / h - 16 / 9) > 0.3) {
		// Вывести сообщение, когда соотношение не 16:9
		alert("Поверните экран");
		// return false;
	}

	// Получаем список городов
	let cities = await getCities();

	// Начинаем игру, начав след. день
	nextDay(cities);

	// Следующий день по клику
	nextDayBtn.addEventListener("click", () => {
		nextDay(cities);
	});
	showMistakes();

	return true;
}
let turnAnimation: number | boolean = false;

function nextDay (cities: any) {
	// Отрисовываем карту (стены, пол, будку и тд)
	map.render();
	// Отрисовываем стол
	desk.render();

	if (typeof turnAnimation !== "boolean") {
		clearInterval(turnAnimation);
	}

	// Отрисовываем саму очередь
	turn.turn();

	// Каждый день случайно выбираем шанс, с которым документ будет подделан один из документов (тип сложность каждого дня)
	let chance = faker.random.number({ min: 0, max: 5 });

	// следующий день
	currentDate.setDate(currentDate.getDate() + 1);

	// Запускаем человека по клику
	nextBtn.onclick = async () => {
		// Не впускать пока идет проверка
		if (verification) return;

		// Началась проверка, не впускать других людей
		verification = true;

		await turn.next();

		next(cities, chance);
	};
}

function next (cities: any, chance: number) {
	let allowed = false; // разрешен ли въезд

	// Кнопка РАЗРЕШИТЬ
	allowBtn.onclick = async () => {
		desk.checked = true; // документы проверены, можно их отдавать
		allowed = true; // Вход разрешен
	};
	// Копка ОТКАЗАТЬ
	refuseBtn.onclick = async () => {
		desk.checked = true; // документы проверены, можно их отдавать
		allowed = false; // Вход разрешен
	};

	// Создаем гражданина
	let person = new Сitizen(cities, currentDate);

	// Выводим диалог инспектора с поситителем
	let talk = [ ...person.talkDialog() ].map(e => e.split(" -- ").map(e => e.trim())).flat();

	let target = true; // true - инспектор
	talk.forEach((phrase, i) => {
		console.log(phrase);
		setTimeout(() => {
			if (target) {
				inspectorSays(phrase);
				target = !target;
			} else {
				citizenSays(phrase);
				target = !target;
			}
			if (i == talk.length) {
				setTimeout(() => {
					dialog.style.opacity = "0";

					setTimeout(() => {
						dialog.innerHTML = "";
					}, 500);
				}, 1000);
			}
		}, 900 * ++i);
	});

	function inspectorSays (phrase: string) {
		if (phrase == "") return;
		dialog.innerHTML += `<div class="phrase inspector">${phrase}</div>`;
	}
	function citizenSays (phrase: string) {
		if (phrase == "") return;
		dialog.innerHTML += `<div class="phrase citizen">${phrase}</div>`;
	}

	// Подделываем данные
	person.fake(chance);

	desk.weightKg = person.weight; // добавляем значение веса, чтобы потом отрисовываеть его вместе со столом
	desk.person_h = person.height; // добавляем значение роста
	desk.photo = person.image; // добавляем значение роста

	// Кладем документы на стол
	desk.submitDocs(person.passport, person.entryPermit, person.pCard).then(async () => {
		// Ждем когда документы отдадут гражданину
		if (allowed) {
			// Анимация прохождения человека через границу
			await turn.allow(map.endOfGatehouse, map.scaner, map.edge); // Ждем пока человек пройдет через сканер

			// Вывести штраф, если есть после того, как человек прошел через сканер
			if (typeof person.allow() == "string") {
				desk.getFine(person.allow() as string);
				mistakes++;
				showMistakes();
			}

			// Проверка закончилась
			verification = false;
		} else {
			// Анимация узода человека
			await turn.refuse(map.startOfGatehouse);

			// // Вывести штраф, если есть после того, как человек совсем ушел
			// console.log(person.refuse());

			// Вывести штраф, если есть после того, как человек прошел через сканер
			if (typeof person.refuse() == "string") {
				desk.getFine(person.refuse() as string);
				mistakes++;
				showMistakes();
			}

			// Проверка закончилась
			verification = false;
		}
		desk.checked = false;
	});
}
function showMistakes () {
	document.querySelector("#mistakes").innerHTML = mistakes.toString();
}

init();
