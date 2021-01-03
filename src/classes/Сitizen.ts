import { Talk } from "./talk";
import { EntryPermit } from "./papers/EntryPermit";
import { PersonalCard } from "./papers/PersonalCard";
import { Passport } from "./papers/Passport";
import { Entry } from "webpack";

let faker = require("faker");

type DurationType = "TRANSIT" | "VISIT" | "WORK" | "IMMIGRATION";

export class Сitizen extends Talk {
	private date: string; // текущая дата
	private gender: string; // пол
	// имя и фамилия
	private firstName: string;
	private lastName: string;
	private fullName: string;
	private passportNumber: string; // номер паспорта
	private job: string; // работа
	private countryArr: string[] = []; // Массив со странами
	private country: string; // страна выдачи
	private city: string; // город выдачи
	private birthday: string; // ДР
	public image: string; // фото в паспорте
	public weight: number; // вес
	public height: number; // рост
	private purpose: DurationType; // цель визита
	private violations: string = "Applicant clear for entry"; // причина штрафа
	private faked: boolean = false; // подделаны ли документы?
	private forgedDocument: any; // подделаный документ

	private fakeGender () {
		return faker.random.arrayElement([ "male", "female" ]);
	}

	private fakeFullName (change = false) {
		if (!change) {
			// Создать имя фамилию
			this.firstName = faker.name.firstName(this.gender);
			this.lastName = faker.name.lastName(this.gender);
		} else {
			// Изменить имя фамилию
			this.firstName = faker.random.arrayElement([
				faker.name.firstName(this.gender),
				this.firstName
			]);
			this.lastName = faker.random.arrayElement([
				faker.name.lastName(this.gender),
				this.lastName
			]);
			// Имя фамилия не поменялись
			if (this.firstName + " " + this.lastName == this.fullName) this.fakeFullName(true);
		}
		return this.firstName + " " + this.lastName;
	}

	private fakePassportNumber () {
		return this.getPasportNumber();
	}

	private fakeJob () {
		this.job = faker.name.jobType();
	}

	private fakeCountry () {
		for (let country in this.cities) {
			this.countryArr.push(country);
		}
		this.country = this.countryArr[Math.floor(Math.random() * this.countryArr.length)];
	}

	private fakeCity (change = false) {
		if (!change) {
			// Создать город
			return this.cities[this.country]["cities"][
				Math.floor(Math.random() * this.cities[this.country]["cities"].length)
			];
		} else {
			// Выбираем все страны, которые не равны той, которая отмечена в паспорте
			let otherCountry = Object.keys(this.cities).filter(e => e !== this.country);
			// Рандомно выбираем одну из стран
			let fakeCountry = faker.random.arrayElement(otherCountry);
			// Выбираем рандомный город из страны
			return faker.random.arrayElement(this.cities[fakeCountry].cities);
		}
	}

	private fakeBirthday () {
		let past = new Date(this.date);
		// День рождения был как минимум 18 лет назад
		past.setFullYear(past.getFullYear() - 18);
		// Выбираем случайную дату рождения(от 18 лет назад и до 128)
		this.birthday = faker.date.past(85, past).toLocaleDateString();
	}

	private fakeImage (change = false) {
		// Заменяем пробелы на _
		let avatarID = this.fullName.replace(/ /g, "_");
		let gender = this.gender;

		if (change) {
			// Подделать аватар
			// Изменяем сид аватара
			avatarID += faker.random.number({ min: 0, max: 100 });
			// изменяем пол для фотографии с некоторой вероятностью
			if (faker.random.boolean() && faker.random.boolean()) {
				gender = gender == "male" ? "female" : "male";
			}
		}

		// Генерируем аватар по имени и полу
		return `https://avatars.dicebear.com/api/${gender}/${avatarID}.svg?mood[]=${faker.random.arrayElement(
			[ "happy", "sad", "surprised" ]
		)}`;
	}

	private fakeWeight () {
		this.weight = faker.random.number({ min: 30, max: 145 });
	}

	private fakeHeight () {
		this.height = faker.random.number({ min: 140, max: 200 });
	}

	private fakePurpose () {
		this.purpose = faker.random.arrayElement([ "TRANSIT", "VISIT", "WORK", "IMMIGRATION" ]);
	}

	constructor (private cities: any, currentDate: Date) {
		super();
		// Пол
		this.gender = this.fakeGender();
		// Имя фамлия
		this.fullName = this.fakeFullName();
		// Номер паспорта
		this.passportNumber = this.fakePassportNumber();
		// Работа
		this.fakeJob();

		/* СТРАНЫ, ГОРОДА, РАЙОНЫ */
		// Рандомная страна
		this.fakeCountry();
		// Рандомный город выдачи
		this.city = this.fakeCity();

		/* ФОТО */
		this.image = this.fakeImage();

		/* ДАТЫ */
		// Конвертируем дату в строку, чтобы она не изменялась при setFullYear() и др.
		this.date = this.formatDate(currentDate);
		// День рождения
		this.fakeBirthday();
		// Годен до
		let expired: Date | string = new Date(this.date);
		// Генерируем случайную дату от 0 до 10 лет
		expired.setFullYear(expired.getFullYear() + faker.random.number({ min: 0, max: 10 }));
		expired.setDate(expired.getDate() + faker.random.number({ min: 3, max: 356 }));
		// Конвертируем дату в строку
		expired = new Date(expired).toLocaleDateString();

		this.passport = new Passport(
			this.fullName,
			this.passportNumber,
			this.country,
			this.city,
			this.gender,
			expired,
			this.birthday,
			this.image
		);

		// Рандомный вес
		this.fakeWeight();
		// Рандомный рост
		this.fakeHeight();

		// Рандомный район
		let districkt = this.cities[this.country]["districkts"][
			Math.floor(Math.random() * this.cities[this.country]["districkts"].length)
		];

		// console.log(this.weight);
		// console.log(this.height);

		this.pCard = new PersonalCard(
			this.fullName,
			this.passportNumber,
			this.birthday,
			districkt,
			this.country,
			this.weight,
			this.height,
			this.image
		);

		// Рандомная цель поездки
		this.fakePurpose();

		// Ответ на вопрос о цели поездки
		if (this.purpose != "IMMIGRATION") {
			this.dialog.purpose = this.purposeAnswers[this.purpose];
		} else {
			this.dialog.purpose = this.durationAnswers[this.purpose]["Forever"];
		}

		// Массив с возможными вариантами срока пребывания
		let durationOptions: string[] = [];
		for (let duration in this.durationAnswers[this.purpose]) {
			durationOptions.push(duration);
		}

		// Выбираем рандомный срок
		let duration = faker.random.arrayElement(durationOptions);

		// Ответ на вопрос "Продолжительность визита"
		this.dialog.duration = this.durationAnswers[this.purpose][duration];

		// Въезд до
		let enterBy: Date | string = new Date(this.date);

		// Генерируем случайную дату от 1 до 50 дней
		enterBy.setDate(enterBy.getDate() + faker.random.number({ min: 1, max: 50 }));
		enterBy = new Date(enterBy).toLocaleDateString();

		this.entryPermit = new EntryPermit(
			this.fullName,
			this.passportNumber,
			this.purpose,
			duration,
			enterBy
		);

		this.forgedDocument = faker.random.arrayElement([
			this.passport,
			this.pCard,
			this.entryPermit
		]);
	}

	getPasportNumber (sections: number = 2, sectionsLength: number = 5, useLowercase = false) {
		// Генератор случайных чисел в заданном диапазоне
		const random = (min: number, max: number) =>
			Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);

		// Небор символов для генерации
		const chars: string[] = [];
		// Добавление в массив символов A-Z по коду символа
		for (let i = 65; i <= 90; i++) chars.push(String.fromCharCode(i));
		if (useLowercase) for (let i = 97; i <= 122; i++) chars.push(String.fromCharCode(i)); // a-z
		for (let i = 0; i <= 9; i++) chars.push(i.toString()); // 0-9

		// Строка результата генерации
		let result = "";
		for (let i = 0; i < sections; i++) {
			for (let j = 0; j < sectionsLength; j++) result += chars[random(0, chars.length - 1)];
			result += "-";
		}

		return result.slice(0, -1);
	}

	formatDate (date: Date) {
		let dd: string | number = date.getDate();
		if (dd < 10) dd = "0" + dd;

		let mm: string | number = date.getMonth() + 1;
		if (mm < 10) mm = "0" + mm;

		// let yy: string | number = date.getFullYear() % 100;
		// if (yy < 10) yy = "0" + yy;
		let yyyy: string | number = date.getFullYear();

		return mm + "." + dd + "." + yyyy;
	}

	fake (chanceId: number) {
		// Выбираем шанс, с которым документ будет подделываться
		// Шанс меняется каждый день в функции nextDay()
		let chance = [
			faker.random.boolean() || faker.random.boolean(), // 75%
			faker.random.boolean(), // 50%
			(faker.random.boolean() && faker.random.boolean()) || faker.random.boolean(), // ~33%
			faker.random.boolean() && faker.random.boolean(), // 25%
			faker.random.boolean() && faker.random.boolean() && faker.random.boolean() // ~15%
		];

		if (chance[chanceId]) {
			// Выбираем где менять данные
			// let forgedDocument = faker.random.arrayElement([
			// 	this.passport,
			// 	this.pCard,
			// 	this.entryPermit
			// ]);

			// Добавляем поля документа в массив
			let fields = [];
			for (let field in this.forgedDocument) {
				if (
					field != "constructor" &&
					field != "country" &&
					field != "purpose" &&
					field != "duration" &&
					field != "type"
				) {
					fields.push(field);
				}
			}

			// Изменяемое поле
			let fakeField = faker.random.arrayElement(fields);

			/* ПОДДЕЛЫВАЕМ ОДНО ПОЛЕ В КАКОМ-ТО ОДНОМ ДУКУМЕНТЕ */
			if (fakeField == "fullName") {
				// Подделываем имя
				this.forgedDocument[fakeField] = this.fakeFullName(true);
				this.violations = `${this.forgedDocument.type}: invalid full name`;
			} else if (fakeField == "gender") {
				// Подделаваем пол
				this.forgedDocument[fakeField] =
					this.forgedDocument.gender == "male" ? "female" : "male";
				this.violations = `${this.forgedDocument.type}: invalid gender`;
			} else if (fakeField == "passportID") {
				// Подделываем номер паспорта (в паспорте или другом документе)
				this.forgedDocument[fakeField] = this.fakePassportNumber();
				this.violations = `${this.forgedDocument.type}: invalid passport number`;
			} else if (fakeField == "city") {
				// Подделываем город выдачи паспорта
				this.forgedDocument[fakeField] = this.fakeCity(true);
				this.violations = `${this.forgedDocument.type}: invalid issuing city`;
			} else if (fakeField == "expired") {
				// Просрачиваем паспорт :)
				let expired = new Date(this.date);
				// Просрачиваем на 0 и более лет
				expired.setFullYear(
					expired.getFullYear() + faker.random.number({ min: 0, max: -3 })
				);
				// Просрачиваем на 0 и более месяцев
				expired.setMonth(expired.getMonth() + faker.random.number({ min: 0, max: -11 }));
				// Просрачиваем на 1 и более дней
				expired.setDate(expired.getDate() + faker.random.number({ min: -1, max: -31 }));

				// Паспорт просрочен
				this.forgedDocument[fakeField] = this.formatDate(expired);
				this.violations = "Passport has expired";
			} else if (fakeField == "brithday") {
				// Изменяем дату рождения
				// Форматируем строковую дату, тк Date считает, что первым должен стоять месяц, а не день
				// дд.мм.гггг -> гггг.мм.дд
				let birthday = new Date(
					this.forgedDocument[fakeField].replace(/(\d+).(\d+).(\d+)/, "$3/$2/$1")
				);
				// Меняем дату рождения
				if (faker.random.boolean()) {
					// C большим шансом изменяем день
					birthday.setDate(
						birthday.getDate() + faker.random.number({ min: -31, max: 31 })
					);
				} else if (faker.random.boolean() && faker.random.boolean()) {
					// C меньшим шансом изменяем месяц
					birthday.setFullYear(
						birthday.getFullYear() + faker.random.number({ min: -20, max: 10 })
					);
				} else {
					// Изменяим год, c самым маленьким шансом
					birthday.setMonth(
						birthday.getMonth() + faker.random.number({ min: -11, max: 11 })
					);
				}

				// Неверная дата рождения
				this.forgedDocument[fakeField] = this.formatDate(birthday);
				this.violations = `${this.forgedDocument.type}: invalid date of birth`;
			} else if (fakeField == "image") {
				// Подделываем фотографию
				this.forgedDocument[fakeField] = this.fakeImage(true);
			} else if (fakeField == "districkt") {
				// Подделываем район прописки из личной карты

				// Выбираем все страны, которые не равны той, которая отмечена в паспорте
				let otherCountry = Object.keys(this.cities).filter(e => e !== this.country);
				// Рандомно выбираем одну из стран
				let fakeCountry = faker.random.arrayElement(otherCountry);
				// Выбираем рандомный район из других страны
				this.forgedDocument[fakeField] = faker.random.arrayElement(
					this.cities[fakeCountry].districkts
				);
				this.violations = `${this.forgedDocument.type}: invalid area of ​​residence`;
			} else if (fakeField == "weight") {
				// Изменяем вес в личной карте
				this.forgedDocument[fakeField] =
					this.forgedDocument[fakeField] + faker.random.number({ min: 2, max: 10 });
				// Ограничение веса
				if (this.forgedDocument[fakeField] > 145) this.forgedDocument[fakeField] = 145;
				this.violations = `Suspicion of smuggling`;
			} else if (fakeField == "height") {
				// Изменяем вес в личной карте
				this.forgedDocument[fakeField] =
					this.forgedDocument[fakeField] + faker.random.number({ min: 15, max: 40 });

				// Ограничение роста
				if (this.forgedDocument[fakeField] > 195) this.forgedDocument[fakeField] = 195;
				this.violations = `${this.forgedDocument.type}: invalid growth`;
			} else if (fakeField == "enterBy") {
				// Въезд до
				let enterBy: Date | string = new Date(this.date);
				// Генерируем случайную просрочную дату (просрачиваем разрешение на въезд)
				if (faker.random.boolean()) {
					enterBy.setDate(enterBy.getDate() + faker.random.number({ min: -1, max: -30 }));
				} else {
					enterBy.setMonth(
						enterBy.getMonth() + faker.random.number({ min: -1, max: -3 })
					);
				}

				this.forgedDocument[fakeField] = enterBy.toLocaleDateString();
				this.violations = `${this.forgedDocument.type}: error - expired`;
			}
			this.faked = true;
			//  С шансом 25% меняем что-то еще
			this.fake(4);
		}
	}

	public allow () {
		if (this.faked) {
			return this.violations;
		} else {
			return true;
		}
	}
	public refuse () {
		if (this.faked) {
			return true;
		} else {
			return this.violations;
		}
	}
}
